const { patientSchema } = require('./validationSchemas');

class PatientWeightError extends Error {
    constructor(message) { super(message); this.statusCode = 400; }
}

async function syncPatientWeight(tx, appointment, measurement, encrypt) {
    if (measurement === undefined) return;
    const parsed = patientSchema.shape.weight.safeParse(measurement);
    if (!parsed.success || !parsed.data) throw new PatientWeightError('Informe um peso válido, maior que zero e até 1000 kg.');
    if (!appointment.patientId) throw new PatientWeightError('Selecione o paciente para atualizar o peso.');
    // Serialize measurements for the patient before deciding which consultation is latest.
    await tx.$queryRaw`SELECT "id" FROM "Patient" WHERE "id" = ${appointment.patientId} FOR NO KEY UPDATE`;
    const latest = await tx.appointment.findFirst({
        where: { patientId: appointment.patientId, date: { lte: new Date() }, status: { not: 'cancelled' } },
        orderBy: [{ date: 'desc' }, { id: 'desc' }], select: { id: true },
    });
    if (latest?.id !== appointment.id) throw new PatientWeightError('Atualize o peso durante a última consulta do paciente.');
    await tx.patient.update({ where: { id: appointment.patientId }, data: { weight: encrypt(parsed.data) } });
}

module.exports = { syncPatientWeight, PatientWeightError };
