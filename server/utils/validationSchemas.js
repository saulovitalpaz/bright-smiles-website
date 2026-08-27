const { z } = require('zod');
const sanitizeBlogContent = require('./sanitizeBlogContent');

const permanentTeeth = new Set(['11','12','13','14','15','16','17','18','21','22','23','24','25','26','27','28','31','32','33','34','35','36','37','38','41','42','43','44','45','46','47','48']);
const deciduousTeeth = new Set(['51','52','53','54','55','61','62','63','64','65','71','72','73','74','75','81','82','83','84','85']);
const allClinicalTeeth = new Set([...permanentTeeth, ...deciduousTeeth]);
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
const toothRecordSchema = z.object({
    notes: safeNote,
    conditions: z.array(conditionSchema).max(30),
}).strict();
const odontogramV2Schema = z.object({
    version: z.literal(2), dentition: z.literal('permanent'),
    teeth: z.record(z.string(), toothRecordSchema),
}).strict().superRefine((value, context) => {
    if (Object.keys(value.teeth).length > 32) context.addIssue({ code: 'custom', message: 'Too many teeth' });
    for (const key of Object.keys(value.teeth)) if (!permanentTeeth.has(key)) context.addIssue({ code: 'custom', message: 'Invalid permanent tooth' });
});

const odontogramV3Schema = z.object({
    version: z.literal(3),
    dentition: z.enum(['deciduous', 'mixed', 'permanent']),
    teeth: z.record(z.string(), toothRecordSchema),
}).strict().superRefine((value, context) => {
    const allowedTeeth = value.dentition === 'deciduous'
        ? deciduousTeeth
        : value.dentition === 'permanent'
            ? permanentTeeth
            : allClinicalTeeth;

    if (Object.keys(value.teeth).length > allowedTeeth.size) {
        context.addIssue({ code: 'custom', message: 'Too many teeth for dentition' });
    }
    for (const key of Object.keys(value.teeth)) {
        if (!allowedTeeth.has(key)) context.addIssue({ code: 'custom', message: 'Invalid tooth for dentition' });
    }
});

const legacyFaceSchema = z.object({
    status: z.enum(['Saudável', 'Tratar', 'Tratado']),
}).strict();
const legacyToothSchema = z.object({
    status: z.enum(['Saudável', 'Ausente', 'Implante', 'Ponte']),
    notes: z.string().trim().max(500),
    faces: z.record(z.enum(['top', 'right', 'bottom', 'left', 'center']), legacyFaceSchema).optional(),
}).strict();
const legacyOdontogramSchema = z.record(z.string(), legacyToothSchema).superRefine((value, context) => {
    if (Object.keys(value).length > 32) context.addIssue({ code: 'custom', message: 'Too many teeth' });
    for (const key of Object.keys(value)) if (!permanentTeeth.has(key)) context.addIssue({ code: 'custom', message: 'Invalid permanent tooth' });
});
const odontogramSchema = z.union([odontogramV2Schema, odontogramV3Schema, legacyOdontogramSchema]);

function legacyCondition(type, target) {
    return {
        id: `legacy-${type}-${target.kind === 'tooth' ? 'tooth' : target.face}`,
        category: 'legado',
        type,
        stage: 'concluido',
        targets: [target],
    };
}

function normalizeOdontogram(value) {
    if (value === null || value === undefined) return null;
    const parsed = odontogramSchema.safeParse(value);
    if (!parsed.success) return null;
    if (parsed.data.version === 2 || parsed.data.version === 3) return parsed.data;

    const teeth = {};
    for (const [toothNumber, tooth] of Object.entries(parsed.data)) {
        const conditions = [];
        if (tooth.status === 'Implante') conditions.push(legacyCondition('implante', { kind: 'tooth' }));
        if (tooth.status === 'Ausente') conditions.push(legacyCondition('legado_ausente', { kind: 'tooth' }));
        if (tooth.status === 'Ponte') conditions.push(legacyCondition('legado_ponte', { kind: 'tooth' }));
        for (const [face, faceData] of Object.entries(tooth.faces || {})) {
            if (faceData.status === 'Tratar') conditions.push(legacyCondition('legado_tratar', { kind: 'surface', face, region: 'entire' }));
            if (faceData.status === 'Tratado') conditions.push(legacyCondition('legado_tratado', { kind: 'surface', face, region: 'entire' }));
        }
        if (conditions.length || tooth.notes) teeth[toothNumber] = { notes: tooth.notes, conditions };
    }
    return { version: 2, dentition: 'permanent', teeth };
}

const dateValueSchema = z.union([
    z.date(),
    z.string().date(),
    z.string().datetime({ offset: true }),
]);
const birthDateSchema = dateValueSchema.refine((value) => {
    const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
    return Number.isFinite(timestamp) && timestamp <= Date.now();
}, 'Birth date cannot be in the future');
const richContentSchema = z.string().trim().max(100000).transform(sanitizeBlogContent);
const hasVisibleContent = (value) => /[^\s]/.test(value.replace(/<[^>]*>/g, ''));
const requiredRichContentSchema = richContentSchema.refine(hasVisibleContent, 'Content is required');
const positiveIdSchema = z.number().int().positive();
const documentKindSchema = z.enum(['text', 'pdf']);
const documentSourceKindSchema = z.enum(['text', 'pdf']);

const prescriptionSchema = z.object({
    patientId: positiveIdSchema,
    content: requiredRichContentSchema,
    odontogramSnapshot: odontogramSchema.optional().nullable(),
    odontogramSourceAppointmentId: positiveIdSchema.optional().nullable(),
}).strict();

const documentTemplateSchema = z.object({
    title: z.string().trim().min(1).max(200),
    content: richContentSchema.default(''),
    kind: documentKindSchema.default('text'),
}).strict().superRefine((value, context) => {
    if (value.kind === 'text' && !hasVisibleContent(value.content)) {
        context.addIssue({ code: 'custom', path: ['content'], message: 'Text templates require content' });
    }
});

const patientDocumentSchema = z.object({
    title: z.string().trim().min(1).max(200),
    content: richContentSchema.default(''),
    date: dateValueSchema.optional(),
    patientId: positiveIdSchema,
    templateId: positiveIdSchema.optional().nullable(),
    sourceKind: documentSourceKindSchema.default('text'),
}).strict().superRefine((value, context) => {
    if (value.sourceKind === 'text' && !hasVisibleContent(value.content)) {
        context.addIssue({ code: 'custom', path: ['content'], message: 'Text documents require content' });
    }
});

const attachmentMimeSchema = z.enum(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const attachmentUploadSchema = z.object({
    documentId: positiveIdSchema,
    mimeType: attachmentMimeSchema,
    originalName: z.string().trim().min(1).max(255).refine((value) => !(/[\\/\0\r\n]/.test(value)), 'Invalid file name'),
    size: z.number().int().positive().max(25 * 1024 * 1024),
}).strict();

const patientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    cpf: z.string().min(11, "CPF must be at least 11 characters"),
    birthDate: birthDateSchema.optional().nullable(),
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
    updateCurrentUserSchema,
    odontogramSchema,
    odontogramV2Schema,
    odontogramV3Schema,
    normalizeOdontogram,
    prescriptionSchema,
    documentTemplateSchema,
    patientDocumentSchema,
    attachmentUploadSchema,
};
