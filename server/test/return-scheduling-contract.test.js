const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(serverRoot, '..');

const sourceAppointment = {
    id: 41,
    patientId: 7,
    patientName: 'Paciente de teste',
    cpf: null,
    professional: 'Profissional de teste',
    appointmentType: 'odontologia',
    procedure: 'Procedimento de teste'
};

const createAppointmentStore = () => {
    const appointments = [];
    let nextId = 100;

    return {
        appointments,
        tx: {
            appointment: {
                findUnique: async ({ where }) => appointments.find(
                    (appointment) => appointment.parentAppointmentId === where.parentAppointmentId
                ) || null,
                create: async ({ data }) => {
                    const appointment = { id: nextId++, ...data };
                    appointments.push(appointment);
                    return appointment;
                },
                update: async ({ where, data }) => {
                    const appointment = appointments.find((item) => item.id === where.id);
                    Object.assign(appointment, data);
                    return appointment;
                }
            }
        }
    };
};

test('return date normalization requires a future ISO date and time', () => {
    const { normalizeReturnDate } = require('../utils/schedule');
    const now = new Date('2026-08-13T12:00:00.000Z');

    assert.equal(normalizeReturnDate(null, now), null);
    assert.equal(
        normalizeReturnDate('2026-08-14T15:30:00.000Z', now).toISOString(),
        '2026-08-14T15:30:00.000Z'
    );
    assert.throws(() => normalizeReturnDate('2026-08-14', now), /Invalid return date/);
    assert.throws(() => normalizeReturnDate('not-a-date', now), /Invalid return date/);
    assert.throws(() => normalizeReturnDate('2026-08-13T11:59:59.000Z', now), /future/);
});

test('return reconciliation creates one linked child and repeated saves stay idempotent', async () => {
    const { syncReturnAppointment } = require('../utils/schedule');
    const store = createAppointmentStore();
    const returnDate = new Date('2026-08-20T16:00:00.000Z');

    const created = await syncReturnAppointment(store.tx, sourceAppointment, { returnDate });
    const repeated = await syncReturnAppointment(store.tx, sourceAppointment, { returnDate });

    assert.equal(store.appointments.length, 1);
    assert.equal(repeated.id, created.id);
    assert.deepEqual(store.appointments[0], {
        id: created.id,
        parentAppointmentId: 41,
        patientId: 7,
        patientName: 'Paciente de teste',
        cpf: null,
        date: returnDate,
        scheduledAt: returnDate,
        procedure: 'Retorno: Procedimento de teste',
        notes: 'Retorno vinculado ao atendimento #41.',
        professional: 'Profissional de teste',
        appointmentType: 'odontologia',
        status: 'scheduled',
        price: null,
        paymentStatus: 'courtesy'
    });
});

test('return reconciliation updates the same child and cancellation preserves history', async () => {
    const { syncReturnAppointment } = require('../utils/schedule');
    const store = createAppointmentStore();
    const firstDate = new Date('2026-08-20T16:00:00.000Z');
    const changedDate = new Date('2026-08-27T13:30:00.000Z');

    const created = await syncReturnAppointment(store.tx, sourceAppointment, { returnDate: firstDate });
    const changed = await syncReturnAppointment(store.tx, sourceAppointment, { returnDate: changedDate });
    const changedSnapshot = { ...changed };
    const cleared = await syncReturnAppointment(store.tx, sourceAppointment, { returnDate: null });

    assert.equal(store.appointments.length, 1);
    assert.equal(changedSnapshot.id, created.id);
    assert.equal(changedSnapshot.scheduledAt, changedDate);
    assert.equal(changedSnapshot.status, 'scheduled');
    assert.equal(cleared.id, created.id);
    assert.equal(cleared.scheduledAt, changedDate);
    assert.equal(cleared.status, 'cancelled');
});

test('upcoming schedule includes active returns once in existing chronological order', () => {
    const { buildUpcomingSchedule } = require('../utils/schedule');
    const returnAppointment = {
        id: 101,
        parentAppointmentId: 41,
        patientId: 7,
        patientName: 'Paciente de teste',
        procedure: 'Retorno: Procedimento de teste',
        appointmentType: 'odontologia',
        scheduledAt: new Date('2026-08-20T16:00:00.000Z'),
        createdAt: new Date('2026-08-13T12:00:00.000Z'),
        status: 'scheduled'
    };

    const result = buildUpcomingSchedule({
        appointments: [
            { ...returnAppointment },
            { ...returnAppointment },
            { ...returnAppointment, id: 102, status: 'cancelled' },
            { ...returnAppointment, id: 103, status: 'attended' }
        ],
        leads: [{
            id: 5,
            name: 'Solicitante de teste',
            treatment: 'Avaliação',
            status: 'scheduled',
            scheduledAt: new Date('2026-08-19T10:00:00.000Z'),
            createdAt: new Date('2026-08-13T11:00:00.000Z')
        }]
    });

    assert.deepEqual(result.map(({ kind, id }) => `${kind}:${id}`), ['lead:5', 'appointment:101']);
});

test('return relation and migration enforce one child per source without rewriting existing rows', () => {
    const schema = fs.readFileSync(path.join(serverRoot, 'prisma/schema.prisma'), 'utf8');
    const migrationRoot = path.join(serverRoot, 'prisma/migrations');
    const migrationDirectory = fs.readdirSync(migrationRoot).find((entry) => entry.endsWith('_link_appointment_returns'));

    assert.match(schema, /parentAppointmentId\s+Int\?\s+@unique/);
    assert.match(schema, /parentAppointment\s+Appointment\?\s+@relation\("AppointmentReturns"/);
    assert.match(schema, /returnAppointment\s+Appointment\?\s+@relation\("AppointmentReturns"/);
    assert.ok(migrationDirectory, 'expected a return-link migration');

    const migration = fs.readFileSync(path.join(migrationRoot, migrationDirectory, 'migration.sql'), 'utf8');
    assert.match(migration, /ADD COLUMN\s+"parentAppointmentId"\s+INTEGER/i);
    assert.match(migration, /CREATE UNIQUE INDEX[\s\S]*"parentAppointmentId"/i);
    assert.match(migration, /ON DELETE SET NULL/i);
    assert.doesNotMatch(migration, /UPDATE\s+"Appointment"/i);
});

test('authenticated appointment update reconciles returns inside its persistence transaction', () => {
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const route = source.slice(source.indexOf("app.put('/appointments/:id'"), source.indexOf("app.delete('/appointments/:id'"));

    assert.match(route, /authenticateToken/);
    assert.match(route, /authorizeRole\(\['admin', 'dentist'\]\)/);
    assert.match(route, /normalizeReturnDate/);
    assert.match(route, /prisma\.\$transaction\(async \(tx\)/);
    assert.match(route, /syncReturnAppointment\(tx, appointment, \{\s*returnDate:/);
});
