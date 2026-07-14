function parseOptionalDate(value, message) {
    if (value === undefined || value === null || value === '') return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new Error(message);
    return parsed;
}

function normalizeScheduledAt(value) {
    return parseOptionalDate(value, 'Invalid scheduled date');
}

function buildUpcomingSchedule({ appointments = [], leads = [], limit = 10 }) {
    return [
        ...appointments
            .filter((appointment) => appointment.scheduledAt)
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
    buildUpcomingSchedule
};
