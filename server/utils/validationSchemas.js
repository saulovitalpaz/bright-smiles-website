const { z } = require('zod');

const permanentTeeth = new Set(['11','12','13','14','15','16','17','18','21','22','23','24','25','26','27','28','31','32','33','34','35','36','37','38','41','42','43','44','45','46','47','48']);
const clinicalCategories = ['achado', 'restauracao', 'endodontia', 'protese', 'periodontiaCirurgia', 'ortodontia', 'legado'];
const clinicalTypes = ['carie', 'lesao_carie_inicial', 'infiltracao', 'fratura', 'trinca', 'desgaste', 'abrasao', 'erosao', 'abfracao', 'mancha', 'hipoplasia', 'sensibilidade', 'mobilidade', 'furca', 'retracao_gengival', 'dente_ausente', 'resina_composta', 'amalgama', 'ionomero_vidro', 'restauracao_provisoria', 'selante', 'inlay', 'onlay', 'overlay', 'faceta', 'tratamento_endodontico', 'retratamento', 'obturacao_radicular', 'lesao_periapical', 'pino_intrarradicular', 'nucleo', 'coroa_total', 'coroa_parcial', 'coroa_provisoria', 'coroa_sobre_implante', 'implante', 'ponte_fixa', 'protese_removivel', 'elemento_pontico', 'gengivectomia', 'enxerto', 'cirurgia_periodontal', 'exodontia_indicada', 'exodontia_executada', 'bracket', 'banda', 'contencao', 'aparelho', 'legado_tratar', 'legado_tratado', 'legado_ausente', 'legado_ponte'];
const safeNote = z.string().trim().max(500).refine((value) => !/[<>]/.test(value), 'Notes must be plain text');
const targetSchema = z.union([
    z.object({ kind: z.literal('tooth') }).strict(),
    z.object({ kind: z.literal('surface'), face: z.enum(['top', 'right', 'bottom', 'left', 'center']), region: z.enum(['entire', 'cervical', 'middle', 'incisalOcclusal']) }).strict(),
]);
const conditionSchema = z.object({
    id: z.string().min(1).max(128), category: z.enum(clinicalCategories), type: z.enum(clinicalTypes),
    stage: z.enum(['aAvaliar', 'planejado', 'emAndamento', 'concluido', 'monitorado', 'suspenso', 'removido']),
    targets: z.array(targetSchema).min(1).max(5), notes: safeNote.optional(),
}).strict();
const odontogramSchema = z.object({
    version: z.literal(2), dentition: z.literal('permanent'),
    teeth: z.record(z.string(), z.object({ notes: safeNote, conditions: z.array(conditionSchema).max(30) }).strict()),
}).strict().superRefine((value, context) => {
    if (Object.keys(value.teeth).length > 32) context.addIssue({ code: 'custom', message: 'Too many teeth' });
    for (const key of Object.keys(value.teeth)) if (!permanentTeeth.has(key)) context.addIssue({ code: 'custom', message: 'Invalid permanent tooth' });
});

const patientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    cpf: z.string().min(11, "CPF must be at least 11 characters"),
    phone: z.string().optional(),
    address: z.string().optional(),
    history: z.string().optional(),
    consent: z.boolean().optional(),
    consentDate: z.string().or(z.date()).optional().nullable(),
    odontogram: odontogramSchema.optional().nullable(),
});

const appointmentStatusSchema = z.enum(['scheduled', 'attended', 'cancelled']);
const appointmentPaymentStatusSchema = z.enum(['received', 'paid', 'pending', 'courtesy', 'voided']);
const returnDateSchema = z.union([
    z.string().datetime({ offset: true, message: 'Invalid return date' }),
    z.date({ error: 'Invalid return date' }),
    z.literal('')
]).nullable();

const appointmentSchema = z.object({
    patientName: z.string().min(1),
    date: z.string().or(z.date()),
    scheduledAt: z.string().or(z.date()).optional().nullable(),
    procedure: z.string().min(1),
    professional: z.string().min(1),
    notes: z.string().default(''),
    cpf: z.string().optional().nullable(),
    patientId: z.number().optional().nullable(),
    appointmentType: z.string().optional(),
    complications: z.string().optional().nullable(),
    materials: z.string().optional().nullable(),
    returnDate: returnDateSchema.optional(),
    weight: z.string().optional().nullable(),
    photos: z.array(z.string()).optional(),
    externalLinks: z.array(z.string()).optional(),
    dentalNotes: z.any().optional().nullable(),
    facialNotes: z.any().optional().nullable(),
    price: z.string().or(z.number()).optional().nullable(),
    paymentStatus: appointmentPaymentStatusSchema.optional().nullable(),
    status: appointmentStatusSchema.default('scheduled')
});

const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1)
});

const signatureReferenceSchema = z.string().trim().regex(
    /^bucket:\/\/public\/.+\.(?:jpe?g|png|webp)$/i,
    'Signature must be a public JPEG, PNG, or WebP asset reference'
);

const createUserSchema = z.object({
    name: z.string().trim().min(1),
    username: z.string().trim().min(3).max(64).regex(/^[a-z0-9._-]+$/i),
    password: z.string().min(8).max(256),
    cro: z.string().trim().optional().nullable(),
    role: z.enum(['admin', 'manager', 'dentist'])
}).strict();

const updateCurrentUserSchema = z.object({
    name: z.string().trim().min(1).optional(),
    cro: z.string().trim().min(1).optional(),
    signatureUrl: signatureReferenceSchema.optional().nullable()
}).strict();

module.exports = {
    patientSchema,
    appointmentSchema,
    appointmentStatusSchema,
    appointmentPaymentStatusSchema,
    returnDateSchema,
    loginSchema,
    createUserSchema,
    updateCurrentUserSchema
    , odontogramSchema
};
