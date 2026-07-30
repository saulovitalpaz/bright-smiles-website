function migratePatientEncryption({ prisma, encryption, log = console.log }) {
    return (async () => {
        const patients = await prisma.patient.findMany({
            select: { id: true, cpf: true, history: true, cpfIndex: true }
        });
        let migrated = 0;
        let skipped = 0;

        for (const patient of patients) {
            const cpf = encryption.decrypt(patient.cpf);
            const history = patient.history ? encryption.decrypt(patient.history) : patient.history;
            const cpfIndex = encryption.blindIndex(cpf);
            const current = encryption.isPrimaryEncrypted(patient.cpf)
                && (!patient.history || encryption.isPrimaryEncrypted(patient.history))
                && patient.cpfIndex === cpfIndex;

            if (current) {
                skipped += 1;
                continue;
            }

            await prisma.patient.update({
                where: { id: patient.id },
                data: {
                    cpf: encryption.encrypt(cpf),
                    history: encryption.encrypt(history),
                    cpfIndex
                }
            });
            migrated += 1;
        }

        log(`Patient encryption migration completed: ${migrated} migrated, ${skipped} already current.`);
        return { migrated, skipped };
    })();
}

module.exports = { migratePatientEncryption };
