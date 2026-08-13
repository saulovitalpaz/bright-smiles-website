const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const multer = require('multer');
const {
    uploadAsset,
    withAssetUploadCleanup,
    createPublicAssetUrl,
    createPrivateAssetUrl,
    createFinancialAssetUrl,
    validateAssetDeliveryRequest
} = require('./utils/assetStorage');
const { uploadPatientDocument, deletePatientDocument, createPatientDocumentUrl } = require('./utils/patientDocumentStorage');
const { isSupportedUpload, isSupportedUploadForScope } = require('./utils/uploadValidation');

const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { createEncryption } = require('./utils/encryption');
const { createUpdateLeadHandler } = require('./routes/leads');
const { createDashboardStatsHandler } = require('./routes/dashboard');
const {
    parseOptionalDate,
    normalizeScheduledAt,
    normalizeReturnDate,
    syncReturnAppointment,
    buildUpcomingSchedule
} = require('./utils/schedule');
const { PUBLIC_SETTINGS_KEYS, toPublicSettings } = require('./utils/publicSettings');
const auditLogger = require('./middleware/auditLogger');
const { hashPassword, verifyPassword } = require('./utils/passwords');
const sanitizeBlogContent = require('./utils/sanitizeBlogContent');
const {
    SIGNATURE_IMAGE_TYPES,
    isSupportedSignatureImage,
    signatureExtension
} = require('./utils/signatureImage');
const {
    patientSchema,
    appointmentSchema,
    appointmentStatusSchema,
    returnDateSchema,
    loginSchema,
    createUserSchema,
    updateCurrentUserSchema
} = require('./utils/validationSchemas');

const app = express();
app.set('trust proxy', 1);
const prisma = new PrismaClient();
const updateLeadHandler = createUpdateLeadHandler(prisma);
const dashboardStatsHandler = createDashboardStatsHandler(prisma, buildUpcomingSchedule);
const port = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGINS = new Set([
    'https://www.odontoeharmonizacao.com.br',
    'https://odontoeharmonizacao.com.br',
    'http://localhost:5173'
]);
const requireProductionSecret = (name) => {
    const value = process.env[name];
    if (isProduction && (typeof value !== 'string' || value.length < 32)) {
        throw new Error('Invalid server security configuration.');
    }
    return value;
};
const JWT_SECRET = requireProductionSecret('JWT_SECRET') || 'development-only-jwt-secret-do-not-use-in-production';
requireProductionSecret('ENCRYPTION_KEY');
const { encrypt, decrypt, blindIndex } = createEncryption(process.env);
const normalizeCpf = (value) => String(value || '').replace(/\D/g, '');
const findPatientByCpf = async (cpf, include) => {
    const indexed = await prisma.patient.findUnique({
        where: { cpfIndex: blindIndex(cpf) },
        ...(include ? { include } : {})
    });
    if (indexed) return indexed;

    const patients = await prisma.patient.findMany(include ? { include } : undefined);
    return patients.find((patient) => normalizeCpf(decrypt(patient.cpf)) === normalizeCpf(cpf)) || null;
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        const allowedMimeTypes = new Set([
            'image/jpeg',
            'image/png',
            'image/webp',
            'video/mp4',
            'video/quicktime',
            'video/webm',
            'application/pdf'
        ]);
        callback(null, allowedMimeTypes.has(file.mimetype));
    }
});
const documentUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, callback) => callback(null, file.mimetype === 'application/pdf')
});
const financialUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, callback) => callback(null, new Set([
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf'
    ]).has(file.mimetype))
});
const signatureUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => callback(null, SIGNATURE_IMAGE_TYPES.has(file.mimetype))
});

app.disable('x-powered-by');
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});
app.use(cors({
    origin: [...ALLOWED_ORIGINS],
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use((req, res, next) => {
    if (!isProduction || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.get('origin');
    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
        return res.status(403).json({ error: 'Invalid request origin.' });
    }
    next();
});
app.use(auditLogger);
app.use((req, res, next) => {
    if (process.env.MAINTENANCE_MODE === 'true' && req.path !== '/health') {
        return res.status(503).json({ error: 'Service temporarily unavailable.' });
    }
    next();
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) token = req.cookies.token;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(401);
        req.user = user;
        next();
    });
};

const optionalAuthenticateToken = (req, _res, next) => {
    const token = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : req.cookies.token;
    if (!token) return next();
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (!err) req.user = user;
        next();
    });
};

// RBAC Middleware
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) return res.sendStatus(401);
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
        }
        next();
    };
};

app.post('/upload', authenticateToken, authorizeRole(['admin', 'dentist']), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Supported image, video, or PDF file is required.' });
        }

        const scope = req.body?.scope || 'public';
        if (!['public', 'clinical'].includes(scope)
            || !isSupportedUploadForScope(scope, req.file.buffer, req.file.mimetype)) {
            return res.status(400).json({ error: 'Invalid file for this storage scope.' });
        }

        const asset = await uploadAsset({
            scope,
            body: req.file.buffer,
            contentType: req.file.mimetype,
            extension: req.file.originalname ? req.file.originalname.split('.').pop() : undefined,
            ownerId: req.user?.id
        });

        await withAssetUploadCleanup({
            uploadedReference: asset.reference,
            run: async () => {
                const payload = { reference: asset.reference, url: asset.deliveryPath };
                res.json(payload);
            }
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/financial-assets', authenticateToken, authorizeRole(['admin', 'manager']), financialUpload.single('file'), async (req, res) => {
    try {
        if (!req.file || !isSupportedUploadForScope('financial', req.file.buffer, req.file.mimetype)) {
            return res.status(400).json({ error: 'A valid receipt image or PDF is required.' });
        }

        const asset = await uploadAsset({
            scope: 'financial',
            body: req.file.buffer,
            contentType: req.file.mimetype,
            extension: req.file.originalname ? req.file.originalname.split('.').pop() : undefined,
            ownerId: req.user.id
        });
        await withAssetUploadCleanup({
            uploadedReference: asset.reference,
            run: async () => res.json({ reference: asset.reference, url: asset.deliveryPath })
        });
    } catch (error) {
        console.error('Financial receipt upload failed.');
        res.status(500).json({ error: 'Unable to upload receipt.' });
    }
});

app.post('/upload/signature', authenticateToken, authorizeRole(['admin']), signatureUpload.single('file'), async (req, res) => {
    try {
        if (!req.file || !isSupportedSignatureImage(req.file.buffer, req.file.mimetype)) {
            return res.status(400).json({ error: 'A valid JPEG, PNG, or WebP signature image is required.' });
        }

        const asset = await uploadAsset({
            scope: 'public',
            body: req.file.buffer,
            contentType: req.file.mimetype,
            extension: signatureExtension(req.file.mimetype),
            ownerId: req.user.id
        });

        await withAssetUploadCleanup({
            uploadedReference: asset.reference,
            run: async () => res.json({ reference: asset.reference, url: asset.deliveryPath })
        });
    } catch (error) {
        console.error('Signature upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/assets', async (req, res) => {
    try {
        const validation = validateAssetDeliveryRequest({
            routeScope: 'public',
            reference: req.query.reference
        });
        if (!validation.ok) {
            return res.status(validation.statusCode).json({ error: validation.error });
        }

        return res.redirect(302, await createPublicAssetUrl(validation.reference));
    } catch (error) {
        console.error('Public asset access error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/clinical-assets', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        const validation = validateAssetDeliveryRequest({
            routeScope: 'clinical',
            reference: req.query.reference
        });
        if (!validation.ok) {
            return res.status(validation.statusCode).json({ error: validation.error });
        }

        return res.redirect(302, await createPrivateAssetUrl(validation.reference));
    } catch (error) {
        console.error('Clinical asset access error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/financial-assets', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const validation = validateAssetDeliveryRequest({
            routeScope: 'financial',
            reference: req.query.reference
        });
        if (!validation.ok) {
            return res.status(validation.statusCode).json({ error: validation.error });
        }

        return res.redirect(302, await createFinancialAssetUrl(validation.reference));
    } catch (error) {
        console.error('Financial asset access failed.');
        res.status(500).json({ error: 'Unable to access receipt.' });
    }
});

// Private patient-document upload. The database stores only the object key;
// access is granted through the authenticated route below.
app.post('/patient-documents/:id/file', authenticateToken, authorizeRole(['admin', 'dentist']), documentUpload.single('file'), async (req, res) => {
    let storageKey;
    let documentUpdated = false;
    try {
        if (!req.file || !isSupportedUpload(req.file.buffer, req.file.mimetype)) {
            return res.status(400).json({ error: 'Only valid PDF files are accepted.' });
        }

        const documentId = Number.parseInt(req.params.id, 10);
        if (!Number.isInteger(documentId)) return res.status(400).json({ error: 'Invalid document id.' });

        const document = await prisma.patientDocument.findUnique({ where: { id: documentId } });
        if (!document) return res.status(404).json({ error: 'Document not found.' });

        const previousStorageKey = document.storageKey;
        storageKey = await uploadPatientDocument({ patientId: document.patientId, body: req.file.buffer });
        await prisma.patientDocument.update({
            where: { id: documentId },
            data: { storageKey, pdfUrl: null }
        });
        documentUpdated = true;

        if (previousStorageKey && previousStorageKey !== storageKey) {
            await deletePatientDocument(previousStorageKey).catch(() => {
                console.error('Previous patient document cleanup failed.');
            });
        }

        res.json({ url: `/patient-documents/${documentId}/file` });
    } catch (error) {
        if (storageKey && !documentUpdated) await deletePatientDocument(storageKey).catch(() => {});
        console.error('Patient document upload failed.');
        res.status(500).json({ error: 'Unable to upload document.' });
    }
});

app.get('/patient-documents/:id/file', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        const documentId = Number.parseInt(req.params.id, 10);
        const document = await prisma.patientDocument.findUnique({ where: { id: documentId } });
        if (!document) return res.status(404).json({ error: 'Document not found.' });

        if (document.storageKey) {
            return res.redirect(302, await createPatientDocumentUrl(document.storageKey));
        }
        if (document.pdfUrl) return res.redirect(302, document.pdfUrl);
        return res.status(404).json({ error: 'No file attached to this document.' });
    } catch (error) {
        console.error('Patient document access error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.json({ message: 'Bright Smiles API is running!' });
});


app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok' });
    } catch (error) {
        res.status(503).json({ status: 'error' });
    }
});

const SAFE_USER_SELECT = {
    id: true,
    username: true,
    name: true,
    cro: true,
    signatureUrl: true,
    role: true,
    createdAt: true,
    updatedAt: true
};
const STAFF_USER_SELECT = {
    id: true,
    name: true,
    role: true
};

const toSafeUser = (user) => ({
    id: user.id,
    username: user.username,
    name: user.name,
    cro: user.cro,
    signatureUrl: user.signatureUrl,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});

// Users API
app.get('/staff', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        const staff = await prisma.user.findMany({ select: STAFF_USER_SELECT });
        res.json(staff);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const users = await prisma.user.findMany({ select: SAFE_USER_SELECT });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const result = createUserSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    try {
        const password = await hashPassword(result.data.password);
        const user = await prisma.user.create({
            data: {
                ...result.data,
                cro: result.data.cro || null,
                password
            },
            select: SAFE_USER_SELECT
        });
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.patch('/users/me', authenticateToken, async (req, res) => {
    const result = updateCurrentUserSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: result.data,
            select: SAFE_USER_SELECT
        });
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/login', async (req, res) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    const { username, password } = result.data;
    try {
        const user = await prisma.user.findUnique({
            where: { username }
        });

        const passwordResult = user
            ? await verifyPassword(password, user.password)
            : { valid: false, needsUpgrade: false };

        if (user && passwordResult.valid) {
            if (passwordResult.needsUpgrade) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { password: await hashPassword(password) }
                });
            }
            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });

            const isSecure = process.env.NODE_ENV === 'production' || req.secure;
            res.cookie('token', token, {
                httpOnly: true,
                secure: isSecure,
                sameSite: 'lax',
                maxAge: 12 * 60 * 60 * 1000 // 12 hours
            });

            res.json(toSafeUser(user));
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: isProduction });
    res.json({ message: 'Logged out' });
});

app.get('/auth/session', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: SAFE_USER_SELECT
        });
        if (!user) return res.sendStatus(401);
        res.json(user);
    } catch {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Protect all API routes below if needed. For now, applying selectively or globally?
// User asked for "Hardened Session Management".
// Let's protect sensitive routes.

// Posts API
app.get('/posts', async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            orderBy: { date: 'desc' }
        });
        res.json(posts.map((post) => ({ ...post, content: sanitizeBlogContent(post.content) })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/posts/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const post = await prisma.post.findUnique({
            where: { slug }
        });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json({ ...post, content: sanitizeBlogContent(post.content) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/posts', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const post = await prisma.post.create({
            data: { ...req.body, content: sanitizeBlogContent(req.body.content) }
        });
        res.json(post);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/posts/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { id: _id, createdAt, updatedAt, ...data } = req.body;
        const post = await prisma.post.update({
            where: { id: parseInt(id) },
            data: { ...data, content: sanitizeBlogContent(data.content) }
        });
        res.json(post);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/posts/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        await prisma.post.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/posts/:id/view', async (req, res) => {
    try {
        // Increment views
        const post = await prisma.post.update({
            where: { id: parseInt(req.params.id) },
            data: { views: { increment: 1 } }
        });
        res.json({ views: post.views });
    } catch (error) {
        res.status(200).send("OK"); // Fail silently
    }
});

// ... Appointments ...


// Appointments API
app.get('/appointments', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        const patientId = Number.parseInt(req.query.patientId, 10);
        const where = Number.isNaN(patientId) ? {} : { patientId };
        const list = await prisma.appointment.findMany({
            where,
            orderBy: { date: 'desc' }
        });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/appointments/:id', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        const { id } = req.params;
        const item = await prisma.appointment.findUnique({
            where: { id: parseInt(id) },
            include: { patient: true, returnAppointment: true }
        });
        if (!item) return res.status(404).json({ error: 'Appointment not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/appointments', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    const result = appointmentSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    const payload = { ...result.data };
    try {
        payload.date = parseOptionalDate(payload.date, 'Invalid appointment date');
        if (!payload.date) {
            return res.status(400).json({ error: 'Invalid appointment date' });
        }
        payload.returnDate = normalizeReturnDate(payload.returnDate);
        payload.scheduledAt = normalizeScheduledAt(payload.scheduledAt);
        if (payload.price === '' || payload.price === null || payload.price === undefined) {
            payload.price = null;
        } else {
            payload.price = parseFloat(payload.price);
            if (Number.isNaN(payload.price)) {
                return res.status(400).json({ error: 'Invalid price' });
            }
        }

    } catch (error) {
        return res.status(400).json({ error: 'Invalid appointment or return date.' });
    }

    try {
        const appointment = await prisma.$transaction(async (tx) => {
            const createdAppointment = await tx.appointment.create({ data: payload });
            const returnAppointment = await syncReturnAppointment(tx, createdAppointment, {
                returnDate: payload.returnDate
            });
            return { ...createdAppointment, returnAppointment };
        });

        // Auto-Billing Finance Integration
        if (payload.price && payload.price > 0) {
            const statusLabel = payload.paymentStatus === 'pending' ? '[A RECEBER] ' : '';
            await prisma.financeTransaction.create({
                data: {
                    type: 'income',
                    amount: payload.price,
                    category: 'Consulta/Procedimento',
                    description: `${statusLabel}Atendimento: ${payload.procedure} - ${payload.patientName}`,
                    date: payload.date ? new Date(payload.date) : new Date(),
                    patientId: payload.patientId
                }
            });
        }

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: 'Unable to create appointment.' });
    }
});

app.put('/appointments/:id', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    const appointmentId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
        return res.status(400).json({ error: 'Invalid appointment id' });
    }

    const {
        id: _id,
        createdAt,
        updatedAt,
        patient,
        parentAppointment,
        parentAppointmentId,
        returnAppointment,
        ...data
    } = req.body || {};
    const hasReturnDate = Object.prototype.hasOwnProperty.call(data, 'returnDate');

    if (data.status !== undefined) {
        const statusResult = appointmentStatusSchema.safeParse(data.status);
        if (!statusResult.success) return res.status(400).json({ error: statusResult.error.issues[0].message });
        data.status = statusResult.data;
    }

    try {
        if (data.date !== undefined) {
            data.date = parseOptionalDate(data.date, 'Invalid appointment date');
            if (!data.date) {
                return res.status(400).json({ error: 'Invalid appointment date' });
            }
        }
        if (data.returnDate !== undefined) {
            const returnDateResult = returnDateSchema.safeParse(data.returnDate);
            if (!returnDateResult.success) {
                return res.status(400).json({ error: returnDateResult.error.issues[0].message });
            }
            data.returnDate = normalizeReturnDate(returnDateResult.data);
        }
        if (data.scheduledAt !== undefined) {
            data.scheduledAt = normalizeScheduledAt(data.scheduledAt);
        }
        if (data.price === '') {
            data.price = null;
        } else if (data.price !== undefined && data.price !== null) {
            data.price = parseFloat(data.price);
            if (Number.isNaN(data.price)) {
                return res.status(400).json({ error: 'Invalid price' });
            }
        }
    } catch (error) {
        return res.status(400).json({ error: 'Invalid appointment or return date.' });
    }

    try {
        const appointment = await prisma.$transaction(async (tx) => {
            const appointment = await tx.appointment.update({
                where: { id: appointmentId },
                data,
                include: { returnAppointment: true }
            });
            if (!hasReturnDate) return appointment;

            const linkedReturn = await syncReturnAppointment(tx, appointment, {
                returnDate: data.returnDate
            });
            return { ...appointment, returnAppointment: linkedReturn };
        });
        res.json(appointment);
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'Appointment not found' });
        res.status(500).json({ error: 'Unable to update appointment.' });
    }
});

app.delete('/appointments/:id', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.appointment.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Appointment deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Treatments API

// [REMOVED FOR SECURITY] - /admin/reset-database endpoint was deleted to prevent accidental data loss in production.



// Treatments API
app.get('/treatments', async (req, res) => {
    try {
        const treatments = await prisma.treatment.findMany({
            include: { results: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(treatments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/treatments/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const treatment = await prisma.treatment.findUnique({
            where: { slug },
            include: { results: true }
        });
        if (!treatment) {
            return res.status(404).json({ error: 'Treatment not found' });
        }
        res.json(treatment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/treatments', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        // duration is expected to be a valid JSON object
        const treatment = await prisma.treatment.create({
            data: req.body
        });
        res.json(treatment);
    } catch (error) {
        // Only return detailed error if safe/needed, otherwise generic.
        // For development, error.message is fine.
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

app.put('/treatments/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        // Exclude results from update data if accidentally sent, to avoid schema mismatch errors if not nested write
        const { results, id: _id, createdAt, updatedAt, ...updateData } = req.body;

        const treatment = await prisma.treatment.update({
            where: { id: parseInt(id) },
            data: updateData
        });
        res.json(treatment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/treatments/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.treatment.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Treatment deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Treatment Results API
app.post('/treatments/:id/results', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await prisma.treatmentResult.create({
            data: {
                ...req.body,
                treatmentId: parseInt(id)
            }
        });
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/treatment-results/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.treatmentResult.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Result deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Stories API
app.get('/stories', optionalAuthenticateToken, async (req, res) => {
    try {
        const stories = await prisma.story.findMany({
            where: req.user?.role === 'admin'
                ? {}
                : { status: 'active', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
            orderBy: { createdAt: 'desc' }
        });
        res.json(stories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/stories', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const story = await prisma.story.create({
            data: {
                ...req.body,
                status: 'active' // Default to active
            }
        });
        res.json(story);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/stories/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.story.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Story deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/stories/:id/view', async (req, res) => {
    try {
        const story = await prisma.story.update({
            where: { id: parseInt(req.params.id) },
            data: { views: { increment: 1 } }
        });
        res.json({ views: story.views });
    } catch (error) {
        res.status(200).send("OK"); // Fail silently
    }
});

// Settings API
app.get('/public-settings', async (req, res) => {
    try {
        const settings = await prisma.setting.findMany();
        res.json(toPublicSettings(settings));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/settings', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const settings = await prisma.setting.findMany();
        // Convert to a simple key-value object
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/settings', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { key, value } = req.body;
    if (!PUBLIC_SETTINGS_KEYS.has(key)) {
        return res.status(400).json({ error: 'Invalid public setting key.' });
    }
    try {
        const setting = await prisma.setting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
        res.json(setting);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Patients API
app.get('/patients', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    const { search } = req.query;
    const phone = req.query.phone;
    const cpf = req.query.cpf;
    try {
        const patients = await prisma.patient.findMany({
            orderBy: { name: 'asc' }
        });

        // Decrypt data
        const decryptedPatients = patients.map(p => ({
            ...p,
            cpf: decrypt(p.cpf),
            history: decrypt(p.history)
        }));

        // Filter in memory if search is provided (since we can't search encrypted securely with current design)
        // Note: For large datasets, this needs deterministic encryption for CPF to search in DB.
        const normalizeIdentity = (value) => String(value || '').replace(/\D/g, '');
        const requestedPhone = normalizeIdentity(phone);
        const requestedCpf = normalizeIdentity(cpf);
        const hasPhoneQuery = phone !== undefined;
        const hasCpfQuery = cpf !== undefined;

        let result = decryptedPatients;
        if (hasPhoneQuery) {
            result = requestedPhone
                ? result.filter(p => normalizeIdentity(p.phone) === requestedPhone)
                : [];
        }
        if (hasCpfQuery) {
            result = requestedCpf
                ? result.filter(p => normalizeIdentity(p.cpf) === requestedCpf)
                : [];
        }
        if (search && !hasPhoneQuery && !hasCpfQuery) {
            const lowerSearch = String(search).toLowerCase();
            const normalizedSearch = normalizeIdentity(search);
            result = decryptedPatients.filter(p =>
                p.name.toLowerCase().includes(lowerSearch) ||
                (normalizedSearch && normalizeIdentity(p.cpf).includes(normalizeIdentity(search)))
            );
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/patients/:cpf', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        const { cpf } = req.params;
        const patientByCpf = await findPatientByCpf(cpf, { appointments: true, prescriptions: true });

        if (!patientByCpf) return res.status(404).json({ error: 'Patient not found' });

        res.json({
            ...patientByCpf,
            cpf: decrypt(patientByCpf.cpf),
            history: decrypt(patientByCpf.history)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/patients', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    const result = patientSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    try {
        const { cpf, history, consentDate, ...rest } = result.data;

        const encryptedCpf = encrypt(cpf);
        const encryptedHistory = encrypt(history);
        const normalizedConsentDate = consentDate === undefined
            ? undefined
            : consentDate === null
                ? null
                : new Date(consentDate);
        const data = {
            ...rest,
            history: encryptedHistory
        };

        if (normalizedConsentDate !== undefined) {
            if (Number.isNaN(normalizedConsentDate?.getTime?.())) {
                return res.status(400).json({ error: 'Invalid consent date.' });
            }
            data.consentDate = normalizedConsentDate;
        }

        const patient = await prisma.patient.upsert({
            where: { cpfIndex: blindIndex(cpf) },
            update: data,
            create: { ...data, cpf: encryptedCpf, cpfIndex: blindIndex(cpf) }
        });

        res.json({
            id: patient.id,
            ...patient,
            cpf: decrypt(patient.cpf),
            history: decrypt(patient.history)
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/patients/:id', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    const result = patientSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid patient id.' });

    try {
        const { cpf, history, consentDate, ...rest } = result.data;
        const data = {
            ...rest,
            cpf: encrypt(cpf),
            cpfIndex: blindIndex(cpf),
            history: encrypt(history)
        };

        if (consentDate !== undefined) {
            data.consentDate = consentDate === null ? null : new Date(consentDate);
        }

        const patient = await prisma.patient.update({
            where: { id },
            data
        });

        res.json({
            ...patient,
            cpf: decrypt(patient.cpf),
            history: decrypt(patient.history)
        });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'Patient not found' });
        res.status(400).json({ error: error.message });
    }
});

app.delete('/patients/:id', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid patient id.' });

    try {
        const patient = await prisma.patient.findUnique({
            where: { id },
            include: {
                appointments: { take: 1, select: { id: true } },
                prescriptions: { take: 1, select: { id: true } },
                documents: { take: 1, select: { id: true } },
                finance: { take: 1, select: { id: true } }
            }
        });

        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const hasRelatedRecords = [
            patient.appointments,
            patient.prescriptions,
            patient.documents,
            patient.finance
        ].some(records => records.length > 0);

        if (hasRelatedRecords) {
            return res.status(409).json({
                error: 'Cannot delete patient with existing appointments, prescriptions, documents, or financial records.'
            });
        }

        await prisma.patient.delete({ where: { id } });
        res.json({ message: 'Patient deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Consent API
app.post('/patients/:cpf/consent', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        const { cpf } = req.params;

        // Ensure patient exists
        const patient = await findPatientByCpf(cpf);

        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const updated = await prisma.patient.update({
            where: { id: patient.id },
            data: {
                consent: true,
                consentDate: new Date()
            }
        });

        // Log this significant event
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: 'CONSENT_SIGNED',
                resource: 'Patient',
                details: `Consent signed for patient ${patient.id}`,
                ip: req.socket.remoteAddress
            }
        });

        res.json({ message: 'Consent recorded successfully', consentDate: updated.consentDate });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Prescriptions API
app.post('/prescriptions', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        const item = await prisma.prescription.create({
            data: req.body
        });
        res.json(item);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/prescriptions/patient/:patientId', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        const { patientId } = req.params;
        const list = await prisma.prescription.findMany({
            where: { patientId: parseInt(patientId) },
            orderBy: { date: 'desc' }
        });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/prescriptions/:id', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        await prisma.prescription.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Prescription deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Dashboard Stats API
app.get('/dashboard/stats', authenticateToken, authorizeRole(['admin', 'manager']), dashboardStatsHandler);

// Leads API
app.post('/leads', async (req, res) => {
    try {
        const { source, ...rest } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Detailed Location Lookup
        let location = "Desconhecido";
        let geoInfo = {};
        try {
            const cleanIp = typeof ip === 'string' ? ip.split(',')[0].trim() : '';
            if (cleanIp && cleanIp !== '127.0.0.1' && cleanIp !== '::1') {
                const geoRes = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,country,regionName,city,district,lat,lon`);
                const geoData = await geoRes.json();
                if (geoData.status === 'success') {
                    location = `${geoData.city}, ${geoData.regionName} - ${geoData.country}`;
                    geoInfo = {
                        city: geoData.city,
                        state: geoData.regionName,
                        neighborhood: geoData.district || "Desconhecido",
                        latitude: geoData.lat,
                        longitude: geoData.lon
                    };
                }
            }
        } catch (geoErr) {
            console.error("Geo lookup failed for lead:", geoErr);
        }

        const lead = await prisma.lead.create({
            data: {
                ...rest,
                source: source || "Site",
                location: location,
                ...geoInfo
            }
        });
        res.json(lead);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/leads', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const leads = await prisma.lead.findMany({
            where: { status: { not: 'completed' } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(leads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/leads/:id', authenticateToken, authorizeRole(['admin', 'manager']), updateLeadHandler);

app.delete('/leads/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        await prisma.lead.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Lead deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Testimonials API
app.post('/testimonials', async (req, res) => {
    try {
        const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 120) : null;
        const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim().slice(0, 2000) : '';
        const rating = Number(req.body?.rating);
        const feeling = typeof req.body?.feeling === 'string' ? req.body.feeling.trim().slice(0, 32) : null;
        if (!comment || !Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Invalid testimonial.' });
        }
        const testimonial = await prisma.testimonial.create({
            data: { name, comment, rating, feeling, approved: false }
        });
        res.json(testimonial);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/testimonials', optionalAuthenticateToken, async (req, res) => {
    try {
        const where = req.user?.role === 'admin' ? {} : { approved: true };
        const testimonials = await prisma.testimonial.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.json(testimonials);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/testimonials/:id', optionalAuthenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const item = await prisma.testimonial.findFirst({
            where: req.user?.role === 'admin'
                ? { id: parseInt(id) }
                : { id: parseInt(id), approved: true }
        });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/testimonials/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const testimonial = await prisma.testimonial.update({
            where: { id: parseInt(req.params.id) },
            data: req.body
        });
        res.json(testimonial);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/testimonials/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        await prisma.testimonial.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Testimonial deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Personal Finance API
app.get('/personal-finance', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const list = await prisma.personalTransaction.findMany({
            where: { userId: req.user.id },
            orderBy: { date: 'desc' }
        });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/personal-finance', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const item = await prisma.personalTransaction.create({
            data: {
                ...req.body,
                userId: req.user.id
            }
        });
        res.json(item);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/personal-finance/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        await prisma.personalTransaction.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Finance API
app.get('/finance', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const { month, year } = req.query;
        let where = {};

        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            where.date = {
                gte: startDate,
                lte: endDate
            };
        }

        const transactions = await prisma.financeTransaction.findMany({
            where,
            include: { patient: { select: { name: true, cpf: true, address: true } } },
            orderBy: { date: 'desc' }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/finance', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const { type, description, amount, category, patientId, receiptUrl } = req.body;
        const data = {
            type,
            description,
            amount: parseFloat(amount),
            category: category || 'Geral'
        };
        if (patientId) data.patientId = parseInt(patientId);
        if (receiptUrl) data.receiptUrl = receiptUrl;
        const transaction = await prisma.financeTransaction.create({ data });
        res.json(transaction);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/finance/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const { date, type, amount, category, description, patientId, receiptUrl, nfeUrl } = req.body;
        const data = {};
        if (date) data.date = new Date(date);
        if (type) data.type = type;
        if (amount) data.amount = parseFloat(amount);
        if (category) data.category = category;
        if (description) data.description = description;
        if (patientId !== undefined) data.patientId = patientId ? parseInt(patientId) : null;
        if (receiptUrl !== undefined) data.receiptUrl = receiptUrl;
        if (nfeUrl !== undefined) data.nfeUrl = nfeUrl;

        const transaction = await prisma.financeTransaction.update({
            where: { id: parseInt(req.params.id) },
            data
        });
        res.json(transaction);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/finance/:id', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        await prisma.financeTransaction.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/finance/stats', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const income = await prisma.financeTransaction.aggregate({
            where: { type: 'income' },
            _sum: { amount: true }
        });
        const expense = await prisma.financeTransaction.aggregate({
            where: { type: 'expense' },
            _sum: { amount: true }
        });
        res.json({
            income: income._sum.amount || 0,
            expense: expense._sum.amount || 0,
            balance: (income._sum.amount || 0) - (expense._sum.amount || 0)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// NEW: NF-e Issuance Stub
app.post('/finance/nfe', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        // In a real scenario, this would call a provider like FocusNFe or eNotas
        // For now, we simulate a successful issuance and update the transaction
        const { transactionIds, nfeUrl } = req.body;

        if (!transactionIds || !Array.isArray(transactionIds)) {
            return res.status(400).json({ error: "Invalid transaction IDs" });
        }

        const updated = await prisma.financeTransaction.updateMany({
            where: { id: { in: transactionIds } },
            data: { nfeUrl: nfeUrl || "" } // If no URL provided, just mark as tracked (empty string)
        });

        res.json({ message: `${updated.count} NF-e(s) marcadas como processadas!`, status: "success" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// NEW: Accounting Report
app.get('/finance/report', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const transactions = await prisma.financeTransaction.findMany({
            orderBy: { date: 'desc' }
        });

        // Simple aggregate report
        const report = {
            generatedAt: new Date(),
            totalTransactions: transactions.length,
            summary: transactions.reduce((acc, t) => {
                const month = t.date.toISOString().substring(0, 7);
                if (!acc[month]) acc[month] = { income: 0, expense: 0 };
                acc[month][t.type] += t.amount;
                return acc;
            }, {})
        };

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// NEW: Cash Flow Export (PDF Stub)
app.get('/finance/export-pdf', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        // In a real scenario, use PDFKit or Puppeteer to generate a PDF
        // Returning a message for now that it's "generated"
        res.json({ message: "PDF gerado e enviado para o cache!", url: "https://exemplo.com/fluxo-caixa.pdf" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Document Templates API
app.get('/document-templates', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        const templates = await prisma.documentTemplate.findMany();
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/document-templates', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        const template = await prisma.documentTemplate.create({
            data: req.body
        });
        res.json(template);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/document-templates/:id', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        await prisma.documentTemplate.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Template deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Patient Documents API (History)
app.get('/patient-documents/:patientId', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        const docs = await prisma.patientDocument.findMany({
            where: { patientId: parseInt(req.params.patientId) },
            orderBy: { date: 'desc' }
        });
        res.json(docs.map(doc => ({
            ...doc,
            fileUrl: doc.storageKey ? `/patient-documents/${doc.id}/file` : doc.pdfUrl || null
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/patient-documents', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        const doc = await prisma.patientDocument.create({
            data: req.body
        });
        res.json(doc);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/patient-documents/:id', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        const doc = await prisma.patientDocument.update({
            where: { id: parseInt(req.params.id) },
            data: req.body
        });
        res.json(doc);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/patient-documents/:id', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const document = await prisma.patientDocument.findUnique({ where: { id } });
        if (!document) return res.status(404).json({ error: 'Document not found.' });
        await deletePatientDocument(document.storageKey);
        await prisma.patientDocument.delete({ where: { id } });
        res.json({ message: 'Document deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Analytics API
app.post('/analytics', async (req, res) => {
    try {
        const { source, path, type } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

        // Detailed Location Lookup
        let location = "Desconhecido";
        let geoInfo = {};
        try {
            const cleanIp = typeof ip === 'string' ? ip.split(',')[0].trim() : '127.0.0.1';
            const userAgent = (req.headers['user-agent'] || '').toLowerCase();

            // BOT/SERVER FILTER: Ignore common cloud provider locations or bot strings
            const isBot = userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.includes('spider');

            if (cleanIp !== '127.0.0.1' && cleanIp !== '::1' && !cleanIp.startsWith('192.168.') && !isBot) {
                const geoRes = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,country,regionName,city,district,lat,lon,as`);
                const geoData = await geoRes.json();

                // Advanced Filter: Ignore data centers (Amazon, Google, Hetzner, etc)
                const isDataCenter = geoData.as && (
                    geoData.as.toLowerCase().includes('amazon') ||
                    geoData.as.toLowerCase().includes('google') ||
                    geoData.as.toLowerCase().includes('hetzner') ||
                    geoData.as.toLowerCase().includes('microsoft') ||
                    geoData.as.toLowerCase().includes('digitalocean')
                );

                if (geoData.status === 'success' && !isDataCenter) {
                    location = `${geoData.city}, ${geoData.regionName} - ${geoData.country}`;
                    geoInfo = {
                        city: geoData.city,
                        state: geoData.regionName,
                        neighborhood: geoData.district || "Desconhecido",
                        latitude: geoData.lat,
                        longitude: geoData.lon
                    };
                } else if (isDataCenter) {
                    return res.status(200).json({ status: 'ignored' }); // Ignore bot/server hits
                }
            } else if (isBot) {
                return res.status(200).json({ status: 'ignored' });
            }
        } catch (geoErr) {
            console.error("Geo lookup failed:", geoErr);
        }

        const event = await prisma.analyticsEvent.create({
            data: {
                type: type || 'pageview',
                path: path || '/',
                source: source || 'Direto',
                location: location,
                ip: typeof ip === 'string' ? ip.substring(0, 45) : 'unknown',
                userAgent: req.headers['user-agent'],
                ...geoInfo
            }
        });
        res.json(event);
    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(200).json({ status: 'ignored' });
    }
});

app.get('/analytics/stats', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {
    try {
        const [events, leadsCount] = await Promise.all([
            prisma.analyticsEvent.findMany({ orderBy: { date: 'desc' } }),
            prisma.lead.count()
        ]);

        const totalVisits = events.filter(e => e.type === 'pageview').length;
        const uniqueIps = new Set(events.map(e => e.ip)).size;
        const conversionRate = uniqueIps > 0 ? ((leadsCount / uniqueIps) * 100).toFixed(2) : 0;

        // Group by Source
        const sources = events.reduce((acc, e) => {
            const s = e.source || 'Direto';
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});

        // Group by Location (City/State)
        const locations = events.reduce((acc, e) => {
            const loc = e.location || 'Brasil';
            acc[loc] = (acc[loc] || 0) + 1;
            return acc;
        }, {});

        // Group by Neighborhood (Bairro) - NEW
        const neighborhoods = events.reduce((acc, e) => {
            if (e.neighborhood && e.neighborhood !== 'Desconhecido') {
                acc[e.neighborhood] = (acc[e.neighborhood] || 0) + 1;
            }
            return acc;
        }, {});

        // Collect coordinates for heat map potentially
        const coordinates = events
            .filter(e => e.latitude && e.longitude)
            .map(e => ({ lat: e.latitude, lng: e.longitude }));

        res.json({
            totalVisits,
            uniqueVisitors: uniqueIps,
            leadsCount,
            conversionRate,
            sources,
            locations,
            neighborhoods,
            coordinates: coordinates.slice(0, 100), // Recent 100 coordinates
            recentEvents: events.slice(0, 50)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
