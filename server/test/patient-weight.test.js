const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { patientSchema } = require('../utils/validationSchemas');
const { createEncryption } = require('../utils/encryption');
const patient = { name: 'Paciente fictício', cpf: '00000000000' };

test('patient weight accepts decimal kilograms, supports clearing and rejects invalid input', () => {
    assert.equal(patientSchema.parse({ ...patient, weight: ' 72,5 ' }).weight, '72.5');
    assert.equal(patientSchema.parse({ ...patient, weight: null }).weight, null);
    assert.equal(Object.hasOwn(patientSchema.parse(patient), 'weight'), false);
    for (const weight of ['0', '-1', 'Infinity', 'abc', '72kg', '1001', '<script>', '1e2']) {
        assert.equal(patientSchema.safeParse({ ...patient, weight }).success, false);
    }
});

test('patient update encrypts weight, returns plaintext, preserves omission and allows clearing', async () => {
    const source = fs.readFileSync(require.resolve('../index.js'), 'utf8');
    const crypto = require('node:crypto');
    const encryption = createEncryption({ ENCRYPTION_KEY: crypto.randomBytes(32).toString('base64'), PATIENT_INDEX_KEY: crypto.randomBytes(32).toString('base64') });
    let handler, stored = { id: 1 };
    vm.runInNewContext(source.slice(source.indexOf("app.put('/patients/:id'"), source.indexOf("app.delete('/patients/:id'")), {
        app: { put: (_path, _auth, _role, cb) => { handler = cb; } },
        authenticateToken: () => {}, authorizeRole: () => () => {}, patientSchema, ...encryption,
        prisma: { patient: { update: async ({ data }) => { stored = { ...stored, ...data }; return stored; } } },
    });
    for (const [fields, expected] of [[{ weight: '72,5' }, '72.5'], [{}, '72.5'], [{ weight: null }, null]]) {
        let response;
        await handler({ params: { id: '1' }, body: { ...patient, ...fields } }, {
            json: value => { response = value; }, status: status => { throw new Error(`Unexpected HTTP ${status}`); },
        });
        assert.equal(response.weight, expected);
        if (expected) { assert.equal(encryption.isPrimaryEncrypted(stored.weight), true); assert.equal(encryption.decrypt(stored.weight), expected); }
        else assert.equal(stored.weight, null);
    }
});
