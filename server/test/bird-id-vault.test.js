const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createBirdIdSessionVault } = require('../utils/birdIdSessionVault');

test('Bird ID envelopes bind owner and session and restore with the same independent key', () => {
    const env = { BIRD_ID_SESSION_KEY: crypto.randomBytes(32).toString('base64') };
    const vault = createBirdIdSessionVault(env);
    const payload = { verifier: 'synthetic', content: 'synthetic' };
    const sealed = vault.sealSession(1, 'session', payload);
    assert.deepEqual(createBirdIdSessionVault(env).openSession(1, 'session', sealed), payload);
    assert.throws(() => vault.openSession(2, 'session', sealed));
    assert.throws(() => vault.openSession(1, 'other', sealed));
    assert.throws(() => vault.openSession(1, 'session', sealed.slice(0, -6) + 'AAAAAA'));
    assert.throws(() => createBirdIdSessionVault({}).sealSession(1, 'session', payload));
    assert.throws(() => createBirdIdSessionVault({ ...env, DIGITAL_CERTIFICATE_KEY: env.BIRD_ID_SESSION_KEY }).sealSession(1, 'session', payload));
});
