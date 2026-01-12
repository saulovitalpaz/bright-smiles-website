const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.set('trust proxy', 1);
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

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

// Cloudinary Upload Endpoint
app.post('/upload', upload.single('file'), (req, res) => {
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
    const { username, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (user && user.password === password) {
            // In a real app, you would issue a JWT here
            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Posts API
app.get('/posts', async (req, res) => {
    const posts = await prisma.post.findMany();
    res.json(posts);
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

// Appointments API
app.get('/appointments', async (req, res) => {
    const appointments = await prisma.appointment.findMany({
        orderBy: { date: 'desc' }
    });
    res.json(appointments);
});

app.post('/appointments', async (req, res) => {
    try {
        const appointment = await prisma.appointment.create({
            data: req.body
        });
        res.json(appointment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await prisma.appointment.update({
            where: { id: parseInt(id) },
            data: req.body
        });
        res.json(appointment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/dashboard/stats', async (req, res) => {
    try {
        const [usersCount, postsCount, appointmentsCount, leadsCount, testimonialsCount, recentAppointments] = await Promise.all([
            prisma.user.count(),
            prisma.post.count(),
            prisma.appointment.count(),
            prisma.lead.count(),
            prisma.testimonial.count(),
            prisma.appointment.findMany({
                take: 5,
                orderBy: { date: 'desc' }
            })
        ]);

        res.json({
            users: usersCount,
            posts: postsCount,
            appointments: appointmentsCount,
            leads: leadsCount,
            testimonials: testimonialsCount,
            recentAppointments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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

// Settings API
app.get('/settings', async (req, res) => {
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
app.get('/patients', async (req, res) => {
    const { search } = req.query;
    try {
        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { cpf: { contains: search } }
            ]
        } : {};
        const patients = await prisma.patient.findMany({
            where,
            orderBy: { name: 'asc' }
        });
        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/patients/:cpf', async (req, res) => {
    try {
        const { cpf } = req.params;
        const patient = await prisma.patient.findUnique({
            where: { cpf },
            include: { appointments: true, prescriptions: true }
        });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });
        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/patients', async (req, res) => {
    try {
        const { cpf } = req.body;
        // Upsert ensures we don't create duplicates and reuse the ID
        const patient = await prisma.patient.upsert({
            where: { cpf },
            update: req.body,
            create: req.body
        });
        res.json(patient);
    } catch (error) {
        res.status(400).json({ error: error.message });
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

// Leads API
app.post('/leads', async (req, res) => {
    try {
        const lead = await prisma.lead.create({
            data: req.body
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

// Leads API (continued)
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

// Testimonials API (continued)
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
app.get('/finance', async (req, res) => {
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

// Analytics API
app.post('/analytics', async (req, res) => {
    try {
        const event = await prisma.analyticsEvent.create({
            data: {
                ...req.body,
                ip: req.ip // Express trust proxy is on
            }
        });
        res.json(event);
    } catch (error) {
        // Analytics should fail silently in production usually, but we log here
        console.error("Analytics Error:", error);
        res.status(200).json({ status: 'ignored' });
    }
});

app.get('/analytics/stats', async (req, res) => {
    try {
        const totalVisits = await prisma.analyticsEvent.count({
            where: { type: 'pageview' }
        });
        // Simple day grouping (Postgres specific, or simplified JS)
        // For now, return raw stats
        const recentEvents = await prisma.analyticsEvent.findMany({
            take: 50,
            orderBy: { date: 'desc' }
        });
        res.json({ totalVisits, recentEvents });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

