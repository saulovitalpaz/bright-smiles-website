function parseOptionalDate(value, message) {
    if (value === undefined || value === null || value === '') return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new Error(message);
    return parsed;
}

function normalizeScheduledAt(value) {
    return parseOptionalDate(value, 'Invalid scheduled date');
}

const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

function normalizeReturnDate(value, now = new Date()) {
    if (value === undefined || value === null || value === '') return null;
    if (!(value instanceof Date) && (typeof value !== 'string' || !ISO_DATE_TIME_PATTERN.test(value))) {
        throw new Error('Invalid return date');
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new Error('Invalid return date');
    if (parsed.getTime() <= now.getTime()) throw new Error('Return date must be in the future');
    return parsed;
}

function normalizeReturnDateForUpdate(value, persistedReturnDate, now = new Date()) {
    if (value === undefined || value === null || value === '') return null;
    if (!(value instanceof Date) && (typeof value !== 'string' || !ISO_DATE_TIME_PATTERN.test(value))) {
        throw new Error('Invalid return date');
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new Error('Invalid return date');

    const persisted = persistedReturnDate ? new Date(persistedReturnDate) : null;
    if (persisted && !Number.isNaN(persisted.getTime()) && parsed.getTime() === persisted.getTime()) {
        return parsed;
    }
    return normalizeReturnDate(value, now);
}

function buildReturnAppointmentData(sourceAppointment, returnDate) {
    return {
        parentAppointmentId: sourceAppointment.id,
        patientId: sourceAppointment.patientId,
        patientName: sourceAppointment.patientName,
        cpf: sourceAppointment.cpf,
        date: returnDate,
        scheduledAt: returnDate,
        procedure: `Retorno: ${sourceAppointment.procedure}`,
        notes: `Retorno vinculado ao atendimento #${sourceAppointment.id}.`,
        professional: sourceAppointment.professional,
        appointmentType: sourceAppointment.appointmentType,
        status: 'scheduled',
        price: null,
        paymentStatus: 'courtesy'
    };
}

async function syncReturnAppointment(tx, sourceAppointment, { returnDate }) {
    if (!returnDate) {
        const existingReturn = await tx.appointment.findUnique({
            where: { parentAppointmentId: sourceAppointment.id }
        });
        if (!existingReturn) return null;
        return tx.appointment.update({
            where: { id: existingReturn.id },
            data: { status: 'cancelled' }
        });
    }

    const data = buildReturnAppointmentData(sourceAppointment, returnDate);
    return tx.appointment.upsert({
        where: { parentAppointmentId: sourceAppointment.id },
        create: data,
        update: data
    });
}

function buildUpcomingSchedule({ appointments = [], leads = [], limit = 10 }) {
    const seenAppointmentIds = new Set();
    return [
        ...appointments
            .filter((appointment) => {
                if (!appointment.scheduledAt || appointment.status === 'attended' || appointment.status === 'cancelled') return false;
                if (seenAppointmentIds.has(appointment.id)) return false;
                seenAppointmentIds.add(appointment.id);
                return true;
            })
            .map((appointment) => ({
                kind: 'appointment',
                id: appointment.id,
                patientName: appointment.patientName,
                treatment: null,
                procedure: appointment.procedure,
                appointmentType: appointment.appointmentType,
                scheduledAt: appointment.scheduledAt,
                createdAt: appointment.createdAt,
                patientId: appointment.patientId,
                leadId: null
            })),
        ...leads
            .filter((lead) => lead.scheduledAt && lead.status !== 'completed')
            .map((lead) => ({
                kind: 'lead',
                id: lead.id,
                patientName: lead.name,
                treatment: lead.treatment,
                procedure: null,
                appointmentType: null,
                scheduledAt: lead.scheduledAt,
                createdAt: lead.createdAt,
                patientId: null,
                leadId: lead.id
            }))
    ]
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
        .slice(0, limit);
}

module.exports = {
    parseOptionalDate,
    normalizeScheduledAt,
    normalizeReturnDate,
    normalizeReturnDateForUpdate,
    syncReturnAppointment,
    buildUpcomingSchedule
};
