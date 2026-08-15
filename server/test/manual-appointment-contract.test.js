const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.resolve(__dirname, '..');

const loadAuthenticateToken = (jwt) => {
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const start = source.indexOf('const authenticateToken =');
    const end = source.indexOf('\n};', start) + 3;
    const declaration = source.slice(start, end);

    return new Function('jwt', 'JWT_SECRET', `${declaration}; return authenticateToken;`)(jwt, 'test-secret');
};

const minimumAppointment = {
    patientName: 'Marina Alves',
    date: '2026-08-14T09:00:00.000Z',
    scheduledAt: '2026-08-14T09:00:00.000Z',
    procedure: 'Avaliação',
    appointmentType: 'odontologia',
    professional: 'Dra. Sofia'
};

test('appointment validation accepts known statuses and rejects unknown status values', () => {
    const { appointmentSchema } = require('../utils/validationSchemas');

    for (const status of ['scheduled', 'attended', 'cancelled']) {
        assert.equal(appointmentSchema.safeParse({ ...minimumAppointment, status }).success, true);
    }

    assert.equal(appointmentSchema.safeParse({ ...minimumAppointment, status: 'rescheduled' }).success, false);
});

test('appointments route remains private to authenticated administrators and dentists', () => {
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const route = source.slice(source.indexOf("app.post('/appointments'"), source.indexOf("app.put('/appointments/:id'"));

    assert.match(route, /authenticateToken/);
    assert.match(route, /authorizeRole\(\['admin', 'dentist'\]\)/);

    const authenticateToken = loadAuthenticateToken({ verify: () => assert.fail('anonymous requests must not verify a token') });
    let statusCode;
    let nextCalled = false;
    authenticateToken(
        { cookies: {}, headers: {} },
        { sendStatus: (code) => { statusCode = code; } },
        () => { nextCalled = true; }
    );

    assert.equal(statusCode, 401);
    assert.equal(nextCalled, false);
});

test('only scheduled appointments remain in dashboard-facing upcoming state', () => {
    const { buildUpcomingSchedule } = require('../utils/schedule');
    const appointment = (id, status) => ({
        id,
        status,
        patientName: `Paciente ${id}`,
        procedure: 'Avaliação',
        appointmentType: 'odontologia',
        scheduledAt: `2026-08-14T${String(id + 8).padStart(2, '0')}:00:00.000Z`,
        createdAt: '2026-08-13T12:00:00.000Z',
        patientId: id
    });

    const result = buildUpcomingSchedule({
        appointments: [appointment(1, 'scheduled'), appointment(2, 'attended'), appointment(3, 'cancelled')]
    });

    assert.deepEqual(result.map((item) => item.id), [1]);
});

test('manual calendar creation keeps a complete, controlled appointment contract', () => {
    const repoRoot = path.resolve(serverRoot, '..');
    const calendarPage = fs.readFileSync(path.join(repoRoot, 'src/pages/AdminCalendar.tsx'), 'utf8');
    const calendar = fs.readFileSync(path.join(repoRoot, 'src/components/admin/appointments/CalendarView.tsx'), 'utf8');
    const calendarHelper = fs.readFileSync(path.join(repoRoot, 'src/lib/calendar.ts'), 'utf8');

    assert.match(calendar, /onEventCreate/);
    assert.match(calendarPage, /setManualAppointmentDate/);
    assert.match(calendarPage, /DialogTitle>.*Novo atendimento/);
    assert.match(calendarPage, /fetchClient\(['"]\/appointments['"],\s*\{\s*method:\s*['"]POST['"]/);
    assert.match(calendarPage, /patientName/);
    assert.match(calendarPage, /procedure/);
    assert.match(calendarPage, /appointmentType/);
    assert.match(calendarPage, /professional/);
    assert.match(calendarPage, /scheduledAt/);
    assert.match(calendarPage, /paymentStatus/);
    assert.match(calendarPage, /refreshCalendarRecords/);
    assert.match(calendarHelper, /status\?:\s*['"]scheduled['"]\s*\|\s*['"]attended['"]\s*\|\s*['"]cancelled['"]/);
    assert.match(calendarHelper, /item\.status !== "attended" && item\.status !== "cancelled"/);
});

test('appointment migration repairs legacy status values before enforcing its contract', () => {
    const migration = fs.readFileSync(
        path.join(serverRoot, 'prisma/migrations/20260813000000_add_appointment_status/migration.sql'),
        'utf8'
    );

    assert.match(migration, /UPDATE\s+(?:public\.)?"Appointment"[\s\S]*"status"\s+IS\s+NULL/i);
    assert.match(migration, /"status"\s+NOT\s+IN\s*\(\s*'scheduled'\s*,\s*'attended'\s*,\s*'cancelled'\s*\)/i);
    assert.match(migration, /ALTER\s+COLUMN\s+"status"\s+SET\s+DEFAULT\s+'scheduled'/i);
    assert.match(migration, /ALTER\s+COLUMN\s+"status"\s+SET\s+NOT\s+NULL/i);
    assert.match(migration, /n\.nspname\s*=\s*'public'/i);
    assert.match(migration, /t\.relname\s*=\s*'Appointment'/i);
});

test('unexpected appointment persistence errors return a generic server error', () => {
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const route = source.slice(source.indexOf("app.post('/appointments'"), source.indexOf("app.put('/appointments/:id'"));

    assert.match(route, /res\.status\(500\)\.json\(\{ error: 'Unable to create appointment\.' \}\)/);
    assert.doesNotMatch(route, /res\.status\(400\)\.json\(\{ error: error\.message \}\)/);
});
