const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { encrypt, decrypt } = require('./utils/encryption');
const auditLogger = require('./middleware/auditLogger');
const { patientSchema, appointmentSchema, loginSchema } = require('./utils/validationSchemas');
const { notificationQueue, scheduleReminders } = require('./workers/whatsappWorker');

const app = express();
app.set('trust proxy', 1);
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_should_be_in_env';

// Start scheduler
setInterval(scheduleReminders, 1000 * 60 * 60); // Check every hour

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: 'drvylmywu',
    api_key: '958317597149665',
    api_secret: 'atOr40x95JejT5Ru5AmgqWyz3_4'
});

// Configure Multer for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'bright-smiles',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov', 'webm'],
        resource_type: 'auto', // Important for video support
    },
});

const upload = multer({ storage: storage });

app.use(cors({
    origin: [
        'https://www.odontoeharmonizacao.com.br',
        'https://odontoeharmonizacao.com.br',
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

// Cloudinary Upload Endpoint
app.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        // Cloudinary returns the URL in req.file.path
        res.json({ url: req.file.path });
    } catch (error) {
        console.error("Upload error:", error);
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

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
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
        const list = await prisma.appointment.findMany({
            orderBy: { date: 'desc' }
        });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/appointments', authenticateToken, async (req, res) => {
    const result = appointmentSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    try {
        const appointment = await prisma.appointment.create({
            data: result.data
        });

        // Trigger generic reminder check or queue specific (optional)
        // await notificationQueue.add('appointmentReminder', { appointmentId: appointment.id }, { delay: ... });

        res.json(appointment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { id: _id, createdAt, updatedAt, patient, ...data } = req.body;

        // Handle returnDate if sent as string
        if (data.returnDate) {
            data.returnDate = new Date(data.returnDate);
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
app.get('/settings', authenticateToken, authorizeRole(['admin']), async (req, res) => {
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

app.post('/settings', async (req, res) => {
    const { key, value } = req.body;
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
        let result = decryptedPatients;
        if (search) {
            const lowerSearch = search.toLowerCase();
            result = decryptedPatients.filter(p =>
                p.name.toLowerCase().includes(lowerSearch) ||
                (p.cpf && p.cpf.includes(search))
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
        const { cpf, history, ...rest } = result.data;

        // Encrypt Sensitive Data
        // Use deterministic for CPF to allow duplicate check if needed (though we rely on catch error for unique constraint)
        const encryptedCpf = encrypt(cpf, true);
        const encryptedHistory = encrypt(history);

        const patient = await prisma.patient.upsert({
            where: { cpf: encryptedCpf },
            update: { ...rest, history: encryptedHistory },
            create: { ...rest, cpf: encryptedCpf, history: encryptedHistory }
        });

        res.json({ ...patient, cpf, history });
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
        try {
            const cleanIp = typeof ip === 'string' ? ip.split(',')[0].trim() : '';
            if (cleanIp) {
                const geoRes = await fetch(`http://ip-api.com/json/${cleanIp}`);
                const geoData = await geoRes.json();
                if (geoData.status === 'success') {
                    location = `${geoData.city}, ${geoData.regionName} - ${geoData.country}`;
                }
            }
        } catch (geoErr) {
            console.error("Geo lookup failed for lead:", geoErr);
        }

        const lead = await prisma.lead.create({
            data: {
                ...rest,
                source: source || "Site",
                location: location
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
            orderBy: { createdAt: 'desc' }
        });
        res.json(leads);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

app.put('/leads/:id', async (req, res) => {
    try {
        const lead = await prisma.lead.update({
            where: { id: parseInt(req.params.id) },
            data: req.body
        });
        res.json(lead);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

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

// Finance API
app.get('/finance', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const transactions = await prisma.financeTransaction.findMany({
            include: { patient: { select: { name: true } } },
            orderBy: { date: 'desc' }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/finance', async (req, res) => {
    try {
        const transaction = await prisma.financeTransaction.create({
            data: req.body
        });
        res.json(transaction);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/finance/:id', async (req, res) => {
    try {
        await prisma.financeTransaction.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/finance/stats', async (req, res) => {
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
app.get('/patient-documents/:patientId', async (req, res) => {
    try {
        const docs = await prisma.patientDocument.findMany({
            where: { patientId: parseInt(req.params.patientId) },
            orderBy: { date: 'desc' }
        });
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/patient-documents', async (req, res) => {
    try {
        const doc = await prisma.patientDocument.create({
            data: req.body
        });
        res.json(doc);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/patient-documents/:id', async (req, res) => {
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

app.delete('/patient-documents/:id', async (req, res) => {
    try {
        await prisma.patientDocument.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Document deleted' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Analytics API
app.post('/analytics', async (req, res) => {
    try {
        const { source, path, type } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Detailed Location Lookup
        let location = "Desconhecido";
        try {
            const cleanIp = ip.split(',')[0].trim();
            // Using ip-api.com (free for non-commercial use, 45 requests/min)
            const geoRes = await fetch(`http://ip-api.com/json/${cleanIp}`);
            const geoData = await geoRes.json();
            if (geoData.status === 'success') {
                location = `${geoData.city}, ${geoData.regionName} - ${geoData.country}`;
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
                userAgent: req.headers['user-agent']
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
        const events = await prisma.analyticsEvent.findMany({
            orderBy: { date: 'desc' }
        });

        const totalVisits = events.filter(e => e.type === 'pageview').length;

        // Group by Source
        const sources = events.reduce((acc, e) => {
            const s = e.source || 'Direto';
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});

        // Group by Location
        const locations = events.reduce((acc, e) => {
            const loc = e.location || 'Brasil';
            acc[loc] = (acc[loc] || 0) + 1;
            return acc;
        }, {});

        res.json({
            totalVisits,
            sources,
            locations,
            recentEvents: events.slice(0, 20)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
