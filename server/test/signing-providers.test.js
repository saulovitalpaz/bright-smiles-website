const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeProvider, providerAvailability } = require('../services/signingProviders');

test('legacy requests remain A1 and unsupported methods fail closed', () => {
    assert.equal(normalizeProvider(undefined), 'A1');
    assert.equal(normalizeProvider('BIRD_ID'), 'BIRD_ID');
    assert.throws(() => normalizeProvider('OTHER'));
});
test('unverified Bird ID contracts cannot enable signing or expose secrets', () => {
    const result = providerAvailability({ BIRD_ID_ENABLED: 'true', BIRD_ID_CLIENT_SECRET: 'synthetic-secret' }, true);
    assert.equal(result[0].available, true);
    assert.equal(result[1].available, false);
    assert.equal(JSON.stringify(result).includes('synthetic-secret'), false);
});
