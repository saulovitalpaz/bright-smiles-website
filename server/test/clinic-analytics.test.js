const test = require('node:test');
const assert = require('node:assert/strict');
const { createClinicAnalyticsHandler } = require('../routes/clinicAnalytics');

test('validates periods before querying sensitive data', async () => {
  const handler = createClinicAnalyticsHandler({});
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await handler({ query: { start: '2026-02-30', end: '2026-03-01' }, user: { role: 'admin' } }, res);
  assert.equal(res.code, 400);
});

test('manager receives finance aggregates without querying clinical data', async () => {
  const calls = [];
  const prisma = { financeTransaction: { groupBy: async (args) => { calls.push(args); return [{ type: 'income', category: 'Consulta', paymentStatus: 'paid', _count: { _all: 2 }, _sum: { amount: 100 } }]; } }, analyticsEvent: { count: async () => 7 }, lead: { count: async () => 2 } };
  const res = { json(body) { this.body = body; return this; }, status(code) { this.code = code; return this; } };
  await createClinicAnalyticsHandler(prisma)({ query: {}, user: { role: 'manager' } }, res);
  assert.equal(res.body.clinic, null);
  assert.equal(res.body.finance.income.total, 100);
  assert.equal(res.body.finance.income.count, 2);
  assert.equal(calls.length, 1);
});

test('admin aggregates clinical and financial groups with inclusive period boundaries', async () => {
  const queries = {};
  const prisma = {
    financeTransaction: { groupBy: async args => { queries.finance = args; return [
      {type:'income', category:'Consulta', paymentStatus:'paid', _count:{_all:2}, _sum:{amount:200}},
      {type:'income', category:'Consulta', paymentStatus:'pending', _count:{_all:1}, _sum:{amount:50}},
      {type:'expense', category:'Material', paymentStatus:'paid', _count:{_all:1}, _sum:{amount:30}},
      {type:'expense', category:'Material', paymentStatus:'voided', _count:{_all:1}, _sum:{amount:99}}
    ]; } },
    analyticsEvent: {count: async () => 4}, lead: {count: async () => 1},
    appointment: { groupBy: async args => { queries[args.by[0]] = args; return args.by[0] === 'status' ? [{status:'attended', appointmentType:'odontologia', _count:{_all:3}}] : [{procedure:'Limpeza', _count:{_all:3}}]; } },
    treatmentPlanItem: {groupBy: async args => { queries.treatments = args; return [{name:'Restauração', _count:{_all:2}}]; }},
    patient: {count: async () => 5},
    treatmentPlan: {count: async args => args.where.status === 'authorized' ? 2 : 6}
  };
  const res = { json(body) { this.body=body; return this; }, status(code) { this.code=code; return this; } };
  await createClinicAnalyticsHandler(prisma)({query:{start:'2026-05-01', end:'2026-05-31'}, user:{role:'admin'}}, res);
  assert.equal(queries.finance.where.date.gte.toISOString(), '2026-05-01T03:00:00.000Z');
  assert.equal(queries.finance.where.date.lt.toISOString(), '2026-06-01T03:00:00.000Z');
  assert.equal(res.body.clinic.patients, 5);
  assert.deepEqual(res.body.clinic.plans, { pending: 4, completed: 2 });
  assert.deepEqual(res.body.clinic.treatments, [{name:'Restauração', count:2}]);
  assert.equal(res.body.finance.income.total, 200);
  assert.equal(res.body.finance.pending.total, 50);
  assert.equal(res.body.finance.expense.total, 30);
});
