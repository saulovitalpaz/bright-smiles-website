const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const schemas = require('../utils/validationSchemas');
const schedule = require('../utils/schedule');
const weights = require('../utils/appointmentPatientWeight');

test('saving a consultation strips patient-only fields and creates a scheduled return', async () => {
    const source = fs.readFileSync(require.resolve('../index.js'), 'utf8');
    let handler, returned, persisted;
    const returnDate = new Date(Date.now() + 86400000).toISOString();
    const tx = { appointment: {
        findUnique: async ({ where }) => where.id ? { returnDate: null } : null,
        update: async ({ data }) => {
            for (const key of ['birthDate', 'sex', 'phone', 'patientWeight']) assert.equal(Object.hasOwn(data, key), false);
            persisted = data;
            return { id: 8, patientId: 3, patientName: 'Paciente fictício', procedure: 'Avaliação', professional: 'Profissional fictício', ...data };
        },
        upsert: async ({ create }) => ({ id: 9, ...create }),
    } };
    vm.runInNewContext(source.slice(source.indexOf("app.put('/appointments/:id'"), source.indexOf("app.delete('/appointments/:id'")), {
        app: { put: (_path, _auth, _role, fn) => { handler = fn; } },
        authenticateToken: () => {}, authorizeRole: () => () => {},
        prisma: { $transaction: fn => fn(tx) }, ...schemas, ...schedule, ...weights,
        syncAppointmentFinance: async () => {}, syncFacialStock: async () => {}, StockError: class extends Error {},
    });
    let status = 200;
    const res = { status: value => { status = value; return res; }, json: value => { returned = value; } };
    await handler({ params: { id: '8' }, user: { id: 1 }, body: { birthDate: '1990-01-01', sex: 'female', phone: '', returnDate } }, res);
    assert.equal(status, 200);
    assert.equal(persisted.returnDate.toISOString(), returnDate);
    assert.equal(returned.returnAppointment.scheduledAt.toISOString(), returnDate);
    assert.equal(returned.returnAppointment.status, 'scheduled');
    assert.equal(returned.returnAppointment.parentAppointmentId, 8);
});
