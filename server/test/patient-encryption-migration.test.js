const test = require('node:test');
const assert = require('node:assert/strict');

const { createEncryption } = require('../utils/encryption');
const { migratePatientEncryption } = require('../utils/patientEncryptionMigration');

const key = (fill) => Buffer.alloc(32, fill).toString('base64');

test('re-encrypts legacy patient values, adds the blind index, and skips already migrated records', async () => {
    const encryption = createEncryption({
        ENCRYPTION_KEY: key(8),
        LEGACY_ENCRYPTION_KEY: 'legacy-key-used-by-the-previous-release',
        PATIENT_INDEX_KEY: key(9)
    });
    const legacyCpf = 'abcdefabcdefabcdefabcdefabcdefab:6cd4a91f5d4f7e9ed6:00000000000000000000000000000000';
    const migratedCpf = encryption.encrypt('98765432100');
    const patients = [
        { id: 1, cpf: legacyCpf, history: 'legacy history', cpfIndex: null },
        { id: 2, cpf: migratedCpf, history: encryption.encrypt('new history'), cpfIndex: encryption.blindIndex('98765432100') }
    ];
    const changes = [];
    const prisma = {
        patient: {
            findMany: async () => patients,
            update: async ({ where, data }) => changes.push({ where, data })
        }
    };
    const decrypt = (value) => value === legacyCpf ? '12345678900' : encryption.decrypt(value);
    const result = await migratePatientEncryption({
        prisma,
        encryption: { ...encryption, decrypt },
        log: () => {}
    });

    assert.deepEqual(result, { migrated: 1, skipped: 1 });
    assert.equal(changes.length, 1);
    assert.deepEqual(changes[0].where, { id: 1 });
    assert.equal(encryption.decrypt(changes[0].data.cpf), '12345678900');
    assert.equal(encryption.decrypt(changes[0].data.history), 'legacy history');
    assert.equal(changes[0].data.cpfIndex, encryption.blindIndex('12345678900'));
});

test('stops without logging patient values when a protected value cannot be decrypted', async () => {
    const encryption = createEncryption({ ENCRYPTION_KEY: key(10), PATIENT_INDEX_KEY: key(11) });
    const calls = [];
    await assert.rejects(
        () => migratePatientEncryption({
            prisma: { patient: { findMany: async () => [{ id: 1, cpf: 'bad:payload:value', history: null, cpfIndex: null }] } },
            encryption,
            log: (message) => calls.push(message)
        }),
        /Unable to decrypt protected value/,
    );
    assert.deepEqual(calls, []);
});
