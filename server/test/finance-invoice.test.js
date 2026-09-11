const test = require('node:test');
const assert = require('node:assert/strict');
const { createFinanceInvoiceHandler } = require('../routes/financeInvoice');

test('invoice upload and delivery deny anonymous and nonfinancial roles before accessing files', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const source = fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8');
    const declaration = (name) => {
        const start = source.indexOf(`const ${name} =`);
        return source.slice(start, source.indexOf('\n};', start) + 3);
    };
    const { authenticateToken, authorizeRole } = new Function('jwt', 'JWT_SECRET',
        `${declaration('authenticateToken')}\n${declaration('authorizeRole')}\nreturn { authenticateToken, authorizeRole };`
    )({ verify: (_token, _key, cb) => cb(null, { role: 'dentist' }) }, 'test-only');
    for (const route of ["app.post('/finance/nfe'", "app.get('/financial-assets'"]) {
        const routeSource = source.slice(source.indexOf(route), source.indexOf(route) + 110);
        assert.match(routeSource, /authenticateToken, authorizeRole\(\['admin', 'manager'\]\)/);
    }
    const response = { statusCode: 200, sendStatus(code) { this.statusCode = code; }, status(code) { this.statusCode = code; return this; }, json() {} };
    let nextCalled = false;
    authenticateToken({ headers: {}, cookies: {} }, response, () => { nextCalled = true; });
    assert.equal(response.statusCode, 401);
    assert.equal(nextCalled, false);
    authorizeRole(['admin', 'manager'])({ user: { role: 'dentist' } }, response, () => { nextCalled = true; });
    assert.equal(response.statusCode, 403);
    assert.equal(nextCalled, false);
    for (const role of ['admin', 'manager']) {
        nextCalled = false;
        authorizeRole(['admin', 'manager'])({ user: { role } }, response, () => { nextCalled = true; });
        assert.equal(nextCalled, true);
    }
});

function fixture(overrides = {}) {
    const row = { id: 1, type: 'income', paymentStatus: 'received', nfeUrl: null };
    const calls = { uploads: 0, updates: 0, deleted: [] };
    const prisma = { financeTransaction: {
        findUnique: async () => overrides.row === undefined ? row : overrides.row,
        updateMany: async ({ where, data }) => {
            calls.updates++;
            assert.equal(where.type, 'income');
            assert.deepEqual(where.paymentStatus, { not: 'voided' });
            assert.equal(where.nfeUrl, row.nfeUrl);
            if (overrides.databaseFailure) throw new Error('sensitive database detail');
            if (overrides.conflict) return { count: 0 };
            Object.assign(row, data);
            return { count: 1 };
        }
    } };
    const handler = createFinanceInvoiceHandler({ prisma,
        uploadAsset: async (data) => {
            calls.uploads++;
            assert.equal(data.scope, 'financial');
            assert.equal(data.ownerId, 3);
            if (overrides.storageFailure) throw new Error('sensitive storage detail');
            return { reference: 'bucket://financial/3/test.pdf' };
        },
        deleteAsset: async (reference) => calls.deleted.push(reference)
    });
    const req = { user: { id: 3 }, body: { transactionId: '1' }, file: {
        buffer: Buffer.from('%PDF-1.7\nsynthetic test document'), mimetype: 'application/pdf'
    } };
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    return { handler, req, res, row, calls };
}

test('links uploaded invoice to income and returns its private reference', async () => {
    const f = fixture();
    await f.handler(f.req, f.res);
    assert.equal(f.res.statusCode, 200);
    assert.equal(f.row.nfeUrl, 'bucket://financial/3/test.pdf');
    assert.equal(f.res.body.nfeUrl, f.row.nfeUrl);
    assert.deepEqual(f.calls.deleted, []);
});

test('rejects empty legacy confirmation, invalid IDs and forged document bytes before storage', async () => {
    for (const input of [
        { body: { transactionIds: [1], nfeUrl: '' }, file: undefined },
        { body: { transactionId: '1abc' } },
        { body: { transactionId: ['1'] } },
        { body: { transactionId: '0' } },
        { file: { buffer: Buffer.from('<script>bad</script>'), mimetype: 'application/pdf' } },
        { file: { buffer: Buffer.from('%PDF-1.7'), mimetype: 'text/html' } },
        { file: undefined }
    ]) {
        const f = fixture();
        await f.handler({ ...f.req, ...input }, f.res);
        assert.equal(f.res.statusCode, 400);
        assert.equal(f.calls.uploads, 0);
        assert.equal(f.calls.updates, 0);
    }
});

test('does not attach invoices to expenses, voided or nonexistent transactions', async () => {
    for (const [row, expected] of [[null, 404], [{ type: 'expense' }, 400], [{ type: 'income', paymentStatus: 'voided' }, 400]]) {
        const f = fixture({ row });
        await f.handler(f.req, f.res);
        assert.equal(f.res.statusCode, expected);
        assert.equal(f.calls.uploads, 0);
    }
});

test('cleans only the newly uploaded document on failed linkage and concurrent changes', async () => {
    for (const options of [{ databaseFailure: true }, { conflict: true }]) {
        const f = fixture(options);
        await f.handler(f.req, f.res);
        assert.equal(f.res.statusCode, options.conflict ? 409 : 500);
        assert.equal(f.row.nfeUrl, null);
        assert.deepEqual(f.calls.deleted, ['bucket://financial/3/test.pdf']);
        assert.doesNotMatch(JSON.stringify(f.res.body), /sensitive/);
    }
});

test('storage failure cannot mark a transaction as having an invoice', async () => {
    const f = fixture({ storageFailure: true });
    await f.handler(f.req, f.res);
    assert.equal(f.res.statusCode, 500);
    assert.equal(f.calls.updates, 0);
    assert.doesNotMatch(JSON.stringify(f.res.body), /sensitive/);
});
