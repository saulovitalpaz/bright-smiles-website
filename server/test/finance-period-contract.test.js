const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { parseFinancePeriod, financeStatsWhere } = require('../utils/financePeriod');

test('parseFinancePeriod uses São Paulo month boundaries with an exclusive end', () => {
    const period = parseFinancePeriod({ month: '3', year: '2026' });

    assert.equal(period.overview, false);
    assert.equal(period.start.toISOString(), '2026-03-01T03:00:00.000Z');
    assert.equal(period.endExclusive.toISOString(), '2026-04-01T03:00:00.000Z');
});

test('parseFinancePeriod supports explicit overview and rejects partial or invalid months', () => {
    assert.equal(parseFinancePeriod({}).overview, true);
    assert.throws(() => parseFinancePeriod({ month: '2' }), /month and year/i);
    assert.throws(() => parseFinancePeriod({ month: '13', year: '2026' }), /month/i);
    assert.throws(() => parseFinancePeriod({ month: '2', year: '20' }), /year/i);
});

test('finance stats distinguish realized and pending cash without counting voided rows', () => {
    assert.deepEqual(financeStatsWhere(parseFinancePeriod({})), {
        realizedIncome: { type: 'income', paymentStatus: { notIn: ['pending', 'voided'] } },
        pendingIncome: { type: 'income', paymentStatus: 'pending' },
        expense: { type: 'expense', paymentStatus: { not: 'voided' } }
    });
});

test('finance list and stats use the shared parser and remain private', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../index.js'), 'utf8');
    const financeRoute = source.slice(source.indexOf("app.get('/finance'"), source.indexOf("app.post('/finance'"));
    const statsRoute = source.slice(source.indexOf("app.get('/finance/stats'"), source.indexOf("// NEW: NF-e"));

    for (const route of [financeRoute, statsRoute]) {
        assert.match(route, /authenticateToken/);
        assert.match(route, /authorizeRole\(\['admin', 'manager'\]\)/);
        assert.match(route, /parseFinancePeriod\(req\.query\)/);
    }
    assert.match(statsRoute, /pendingIncome/);
    assert.match(statsRoute, /endExclusive/);
    assert.match(source.slice(source.indexOf("app.post('/finance'"), source.indexOf("app.put('/finance/:id'")), /paymentStatus:\s*'received'/);
});
