const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.resolve(__dirname, '..');

function readRoute(source, startMarker, endMarker) {
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start + startMarker.length);

    assert.notEqual(start, -1, `route marker not found: ${startMarker}`);
    assert.notEqual(end, -1, `route marker not found: ${endMarker}`);

    return source.slice(start, end);
}

test('appointments can filter history by patient and completed requests are hidden', () => {
    const indexSource = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const appointmentsRoute = readRoute(
        indexSource,
        "app.get('/appointments', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {",
        "app.get('/appointments/:id'"
    );
    const leadsRoute = readRoute(
        indexSource,
        "app.get('/leads', authenticateToken, authorizeRole(['admin', 'manager']), async (req, res) => {",
        "app.put('/leads/:id'"
    );

    assert.match(appointmentsRoute, /req\.query\.patientId/);
    assert.match(appointmentsRoute, /Number\.parseInt/);
    assert.match(appointmentsRoute, /where/);
    assert.match(appointmentsRoute, /prisma\.appointment\.findMany\(\{[\s\S]*where/);
    assert.match(leadsRoute, /where:\s*\{\s*status:\s*\{\s*not:\s*['"]completed['"]\s*\}\s*\}/);
});

test('attendance navigation preserves the selected patient', () => {
    const appointmentsSource = fs.readFileSync(
        path.join(serverRoot, '..', 'src', 'pages', 'AdminAppointments.tsx'),
        'utf8'
    );
    const timelineSource = fs.readFileSync(
        path.join(serverRoot, '..', 'src', 'components', 'admin', 'attendance', 'EvolutionTimeline.tsx'),
        'utf8'
    );

    assert.match(appointmentsSource, /patientId\??:\s*number\s*\|\s*null/);
    const patientLinks = appointmentsSource.match(/patientId=\$\{record\.patientId(?:\s*\?\?[^}]+)?\}/g) || [];
    assert.ok(patientLinks.length >= 2, 'row and Ver Evolução links must carry patientId');
    assert.match(timelineSource, /appointments\?patientId=\$\{patientId\}/);
});

test('lead attendance resolves patients by exact contact identity', () => {
    const indexSource = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const patientsRoute = readRoute(
        indexSource,
        "app.get('/patients', authenticateToken, authorizeRole(['admin', 'dentist']), async (req, res) => {",
        "app.get('/patients/:cpf'"
    );
    const attendanceSource = fs.readFileSync(
        path.join(serverRoot, '..', 'src', 'pages', 'AdminAttendanceDetail.tsx'),
        'utf8'
    );

    assert.match(patientsRoute, /req\.query\.phone/);
    assert.match(patientsRoute, /req\.query\.cpf/);
    assert.match(patientsRoute, /const hasPhoneQuery = phone !== undefined/);
    assert.match(patientsRoute, /const hasCpfQuery = cpf !== undefined/);
    assert.match(patientsRoute, /hasPhoneQuery[\s\S]*requestedPhone[\s\S]*\[\]/);
    assert.match(patientsRoute, /hasCpfQuery[\s\S]*requestedCpf[\s\S]*\[\]/);
    assert.match(patientsRoute, /normalizeIdentity\(p\.cpf\)\.includes\(normalizeIdentity\(search\)\)/);
    assert.match(attendanceSource, /patients\?phone=/);
    assert.match(attendanceSource, /patients\?cpf=/);
    assert.match(attendanceSource, /phone:\s*data\.phone/);
    assert.match(attendanceSource, /phone:\s*_phone/);
});

test('patient schema and routes support safe updates and deletion protection', () => {
    const indexSource = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const schemaSource = fs.readFileSync(path.join(serverRoot, 'utils', 'validationSchemas.js'), 'utf8');

    assert.match(schemaSource, /consent:\s*z\.boolean\(\)\.optional\(\)/);
    assert.match(schemaSource, /consentDate:\s*(?:z\.string\(\)\.or\(z\.date\(\)\)|z\.date\(\))\.optional\(\)/);
    assert.match(schemaSource, /odontogram:\s*z\.any\(\)\.optional\(\)/);

    const updateRoute = readRoute(
        indexSource,
        "app.put('/patients/:id'",
        "app.post('/patients/:cpf/consent'"
    );
    assert.match(updateRoute, /authenticateToken/);
    assert.match(updateRoute, /patientSchema\.safeParse\(req\.body\)/);
    assert.match(updateRoute, /Number\.parseInt\(req\.params\.id/);
    assert.match(updateRoute, /cpfIndex:\s*blindIndex\(cpf\)/);
    assert.match(updateRoute, /cpf:\s*encrypt\(cpf\)/);
    assert.doesNotMatch(updateRoute, /encrypt\(cpf,\s*true\)/);
    assert.match(updateRoute, /encrypt\(history\)/);
    assert.match(updateRoute, /prisma\.patient\.update/);
    assert.match(updateRoute, /decrypt\(.*\.cpf\)/s);
    assert.match(updateRoute, /decrypt\(.*\.history\)/s);

    const lookupRoute = readRoute(
        indexSource,
        "app.get('/patients/:cpf'",
        "app.post('/patients'"
    );
    assert.match(lookupRoute, /findPatientByCpf\(cpf/);

    const consentRoute = readRoute(
        indexSource,
        "app.post('/patients/:cpf/consent'",
        "// Prescriptions API"
    );
    assert.match(consentRoute, /findPatientByCpf\(cpf\)/);
    assert.match(indexSource, /const findPatientByCpf[\s\S]*where:\s*\{\s*cpfIndex:\s*blindIndex\(cpf\)\s*\}/);
    assert.match(indexSource, /const findPatientByCpf[\s\S]*prisma\.patient\.findMany/);

    const deleteRoute = readRoute(
        indexSource,
        "app.delete('/patients/:id'",
        "// Consent API"
    );
    assert.match(deleteRoute, /authenticateToken/);
    assert.match(deleteRoute, /prisma\.patient\.findUnique/);
    assert.match(deleteRoute, /appointments/);
    assert.match(deleteRoute, /prescriptions/);
    assert.match(deleteRoute, /documents/);
    assert.match(deleteRoute, /finance/);
    assert.match(deleteRoute, /status\(404\)/);
    assert.match(deleteRoute, /status\(409\)/);
    assert.match(deleteRoute, /prisma\.patient\.delete/);
});

test('admin patients page is registered and exposed in the admin navigation', () => {
    const appSource = fs.readFileSync(path.join(serverRoot, '..', 'src', 'App.tsx'), 'utf8');
    const layoutSource = fs.readFileSync(
        path.join(serverRoot, '..', 'src', 'components', 'admin', 'AdminLayout.tsx'),
        'utf8'
    );

    assert.match(appSource, /import AdminPatients from ["']\.\/pages\/AdminPatients["']/);
    assert.match(appSource, /path=["']\/admin\/pacientes["'][\s\S]*AdminPatients/);
    assert.match(layoutSource, /label:\s*["']Pacientes["']/);
    assert.match(layoutSource, /href:\s*["']\/admin\/pacientes["']/);
    assert.match(layoutSource, /icon:\s*Users/);
    assert.match(layoutSource, /adminOnly:\s*true/);
});
