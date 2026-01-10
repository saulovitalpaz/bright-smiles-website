const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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
        // Optional: Keep users or delete non-admins. For now, let's keep users to avoid locking out.
        // await prisma.user.deleteMany({ where: { role: { not: 'admin' } } }); 

        res.json({ message: "Database reset successfully (appointments and posts cleared)." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

