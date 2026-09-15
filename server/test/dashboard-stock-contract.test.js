const test = require('node:test');
const assert = require('node:assert/strict');

const { createDashboardStatsHandler } = require('../routes/dashboard');

const createResponse = () => ({
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
});

test('dashboard includes only active stock products in its recent list and total value', async () => {
    let stockQuery;
    const prisma = {
        user: { count: async () => 0 },
        appointment: {
            count: async () => 0,
            findMany: async () => []
        },
        lead: { count: async () => 0, findMany: async () => [] },
        testimonial: { count: async () => 0, findMany: async () => [] },
        stockProduct: {
            findMany: async (query) => {
                stockQuery = query;
                const products = [
                    { id: 'active', name: 'Produto ativo', quantity: 2, stockUnit: 'ml', price: 10, reconstitutedAt: null },
                    { id: 'inactive', name: 'Produto inativo', quantity: 100, stockUnit: 'ml', price: 999, reconstitutedAt: null }
                ];
                return query.where?.active === true ? products.filter(product => product.id === 'active') : products;
            }
        }
    };
    const handler = createDashboardStatsHandler(prisma, () => []);
    const res = createResponse();

    await handler({ user: { role: 'admin' } }, res);

    assert.deepEqual(stockQuery.where, { active: true });
    assert.deepEqual(res.body.recentStock.map(product => product.id), ['active']);
    assert.equal(res.body.stockTotalValue, 20);
});
