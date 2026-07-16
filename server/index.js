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
    validateAssetDeliveryRequest
} = require('./utils/assetStorage');
const { uploadPatientDocument, deletePatientDocument, createPatientDocumentUrl } = require('./utils/patientDocumentStorage');

const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { encrypt, decrypt } = require('./utils/encryption');
const { createUpdateLeadHandler } = require('./routes/leads');
const { parseOptionalDate, normalizeScheduledAt, buildUpcomingSchedule } = require('./utils/schedule');
const { PUBLIC_SETTINGS_KEYS, toPublicSettings } = require('./utils/publicSettings');
const auditLogger = require('./middleware/auditLogger');
const {
    patientSchema,
    appointmentSchema,
    loginSchema,
    updateCurrentUserSchema
} = require('./utils/validationSchemas');

const app = express();
app.set('trust proxy', 1);
const prisma = new PrismaClient();
const updateLeadHandler = createUpdateLeadHandler(prisma);
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_should_be_in_env';

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

app.use(cors({
    origin: [
        'https://www.odontoeharmonizacao.com.br',
        'https://odontoeharmonizacao.com.br',
        'https://bright-smiles-website.vercel.app',
        'http://localhost:5173',
        /https:\/\/.*\.up\.railway\.app$/
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(auditLogger);

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
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

app.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Supported image, video, or PDF file is required.' });
        }

        const scope = req.body?.scope || 'public';
        if (!['public', 'clinical'].includes(scope)) {
            return res.status(400).json({ error: 'Invalid scope. Expected public or clinical.' });
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

app.get('/clinical-assets', authenticateToken, async (req, res) => {
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

// Private patient-document upload. The database stores only the object key;
// access is granted through the authenticated route below.
app.post('/patient-documents/:id/file', authenticateToken, documentUpload.single('file'), async (req, res) => {
    let storageKey;
    try {
        if (!req.file) return res.status(400).json({ error: 'Only PDF files are accepted.' });

        const documentId = Number.parseInt(req.params.id, 10);
        if (!Number.isInteger(documentId)) return res.status(400).json({ error: 'Invalid document id.' });

        const document = await prisma.patientDocument.findUnique({ where: { id: documentId } });
        if (!document) return res.status(404).json({ error: 'Document not found.' });

        storageKey = await uploadPatientDocument({ patientId: document.patientId, body: req.file.buffer });
        await prisma.patientDocument.update({
            where: { id: documentId },
            data: { storageKey, pdfUrl: null }
        });

        res.json({ url: `/patient-documents/${documentId}/file` });
    } catch (error) {
        if (storageKey) await deletePatientDocument(storageKey).catch(() => {});
        console.error('Patient document upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/patient-documents/:id/file', authenticateToken, async (req, res) => {
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
        res.json({ status: 'ok', database: 'connected', timestamp: new Date() });
    } catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
    }
});

// Users API
app.get('/users', async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
});

app.post('/users', async (req, res) => {
    try {
        const user = await prisma.user.create({
            data: req.body
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
            select: {
                id: true,
                username: true,
                name: true,
                cro: true,
                signatureUrl: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
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

        if (user && user.password === password) {
            const { password, ...userWithoutPassword } = user;
            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });

            const isSecure = process.env.NODE_ENV === 'production' || req.secure;
            res.cookie('token', token, {
                httpOnly: true,
                secure: isSecure,
                sameSite: isSecure ? 'none' : 'lax',
                maxAge: 12 * 60 * 60 * 1000 // 12 hours
            });

            res.json(userWithoutPassword);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
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
        res.json(posts);
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
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/posts', async (req, res) => {
    try {
        const post = await prisma.post.create({
            data: req.body
        });
        res.json(post);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { id: _id, createdAt, updatedAt, ...data } = req.body;
        const post = await prisma.post.update({
            where: { id: parseInt(id) },
            data: data
        });
        res.json(post);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/posts/:id', async (req, res) => {
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
app.get('/appointments', async (req, res) => {
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

app.get('/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const item = await prisma.appointment.findUnique({
            where: { id: parseInt(id) },
            include: { patient: true }
        });
        if (!item) return res.status(404).json({ error: 'Appointment not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/appointments', authenticateToken, async (req, res) => {
    const result = appointmentSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    try {
        const payload = { ...result.data };
        payload.date = parseOptionalDate(payload.date, 'Invalid appointment date');
        if (!payload.date) {
            return res.status(400).json({ error: 'Invalid appointment date' });
        }
        payload.returnDate = parseOptionalDate(payload.returnDate, 'Invalid return date');
        payload.scheduledAt = normalizeScheduledAt(payload.scheduledAt);
        if (payload.price === '' || payload.price === null || payload.price === undefined) {
            payload.price = null;
        } else {
            payload.price = parseFloat(payload.price);
            if (Number.isNaN(payload.price)) {
                return res.status(400).json({ error: 'Invalid price' });
            }
        }

        const appointment = await prisma.appointment.create({
            data: payload
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
        res.status(400).json({ error: error.message });
    }
});

app.put('/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { id: _id, createdAt, updatedAt, patient, ...data } = req.body;

        if (data.date !== undefined) {
            data.date = parseOptionalDate(data.date, 'Invalid appointment date');
            if (!data.date) {
                return res.status(400).json({ error: 'Invalid appointment date' });
            }
        }
        if (data.returnDate !== undefined) {
            data.returnDate = parseOptionalDate(data.returnDate, 'Invalid return date');
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

        const appointment = await prisma.appointment.update({
            where: { id: parseInt(id) },
            data: data
        });
        res.json(appointment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/appointments/:id', async (req, res) => {
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

app.post('/treatments', async (req, res) => {
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

app.put('/treatments/:id', async (req, res) => {
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

app.delete('/treatments/:id', async (req, res) => {
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
app.post('/treatments/:id/results', async (req, res) => {
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

app.delete('/treatment-results/:id', async (req, res) => {
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
app.get('/stories', async (req, res) => {
    try {
        const stories = await prisma.story.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(stories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/stories', async (req, res) => {
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

app.delete('/stories/:id', async (req, res) => {
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
app.get('/patients', authenticateToken, async (req, res) => {
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

app.get('/patients/:cpf', async (req, res) => {
    try {
        const { cpf } = req.params;
        const patient = await prisma.patient.findMany(); // We need to scan all to find matching encrypted CPF if deterministic isn't perfectly trusted or if we search by ID.
        // Wait, route is /patients/:cpf.
        // If we use deterministic encryption for CPF, we can search directly.

        const encryptedCpf = encrypt(cpf, true); // Re-derive deterministic
        const patientByCpf = await prisma.patient.findUnique({
            where: { cpf: encryptedCpf },
            include: { appointments: true, prescriptions: true }
        });

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

        // Encrypt Sensitive Data
        // Use deterministic for CPF to allow duplicate check if needed (though we rely on catch error for unique constraint)
        const encryptedCpf = encrypt(cpf, true);
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
            where: { cpf: encryptedCpf },
            update: data,
            create: { ...data, cpf: encryptedCpf }
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
            cpf: encrypt(cpf, true),
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
app.post('/patients/:cpf/consent', authenticateToken, async (req, res) => {
    try {
        const { cpf } = req.params;
        const encryptedCpf = encrypt(cpf, true);

        // Ensure patient exists
        const patient = await prisma.patient.findUnique({
            where: { cpf: encryptedCpf }
        });

        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const updated = await prisma.patient.update({
            where: { cpf: encryptedCpf },
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
app.post('/prescriptions', async (req, res) => {
    try {
        const item = await prisma.prescription.create({
            data: req.body
        });
        res.json(item);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/prescriptions/patient/:patientId', async (req, res) => {
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

app.delete('/prescriptions/:id', async (req, res) => {
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
app.get('/dashboard/stats', async (req, res) => {
    try {
        const [users, posts, appointments, leads, testimonials] = await Promise.all([
            prisma.user.count(),
            prisma.post.count(),
            prisma.appointment.count(),
            prisma.lead.count(),
            prisma.testimonial.count()
        ]);

        const recentAppointments = await prisma.appointment.findMany({
            take: 5,
            orderBy: { date: 'desc' }
        });

        const recentLeads = await prisma.lead.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        const [scheduledAppointments, scheduledLeads] = await Promise.all([
            prisma.appointment.findMany({
                where: { scheduledAt: { not: null } },
                orderBy: { scheduledAt: 'asc' }
            }),
            prisma.lead.findMany({
                where: {
                    scheduledAt: { not: null },
                    status: { not: 'completed' }
                },
                orderBy: { scheduledAt: 'asc' }
            })
        ]);

        const upcomingSchedule = buildUpcomingSchedule({
            appointments: scheduledAppointments,
            leads: scheduledLeads
        });

        const recentTestimonials = await prisma.testimonial.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            users,
            posts,
            appointments,
            leads,
            testimonials,
            upcomingSchedule,
            recentAppointments,
            recentLeads,
            recentTestimonials
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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

app.get('/leads', async (req, res) => {
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

app.put('/leads/:id', updateLeadHandler);

app.delete('/leads/:id', async (req, res) => {
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
        const testimonial = await prisma.testimonial.create({
            data: req.body
        });
        res.json(testimonial);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/testimonials', async (req, res) => {
    try {
        const { approved } = req.query;
        const where = approved ? { approved: approved === 'true' } : {};
        const testimonials = await prisma.testimonial.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.json(testimonials);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/testimonials/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const item = await prisma.testimonial.findUnique({
            where: { id: parseInt(id) }
        });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/leads/:id', updateLeadHandler);

app.delete('/leads/:id', async (req, res) => {
    try {
        await prisma.lead.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Lead deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/testimonials/:id', async (req, res) => {
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

app.delete('/testimonials/:id', async (req, res) => {
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
app.get('/document-templates', async (req, res) => {
    try {
        const templates = await prisma.documentTemplate.findMany();
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/document-templates', async (req, res) => {
    try {
        const template = await prisma.documentTemplate.create({
            data: req.body
        });
        res.json(template);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/document-templates/:id', async (req, res) => {
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
app.get('/patient-documents/:patientId', authenticateToken, async (req, res) => {
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

app.post('/patient-documents', authenticateToken, async (req, res) => {
    try {
        const doc = await prisma.patientDocument.create({
            data: req.body
        });
        res.json(doc);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/patient-documents/:id', authenticateToken, async (req, res) => {
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

app.delete('/patient-documents/:id', authenticateToken, async (req, res) => {
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

app.get('/analytics/stats', async (req, res) => {
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
