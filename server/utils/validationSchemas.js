const { z } = require('zod');

const patientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    cpf: z.string().min(11, "CPF must be at least 11 characters"),
    phone: z.string().optional(),
    address: z.string().optional(),
    history: z.string().optional(),
});

const appointmentSchema = z.object({
    patientName: z.string().min(1),
    date: z.string().or(z.date()),
    procedure: z.string().min(1),
    professional: z.string().min(1),
    notes: z.string().optional(),
    cpf: z.string().optional().nullable(),
    patientId: z.number().optional().nullable(),
    appointmentType: z.string().optional(),
    complications: z.string().optional().nullable(),
    materials: z.string().optional().nullable(),
    returnDate: z.string().or(z.date()).optional().nullable(),
    weight: z.string().optional().nullable(),
    photos: z.array(z.string()).optional(),
    dentalNotes: z.any().optional().nullable(),
    facialNotes: z.any().optional().nullable(),
});

const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1)
});

module.exports = {
    patientSchema,
    appointmentSchema,
    loginSchema
};
