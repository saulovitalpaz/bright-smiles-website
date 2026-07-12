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
        "app.get('/appointments', async (req, res) => {",
        "app.get('/appointments/:id'"
    );
    const leadsRoute = readRoute(
        indexSource,
        "app.get('/leads', async (req, res) => {",
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
