const test = require('node:test');
const assert = require('node:assert/strict');
const { patientSchema } = require('../utils/validationSchemas');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('patient sex accepts supported values and preserves omission for existing clients', () => {
    const patient = { name: 'Paciente fictício', cpf: '00000000000' };
    for (const sex of ['female', 'male', null]) {
        assert.equal(patientSchema.parse({ ...patient, sex }).sex, sex);
    }
    assert.equal(Object.hasOwn(patientSchema.parse(patient), 'sex'), false);
    assert.equal(patientSchema.safeParse({ ...patient, sex: 'invalid' }).success, false);
});

test('patient update persists, clears and preserves omitted sex through the real route', async () => {
    const source = fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8');
    const start = source.indexOf("app.put('/patients/:id'");
    const end = source.indexOf("app.delete('/patients/:id'", start);
    let handler;
    let stored = { id: 1, sex: 'female' };
    vm.runInNewContext(source.slice(start, end), {
        app: { put: (_path, _auth, _role, callback) => { handler = callback; } },
        authenticateToken: () => {}, authorizeRole: () => () => {}, patientSchema,
        encrypt: value => value, decrypt: value => value, blindIndex: value => value,
        prisma: { patient: { update: async ({ data }) => { stored = { ...stored, ...data }; return stored; } } },
    });
    for (const [fields, expected] of [[{ sex: 'male' }, 'male'], [{}, 'male'], [{ sex: null }, null]]) {
        let response;
        await handler({ params: { id: '1' }, body: { name: 'Paciente fictício', cpf: '00000000000', ...fields } }, {
            json: value => { response = value; },
            status: status => { throw new Error(`Unexpected HTTP ${status}`); },
        });
        assert.equal(stored.sex, expected);
        assert.equal(response.sex, expected);
    }
});
