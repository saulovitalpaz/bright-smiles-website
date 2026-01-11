const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

// Configure Multer for local storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // secure filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
})

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        // Return the full URL or relative path accessible via the static route
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        res.json({ url: fileUrl });
    } catch (error) {
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
        const [usersCount, postsCount, appointmentsCount, recentAppointments] = await Promise.all([
            prisma.user.count(),
            prisma.post.count(),
            prisma.appointment.count(),
            prisma.appointment.findMany({
                take: 5,
                orderBy: { date: 'desc' }
            })
        ]);

        res.json({
            users: usersCount,
            posts: postsCount,
            appointments: appointmentsCount,
            recentAppointments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/admin/reset-database', async (req, res) => {
    try {
        // Delete all data except admin users (safeguard)
        // Note: In a real production app, this should be protected or disabled.
        await prisma.appointment.deleteMany({});
        await prisma.post.deleteMany({});
        // Delete non-admin users to clean slate
        await prisma.user.deleteMany({ where: { role: { not: 'admin' } } });

        res.json({ message: "Database reset successfully (appointments and posts cleared)." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



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
                status: 'Ativo' // Default to Active/Ativo
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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

