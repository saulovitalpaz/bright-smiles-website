const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const express = require('express');

async function withApi(prisma, run, extra = {}) {
    prisma.setting ||= { findMany: async () => [] };
    const { registerDigitalSigningRoutes } = require('../routes/digitalSigning');
    const app = express(); app.use(express.json());
    const authenticateToken = (req, res, next) => { if (!req.headers['x-user']) return res.sendStatus(401); req.user = { id: 1, role: 'admin', iat: extra.loginIat ?? Math.floor(Date.now() / 1000) }; next(); };
    registerDigitalSigningRoutes(app, { prisma, authenticateToken, ...extra });
    const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
    const request = (url, auth = false, method = 'GET', body) => fetch(`http://127.0.0.1:${server.address().port}${url}`, { method, headers: { ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(auth ? { 'x-user': '1' } : {}) }, ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}) });
    try { await run(request); } finally { await new Promise(resolve => server.close(resolve)); }
}

test('all digital private routes deny anonymous requests', async () => {
    await withApi({}, async request => {
        for (const [url, method] of [['/digital-signatures/certificate', 'GET'], ['/digital-signatures/certificate', 'POST'], ['/digital-signatures/certificate', 'DELETE'], ['/digital-signatures/certificate/suspend', 'POST'], ['/digital-signatures/certificate/verify', 'POST'], ['/prescriptions/digital-issue', 'POST'], ['/prescriptions/digital-documents/patient/1', 'GET'], ['/prescriptions/digital-documents/example', 'GET'], ['/prescriptions/digital-documents/example/file', 'GET'], ['/prescription-validation/pdf', 'POST']]) {
            assert.equal((await request(url, false, method)).status, 401);
        }
    });
});

test('stale admin claim cannot bypass current database role', async () => {
    await withApi({ user: { findUnique: async () => ({ id: 1, role: 'manager' }) } }, async request => {
        assert.equal((await request('/digital-signatures/certificate', true)).status, 403);
    });
});

test('clinic details and providers require current clinical authorization', async () => {
    for (const path of ['/digital-signatures/clinic', '/digital-signatures/providers']) {
        await withApi({ user: { findUnique: async () => ({ id: 1, role: 'manager' }) } }, async request => {
            assert.equal((await request(path)).status, 401);
            assert.equal((await request(path, true)).status, 403);
        });
    }
    await withApi({ user: { findUnique: async () => ({ id: 1, role: 'dentist' }) }, setting: { findMany: async ({ where }) => {
        assert.ok(!where.key.in.includes('secret'));
        return [{ key: 'clinic_address', value: 'Endereço fictício' }, { key: 'clinic_cnpj', value: 'CNPJ fictício' }];
    } } }, async request => {
        const response = await request('/digital-signatures/clinic', true);
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.deepEqual(await response.json(), { address: 'Endereço fictício', cnpj: 'CNPJ fictício' });
        const bird = await request('/prescriptions/digital-issue', true, 'POST', { provider: 'BIRD_ID' });
        assert.equal(bird.status, 503);
        assert.equal((await bird.json()).code, 'BIRD_ID_CONTRACT_PENDING');
    });
});

test('public token validation returns only minimal allowlisted data', async () => {
    const token = crypto.randomBytes(32).toString('base64url');
    await withApi({ digitalPrescription: { findUnique: async ({ where }) => { assert.equal(where.tokenDigest, crypto.createHash('sha256').update(token).digest('hex')); return { signatureStatus: 'VALID', professionalName: 'Fixture', professionalCro: 'Fixture', signedAt: new Date(), hash: 'a'.repeat(64), storageKey: 'private', sealedToken: 'private', prescription: { content: 'private' } }; } } }, async request => {
        const response = await request('/prescription-validation/token', false, 'POST', { token });
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.deepEqual(Object.keys(await response.json()).sort(), ['checkedAt', 'fileAvailable', 'hash', 'professionalCro', 'professionalName', 'scope', 'signatureStatusAtIssuance', 'signedAt', 'status']);
        const invalid = await request('/prescription-validation/token', false, 'POST', { token: 'short' });
        assert.equal((await invalid.json()).status, 'INVALID');
    });
});

test('private document lookup is scoped to current user and hides storage keys', async () => {
    await withApi({ user: { findUnique: async () => ({ id: 1, role: 'dentist' }) }, digitalPrescription: { findFirst: async ({ where }) => { assert.equal(where.userId, 1); return null; } } }, async request => {
        assert.equal((await request('/prescriptions/digital-documents/foreign', true)).status, 404);
    });
});

test('vault fails closed without an independent key and binds ciphertext to its owner', () => {
    const { createCertificateVault } = require('../utils/certificateVault');
    assert.throws(() => createCertificateVault({}).seal(1, { password: 'fixture' }));
    const vault = createCertificateVault({ DIGITAL_CERTIFICATE_KEY: crypto.randomBytes(32).toString('base64') });
    const secret = { password: 'fixture', pfxBase64: 'fixture', cpf: 'fixture' };
    const sealed = vault.seal(1, secret);
    assert.deepEqual(vault.open(1, sealed), secret);
    assert.throws(() => vault.open(2, sealed));
    assert.throws(() => vault.open(1, sealed.slice(0, -4) + 'AAAA'));
    assert.ok(!sealed.includes('fixture'));
});

test('CPF check digits and PKCS12 DER envelope reject invalid input', () => {
    const { validCpf, validPkcs12 } = require('../utils/certificateVault');
    assert.equal(validCpf('11111111111'), false);
    assert.equal(validCpf('12345678900'), false);
    assert.equal(validCpf('52998224725'), true);
    assert.equal(validPkcs12(Buffer.from('%PDF-1.7')), false);
    assert.equal(validPkcs12(Buffer.from([0x30, 3, 2, 1, 3])), true);
    assert.equal(validPkcs12(Buffer.from([0x30, 3, 2, 1, 3, 0])), false);
});

test('PKCS12 preflight accepts BER indefinite envelopes but rejects missing terminators', () => {
    const { validPkcs12 } = require('../utils/certificateVault');
    assert.equal(validPkcs12(Buffer.from([0x30, 0x80, 2, 1, 3, 0, 0])), true);
    assert.equal(validPkcs12(Buffer.from([0x30, 0x80, 2, 1, 3])), false);
    assert.equal(validPkcs12(Buffer.from([0x30, 0x80, 2, 1, 2, 0, 0])), false);
    assert.equal(validPkcs12(Buffer.from([0x30, 0x80, 2, 1, 3, 0, 1])), false);
});

test('worker environment excludes application credentials and vault keys', () => {
    const { workerEnvironment } = require('../services/digitalSigningWorker');
    const env = workerEnvironment({ PATH: 'fixture', DATABASE_URL: 'private', DIGITAL_CERTIFICATE_KEY: 'private', SIGNING_TRUST_ROOTS_PATH: 'roots' });
    assert.equal(env.DATABASE_URL, undefined);
    assert.equal(env.DIGITAL_CERTIFICATE_KEY, undefined);
    assert.equal(env.SIGNING_TRUST_ROOTS_PATH, 'roots');
});

test('signing requires recent login or password before runtime and patient access', async () => {
    await withApi({ user: { findUnique: async () => ({ id: 1, role: 'dentist' }) } }, async request => {
        const response = await request('/prescriptions/digital-issue', true, 'POST', { patientId: 1, content: 'Fixture', prescriptionType: 'SIMPLE', requestId: crypto.randomUUID() });
        assert.equal(response.status, 428); assert.equal((await response.json()).code, 'REAUTH_REQUIRED');
    }, { loginIat: 1 });
});

test('certificate deletion requires account password and preserves historical documents', async () => {
    const { hashPassword } = require('../utils/passwords');
    const password = crypto.randomBytes(20).toString('hex'); let removed = false;
    await withApi({ user: { findUnique: async () => ({ id: 1, role: 'dentist', password: await hashPassword(password) }) }, digitalCertificate: { deleteMany: async () => { removed = true; } } }, async request => {
        const invalid = await request('/digital-signatures/certificate', true, 'DELETE', { accountPassword: 'wrong' });
        assert.equal(invalid.status, 403); assert.equal((await invalid.json()).code, 'ACCESS_PASSWORD_INVALID');
        assert.equal(removed, false);
        assert.equal((await request('/digital-signatures/certificate', true, 'DELETE', { accountPassword: password })).status, 200);
        assert.equal(removed, true);
    });
});

test('changed patient snapshot rejects issuance before certificate inspection', async () => {
    let workerInspections = 0;
    const prisma = {
        user: { findUnique: async () => ({ id: 1, role: 'dentist', cro: 'Fixture' }) },
        digitalIssueOperation: { findUnique: async () => null },
        patient: { findUnique: async () => ({ name: 'Current patient', cpf: 'encrypted-fixture', consent: true }) }
    };
    await withApi(prisma, async request => {
        const result = await request('/prescriptions/digital-issue', true, 'POST', { patientId: 1, content: 'Fixture', prescriptionType: 'SIMPLE', requestId: crypto.randomUUID(), expectedPatient: { name: 'Old patient', cpf: '52998224725' } });
        assert.equal(result.status, 409); assert.equal((await result.json()).code, 'PATIENT_CHANGED'); assert.equal(workerInspections, 0);
    }, { vault: { available: true }, worker: async input => { if (input.operation === 'inspect') workerInspections++; return { available: true }; }, storage: { isPrivateDocumentStorageConfigured: () => true }, decrypt: () => '52998224725' });
});

test('public token validation rate limits repeated invalid submissions', async () => {
    await withApi({}, async request => {
        for (let index = 0; index < 30; index++) assert.equal((await request('/prescription-validation/token', false, 'POST', {})).status, 200);
        assert.equal((await request('/prescription-validation/token', false, 'POST', {})).status, 429);
    });
});

test('digital issuance activates only verified PDF and idempotent retry returns same document', async () => {
    const { createCertificateVault } = require('../utils/certificateVault');
    const vault = createCertificateVault({ DIGITAL_CERTIFICATE_KEY: crypto.randomBytes(32).toString('base64') });
    const pdf = Buffer.from('%PDF-1.7\nFixture'); const hash = crypto.createHash('sha256').update(pdf).digest('hex');
    const patientCpf = Array.from({ length: 11 }, () => crypto.randomInt(10)).join('');
    const certificate = { ...lifecycleMetadata }; let operation; let document; let prescription; let uploads = 0; let signs = 0;
    let signalSigning; let releaseSigning;
    const signingStarted = new Promise(resolve => { signalSigning = resolve; });
    const signingMayFinish = new Promise(resolve => { releaseSigning = resolve; });
    const prisma = {
        user: { findUnique: async () => ({ id: 1, role: 'dentist', name: 'Fixture', cro: 'Fixture' }) },
        patient: { findUnique: async () => ({ name: 'Patient fixture', cpf: patientCpf, consent: true }) },
        digitalCertificate: savedCertificateFixture(vault),
        digitalIssueOperation: {
            findUnique: async () => operation ? { ...operation, document: document ? { ...document, prescription } : null } : null,
            create: async ({ data }) => { operation = { id: crypto.randomUUID(), ...data, status: 'PENDING' }; return operation; },
            update: async ({ data }) => { operation = { ...operation, ...data }; },
            updateMany: async ({ where, data }) => {
                if (where.document) assert.deepEqual(where.document, { is: null });
                if (operation.status !== where.status || document) return { count: 0 };
                operation = { ...operation, ...data }; return { count: 1 };
            }
        },
        prescription: { create: async ({ data }) => { prescription = { id: 1, ...data }; return prescription; } },
        digitalPrescription: { create: async ({ data }) => { document = { id: crypto.randomUUID(), ...data }; return document; }, findUnique: async () => document || null },
        $queryRaw: async () => [], $transaction: async run => run(prisma)
    };
    const worker = async request => {
        if (request.operation === 'capabilities') return { available: true };
        if (request.operation === 'inspect') return { status: 'VALID', certificate };
        signs++; assert.equal(request.document.professionalName, 'Fixture'); assert.ok(!request.document.content.includes('<'));
        if (signs === 1) throw new Error('Temporary worker failure.');
        signalSigning(); await signingMayFinish;
        return { pdfBase64: pdf.toString('base64'), hash, certificate: lifecycleMetadata, validation: { status: 'VALID', signers: [] } };
    };
    const storage = { isPrivateDocumentStorageConfigured: () => true, uploadDigitalPrescription: async () => { uploads++; return 'private'; } };
    await withApi(prisma, async request => {
        const body = { patientId: 1, content: '<p>Fixture</p><script>bad()</script>', prescriptionType: 'SIMPLE', requestId: crypto.randomUUID(), expectedPatient: { name: 'Patient fixture', cpf: patientCpf } };
        assert.equal((await request('/prescriptions/digital-issue', true, 'POST', body)).status, 503);
        assert.equal(operation.status, 'FAILED');
        const activeRequest = request('/prescriptions/digital-issue', true, 'POST', body);
        await signingStarted;
        assert.equal((await request('/prescriptions/digital-issue', true, 'POST', body)).status, 409);
        releaseSigning();
        const first = await activeRequest; assert.equal(first.status, 201); const firstValue = await first.json();
        const second = await request('/prescriptions/digital-issue', true, 'POST', body); assert.equal(second.status, 200); assert.deepEqual(await second.json(), firstValue);
        assert.equal(signs, 2); assert.equal(uploads, 1);
        assert.ok(!document.tokenDigest.includes(firstValue.document.token));
        assert.ok(!document.sealedToken.includes(firstValue.document.token));
        assert.equal((await request('/prescriptions/digital-issue', true, 'POST', { ...body, content: 'Different' })).status, 409);
        assert.equal((await request('/prescriptions/digital-issue', true, 'POST', { ...body, expectedPatient: { ...body.expectedPatient, name: 'Changed patient' } })).status, 409);
        assert.equal((await request('/prescriptions/digital-issue', true, 'POST', { ...body, expectedPatient: { ...body.expectedPatient, cpf: patientCpf + '1' } })).status, 409);
    }, { vault, worker, storage });
});

test('failed operation claim lost to another instance cannot sign or read patient data', async () => {
    const body = { patientId: 1, content: 'Fixture', prescriptionType: 'SIMPLE', requestId: crypto.randomUUID() };
    const inputHash = crypto.createHash('sha256').update(JSON.stringify({ patientId: 1, content: 'Fixture', prescriptionType: 'SIMPLE' })).digest('hex');
    let patientReads = 0;
    const prisma = {
        user: { findUnique: async () => ({ id: 1, role: 'dentist', cro: 'Fixture' }) },
        digitalIssueOperation: {
            findUnique: async () => ({ id: 'fixture', status: 'FAILED', inputHash, document: null }),
            updateMany: async ({ where, data }) => { assert.equal(where.status, 'FAILED'); assert.deepEqual(where.document, { is: null }); assert.equal(data.status, 'PENDING'); return { count: 0 }; }
        },
        patient: { findUnique: async () => { patientReads++; } }
    };
    await withApi(prisma, async request => {
        assert.equal((await request('/prescriptions/digital-issue', true, 'POST', body)).status, 409);
        assert.equal(patientReads, 0);
    }, { vault: { available: true }, worker: async () => ({ available: true }), storage: { isPrivateDocumentStorageConfigured: () => true } });
});

test('pending operation blocks duplicate signing and changed content conflicts', async () => {
    const vault = { available: true }; let patientReads = 0;
    const prisma = {
        user: { findUnique: async () => ({ id: 1, role: 'dentist', name: 'Fixture', cro: 'Fixture' }) },
        patient: { findUnique: async () => { patientReads++; } },
        digitalIssueOperation: { findUnique: async () => ({ status: 'PENDING', inputHash: 'different' }) }
    };
    await withApi(prisma, async request => {
        const response = await request('/prescriptions/digital-issue', true, 'POST', { patientId: 1, content: 'Fixture', prescriptionType: 'SIMPLE', requestId: crypto.randomUUID() });
        assert.equal(response.status, 409); assert.equal(patientReads, 0);
    }, { vault, worker: async () => ({ available: true }), storage: { isPrivateDocumentStorageConfigured: () => true } });
});

test('unverified worker PDF never uploads or creates a prescription', async () => {
    const { createCertificateVault } = require('../utils/certificateVault');
    const vault = createCertificateVault({ DIGITAL_CERTIFICATE_KEY: crypto.randomBytes(32).toString('base64') });
    let uploaded = false; let failed = false;
    const prisma = {
        user: { findUnique: async () => ({ id: 1, role: 'dentist', name: 'Fixture', cro: 'Fixture' }) },
        patient: { findUnique: async () => ({ name: 'Fixture', cpf: 'Fixture', consent: true }) },
        digitalCertificate: savedCertificateFixture(vault),
        digitalIssueOperation: { findUnique: async () => null, create: async () => ({ id: 'fixture' }), updateMany: async () => { failed = true; } },
        digitalPrescription: { findUnique: async () => null }
    };
    const worker = async request => request.operation === 'capabilities' ? { available: true } : request.operation === 'inspect' ? { status: 'VALID', certificate: { ...lifecycleMetadata } } : { pdfBase64: Buffer.from('%PDF-Fixture').toString('base64'), hash: 'invalid', validation: { status: 'INVALID' } };
    await withApi(prisma, async request => {
        assert.equal((await request('/prescriptions/digital-issue', true, 'POST', { patientId: 1, content: 'Fixture', prescriptionType: 'SIMPLE', requestId: crypto.randomUUID() })).status, 422);
        assert.equal(uploaded, false); assert.equal(failed, true);
    }, { vault, worker, storage: { isPrivateDocumentStorageConfigured: () => true, uploadDigitalPrescription: async () => { uploaded = true; } } });
});

test('private download detects object modification before delivering bytes', async () => {
    await withApi({ user: { findUnique: async () => ({ id: 1, role: 'dentist' }) }, digitalPrescription: { findFirst: async () => ({ storageKey: 'fixture', hash: 'incorrect' }) } }, async request => {
        const response = await request('/prescriptions/digital-documents/fixture/file', true);
        assert.equal(response.status, 409); assert.equal(response.headers.get('cache-control'), 'no-store');
    }, { storage: { readDigitalPrescription: async () => Buffer.from('%PDF-Fixture') } });
});

test('lost commit acknowledgement never deletes an activated private PDF', async () => {
    const { createCertificateVault } = require('../utils/certificateVault');
    const vault = createCertificateVault({ DIGITAL_CERTIFICATE_KEY: crypto.randomBytes(32).toString('base64') });
    const pdf = Buffer.from('%PDF-Fixture'); let deleted = false; let markedFailed = false;
    const prisma = {
        user: { findUnique: async () => ({ id: 1, role: 'dentist', name: 'Fixture', cro: 'Fixture' }) },
        patient: { findUnique: async () => ({ name: 'Fixture', cpf: 'Fixture', consent: true }) },
        digitalCertificate: savedCertificateFixture(vault),
        digitalIssueOperation: { findUnique: async () => null, create: async () => ({ id: 'fixture' }), updateMany: async () => { markedFailed = true; } },
        digitalPrescription: { findUnique: async () => ({ id: 'already-committed' }) },
        $transaction: async () => { throw new Error('Commit acknowledgement lost.'); }
    };
    const worker = async request => request.operation === 'capabilities' ? { available: true } : request.operation === 'inspect' ? { status: 'VALID', certificate: { ...lifecycleMetadata } } : { pdfBase64: pdf.toString('base64'), hash: crypto.createHash('sha256').update(pdf).digest('hex'), certificate: lifecycleMetadata, validation: { status: 'VALID' } };
    const storage = { isPrivateDocumentStorageConfigured: () => true, uploadDigitalPrescription: async () => 'new-private-object', deletePatientDocument: async () => { deleted = true; } };
    await withApi(prisma, async request => {
        assert.equal((await request('/prescriptions/digital-issue', true, 'POST', { patientId: 1, content: 'Fixture', prescriptionType: 'SIMPLE', requestId: crypto.randomUUID() })).status, 503);
        assert.equal(deleted, false); assert.equal(markedFailed, false);
    }, { vault, worker, storage });
});
const lifecycleMetadata = { subjectName: 'Fixture', ready: true, fingerprint: 'a'.repeat(64), validUntil: '2099-01-01T00:00:00Z', checkedAt: '2026-01-01T00:00:00Z' };
async function lifecycleApi(run, options = {}) {
    const { hashPassword } = require('../utils/passwords');
    const password = crypto.randomBytes(20).toString('hex');
    const user = { id: 1, role: 'dentist', name: 'Fixture', cro: 'Fixture', password: await hashPassword(password) };
    let saved = { userId: 1, status: 'ACTIVE', suspendedAt: null, fingerprint: lifecycleMetadata.fingerprint, metadata: { ...lifecycleMetadata }, sealedCredentials: 'encrypted-fixture', ...options.saved };
    let inspections = 0; let signs = 0; let documents = 0; let deletes = 0; let capabilities = 0; let operation;
    const pdf = Buffer.from('%PDF-Fixture');
    const prisma = {
        user: { findUnique: async () => ({ ...user }) }, patient: { findUnique: async () => ({ name: 'Fixture', cpf: 'Fixture', consent: true }) },
        digitalCertificate: {
            findUnique: async () => saved,
            upsert: async ({ update }) => { saved = { ...saved, ...update }; return saved; },
            updateMany: async ({ where, data }) => { if (where.status?.in && !where.status.in.includes(saved.status)) return { count: 0 }; if (where.fingerprint && where.fingerprint !== saved.fingerprint) return { count: 0 }; if (where.sealedCredentials && where.sealedCredentials !== saved.sealedCredentials) return { count: 0 }; saved = { ...saved, ...data }; return { count: 1 }; }
        },
        digitalIssueOperation: { findUnique: async () => null, create: async () => { operation = { id: 'operation' }; return operation; }, update: async () => {}, updateMany: async () => ({ count: 1 }) },
        prescription: { create: async ({ data }) => { documents++; return { id: 1, ...data }; } },
        digitalPrescription: { create: async ({ data }) => ({ id: 'document', ...data }), findUnique: async () => null },
        $queryRaw: async () => [saved], $transaction: async fn => fn(prisma)
    };
    const worker = async input => {
        if (input.operation === 'capabilities') { capabilities++; return { available: true }; }
        if (input.operation === 'inspect') { inspections++; if (options.inspectProfileChange) user.name = 'Changed profile'; if (options.duringInspect) saved = { ...saved, ...options.duringInspect }; if (options.inspectError) throw Object.assign(new Error('Fixture validation failure'), { status: 422, code: options.inspectError }); return { status: 'VALID', certificate: { ...lifecycleMetadata, ...options.inspected } }; }
        signs++; if (options.duringSign) saved = { ...saved, ...options.duringSign }; if (options.changedProfile) user.cro = "Changed fixture";
        return { pdfBase64: pdf.toString('base64'), hash: crypto.createHash('sha256').update(pdf).digest('hex'), certificate: lifecycleMetadata, validation: { status: 'VALID' } };
    };
    const storage = { isPrivateDocumentStorageConfigured: () => true, uploadDigitalPrescription: async () => 'private-fixture', deletePatientDocument: async () => { deletes++; } };
    await withApi(prisma, request => run({ request, password, saved: () => saved, counts: () => ({ inspections, signs, documents, deletes, capabilities }) }), { worker, storage, vault: { available: true, open: () => { if (options.rejectDecrypt) throw new Error('Must not decrypt'); return {}; }, seal: () => 'new-encrypted-fixture' } });
}
const issueFixture = () => ({ patientId: 1, content: 'Fixture', prescriptionType: 'SIMPLE', requestId: crypto.randomUUID() });

test('suspension reauthenticates and persists without removing credentials', async () => {
    await lifecycleApi(async ({ request, password, saved }) => {
        assert.equal((await request('/digital-signatures/certificate/suspend', true, 'POST', { accountPassword: 'wrong' })).status, 403);
        assert.equal(saved().status, 'ACTIVE');
        const response = await request('/digital-signatures/certificate/suspend', true, 'POST', { accountPassword: password });
        assert.equal(response.status, 200);
        assert.equal(saved().status, 'SUSPENDED'); assert.ok(saved().suspendedAt);
        assert.equal(saved().sealedCredentials, 'encrypted-fixture');
        const body = await response.json(); assert.equal(body.certificate.status, 'SUSPENDED'); assert.equal(body.certificate.ready, false);
        assert.ok(!JSON.stringify(body).includes('encrypted-fixture'));
    });
});

test('suspended certificate blocks signing before decrypt or inspection', async () => {
    await lifecycleApi(async ({ request, counts }) => {
        const response = await request('/prescriptions/digital-issue', true, 'POST', issueFixture());
        assert.equal(response.status, 422); assert.equal((await response.json()).code, 'CERTIFICATE_SUSPENDED');
        assert.equal(counts().inspections, 0); assert.equal(counts().signs, 0); assert.equal(counts().capabilities, 0);
    }, { saved: { status: 'SUSPENDED' }, rejectDecrypt: true });
});

test('expiry and revoked inspection outcomes persist while source outages remain retryable', async () => {
    for (const [code, status] of [['CERTIFICATE_EXPIRED', 'EXPIRED'], ['CERTIFICATE_REVOKED', 'REVOKED'], ['CERTIFICATE_UNTRUSTED', 'VERIFICATION_UNAVAILABLE']]) {
        await lifecycleApi(async ({ request, saved }) => {
            const response = await request('/prescriptions/digital-issue', true, 'POST', issueFixture());
            assert.equal(response.status, 422); assert.equal((await response.json()).code, code);
            assert.equal(saved().status, status); assert.equal(saved().sealedCredentials, 'encrypted-fixture');
        }, { inspectError: code });
    }
});

test('certificate GET computes expired readiness without decrypting or inspecting', async () => {
    await lifecycleApi(async ({ request, counts }) => {
        const response = await request('/digital-signatures/certificate', true);
        const body = await response.json(); assert.equal(body.certificate.status, 'EXPIRED'); assert.equal(body.certificate.ready, false); assert.equal(counts().inspections, 0);
    }, { saved: { metadata: { ...lifecycleMetadata, validUntil: '2000-01-01T00:00:00Z' } }, rejectDecrypt: true });
});

test('suspension during signing prevents document issuance and cleans uploaded PDF', async () => {
    await lifecycleApi(async ({ request, counts }) => {
        const response = await request('/prescriptions/digital-issue', true, 'POST', issueFixture());
        assert.equal(response.status, 422); assert.equal((await response.json()).code, 'CERTIFICATE_SUSPENDED');
        assert.equal(counts().documents, 0); assert.equal(counts().deletes, 1);
    }, { duringSign: { status: 'SUSPENDED', suspendedAt: new Date() } });
});

test('fresh inspection must match persisted certificate fingerprint', async () => {
    await lifecycleApi(async ({ request, counts }) => {
        assert.equal((await request('/prescriptions/digital-issue', true, 'POST', issueFixture())).status, 422);
        assert.equal(counts().signs, 0);
    }, { inspected: { fingerprint: 'b'.repeat(64) } });
});

const certificateUpload = password => {
    const form = new FormData();
    form.set('certificate', new Blob([Buffer.from([0x30, 3, 2, 1, 3])]), 'fixture.pfx');
    form.set('cpf', '52998224725'); form.set('password', 'synthetic-fixture'); form.set('accountPassword', password);
    return form;
};
test('valid certificate replacement automatically activates and clears suspension', async () => {
    await lifecycleApi(async ({ request, password, saved }) => {
        const response = await request('/digital-signatures/certificate', true, 'POST', certificateUpload(password));
        assert.equal(response.status, 200); assert.equal(saved().status, 'ACTIVE'); assert.equal(saved().suspendedAt, null);
        assert.equal(saved().fingerprint, lifecycleMetadata.fingerprint);
        const result = await response.json();
        assert.equal(result.certificate.status, 'ACTIVE');
        assert.equal(result.professional.name, 'Fixture');
        assert.equal(result.professional.cro, 'Fixture');
        assert.equal(Object.hasOwn(result.professional, 'password'), false);
    }, { saved: { status: 'SUSPENDED', suspendedAt: new Date() } });
});
test('failed certificate replacement preserves previously valid credentials', async () => {
    await lifecycleApi(async ({ request, password, saved }) => {
        assert.equal((await request('/digital-signatures/certificate', true, 'POST', certificateUpload(password))).status, 422);
        assert.equal(saved().status, 'ACTIVE'); assert.equal(saved().sealedCredentials, 'encrypted-fixture');
    }, { inspectError: 'INVALID_CERTIFICATE' });
});

test('certificate upload extracts CPF in the worker when no manual assertion is supplied', async () => {
    await lifecycleApi(async ({ request, password, counts }) => {
        const form = certificateUpload(password);
        form.delete('cpf');
        const response = await request('/digital-signatures/certificate', true, 'POST', form);
        assert.equal(response.status, 200);
        assert.equal(counts().inspections, 1);
    });
});

test('certificate upload explains profile mismatch without replacing credentials', async () => {
    await lifecycleApi(async ({ request, password, saved }) => {
        const response = await request('/digital-signatures/certificate', true, 'POST', certificateUpload(password));
        assert.equal(response.status, 422);
        assert.equal((await response.json()).code, 'CERTIFICATE_PROFILE_MISMATCH');
        assert.equal(saved().sealedCredentials, 'encrypted-fixture');
    }, { inspected: { subjectName: 'Another professional' } });
});

test('profile changes during upload prevent activation against stale identity', async () => {
    await lifecycleApi(async ({ request, password, saved }) => {
        const response = await request('/digital-signatures/certificate', true, 'POST', certificateUpload(password));
        assert.equal(response.status, 409);
        assert.equal((await response.json()).code, 'PROFESSIONAL_CHANGED');
        assert.equal(saved().sealedCredentials, 'encrypted-fixture');
    }, { inspectProfileChange: true });
});

function savedCertificateFixture(vault) {
    let saved = { userId: 1, status: 'ACTIVE', sealedCredentials: vault.seal(1, {}), fingerprint: lifecycleMetadata.fingerprint, metadata: { ...lifecycleMetadata } };
    return { findUnique: async () => saved, updateMany: async ({ data }) => { saved = { ...saved, ...data }; return { count: 1 }; } };
}

test('certificate replacement during signing prevents stale certificate issuance', async () => {
    await lifecycleApi(async ({ request, counts }) => {
        const response = await request('/prescriptions/digital-issue', true, 'POST', issueFixture());
        assert.equal(response.status, 422); assert.equal((await response.json()).code, 'CERTIFICATE_CHANGED');
        assert.equal(counts().documents, 0); assert.equal(counts().deletes, 1);
    }, { duringSign: { sealedCredentials: 'replacement-fixture' } });
});
test('professional profile changes during signing prevent issuance', async () => {
    await lifecycleApi(async ({ request, counts }) => {
        const response = await request('/prescriptions/digital-issue', true, 'POST', issueFixture());
        assert.equal(response.status, 409); assert.equal((await response.json()).code, 'PROFESSIONAL_CHANGED');
        assert.equal(counts().documents, 0); assert.equal(counts().deletes, 1);
    }, { changedProfile: true });
});
test('verification unavailable certificate retries fresh cryptographic inspection and reactivates', async () => {
    await lifecycleApi(async ({ request, saved, counts }) => {
        const response = await request('/prescriptions/digital-issue', true, 'POST', issueFixture());
        assert.equal(response.status, 201); assert.equal(saved().status, 'ACTIVE'); assert.equal(saved().lastVerificationCode, null);
        assert.equal(counts().inspections, 1);
    }, { saved: { status: 'VERIFICATION_UNAVAILABLE', lastVerificationCode: 'CERTIFICATE_UNTRUSTED' } });
});
test('known certificate expiry persists and blocks signing without inspection', async () => {
    await lifecycleApi(async ({ request, saved, counts }) => {
        const response = await request('/prescriptions/digital-issue', true, 'POST', issueFixture());
        assert.equal(response.status, 422); assert.equal((await response.json()).code, 'CERTIFICATE_EXPIRED');
        assert.equal(saved().status, 'EXPIRED'); assert.equal(counts().inspections, 0);
    }, { saved: { metadata: { ...lifecycleMetadata, validUntil: '2000-01-01T00:00:00Z' } } });
});

test('private certificate reverify recovers temporary unavailable status without account password', async () => {
    await lifecycleApi(async ({ request, saved, counts }) => {
        const response = await request('/digital-signatures/certificate/verify', true, 'POST', {});
        assert.equal(response.status, 200); const body = await response.json();
        assert.equal(saved().status, 'ACTIVE'); assert.equal(saved().lastVerificationCode, null);
        assert.equal(body.certificate.ready, true); assert.equal(body.certificate.status, 'ACTIVE'); assert.equal(counts().inspections, 1); assert.equal(counts().signs, 0);
        assert.ok(!JSON.stringify(body).includes('encrypted-fixture'));
    }, { saved: { status: 'VERIFICATION_UNAVAILABLE', lastVerificationCode: 'CERTIFICATE_UNTRUSTED' } });
});
test('certificate reverify never reactivates suspended expired or revoked credentials', async () => {
    for (const [status, code] of [['SUSPENDED', 'CERTIFICATE_SUSPENDED'], ['EXPIRED', 'CERTIFICATE_EXPIRED'], ['REVOKED', 'CERTIFICATE_REVOKED']]) {
        await lifecycleApi(async ({ request, saved, counts }) => {
            const response = await request('/digital-signatures/certificate/verify', true, 'POST', {});
            assert.equal(response.status, 422); assert.equal((await response.json()).code, code); assert.equal(saved().status, status);
            assert.equal(counts().inspections, 0); assert.equal(counts().capabilities, 0);
        }, { saved: { status }, rejectDecrypt: true });
    }
});
test('suspension during certificate reverify remains persistent and blocks activation', async () => {
    await lifecycleApi(async ({ request, saved }) => {
        const response = await request('/digital-signatures/certificate/verify', true, 'POST', {});
        assert.equal(response.status, 422); assert.equal((await response.json()).code, 'CERTIFICATE_SUSPENDED');
        assert.equal(saved().status, 'SUSPENDED'); assert.equal(saved().sealedCredentials, 'encrypted-fixture');
    }, { saved: { status: 'VERIFICATION_UNAVAILABLE' }, duringInspect: { status: 'SUSPENDED', suspendedAt: new Date() } });
});
test('certificate reverify preserves outage and permanent failure classifications', async () => {
    for (const [code, status] of [['CERTIFICATE_UNTRUSTED', 'VERIFICATION_UNAVAILABLE'], ['CERTIFICATE_EXPIRED', 'EXPIRED'], ['CERTIFICATE_REVOKED', 'REVOKED']]) {
        await lifecycleApi(async ({ request, saved }) => {
            const response = await request('/digital-signatures/certificate/verify', true, 'POST', {});
            assert.equal(response.status, 422); assert.equal((await response.json()).code, code); assert.equal(saved().status, status);
        }, { saved: { status: 'VERIFICATION_UNAVAILABLE' }, inspectError: code });
    }
});
test('certificate replacement during reverify cannot activate stale credentials', async () => {
    await lifecycleApi(async ({ request, saved }) => {
        const response = await request('/digital-signatures/certificate/verify', true, 'POST', {});
        assert.equal(response.status, 422); assert.equal((await response.json()).code, 'CERTIFICATE_CHANGED');
        assert.equal(saved().sealedCredentials, 'replacement-fixture'); assert.equal(saved().status, 'VERIFICATION_UNAVAILABLE');
    }, { saved: { status: 'VERIFICATION_UNAVAILABLE' }, duringInspect: { sealedCredentials: 'replacement-fixture' } });
});
test('certificate reverify records known expiry without consulting worker', async () => {
    await lifecycleApi(async ({ request, saved, counts }) => {
        const response = await request('/digital-signatures/certificate/verify', true, 'POST', {});
        assert.equal(response.status, 422); assert.equal((await response.json()).code, 'CERTIFICATE_EXPIRED');
        assert.equal(saved().status, 'EXPIRED'); assert.equal(counts().capabilities, 0);
    }, { saved: { metadata: { ...lifecycleMetadata, validUntil: '2000-01-01T00:00:00Z' } }, rejectDecrypt: true });
});


test('certificate upload identifies invalid fields before inspection without changing saved credentials', async () => {
    await lifecycleApi(async ({ request, password, saved, counts }) => {
        const cases = [
            ['cpf', '12345678900', 'INVALID_CPF'],
            ['password', '', 'CERTIFICATE_PASSWORD_REQUIRED'],
            ['password', 'x'.repeat(1025), 'CERTIFICATE_PASSWORD_INVALID'],
            ['certificate', new Blob([Buffer.from([0x30, 3, 2, 1, 3])]), 'CERTIFICATE_FILE_INVALID', 'fixture.txt'],
            ['certificate', new Blob([Buffer.from('%PDF-1.7')]), 'CERTIFICATE_FILE_INVALID', 'fixture.pfx'],
        ];
        for (const [field, value, code, filename] of cases) {
            const form = certificateUpload(password);
            if (filename) form.set(field, value, filename); else form.set(field, value);
            const response = await request('/digital-signatures/certificate', true, 'POST', form);
            assert.equal(response.status, 400);
            assert.equal((await response.json()).code, code);
            assert.equal(counts().inspections, 0);
            assert.equal(saved().sealedCredentials, 'encrypted-fixture');
        }
    });
});


test('public PDF access requires a valid token and never trusts a document ID', async () => {
    let lookups = 0; let reads = 0;
    const prisma = { digitalPrescription: { findUnique: async () => { lookups++; return null; } } };
    await withApi(prisma, async request => {
        for (const body of [{}, { token: 'short' }, { id: 'known-document' }, { token: crypto.randomBytes(32).toString('base64url') }]) {
            assert.equal((await request('/prescription-validation/file', false, 'POST', body)).status, 404);
        }
        assert.equal(lookups, 1); assert.equal(reads, 0);
        assert.equal((await request('/prescription-validation/file')).status, 404);
    }, { storage: { readDigitalPrescription: async () => { reads++; } } });
});

test('public PDF access returns the exact stored signed bytes with no public storage URL', async () => {
    const token = crypto.randomBytes(32).toString('base64url');
    const pdf = Buffer.from('%PDF-1.7\nSynthetic signed document');
    const hash = crypto.createHash('sha256').update(pdf).digest('hex');
    const prisma = { digitalPrescription: { findUnique: async ({ where }) => {
        assert.equal(where.tokenDigest, crypto.createHash('sha256').update(token).digest('hex'));
        return { signatureStatus: 'VALID', hash, storageKey: 'private-fixture' };
    } } };
    await withApi(prisma, async request => {
        const response = await request('/prescription-validation/file', false, 'POST', { token });
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('content-type'), 'application/pdf');
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
        assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
        assert.match(response.headers.get('content-disposition'), /^inline;/);
        assert.deepEqual(Buffer.from(await response.arrayBuffer()), pdf);
    }, { storage: { readDigitalPrescription: async key => { assert.equal(key, 'private-fixture'); return pdf; } } });
});

test('public PDF access blocks altered bytes, invalid issuance and unavailable storage', async () => {
    for (const state of ['altered', 'invalid', 'unavailable']) {
        let reads = 0;
        await withApi({ digitalPrescription: { findUnique: async () => ({ signatureStatus: state === 'invalid' ? 'INVALID' : 'VALID', hash: 'a'.repeat(64), storageKey: 'private-fixture' }) } }, async request => {
            const response = await request('/prescription-validation/file', false, 'POST', { token: crypto.randomBytes(32).toString('base64url') });
            assert.equal(response.status, state === 'invalid' ? 404 : state === 'altered' ? 409 : 503);
            assert.ok(!JSON.stringify(await response.json()).includes('private-fixture'));
            assert.equal(reads, state === 'invalid' ? 0 : 1);
        }, { storage: { readDigitalPrescription: async () => { reads++; if (state === 'unavailable') throw new Error('private-fixture'); return Buffer.from('%PDF-altered'); } } });
    }
});

test('public PDF access shares the token brute-force limit', async () => {
    await withApi({}, async request => {
        for (let index = 0; index < 30; index++) await request('/prescription-validation/token', false, 'POST', {});
        assert.equal((await request('/prescription-validation/file', false, 'POST', {})).status, 429);
    });
});
