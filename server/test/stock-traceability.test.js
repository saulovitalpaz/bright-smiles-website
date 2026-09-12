const test = require('node:test');
const assert = require('node:assert/strict');
const { stockProductSchema } = require('../utils/facialStock');
const product = { name: 'Produto fictício', procedureType: 'filler', stockUnit: 'ml', concentration: null, price: 100 };

test('stock accepts optional batch and valid calendar date, preserves omission and supports clearing', () => {
    assert.equal(stockProductSchema.parse({ ...product, batch: ' LOTE-TESTE ', reconstitutedAt: '2026-09-12' }).batch, 'LOTE-TESTE');
    assert.equal(stockProductSchema.parse({ ...product, reconstitutedAt: '2026-09-12' }).reconstitutedAt.toISOString(), '2026-09-12T00:00:00.000Z');
    assert.equal(Object.hasOwn(stockProductSchema.parse(product), 'batch'), false);
    assert.equal(stockProductSchema.parse({ ...product, batch: null, reconstitutedAt: null }).reconstitutedAt, null);
});

test('stock rejects invalid calendar dates and unsafe or oversized batch identifiers', () => {
    for (const reconstitutedAt of ['2026-02-30', '2026-13-01', 'invalid', '2026-09-12T12:00:00Z']) {
        assert.equal(stockProductSchema.safeParse({ ...product, reconstitutedAt }).success, false);
    }
    for (const batch of ['<script>', 'x'.repeat(101)]) assert.equal(stockProductSchema.safeParse({ ...product, batch }).success, false);
});
