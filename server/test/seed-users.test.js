const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { buildSeedUsers } = require('../utils/seedUsers');
const { verifyPassword } = require('../utils/passwords');

test('seed users require explicit secrets without default credentials', async () => {
    await assert.rejects(buildSeedUsers({}), /SEED_SUPPORT_PASSWORD/);
    await assert.rejects(buildSeedUsers({ SEED_SUPPORT_PASSWORD: 'short' }), /SEED_SUPPORT_PASSWORD/);
});

test('seed users hash configured passwords before database insertion', async () => {
    const env = Object.fromEntries(['SUPPORT', 'ANA', 'CLARA', 'MANAGER'].map((key) => [
        `SEED_${key}_PASSWORD`, crypto.randomBytes(24).toString('base64url'),
    ]));
    const users = await buildSeedUsers(env);
    assert.equal(users.length, 4);
    for (const [index, password] of Object.values(env).entries()) {
        assert.notEqual(users[index].password, password);
        assert.deepEqual(await verifyPassword(password, users[index].password), { valid: true, needsUpgrade: false });
    }
});
