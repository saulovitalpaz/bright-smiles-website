const FINANCE_CATEGORY = 'Consulta/Procedimento';

const normalizePaymentStatus = (value) => {
    if (value === 'paid') return 'received';
    if (value === 'courtesy') return 'courtesy';
    if (value === 'pending') return 'pending';
    if (value === 'voided') return 'voided';
    return 'received';
};

const financeDataForAppointment = (appointment, paymentStatus) => ({
    type: 'income',
    amount: Number(appointment.price),
    category: FINANCE_CATEGORY,
    description: `Atendimento #${appointment.id}: ${appointment.procedure}`,
    date: appointment.date,
    patientId: appointment.patientId || null,
    paymentStatus
});

async function syncAppointmentFinance(tx, appointment) {
    const existing = await tx.financeTransaction.findUnique({
        where: { appointmentId: appointment.id }
    });
    const normalizedStatus = normalizePaymentStatus(appointment.paymentStatus);
    const hasCharge = Number(appointment.price) > 0;
    const shouldVoid = appointment.status === 'cancelled' || normalizedStatus === 'voided';

    if (!hasCharge || normalizedStatus === 'courtesy') {
        if (existing) {
            return tx.financeTransaction.update({
                where: { id: existing.id },
                data: { ...financeDataForAppointment(appointment, 'voided'), amount: 0 }
            });
        }
        return null;
    }

    const paymentStatus = shouldVoid ? 'voided' : normalizedStatus;
    const data = financeDataForAppointment(appointment, paymentStatus);
    return tx.financeTransaction.upsert({
        where: { appointmentId: appointment.id },
        create: { appointmentId: appointment.id, ...data },
        update: data
    });
}

module.exports = { syncAppointmentFinance, normalizePaymentStatus };
