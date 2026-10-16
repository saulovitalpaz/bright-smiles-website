const crypto = require('node:crypto');
const multer = require('multer');
const sanitizeHtml = require('sanitize-html');
const sanitizeRichContent = require('../utils/sanitizeRichContent');
const { verifyPassword } = require('../utils/passwords');
const { createCertificateVault, validCpf, validPkcs12 } = require('../utils/certificateVault');
const { createDigitalSigningWorker } = require('../services/digitalSigningWorker');
const defaultStorage = require('../utils/patientDocumentStorage');
const { normalizeProvider, providerAvailability } = require('../services/signingProviders');

const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const normalizeCpf = value => String(value || '').replace(/\D/g, '');
const fail = (status, message, code) => Object.assign(new Error(message), { status, code });
const certificateFields = ['subjectName', 'cpfMasked', 'issuer', 'validFrom', 'validUntil', 'fingerprint', 'checkedAt', 'ready'];
const publicCertificate = value => Object.fromEntries(certificateFields.map(name => [name, value?.[name] ?? null]));
const professionalSummary = user => ({ name: user.name || '', cro: user.cro || '', username: user.username || '' });
const certificateStatus = saved => {
    if (['SUSPENDED', 'REVOKED', 'EXPIRED'].includes(saved.status)) return saved.status;
    if (!(Date.parse(saved.metadata?.validUntil) > Date.now())) return 'EXPIRED';
    return saved.status;
};
const requireCertificate = saved => {
    if (!saved) throw fail(422, 'Cadastre seu certificado A1.');
    const status = certificateStatus(saved);
    if (status === 'SUSPENDED') throw fail(422, 'Certificado suspenso. Envie um certificado válido para reativar.', 'CERTIFICATE_SUSPENDED');
    if (status === 'EXPIRED') throw fail(422, 'O certificado está fora do período de validade.', 'CERTIFICATE_EXPIRED');
    if (status === 'REVOKED') throw fail(422, 'O certificado foi revogado. Envie um certificado válido.', 'CERTIFICATE_REVOKED');
    if (!['ACTIVE', 'VERIFICATION_UNAVAILABLE'].includes(status)) throw fail(422, 'Certificado indisponível.');
};
const normalizeName = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z ]/g, '').replace(/\s+/g, ' ').trim().replace(/^(DRA?|DOUTORA?)\s+/, '');
const certificateMatches = (certificate, user) => typeof certificate?.subjectName === 'string' && normalizeName(certificate.subjectName.split(':')[0]) === normalizeName(user.name);
const documentMetadata = document => ({ id: document.id, hash: document.hash, signatureStatus: document.signatureStatus, signedAt: document.signedAt, fileUrl: `/prescriptions/digital-documents/${document.id}/file` });
const documentSelect = { id: true, hash: true, signatureStatus: true, signedAt: true, storageKey: true };

function rateLimiter(limit, windowMs) {
    const entries = new Map();
    return (req, res, next) => {
        const now = Date.now();
        for (const [key, entry] of entries) if (entry.until <= now) entries.delete(key);
        const key = `${req.ip || 'unknown'}:${req.user?.id || ''}`;
        const entry = entries.get(key) || { count: 0, until: now + windowMs };
        if (entry.count >= limit || (!entries.has(key) && entries.size >= 10000)) return res.status(429).json({ error: 'Muitas tentativas. Aguarde e tente novamente.' });
        entry.count++; entries.set(key, entry); next();
    };
}

function registerDigitalSigningRoutes(app, dependencies) {
    const { prisma, authenticateToken, decrypt = value => value, env = process.env } = dependencies;
    const vault = dependencies.vault || createCertificateVault(env);
    const worker = dependencies.worker || createDigitalSigningWorker(env);
    const storage = dependencies.storage || defaultStorage;
    const mutationLimit = rateLimiter(8, 15 * 60 * 1000);
    const signingLimit = rateLimiter(15, 15 * 60 * 1000);
    const publicLimit = rateLimiter(30, 60 * 1000);
    const locks = new Set();
    const upload = maximum => multer({ storage: multer.memoryStorage(), limits: { fileSize: maximum, files: 1, fields: 4, fieldSize: 4096, parts: 5 } });
    const multipart = (maximum, field) => (req, res, next) => upload(maximum).single(field)(req, res, error => error ? res.status(400).json({ error: 'Arquivo inválido ou acima do limite.' }) : next());
    const noStore = (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); };
    const route = handler => async (req, res) => {
        try { await handler(req, res); } catch (error) { res.status(error.status || 503).json({ error: error.status ? error.message : 'Serviço de assinatura indisponível.', ...(error.code ? { code: error.code } : {}) }); }
        finally { if (req.file?.buffer) req.file.buffer.fill(0); }
    };
    const clinical = async (req, res, next) => {
        try {
            const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, role: true, username: true, name: true, cro: true, password: true, signatureUrl: true } });
            if (!user || !['admin', 'dentist'].includes(user.role)) return res.sendStatus(403);
            req.signingUser = user; next();
        } catch { res.sendStatus(503); }
    };
    const privateMiddleware = [noStore, authenticateToken, clinical];
    const reauthenticate = async req => {
        if (typeof req.body?.accountPassword !== 'string' || req.body.accountPassword.length > 1024 || !(await verifyPassword(req.body.accountPassword, req.signingUser.password)).valid) throw fail(403, 'Senha de acesso inválida.', 'ACCESS_PASSWORD_INVALID');
    };
    const availability = async () => {
        if (!vault.available || !storage.isPrivateDocumentStorageConfigured()) return false;
        try { return (await worker({ operation: 'capabilities' })).available === true; } catch { return false; }
    };
    const requireAvailable = async () => { if (!(await availability())) throw fail(503, 'Assinatura digital indisponível. Configure o cofre, armazenamento e validação ICP-Brasil.'); };
    const recordKnownExpiry = async (userId, certificate) => {
        if (certificate && certificateStatus(certificate) === 'EXPIRED' && certificate.status !== 'EXPIRED') {
            await prisma.digitalCertificate.updateMany({ where: { userId, fingerprint: certificate.fingerprint, sealedCredentials: certificate.sealedCredentials, status: { in: ['ACTIVE', 'VERIFICATION_UNAVAILABLE'] } }, data: { status: 'EXPIRED', lastVerificationCode: 'CERTIFICATE_EXPIRED' } });
        }
    };
    const certificateResponse = async user => {
        const available = await availability();
        const saved = await prisma.digitalCertificate.findUnique({ where: { userId: user.id }, select: { metadata: true, status: true, suspendedAt: true, lastVerificationCode: true } });
        const certificate = saved ? publicCertificate(saved.metadata) : null;
        if (certificate) {
            certificate.status = certificateStatus(saved);
            certificate.suspendedAt = saved.suspendedAt;
            certificate.lastVerificationCode = saved.lastVerificationCode;
            certificate.ready = available && certificate.ready === true && certificate.status === 'ACTIVE';
        }
        return { available, certificate, professional: professionalSummary(user), ...(!available ? { message: 'Serviço de assinatura indisponível.' } : {}) };
    };

    app.get('/digital-signatures/certificate', ...privateMiddleware, route(async (req, res) => res.json(await certificateResponse(req.signingUser))));
    const clinicDetails = async () => {
        const rows = await prisma.setting.findMany({ where: { key: { in: ['clinic_name', 'clinic_slogan', 'clinic_address', 'clinic_phone', 'clinic_cnpj', 'contact_whatsapp'] } } });
        const settings = Object.fromEntries(rows.map(row => [row.key, row.value]));
        return { name: settings.clinic_name, slogan: settings.clinic_slogan, address: settings.clinic_address, phone: settings.clinic_phone || settings.contact_whatsapp, cnpj: settings.clinic_cnpj };
    };
    app.get('/digital-signatures/clinic', ...privateMiddleware, route(async (_req, res) => res.json(await clinicDetails())));
    app.get('/digital-signatures/providers', ...privateMiddleware, route(async (_req, res) => res.json(providerAvailability(env, await availability()))));
    app.post('/digital-signatures/certificate', ...privateMiddleware, mutationLimit, multipart(1024 * 1024, 'certificate'), route(async (req, res) => {
        await reauthenticate(req); await requireAvailable();
        const cpf = req.body.cpf === undefined ? undefined : String(req.body.cpf || '').replace(/[.\-\s]/g, '');
        if (cpf !== undefined && !validCpf(cpf)) throw fail(400, 'Informe um CPF válido.', 'INVALID_CPF');
        if (typeof req.body.password !== 'string' || !req.body.password) throw fail(400, 'Informe a senha do arquivo do certificado.', 'CERTIFICATE_PASSWORD_REQUIRED');
        if (req.body.password.length > 1024) throw fail(400, 'A senha do certificado excede o limite permitido.', 'CERTIFICATE_PASSWORD_INVALID');
        if (!/\.(pfx|p12)$/i.test(req.file?.originalname || '') || !validPkcs12(req.file?.buffer)) throw fail(400, 'O arquivo do certificado é inválido.', 'CERTIFICATE_FILE_INVALID');
        if (!req.signingUser.cro?.trim()) throw fail(422, 'Preencha seu CRO no perfil.', 'PROFESSIONAL_CRO_REQUIRED');
        const credentials = { pfxBase64: req.file.buffer.toString('base64'), password: req.body.password, ...(cpf !== undefined ? { cpf } : {}) };
        const inspected = await worker({ operation: 'inspect', ...credentials });
        if (inspected.status !== 'VALID' || !inspected.certificate?.ready) throw fail(422, 'O certificado não passou na verificação.', 'INVALID_CERTIFICATE');
        if (!certificateMatches(inspected.certificate, req.signingUser)) throw fail(422, 'O certificado deve pertencer ao profissional cadastrado.', 'CERTIFICATE_PROFILE_MISMATCH');
        const metadata = publicCertificate(inspected.certificate);
        if (!/^[a-f0-9]{64}$/.test(metadata.fingerprint || '')) throw fail(422, 'A identidade do certificado não pôde ser confirmada.');
        const data = { sealedCredentials: vault.seal(req.signingUser.id, credentials), metadata, fingerprint: metadata.fingerprint, status: 'ACTIVE', suspendedAt: null, lastVerificationCode: null };
        await prisma.$transaction(async tx => {
            const userId = req.signingUser.id;
            await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
            const current = await tx.user.findUnique({ where: { id: userId }, select: { name: true, cro: true, role: true } });
            if (!current || current.name !== req.signingUser.name || current.cro !== req.signingUser.cro || !['admin', 'dentist'].includes(current.role)) throw fail(409, 'O perfil mudou. Revise seus dados e tente novamente.', 'PROFESSIONAL_CHANGED');
            await tx.digitalCertificate.upsert({ where: { userId }, create: { userId, ...data }, update: data });
        });
        res.json({ available: true, professional: professionalSummary(req.signingUser), certificate: { ...metadata, status: 'ACTIVE', suspendedAt: null, lastVerificationCode: null } });
    }));
    app.post('/digital-signatures/certificate/suspend', ...privateMiddleware, mutationLimit, route(async (req, res) => {
        await reauthenticate(req);
        const result = await prisma.digitalCertificate.updateMany({ where: { userId: req.signingUser.id }, data: { status: 'SUSPENDED', suspendedAt: new Date() } });
        if (result.count !== 1) throw fail(404, 'Certificado não encontrado.');
        res.json(await certificateResponse(req.signingUser));
    }));
    app.post('/digital-signatures/certificate/verify', ...privateMiddleware, mutationLimit, route(async (req, res) => {
        const userId = req.signingUser.id;
        const certificate = await prisma.digitalCertificate.findUnique({ where: { userId } });
        await recordKnownExpiry(userId, certificate);
        requireCertificate(certificate);
        if (!req.signingUser.cro) throw fail(422, 'Preencha seu CRO no perfil.');
        await requireAvailable();
        const where = { userId, fingerprint: certificate.fingerprint, sealedCredentials: certificate.sealedCredentials, status: { in: ['ACTIVE', 'VERIFICATION_UNAVAILABLE'] } };
        let inspected;
        try { inspected = await worker({ operation: 'inspect', ...vault.open(userId, certificate.sealedCredentials) }); }
        catch (error) {
            const status = error.code === 'CERTIFICATE_EXPIRED' ? 'EXPIRED' : error.code === 'CERTIFICATE_REVOKED' ? 'REVOKED' : 'VERIFICATION_UNAVAILABLE';
            await prisma.digitalCertificate.updateMany({ where, data: { status, lastVerificationCode: error.code || 'VERIFICATION_UNAVAILABLE' } });
            throw error;
        }
        if (inspected.status !== 'VALID' || !inspected.certificate?.ready || !certificateMatches(inspected.certificate, req.signingUser)) throw fail(422, 'Certificado inválido ou incompatível com o perfil atual.');
        if (!certificate.fingerprint || inspected.certificate.fingerprint !== certificate.fingerprint || certificate.metadata?.fingerprint !== certificate.fingerprint) throw fail(422, 'A identidade do certificado não corresponde ao cadastro.', 'CERTIFICATE_CHANGED');
        await prisma.$transaction(async tx => {
            await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
            await tx.$queryRaw`SELECT "userId" FROM "DigitalCertificate" WHERE "userId" = ${userId} FOR UPDATE`;
            const current = await tx.digitalCertificate.findUnique({ where: { userId } });
            requireCertificate(current);
            if (current.fingerprint !== certificate.fingerprint || current.sealedCredentials !== certificate.sealedCredentials) throw fail(422, 'O certificado mudou durante a verificação.', 'CERTIFICATE_CHANGED');
            const professional = await tx.user.findUnique({ where: { id: userId }, select: { name: true, cro: true, role: true } });
            if (!professional || professional.name !== req.signingUser.name || professional.cro !== req.signingUser.cro || !['admin', 'dentist'].includes(professional.role)) throw fail(409, 'O perfil mudou. Revise seus dados e tente novamente.', 'PROFESSIONAL_CHANGED');
            const verified = await tx.digitalCertificate.updateMany({ where, data: { metadata: publicCertificate(inspected.certificate), status: 'ACTIVE', lastVerificationCode: null } });
            if (verified.count !== 1) throw fail(422, 'O certificado mudou durante a verificação.', 'CERTIFICATE_CHANGED');
        });
        res.json(await certificateResponse(req.signingUser));
    }));
    app.delete('/digital-signatures/certificate', ...privateMiddleware, mutationLimit, route(async (req, res) => {
        await reauthenticate(req);
        await prisma.digitalCertificate.deleteMany({ where: { userId: req.signingUser.id } });
        res.json({ removed: true, available: await availability(), certificate: null });
    }));

    app.post('/prescription-validation/token', noStore, publicLimit, route(async (req, res) => {
        if (typeof req.body?.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(req.body.token)) return res.json({ status: 'INVALID' });
        const document = await prisma.digitalPrescription.findUnique({ where: { tokenDigest: digest(req.body.token) }, select: { signatureStatus: true, professionalName: true, professionalCro: true, signedAt: true, hash: true } });
        if (!document) return res.json({ status: 'INVALID' });
        res.json({ fileAvailable: document.signatureStatus === 'VALID', status: document.signatureStatus, scope: 'ISSUANCE_RECORD', checkedAt: document.signedAt, signatureStatusAtIssuance: document.signatureStatus, professionalName: document.professionalName, professionalCro: document.professionalCro, signedAt: document.signedAt, hash: document.hash });
    }));
    // Public capability access: the high-entropy token is required in the POST body.
    // Production origin checks apply; bucket keys and signed storage URLs stay server-side.
    app.post('/prescription-validation/file', noStore, publicLimit, route(async (req, res) => {
        if (typeof req.body?.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(req.body.token)) throw fail(404, 'Documento não encontrado.');
        const document = await prisma.digitalPrescription.findUnique({ where: { tokenDigest: digest(req.body.token) }, select: { signatureStatus: true, storageKey: true, hash: true } });
        if (!document || document.signatureStatus !== 'VALID') throw fail(404, 'Documento não encontrado.');
        const pdf = await storage.readDigitalPrescription(document.storageKey);
        if (digest(pdf) !== document.hash) throw fail(409, 'Integridade do documento inválida.');
        res.type('application/pdf')
            .set('Content-Disposition', 'inline; filename="receita-assinada.pdf"')
            .set('X-Content-Type-Options', 'nosniff')
            .set('Referrer-Policy', 'no-referrer')
            .set('X-Robots-Tag', 'noindex, nofollow, noarchive')
            .send(pdf);
    }));
    app.post('/prescription-validation/pdf', ...privateMiddleware, signingLimit, multipart(10 * 1024 * 1024, 'file'), route(async (req, res) => {
        if (!req.file?.buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw fail(400, 'Envie um PDF válido.');
        const summary = await worker({ operation: 'validate', pdfBase64: req.file.buffer.toString('base64') });
        if (!['VALID', 'INVALID', 'INDETERMINATE'].includes(summary.status)) throw fail(503, 'Validação indisponível.');
        res.json({ status: summary.status, signers: (summary.signers || []).map(signer => ({ name: signer.name, cpfMasked: signer.cpfMasked, issuer: signer.issuer, validUntil: signer.validUntil, status: signer.status, reasons: signer.reasons })), checkedAt: summary.checkedAt });
    }));

    const findOwnedDocument = req => prisma.digitalPrescription.findFirst({ where: { id: req.params.id, userId: req.signingUser.id }, select: documentSelect });
    app.get('/prescriptions/digital-documents/patient/:patientId', ...privateMiddleware, route(async (req, res) => {
        const patientId = Number(req.params.patientId);
        if (!Number.isSafeInteger(patientId) || patientId <= 0) throw fail(400, 'Paciente inválido.');
        const documents = await prisma.digitalPrescription.findMany({ where: { userId: req.signingUser.id, prescription: { patientId } }, orderBy: { signedAt: 'desc' }, take: 500, select: documentSelect });
        res.json(documents.map(documentMetadata));
    }));
    app.get('/prescriptions/digital-documents/:id/file', ...privateMiddleware, route(async (req, res) => {
        const document = await findOwnedDocument(req);
        if (!document) throw fail(404, 'Documento não encontrado.');
        const pdf = await storage.readDigitalPrescription(document.storageKey);
        if (digest(pdf) !== document.hash) throw fail(409, 'Integridade do documento inválida.');
        res.type('application/pdf').set('Content-Disposition', 'attachment; filename="receita-assinada.pdf"').send(pdf);
    }));
    app.get('/prescriptions/digital-documents/:id', ...privateMiddleware, route(async (req, res) => {
        const document = await findOwnedDocument(req);
        if (!document) throw fail(404, 'Documento não encontrado.');
        res.json(documentMetadata(document));
    }));

    const issueResponse = (document, prescription) => {
        const token = vault.open(document.userId, document.sealedToken).token;
        return { prescription: { id: prescription.id, date: prescription.date, content: prescription.content, patientId: prescription.patientId }, document: { ...documentMetadata(document), token, verificationUrl: verificationUrl(token) } };
    };
    const verificationUrl = token => {
        const url = new URL(env.DIGITAL_VERIFICATION_BASE_URL || 'https://www.odontoeharmonizacao.com.br/validar-receita');
        if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw fail(503, 'URL de validação inválida.');
        return `${url.href}#token=${token}`;
    };
    app.post('/prescriptions/digital-issue', ...privateMiddleware, signingLimit, route(async (req, res) => {
        if (normalizeProvider(req.body?.provider) !== 'A1') throw fail(503, 'Bird ID aguarda configuração e homologação.', 'BIRD_ID_CONTRACT_PENDING');
        const { patientId, content, prescriptionType, requestId, expectedPatient } = req.body || {};
        if (!Number.isSafeInteger(patientId) || patientId <= 0 || typeof content !== 'string' || content.length > 100000 || !content.trim() || prescriptionType !== 'SIMPLE' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId || '')) throw fail(400, 'Dados da receita inválidos. Apenas receitas simples são aceitas.');
        if (expectedPatient !== undefined && (!expectedPatient || typeof expectedPatient.name !== 'string' || !expectedPatient.name.trim() || expectedPatient.name.length > 300 || typeof expectedPatient.cpf !== 'string' || expectedPatient.cpf.length > 32)) throw fail(400, 'Dados de conferência do paciente inválidos.');
        const loginAge = Date.now() / 1000 - Number(req.user.iat);
        if (!(loginAge >= 0 && loginAge <= 900)) {
            if (!req.body.accountPassword) throw fail(428, 'Confirme sua senha de acesso para assinar.', 'REAUTH_REQUIRED');
            await reauthenticate(req);
        }
        if (!req.signingUser.cro) throw fail(422, 'Preencha seu CRO no perfil.');
        const safeContent = sanitizeRichContent(content);
        const plainContent = sanitizeHtml(safeContent.replace(/<\/(p|div|li|h[123]|blockquote)>|<br\s*\/?\s*>/gi, '\n'), { allowedTags: [], allowedAttributes: {} });
        if (!plainContent.trim()) throw fail(400, 'Conteúdo da receita vazio.');
        const patientSnapshot = expectedPatient === undefined ? undefined : { name: expectedPatient.name.trim(), cpf: normalizeCpf(expectedPatient.cpf) };
        const inputHash = digest(JSON.stringify({ patientId, content: safeContent, prescriptionType, ...(patientSnapshot ? { expectedPatient: patientSnapshot } : {}) }));
        const userId = req.signingUser.id; const lockKey = `${userId}:${requestId}`;
        if (locks.has(lockKey)) throw fail(409, 'Assinatura em andamento.', 'SIGNING_PENDING');
        locks.add(lockKey);
        let operation; let storageKey; let activated = false;
        try {
            const existing = await prisma.digitalIssueOperation.findUnique({ where: { userId_requestId: { userId, requestId } }, include: { document: { include: { prescription: true } } } });
            if (existing) {
                if ((existing.provider && existing.provider !== 'A1') || existing.inputHash !== inputHash) throw fail(409, 'Identificador já usado para outra receita.');
                if (existing.status === 'COMPLETE' && existing.document) return res.json(issueResponse(existing.document, existing.document.prescription));
                if (existing.status !== 'FAILED' || existing.document) throw fail(409, 'Assinatura em andamento ou aguardando confirmação. Confira o histórico.', 'SIGNING_PENDING');
                const reclaimed = await prisma.digitalIssueOperation.updateMany({ where: { id: existing.id, status: 'FAILED', document: { is: null } }, data: { status: 'PENDING' } });
                if (reclaimed.count !== 1) throw fail(409, 'Assinatura em andamento.', 'SIGNING_PENDING');
                operation = existing;
            }
            const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { name: true, cpf: true, consent: true, address: true, phone: true } });
            if (!patient?.consent) throw fail(422, 'Paciente não encontrado ou sem consentimento registrado.');
            if (patientSnapshot && (patientSnapshot.name !== patient.name.trim() || patientSnapshot.cpf !== normalizeCpf(decrypt(patient.cpf)))) throw fail(409, 'Os dados do paciente mudaram. Atualize o cadastro e revise a receita.', 'PATIENT_CHANGED');
            const certificate = await prisma.digitalCertificate.findUnique({ where: { userId } });
            await recordKnownExpiry(userId, certificate);
            requireCertificate(certificate);
            await requireAvailable();
            const credentials = vault.open(userId, certificate.sealedCredentials);
            const certificateWhere = { userId, fingerprint: certificate.fingerprint, sealedCredentials: certificate.sealedCredentials, status: { in: ['ACTIVE', 'VERIFICATION_UNAVAILABLE'] } };
            const verifyWithWorker = async input => {
                try { return await worker(input); }
                catch (error) {
                    if (['INVALID_SIGNATURE_IMAGE', 'INVALID_DOCUMENT'].includes(error.code)) throw error;
                    const status = error.code === 'CERTIFICATE_EXPIRED' ? 'EXPIRED' : error.code === 'CERTIFICATE_REVOKED' ? 'REVOKED' : 'VERIFICATION_UNAVAILABLE';
                    await prisma.digitalCertificate.updateMany({ where: certificateWhere, data: { status, lastVerificationCode: error.code || 'VERIFICATION_UNAVAILABLE' } });
                    throw error;
                }
            };
            const inspected = await verifyWithWorker({ operation: 'inspect', ...credentials });
            if (inspected.status !== 'VALID' || !inspected.certificate?.ready || !certificateMatches(inspected.certificate, req.signingUser)) throw fail(422, 'Certificado inválido ou incompatível com o perfil atual.');
            if (!certificate.fingerprint || inspected.certificate.fingerprint !== certificate.fingerprint || certificate.metadata?.fingerprint !== certificate.fingerprint) throw fail(422, 'A identidade do certificado não corresponde ao cadastro.', 'CERTIFICATE_CHANGED');
            const verified = await prisma.digitalCertificate.updateMany({ where: certificateWhere, data: { metadata: publicCertificate(inspected.certificate), status: 'ACTIVE', lastVerificationCode: null } });
            if (verified.count !== 1) throw fail(422, 'O certificado mudou durante a verificação.', 'CERTIFICATE_CHANGED');
            try { if (!operation) operation = await prisma.digitalIssueOperation.create({ data: { userId, requestId, inputHash } }); }
            catch (error) { if (error.code === 'P2002') throw fail(409, 'Assinatura em andamento.', 'SIGNING_PENDING'); throw error; }
            const token = crypto.randomBytes(32).toString('base64url'); const date = new Date();
            const clinic = await clinicDetails();
            const signatureImageBase64 = req.signingUser.signatureUrl
                ? await (dependencies.readProfessionalSignature || require('../utils/assetStorage').readProfessionalSignature)(req.signingUser.signatureUrl, userId)
                : undefined;
            const signed = await verifyWithWorker({ operation: 'sign', ...credentials, document: { patientName: patient.name, patientCpf: decrypt(patient.cpf), patientAddress: patient.address ? decrypt(patient.address) : '', patientPhone: patient.phone ? decrypt(patient.phone) : '', clinic, signatureImageBase64, professionalName: req.signingUser.name, professionalCro: req.signingUser.cro, content: plainContent, date: date.toISOString(), verificationUrl: verificationUrl(token) } });
            const pdf = Buffer.from(signed.pdfBase64 || '', 'base64');
            if (signed.validation?.status !== 'VALID' || !pdf.subarray(0, 5).equals(Buffer.from('%PDF-')) || pdf.length > 10 * 1024 * 1024 || digest(pdf) !== signed.hash) throw fail(422, 'A assinatura não passou na validação criptográfica.');
            if (signed.certificate?.fingerprint !== certificate.fingerprint) throw fail(422, 'A assinatura não corresponde ao certificado cadastrado.', 'CERTIFICATE_CHANGED');
            storageKey = await storage.uploadDigitalPrescription({ userId, body: pdf });
            const result = await prisma.$transaction(async tx => {
                await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
                await tx.$queryRaw`SELECT "userId" FROM "DigitalCertificate" WHERE "userId" = ${userId} FOR UPDATE`;
                const current = await tx.digitalCertificate.findUnique({ where: { userId } });
                requireCertificate(current);
                if (current.status !== 'ACTIVE' || current.fingerprint !== certificate.fingerprint || current.sealedCredentials !== certificate.sealedCredentials) throw fail(422, 'O certificado mudou durante a assinatura.', 'CERTIFICATE_CHANGED');
                const professional = await tx.user.findUnique({ where: { id: userId }, select: { name: true, cro: true, role: true } });
                if (!professional || professional.name !== req.signingUser.name || professional.cro !== req.signingUser.cro || !['admin', 'dentist'].includes(professional.role)) throw fail(409, 'O perfil mudou. Revise seus dados e tente novamente.', 'PROFESSIONAL_CHANGED');
                const prescription = await tx.prescription.create({ data: { patientId, content: safeContent, date } });
                const document = await tx.digitalPrescription.create({ data: { prescriptionId: prescription.id, userId, operationId: operation.id, storageKey, hash: signed.hash, tokenDigest: digest(token), sealedToken: vault.seal(userId, { token }), signedAt: date, professionalName: req.signingUser.name, professionalCro: req.signingUser.cro, signatureStatus: 'VALID', validation: { ...signed.validation, certificateFingerprint: certificate.fingerprint } } });
                await tx.digitalIssueOperation.update({ where: { id: operation.id }, data: { status: 'COMPLETE' } });
                return { prescription, document };
            });
            activated = true;
            res.status(201).json(issueResponse(result.document, result.prescription));
        } catch (error) {
            if (!activated && operation) {
                // A commit acknowledgement can fail after the database commits. Check before deleting the uploaded object.
                let committed;
                try { committed = await prisma.digitalPrescription.findUnique({ where: { operationId: operation.id } }); } catch { throw error; }
                if (!committed) {
                    if (storageKey) await storage.deletePatientDocument(storageKey).catch(() => {});
                    await prisma.digitalIssueOperation.updateMany({ where: { id: operation.id, status: 'PENDING' }, data: { status: 'FAILED' } }).catch(() => {});
                }
            }
            throw error;
        } finally { locks.delete(lockKey); }
    }));
}

module.exports = { registerDigitalSigningRoutes, rateLimiter, certificateMatches };
