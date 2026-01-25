const { Worker, Queue } = require('bullmq');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock WhatsApp Sender
async function sendWhatsAppMessage(phone, message) {
    console.log(`[WhatsApp Mock] Sending to ${phone}: ${message}`);
    // Here you would integrate with Twilio, Z-API, or similar
    return true;
}

const connection = {
    host: 'localhost',
    port: 6379
};

const notificationQueue = new Queue('notifications', { connection });

const worker = new Worker('notifications', async job => {
    console.log(`Processing job ${job.id} of type ${job.name}`);

    if (job.name === 'appointmentReminder') {
        const { appointmentId } = job.data;
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { patient: true }
        });

        if (appointment && appointment.patient && appointment.patient.phone) {
            const message = `Olá ${appointment.patient.name}, lembrete da sua consulta amanhã às ${new Date(appointment.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`;
            await sendWhatsAppMessage(appointment.patient.phone, message);
        }
    }
}, { connection });

// Schedule function to be called periodically (e.g. by cron or a separate timer)
async function scheduleReminders() {
    // Find appointments in the next 24 hours that haven't been notified (need a flag or just check time window carefully)
    // For simplicity, let's just find appointments tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfDay = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfDay = new Date(tomorrow.setHours(23, 59, 59, 999));

    const appointments = await prisma.appointment.findMany({
        where: {
            date: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });

    for (const appt of appointments) {
        await notificationQueue.add('appointmentReminder', { appointmentId: appt.id });
    }
}

module.exports = { worker, notificationQueue, scheduleReminders };
