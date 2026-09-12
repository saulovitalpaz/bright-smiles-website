const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('node:fs');
const vm = require('node:vm');
const { registerStockRoutes } = require('../routes/stock');
// Exercise the application's real auth middleware without starting its database/API.
const source = fs.readFileSync(require.resolve('../index.js'), 'utf8');
const authSource = source.slice(source.indexOf('const authenticateToken ='), source.indexOf("registerStockRoutes(app,"));
const auth = vm.runInNewContext(`${authSource}; ({ authenticateToken, authorizeRole })`, { jwt, JWT_SECRET: 'stock-test-only' });
async function withApi(prisma, run) {
    const app = express(); app.use(express.json()); app.use((req, _res, next) => { req.cookies = {}; next(); });
    registerStockRoutes(app, prisma, auth.authenticateToken, auth.authorizeRole);
    const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
    const request = (path, role, method = 'GET', body) => fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(role ? { Authorization: `Bearer ${jwt.sign({ id: 1, role }, 'stock-test-only')}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    try { await run(request); } finally { await new Promise(resolve => server.close(resolve)); }
}
test('every stock endpoint denies anonymous and manager requests before database access', async () => {
    await withApi({}, async request => {
        for (const [path, method] of [['/stock/products', 'GET'], ['/stock/products', 'POST'], ['/stock/products/p1', 'PUT'], ['/stock/products/p1/adjustments', 'POST'], ['/stock/products/p1/movements', 'GET']]) {
            assert.equal((await request(path, null, method, method === 'GET' ? undefined : {})).status, 401);
            assert.equal((await request(path, 'manager', method, method === 'GET' ? undefined : {})).status, 403);
        }
    });
});
test('authorized stock search serializes decimal values and bounds results', async () => {
    await withApi({ stockProduct: { findMany: async args => { assert.equal(args.take, 500); assert.equal(args.where.procedureType, 'filler'); return [{ id: 'p1', quantity: '1.5', concentration: null, price: '100' }]; } } }, async request => {
        const response = await request('/stock/products?procedureType=filler', 'dentist');
        assert.equal(response.status, 200); assert.deepEqual(await response.json(), [{ id: 'p1', quantity: 1.5, concentration: null, price: 100 }]);
    });
});
test('rejects invalid product and adjustment input without accessing database', async () => {
    await withApi({}, async request => {
        assert.equal((await request('/stock/products', 'admin', 'POST', { quantity: -1, product: {} })).status, 400);
        assert.equal((await request('/stock/products/p1/adjustments', 'admin', 'POST', { quantity: 0, reason: '' })).status, 400);
    });
});
test('appointment routes reconcile stock inside both save transactions', () => {
    const create = source.slice(source.indexOf("app.post('/appointments'"), source.indexOf("app.put('/appointments/:id'"));
    const update = source.slice(source.indexOf("app.put('/appointments/:id'"), source.indexOf("app.delete('/appointments/:id'"));
    for (const route of [create, update]) {
        assert.match(route, /prisma\.\$transaction/); assert.match(route, /await syncFacialStock\(tx, appointment, req\.user\.id\)/); assert.match(route, /error instanceof StockError/);
    }
});
