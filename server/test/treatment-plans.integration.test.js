const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { registerTreatmentPlanRoutes } = require('../routes/treatmentPlans');
const { registerClinicalConditionRoutes } = require('../routes/clinicalConditions');
const { syncAppointmentFinance } = require('../utils/appointmentFinance');
const source = fs.readFileSync(require.resolve('../index.js'), 'utf8');
const auth = vm.runInNewContext(`${source.slice(source.indexOf('const authenticateToken ='), source.indexOf('registerStockRoutes(app,'))}; ({ authenticateToken, authorizeRole })`, { jwt, JWT_SECRET: 'isolated-clinical-tests' });

async function api(prisma, userId, run) {
    const app = express();
    app.use(express.json()); app.use((req, _res, next) => { req.cookies = {}; next(); });
    const dependencies = { prisma, ...auth };
    registerTreatmentPlanRoutes(app, dependencies);
    registerClinicalConditionRoutes(app, dependencies);
    const deleteFinance = source.slice(source.indexOf("app.delete('/finance/:id'"), source.indexOf("app.get('/finance/stats'"));
    vm.runInNewContext(deleteFinance, { app, prisma, ...auth,
        parseFinanceTransactionId: value => { const id = Number(value); if (!Number.isSafeInteger(id) || id <= 0) throw Object.assign(new Error('invalid'), { statusCode: 400 }); return id; },
        isKnownPrismaError: (error, code) => error?.code === code,
    });
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const request = async (path, method = 'GET', body, role = 'admin') => {
        const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
            method, headers: { 'Content-Type': 'application/json', ...(role ? { Authorization: `Bearer ${jwt.sign({ id: userId, role }, 'isolated-clinical-tests')}` } : {}) },
            ...(body ? { body: JSON.stringify(body) } : {}),
        });
        return { status: response.status, body: await response.json().catch(() => null) };
    };
    try { await run(request); } finally { await new Promise(resolve => server.close(resolve)); }
}

test('all new routes deny anonymous and manager requests before database access', async () => {
    await api({}, 1, async request => {
        for (const [path, method] of [
            ['/clinical-procedures','GET'], ['/clinical-procedures','POST'], ['/clinical-procedures/1','PUT'],
            ['/treatment-plans','GET'], ['/treatment-plans','POST'], ['/treatment-plans/1','GET'], ['/treatment-plans/1','PUT'],
            ['/treatment-plans/1','DELETE'], ['/treatment-plans/1/authorization','POST'], ['/treatment-plans/1/payments','POST'], ['/treatment-plan-items/1/status','PATCH'], ['/patients/1/history','GET'],
            ['/clinical-conditions','GET'], ['/clinical-conditions','POST'], ['/clinical-conditions/carie','PUT'], ['/clinical-conditions/carie','DELETE'],
            ['/clinical-condition-groups','POST'], ['/clinical-condition-groups/achado','PUT'], ['/clinical-condition-groups/achado','DELETE'],
        ]) {
            assert.equal((await request(path, method, undefined, null)).status, 401, path);
            assert.equal((await request(path, method, undefined, 'manager')).status, 403, path);
        }
        assert.equal((await request('/clinical-conditions', 'POST', {}, 'dentist')).status, 403);
        assert.equal((await request('/treatment-plans/no-id')).status, 400);
        assert.equal((await request('/patients/2147483648/history')).status, 400);
    });
});

const databaseUrl = process.env.TREATMENT_TEST_DATABASE_URL;
test('PostgreSQL: catalog, IDs, partial approval, clinical execution, cash receipts and legacy finance', { skip: !databaseUrl }, async () => {
    const url = new URL(databaseUrl);
    assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname) && url.pathname.startsWith('/upgrade_'), 'Use an isolated local upgrade_* database only');
    const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    const suffix = randomUUID();
    try {
        const user = await prisma.user.create({ data: { username: `test-${suffix}`, password: 'unusable-test-hash', name: 'Fictitious clinician' } });
        const patient = await prisma.patient.create({ data: { name: 'Fictitious patient', cpf: `fiction-${suffix}` } });
        const other = await prisma.patient.create({ data: { name: 'Other fixture', cpf: `other-${suffix}` } });
        const appointment = await prisma.appointment.create({ data: { patientId: patient.id, patientName: patient.name, date: new Date(), scheduledAt: new Date(Date.now() + 3600000), procedure: 'Fixture consultation', professional: 'Fixture', notes: '', price: 50, paymentStatus: 'pending' } });
        await prisma.appointment.create({ data: { patientId: patient.id, patientName: patient.name, date: new Date(), scheduledAt: new Date(Date.now() + 7200000), procedure: 'Later fixture', professional: 'Fixture', notes: '' } });
        await prisma.$transaction(tx => syncAppointmentFinance(tx, appointment));
        await api(prisma, user.id, async request => {
            const groups = await request('/clinical-conditions'); assert.equal(groups.status, 200);
            assert.ok(groups.body.some(group => group.key === 'achado'));
            const group = await request('/clinical-condition-groups', 'POST', { name: 'Fixture group', active: true }); assert.equal(group.status, 201);
            const condition = await request('/clinical-conditions', 'POST', { name: 'Fixture finding', active: true, groupKey: group.body.key }); assert.equal(condition.status, 201);
            assert.equal((await request('/clinical-conditions', 'POST', { name: 'Invalid', active: true, groupKey: 'missing' })).status, 400);
            const procedure = await request('/clinical-procedures', 'POST', { name: 'Fixture restoration', category: 'Dentística', pricingUnit: 'procedure', price: 100, conditionTypes: [condition.body.key] }); assert.equal(procedure.status, 201);
            const item = { procedureId: procedure.body.id, name: 'Fixture restoration', category: 'Dentística', pricingUnit: 'procedure', unitPrice: 100, quantity: 1, phase: 'mouth_adjustment', toothNumber: 16, conditionType: condition.body.key, targets: [{ kind: 'tooth' }] };
            const payload = { patientId: patient.id, sourceAppointmentId: appointment.id, items: [item, { ...item, toothNumber: 17 }] };
            assert.equal((await request('/treatment-plans', 'POST', { ...payload, patientId: other.id })).status, 400);
            assert.equal((await request('/treatment-plans', 'POST', { ...payload, items: [{ ...item, procedureId: 2147483647 }] })).status, 400);
            const created = await request('/treatment-plans', 'POST', payload); assert.equal(created.status, 201);
            const planId = created.body.id;
            const base = `/treatment-plans/${planId}`;
            assert.equal(created.body.patient.id, patient.id);
            assert.equal(created.body.patientNumber, 1);
            const otherPlan = await request('/treatment-plans', 'POST', { patientId: other.id, items: [item] });
            assert.equal(otherPlan.status, 201);
            assert.equal(otherPlan.body.patientNumber, 1);
            const nextPlan = await request('/treatment-plans', 'POST', { patientId: patient.id, items: [item] });
            assert.equal(nextPlan.body.patientNumber, 2);
            assert.equal((await request(`/treatment-plans/${nextPlan.body.id}`, 'DELETE')).status, 204);
            const afterDelete = await request('/treatment-plans', 'POST', { patientId: patient.id, items: [item] });
            assert.equal(afterDelete.body.patientNumber, 3);
            assert.equal((await request(`/treatment-plans/${afterDelete.body.id}`, 'DELETE')).status, 204);
            assert.equal(await prisma.financeTransaction.count({ where: { patientId: patient.id } }), 1, 'saving a quote creates no cash entry');
            const edited = await request(base, 'PUT', { items: payload.items, notes: 'Fixture note' }); assert.equal(edited.status, 200);
            const [first, second] = edited.body.items;
            assert.equal((await request(base + '/authorization', 'POST', { items: [{ itemId: 2147483647, authorized: true }] })).status, 400);
            assert.equal((await request(base + '/authorization', 'POST', { items: [{ itemId: first.id, authorized: true, authorizedTotal: 101 }] })).status, 400);
            assert.equal((await request(`/treatment-plan-items/${first.id}/status`, 'PATCH', { status: 'completed' })).status, 409);
            const partial = await request(base + '/authorization', 'POST', { items: [{ itemId: first.id, authorized: true, authorizedTotal: 80 }, { itemId: second.id, authorized: false }] });
            assert.equal(partial.status, 200); assert.equal(partial.body.status, 'partially_authorized'); assert.equal(partial.body.totals.balance, 80);
            assert.equal((await request(base, 'PUT', { items: payload.items })).status, 409);
            const payment = { amount: 30, method: 'pix', idempotencyKey: randomUUID() };
            assert.equal((await request(base + '/payments', 'POST', payment)).status, 201);
            assert.equal((await request(base, 'DELETE')).status, 409);
            const repeated = await request(base + '/payments', 'POST', payment); assert.equal(repeated.status, 200); assert.equal(repeated.body.repeated, true);
            assert.equal((await request(base + '/payments', 'POST', { ...payment, amount: 31 })).status, 409);
            assert.equal((await request(base + '/payments', 'POST', { ...payment, amount: 51, idempotencyKey: randomUUID() })).status, 400);
            const concurrent = await Promise.all([1, 2].map(() => request(base + '/payments', 'POST', { amount: 40, method: 'pix', idempotencyKey: randomUUID() })));
            assert.equal(concurrent.filter(result => result.status === 201).length, 1);
            assert.ok(concurrent.every(result => [201, 400, 409].includes(result.status)));
            assert.equal((await request(`/treatment-plan-items/${first.id}/status`, 'PATCH', { status: 'completed' })).status, 200);
            assert.equal((await request(`/treatment-plan-items/${first.id}/status`, 'PATCH', { status: 'in_progress' })).status, 409);
            assert.equal((await request(base + '/authorization', 'POST', { items: [{ itemId: second.id, authorized: true }] })).body.status, 'authorized');
            const detail = await request(base); assert.equal(detail.body.totals.balance, 110);
            const linked = await prisma.financeTransaction.findMany({ where: { treatmentPlanPayment: { planId } } });
            assert.equal(linked.length, 2); assert.ok(linked.every(entry => entry.patientId === patient.id && entry.appointmentId === null && entry.paymentStatus === 'received'));
            await prisma.$transaction(tx => syncAppointmentFinance(tx, { ...appointment, paymentStatus: 'received' }));
            const history = await request(`/patients/${patient.id}/history`); assert.equal(history.status, 200); assert.equal(history.body.nextAppointment.id, appointment.id);
            assert.equal(history.body.financialSummary.received, 120); assert.equal(history.body.financialSummary.totalReceivable, 110);
            assert.equal((await request(`/clinical-conditions/${condition.body.key}`, 'DELETE')).status, 204);
            assert.equal((await prisma.clinicalConditionDefinition.findUnique({ where: { key: condition.body.key } })).active, false);
            assert.equal((await request(base)).body.items[0].conditionType, condition.body.key);
            await assert.rejects(prisma.treatmentPlanPayment.create({ data: { planId: 2147483647, createdById: user.id, amount: 1, method: 'pix', idempotencyKey: randomUUID() } }), { code: 'P2003' });
            await assert.rejects(prisma.patient.delete({ where: { id: patient.id } }), { code: 'P2003' });
            assert.equal((await request(`/finance/${linked[0].id}`, 'DELETE', undefined, null)).status, 401);
            assert.equal((await request(`/finance/${linked[0].id}`, 'DELETE', undefined, 'manager')).status, 200);
            const afterRemoval = await request(base);
            assert.equal(afterRemoval.body.totals.received, 70 - Number(linked[0].amount));
            assert.equal(afterRemoval.body.totals.balance, 110 + Number(linked[0].amount));
            assert.equal(await prisma.treatmentPlanPayment.findUnique({ where: { id: linked[0].treatmentPlanPaymentId } }), null);
            assert.equal((await request(`/finance/${linked[1].id}`, 'DELETE')).status, 200);
            assert.equal((await request(base, 'DELETE')).status, 204);
        });
    } finally { await prisma.$disconnect(); }
});
