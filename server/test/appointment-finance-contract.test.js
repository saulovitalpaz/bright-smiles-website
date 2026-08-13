const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(serverRoot, '..');

const appointment = (overrides = {}) => ({
    id: 71,
    patientId: 12,
    date: new Date('2026-08-20T14:00:00.000Z'),
    procedure: 'Procedimento de teste',
    price: 250,
    paymentStatus: 'received',
    status: 'attended',
    ...overrides
});

const createFinanceStore = () => {
    const rows = [];
    let nextId = 1;
    return {
        rows,
        tx: {
            financeTransaction: {
                findUnique: async ({ where }) => rows.find((row) => row.appointmentId === where.appointmentId) || null,
                upsert: async ({ where, create, update }) => {
                    const existing = rows.find((row) => row.appointmentId === where.appointmentId);
                    if (existing) {
                        Object.assign(existing, update);
                        return existing;
                    }
                    const row = { id: nextId++, ...create };
                    rows.push(row);
                    return row;
                },
                update: async ({ where, data }) => {
                    const row = rows.find((item) => item.id === where.id);
                    Object.assign(row, data);
                    return row;
                }
            }
        }
    };
};

test('received consultation creates one realized linked income with deterministic fields', async () => {
    const { syncAppointmentFinance } = require('../utils/appointmentFinance');
    const store = createFinanceStore();

    await syncAppointmentFinance(store.tx, appointment());

    assert.deepEqual(store.rows, [{
        id: 1,
        appointmentId: 71,
        type: 'income',
        amount: 250,
        category: 'Consulta/Procedimento',
        description: 'Atendimento #71: Procedimento de teste',
        date: new Date('2026-08-20T14:00:00.000Z'),
        patientId: 12,
        paymentStatus: 'received'
    }]);
});

test('pending consultation remains one linked pending income and repeated reconciliation updates it', async () => {
    const { syncAppointmentFinance } = require('../utils/appointmentFinance');
    const store = createFinanceStore();

    await syncAppointmentFinance(store.tx, appointment({ paymentStatus: 'pending', price: 250 }));
    await syncAppointmentFinance(store.tx, appointment({ paymentStatus: 'received', price: 320 }));

    assert.equal(store.rows.length, 1);
    assert.equal(store.rows[0].amount, 320);
    assert.equal(store.rows[0].paymentStatus, 'received');
});

test('courtesy creates no income and cancelling a linked consultation voids history', async () => {
    const { syncAppointmentFinance } = require('../utils/appointmentFinance');
    const store = createFinanceStore();

    await syncAppointmentFinance(store.tx, appointment({ price: 0, paymentStatus: 'courtesy' }));
    assert.equal(store.rows.length, 0);

    await syncAppointmentFinance(store.tx, appointment());
    await syncAppointmentFinance(store.tx, appointment({ status: 'cancelled' }));

    assert.equal(store.rows.length, 1);
    assert.equal(store.rows[0].paymentStatus, 'voided');
});

test('finance relation migration preserves legacy data and maps ambiguous payment state to pending', () => {
    const schema = fs.readFileSync(path.join(serverRoot, 'prisma/schema.prisma'), 'utf8');
    const migrationRoot = path.join(serverRoot, 'prisma/migrations');
    const migrationDirectory = fs.readdirSync(migrationRoot).find((entry) => entry.endsWith('_link_appointment_finance'));

    assert.match(schema, /appointmentId\s+Int\?\s+@unique/);
    assert.match(schema, /appointment\s+Appointment\?\s+@relation\(fields: \[appointmentId\]/);
    assert.match(schema, /financeTransactions\s+FinanceTransaction\[\]/);
    assert.match(schema, /paymentStatus\s+String\s+@default\("pending"\)/);
    assert.ok(migrationDirectory, 'expected an appointment-finance migration');

    const migration = fs.readFileSync(path.join(migrationRoot, migrationDirectory, 'migration.sql'), 'utf8');
    assert.match(migration, /ADD COLUMN\s+"appointmentId"\s+INTEGER/i);
    assert.match(migration, /ADD COLUMN\s+"paymentStatus"\s+TEXT/i);
    assert.match(migration, /CREATE UNIQUE INDEX[\s\S]*"appointmentId"/i);
    assert.match(migration, /\[A RECEBER\]/i);
    assert.doesNotMatch(migration, /DELETE\s+FROM\s+"FinanceTransaction"/i);
});

test('appointment finance reconciliation stays private and inside create and update transactions', () => {
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const createRoute = source.slice(source.indexOf("app.post('/appointments'"), source.indexOf("app.put('/appointments/:id'"));
    const updateRoute = source.slice(source.indexOf("app.put('/appointments/:id'"), source.indexOf("app.delete('/appointments/:id'"));

    for (const route of [createRoute, updateRoute]) {
        assert.match(route, /authenticateToken/);
        assert.match(route, /authorizeRole\(\['admin', 'dentist'\]\)/);
        assert.match(route, /prisma\.\$transaction\(async \(tx\)/);
        assert.match(route, /syncAppointmentFinance\(tx, (?:appointment|createdAppointment)\)/);
    }
});

test('consultation payment copy distinguishes realized, pending, and courtesy states', () => {
    const page = fs.readFileSync(path.join(repoRoot, 'src/pages/AdminAttendanceDetail.tsx'), 'utf8');

    assert.match(page, /value="received"[\s\S]*Recebido.*caixa/i);
    assert.match(page, /value="pending"[\s\S]*A Receber/i);
    assert.match(page, /value="courtesy"[\s\S]*Cortesia\s*\/\s*Retorno/i);
});
