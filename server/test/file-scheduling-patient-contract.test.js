const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.resolve(__dirname, '..');

async function withRouteServer(registerRoutes, run) {
    const express = require('express');
    const app = express();
    app.use(express.json());
    registerRoutes(app);

    let server;
    await new Promise((resolve, reject) => {
        server = app.listen(0, '127.0.0.1', resolve);
        server.on('error', reject);
    });

    try {
        const { port } = server.address();
        await run(`http://127.0.0.1:${port}`);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }
}

test('general uploads use bucket storage and expose separate public/private delivery routes', () => {
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    assert.match(source, /require\(['"]\.\/utils\/assetStorage['"]\)/);
    assert.match(source, /app\.post\(['"]\/upload['"]/);
    assert.match(source, /app\.get\(['"]\/assets/);
    assert.match(source, /app\.get\(['"]\/clinical-assets/);
    assert.match(source, /authenticateToken/);
    assert.doesNotMatch(
        source.slice(source.indexOf("app.post('/upload'"), source.indexOf("app.post('/patient-documents")),
        /CloudinaryStorage/
    );
});

test('asset storage exports stable reference and signed URL helpers', () => {
    const storage = require('../utils/assetStorage');
    assert.equal(typeof storage.uploadAsset, 'function');
    assert.equal(typeof storage.createPublicAssetUrl, 'function');
    assert.equal(typeof storage.createPrivateAssetUrl, 'function');
    assert.equal(storage.isAssetReference('bucket://clinical/appointments/1/a.jpg'), true);
    assert.equal(storage.isAssetReference('/images/logo-oficial.png'), false);
});

test('asset storage parses stable bucket references and rejects malformed ones', () => {
    const storage = require('../utils/assetStorage');

    assert.deepEqual(
        storage.parseAssetReference('bucket://public/gallery/hero image.png'),
        { scope: 'public', key: 'gallery/hero image.png' }
    );
    assert.deepEqual(
        storage.parseAssetReference('bucket://clinical/patients/42/x-ray.jpg'),
        { scope: 'clinical', key: 'patients/42/x-ray.jpg' }
    );

    for (const malformedReference of [
        '',
        'bucket://public',
        'bucket://public/',
        'bucket://private/patients/42/x-ray.jpg',
        'bucket:/clinical/patients/42/x-ray.jpg',
        '/clinical-assets?reference=bucket://clinical/patients/42/x-ray.jpg'
    ]) {
        assert.equal(
            storage.parseAssetReference(malformedReference),
            null,
            `expected ${malformedReference || '<empty>'} to be rejected`
        );
    }
});

test('asset storage generates stable encoded delivery paths', () => {
    const storage = require('../utils/assetStorage');

    assert.equal(
        storage.createAssetDeliveryPath('bucket://public/gallery/hero image.png'),
        '/assets?reference=bucket%3A%2F%2Fpublic%2Fgallery%2Fhero%20image.png'
    );
    assert.equal(
        storage.createAssetDeliveryPath('bucket://clinical/patients/42/scan #1.pdf'),
        '/clinical-assets?reference=bucket%3A%2F%2Fclinical%2Fpatients%2F42%2Fscan%20%231.pdf'
    );
});

test('asset storage validates delivery requests at the route boundary', () => {
    const storage = require('../utils/assetStorage');

    assert.deepEqual(
        storage.validateAssetDeliveryRequest({
            routeScope: 'public',
            reference: 'bucket://public/gallery/hero.png'
        }),
        {
            ok: true,
            reference: 'bucket://public/gallery/hero.png',
            parsed: { scope: 'public', key: 'gallery/hero.png' }
        }
    );

    assert.deepEqual(
        storage.validateAssetDeliveryRequest({
            routeScope: 'clinical',
            reference: 'bucket://public/gallery/hero.png'
        }),
        {
            ok: false,
            statusCode: 403,
            error: 'Clinical asset route accepts only clinical asset references.'
        }
    );

    assert.deepEqual(
        storage.validateAssetDeliveryRequest({
            routeScope: 'public',
            reference: 'not-a-reference'
        }),
        {
            ok: false,
            statusCode: 400,
            error: 'Invalid asset reference.'
        }
    );
});

test('asset storage cleanup helper deletes uploaded assets when response construction fails', async () => {
    const storage = require('../utils/assetStorage');
    const deletedReferences = [];

    await assert.rejects(
        storage.withAssetUploadCleanup({
            uploadedReference: 'bucket://clinical/patients/42/x-ray.jpg',
            run: async () => {
                throw new Error('response serialization failed');
            },
            cleanup: async (reference) => {
                deletedReferences.push(reference);
            }
        }),
        /response serialization failed/
    );

    assert.deepEqual(deletedReferences, ['bucket://clinical/patients/42/x-ray.jpg']);
});

test('clinical photo uploads use the private scope and documents expose legacy pdfUrl', () => {
    const repoRoot = path.resolve(serverRoot, '..');
    const gallery = fs.readFileSync(path.join(repoRoot, 'src/components/admin/attendance/PhotoGallery.tsx'), 'utf8');
    const indexSource = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    assert.match(gallery, /scope.*clinical|clinical.*scope/);
    assert.match(indexSource, /fileUrl:.*storageKey.*pdfUrl/);
    assert.match(indexSource, /clinical-assets/);
});

test('schedule normalization handles nullable, ISO, and datetime-local values at runtime', () => {
    const { normalizeScheduledAt } = require('../utils/schedule');

    assert.equal(normalizeScheduledAt(undefined), null);
    assert.equal(normalizeScheduledAt(null), null);
    assert.equal(normalizeScheduledAt(''), null);

    const isoValue = normalizeScheduledAt('2026-07-13T14:30:00.000Z');
    assert.equal(isoValue instanceof Date, true);
    assert.equal(isoValue.toISOString(), '2026-07-13T14:30:00.000Z');

    const browserValue = normalizeScheduledAt('2026-07-13T09:45');
    assert.equal(browserValue instanceof Date, true);
    assert.equal(Number.isNaN(browserValue.getTime()), false);
    assert.equal(browserValue.getFullYear(), 2026);
    assert.equal(browserValue.getMonth(), 6);
    assert.equal(browserValue.getDate(), 13);
    assert.equal(browserValue.getHours(), 9);
    assert.equal(browserValue.getMinutes(), 45);

    const dateOnlyValue = normalizeScheduledAt('2026-07-13');
    assert.equal(dateOnlyValue instanceof Date, true);
    assert.equal(dateOnlyValue.toISOString(), '2026-07-13T00:00:00.000Z');
});

test('schedule normalization rejects invalid scheduled values with the clear contract message', () => {
    const { normalizeScheduledAt } = require('../utils/schedule');

    assert.throws(() => normalizeScheduledAt('not-a-date'), /Invalid scheduled date/);
});

test('patient create converts consentDate before Prisma persistence', () => {
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const route = source.slice(source.indexOf("app.post('/patients'"), source.indexOf("app.put('/patients/:id'"));

    assert.match(route, /consentDate/);
    assert.match(route, /new Date\(consentDate\)/);
    assert.match(route, /res\.json\(\{[\s\S]*id/);
});

test('lead update route rejects invalid scheduledAt with HTTP 400 JSON before prisma', async () => {
    const { createUpdateLeadHandler } = require('../routes/leads');
    let updateCalls = 0;
    const prisma = {
        lead: {
            update: async () => {
                updateCalls += 1;
                throw new Error('Prisma should not be reached for invalid scheduledAt');
            }
        }
    };

    await withRouteServer(
        (app) => app.put('/leads/:id', createUpdateLeadHandler(prisma)),
        async (baseUrl) => {
            const response = await fetch(`${baseUrl}/leads/42`, {
                method: 'PUT',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ scheduledAt: 'not-a-date', status: 'scheduled' })
            });
            const body = await response.json();

            assert.equal(response.status, 400);
            assert.deepEqual(body, { error: 'Invalid scheduled date' });
        }
    );

    assert.equal(updateCalls, 0);
});

test('upcoming schedule helper returns promised fields in ascending order and excludes completed leads', () => {
    const { buildUpcomingSchedule } = require('../utils/schedule');

    const upcomingSchedule = buildUpcomingSchedule({
        appointments: [
            {
                id: 8,
                patientName: 'Ana Paciente',
                procedure: 'Limpeza',
                appointmentType: 'return',
                scheduledAt: new Date('2026-07-15T12:00:00.000Z'),
                createdAt: new Date('2026-07-01T09:00:00.000Z'),
                patientId: 3
            },
            {
                id: 2,
                patientName: 'Bruno Paciente',
                procedure: 'Avaliação',
                appointmentType: 'initial',
                scheduledAt: new Date('2026-07-14T09:00:00.000Z'),
                createdAt: new Date('2026-07-01T08:00:00.000Z'),
                patientId: 5
            },
            {
                id: 11,
                patientName: 'Sem Agenda',
                procedure: 'Ignorar',
                appointmentType: 'initial',
                scheduledAt: null,
                createdAt: new Date('2026-07-02T08:00:00.000Z'),
                patientId: 9
            }
        ],
        leads: [
            {
                id: 7,
                name: 'Carlos Lead',
                treatment: 'Implante',
                status: 'new',
                scheduledAt: new Date('2026-07-14T08:30:00.000Z'),
                createdAt: new Date('2026-07-03T08:00:00.000Z')
            },
            {
                id: 9,
                name: 'Lead Concluído',
                treatment: 'Clareamento',
                status: 'completed',
                scheduledAt: new Date('2026-07-13T08:30:00.000Z'),
                createdAt: new Date('2026-07-02T08:00:00.000Z')
            },
            {
                id: 10,
                name: 'Sem Horário',
                treatment: 'Botox',
                status: 'new',
                scheduledAt: null,
                createdAt: new Date('2026-07-02T09:00:00.000Z')
            }
        ]
    });

    assert.deepEqual(
        upcomingSchedule.map((item) => ({
            kind: item.kind,
            id: item.id,
            patientName: item.patientName,
            treatment: item.treatment,
            procedure: item.procedure,
            appointmentType: item.appointmentType,
            patientId: item.patientId,
            leadId: item.leadId
        })),
        [
            {
                kind: 'lead',
                id: 7,
                patientName: 'Carlos Lead',
                treatment: 'Implante',
                procedure: null,
                appointmentType: null,
                patientId: null,
                leadId: 7
            },
            {
                kind: 'appointment',
                id: 2,
                patientName: 'Bruno Paciente',
                treatment: null,
                procedure: 'Avaliação',
                appointmentType: 'initial',
                patientId: 5,
                leadId: null
            },
            {
                kind: 'appointment',
                id: 8,
                patientName: 'Ana Paciente',
                treatment: null,
                procedure: 'Limpeza',
                appointmentType: 'return',
                patientId: 3,
                leadId: null
            }
        ]
    );
    assert.deepEqual(
        upcomingSchedule.map((item) => item.scheduledAt.toISOString()),
        [
            '2026-07-14T08:30:00.000Z',
            '2026-07-14T09:00:00.000Z',
            '2026-07-15T12:00:00.000Z'
        ]
    );
    assert.equal(upcomingSchedule.every((item) => item.createdAt instanceof Date), true);
});

test('schedule contract remains wired through schema and server boundaries', () => {
    const schema = fs.readFileSync(path.join(serverRoot, 'prisma/schema.prisma'), 'utf8');
    const validation = fs.readFileSync(path.join(serverRoot, 'utils/validationSchemas.js'), 'utf8');
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    assert.match(schema, /model Lead[\s\S]*scheduledAt\s+DateTime\?/);
    assert.match(schema, /model Appointment[\s\S]*scheduledAt\s+DateTime\?/);
    assert.match(validation, /scheduledAt/);
    assert.match(source, /require\(['"]\.\/utils\/schedule['"]\)/);
    assert.match(source, /normalizeScheduledAt/);
    assert.match(source, /buildUpcomingSchedule/);
});

test('request, dashboard, and attendance screens distinguish scheduledAt from createdAt', () => {
    const repoRoot = path.resolve(serverRoot, '..');
    const leads = fs.readFileSync(path.join(repoRoot, 'src/pages/AdminLeads.tsx'), 'utf8');
    const dashboard = fs.readFileSync(path.join(repoRoot, 'src/pages/AdminDashboard.tsx'), 'utf8');
    const attendance = fs.readFileSync(path.join(repoRoot, 'src/pages/AdminAttendanceDetail.tsx'), 'utf8');
    const appointments = fs.readFileSync(path.join(repoRoot, 'src/pages/AdminAppointments.tsx'), 'utf8');

    assert.match(leads, /type=["']datetime-local["']/);
    assert.match(leads, /scheduledAt/);
    assert.match(dashboard, /upcomingSchedule/);
    assert.match(dashboard, /admin\/consultas\/new\?leadId=/);
    assert.match(attendance, /scheduledAt/);
    assert.match(attendance, /createdAt/);
    assert.match(appointments, /Agendado para/);
    assert.match(appointments, /Data clínica/);
    assert.match(appointments, /Criado em/);
    assert.match(appointments, /record\.createdAt/);
    assert.doesNotMatch(appointments, /Criado em \{formatDate\(record\.date\)\}/);
});

test('evolution classification uses appointmentType for clinical panels', () => {
    const repoRoot = path.resolve(serverRoot, '..');
    const timeline = fs.readFileSync(path.join(repoRoot, 'src/components/admin/attendance/EvolutionTimeline.tsx'), 'utf8');
    assert.match(timeline, /appointmentType === ['"]odontologia['"]/);
    assert.match(timeline, /appointmentType === ['"]harmonizacao['"]/);
    assert.match(timeline, /procedure/);
    assert.match(timeline, /Odontologia/);
    assert.match(timeline, /Harmonização Facial/);
    assert.doesNotMatch(timeline, /procedure === ['"]odontologia['"]|procedure === ['"]harmonizacao['"]/);
});
