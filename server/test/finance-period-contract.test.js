const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
    financeCumulativeWhere,
    financeStatsWhere,
    parseFinancePeriod,
    parseFinanceTransactionDate
} = require('../utils/financePeriod');

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
    assert.match(source.slice(source.indexOf("app.post('/finance'"), source.indexOf("app.put('/finance/:id'")), /paymentStatus\s*=\s*'received'/);
});

test('parseFinanceTransactionDate keeps YYYY-MM-DD at São Paulo midnight', () => {
    assert.equal(parseFinanceTransactionDate('2026-08-15').toISOString(), '2026-08-15T03:00:00.000Z');
});

test('parseFinanceTransactionDate rejects missing and malformed dates', () => {
    assert.throws(() => parseFinanceTransactionDate(), /date/i);
    assert.throws(() => parseFinanceTransactionDate('2026-02-31'), /date/i);
});

test('financeCumulativeWhere stops before the selected period', () => {
    const period = parseFinancePeriod({ month: '3', year: '2026' });

    assert.deepEqual(financeCumulativeWhere(period), { date: { lt: period.start } });
});

test('finance routes expose dated input and accounting totals', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../index.js'), 'utf8');
    const createRoute = source.slice(source.indexOf("app.post('/finance'"), source.indexOf("app.put('/finance/:id'"));
    const statsRoute = source.slice(source.indexOf("app.get('/finance/stats'"), source.indexOf('// NEW: NF-e'));

    assert.match(source, /parseFinanceTransactionDate/);
    assert.match(source, /data\.description\s*=.*null/);
    assert.match(statsRoute, /openingBalance/);
    assert.match(statsRoute, /closingBalance/);
});

test('finance schema keeps the legacy category while linking global categories', () => {
    const schema = fs.readFileSync(path.resolve(__dirname, '../prisma/schema.prisma'), 'utf8');

    assert.match(schema, /model FinanceCategory/);
    assert.match(schema, /name\s+String\s+@unique/);
    assert.match(schema, /categoryId\s+Int\?/);
    assert.match(schema, /categoryRef\s+FinanceCategory\?\s+@relation\(fields: \[categoryId\], references: \[id\], onDelete: Restrict\)/);
    assert.match(schema, /description\s+String\?/);
    assert.match(schema, /@@index\(\[categoryId\]\)/);
});

test('finance category routes are private with least-privilege roles', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../index.js'), 'utf8');
    const categoryRoutes = source.slice(source.indexOf("app.get('/finance/categories'"), source.indexOf("app.get('/finance'"));

    assert.match(categoryRoutes, /app\.get\('\/finance\/categories', authenticateToken, authorizeRole\(\['admin', 'manager'\]\)/);
    assert.match(categoryRoutes, /app\.post\('\/finance\/categories', authenticateToken, authorizeRole\(\['admin'\]\)/);
    assert.match(categoryRoutes, /app\.delete\('\/finance\/categories\/:id', authenticateToken, authorizeRole\(\['admin'\]\)/);
    assert.match(categoryRoutes, /category name/i);
    assert.match(categoryRoutes, /409/);
});

test('finance creation validates dated cash-flow input without raw database errors', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../index.js'), 'utf8');
    const createRoute = source.slice(source.indexOf("app.post('/finance'"), source.indexOf("app.put('/finance/:id'"));

    assert.match(createRoute, /validateFinanceTransactionInput/);
    assert.match(source, /Number\.isFinite/);
    assert.match(source, /\['income', 'expense'\]/);
    assert.match(source, /financeCategory\.findUnique/);
    assert.match(createRoute, /categoryId/);
    assert.match(source, /requestedCategoryId/);
    assert.doesNotMatch(createRoute, /error\.message/);
});

test('finance updates use the creation contract and safe fixed errors', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../index.js'), 'utf8');
    const updateRoute = source.slice(source.indexOf("app.put('/finance/:id'"), source.indexOf("app.delete('/finance/:id'"));
    const deleteRoute = source.slice(source.indexOf("app.delete('/finance/:id'"), source.indexOf("app.get('/finance/stats'"));

    assert.match(source, /const validateFinanceTransactionInput = async/);
    assert.match(updateRoute, /validateFinanceTransactionInput/);
    assert.match(updateRoute, /financeTransaction\.findUnique/);
    assert.match(source, /categoryId/);
    assert.match(updateRoute, /P2025/);
    assert.match(updateRoute, /P2002/);
    assert.doesNotMatch(updateRoute, /error\.message/);
    assert.match(deleteRoute, /P2025/);
    assert.doesNotMatch(deleteRoute, /error\.message/);
});

test('finance category deletion remains restrictive after the original migration', () => {
    const schema = fs.readFileSync(path.resolve(__dirname, '../prisma/schema.prisma'), 'utf8');
    const migration = fs.readFileSync(
        path.resolve(__dirname, '../prisma/migrations/20260909010000_restrict_finance_category_deletion/migration.sql'),
        'utf8'
    );

    assert.match(schema, /onDelete: Restrict/);
    assert.match(migration, /DROP CONSTRAINT "FinanceTransaction_categoryId_fkey"/);
    assert.match(migration, /ON DELETE RESTRICT ON UPDATE CASCADE/);
});

test('legacy finance categories are inserted without rewriting transactions and protected from deletion', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../index.js'), 'utf8');
    const deleteRoute = source.slice(source.indexOf("app.delete('/finance/categories/:id'"), source.indexOf("app.get('/finance'", source.indexOf("app.delete('/finance/categories/:id'")));
    const migration = fs.readFileSync(
        path.resolve(__dirname, '../prisma/migrations/20260909020000_backfill_legacy_finance_categories/migration.sql'),
        'utf8'
    );

    assert.match(migration, /INSERT INTO "FinanceCategory" \("name", "updatedAt"\)\s+SELECT DISTINCT TRIM\("category"\), CURRENT_TIMESTAMP/);
    assert.doesNotMatch(migration, /UPDATE\s+"FinanceTransaction"/i);
    assert.doesNotMatch(migration, /DELETE\s+FROM\s+"FinanceTransaction"/i);
    assert.match(deleteRoute, /financeCategory\.findUnique/);
    assert.match(deleteRoute, /financeTransaction\.count\(\{\s*where: \{ categoryId: id \}/);
    assert.match(deleteRoute, /prisma\.\$queryRaw`/);
    assert.match(deleteRoute, /"categoryId" IS NULL/);
    assert.match(deleteRoute, /TRIM\("category"\) = \$\{category\.name\}/);
    assert.match(deleteRoute, /const id = Number\(req\.params\.id\)/);
    assert.doesNotMatch(deleteRoute, /Number\.parseInt/);
});

test('finance migration preserves existing transactions and seeds Geral', () => {
    const migration = fs.readFileSync(
        path.resolve(__dirname, '../prisma/migrations/20260909000000_add_finance_categories_and_optional_description/migration.sql'),
        'utf8'
    );

    assert.match(migration, /CREATE TABLE "FinanceCategory"/);
    assert.match(migration, /ADD COLUMN "categoryId" INTEGER/);
    assert.match(migration, /DROP NOT NULL/);
    assert.match(migration, /ON DELETE SET NULL/);
    assert.match(migration, /INSERT INTO "FinanceCategory" \("name", "updatedAt"\) VALUES \('Geral', CURRENT_TIMESTAMP\) ON CONFLICT \("name"\) DO NOTHING/);
    assert.doesNotMatch(migration, /DELETE FROM "FinanceTransaction"/);
});
