const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const { createEncryption } = require('../utils/encryption');

const key = (fill) => Buffer.alloc(32, fill).toString('base64');
const legacyRaw = 'legacy-key-used-by-the-previous-release';

const encryptLegacy = (value) => {
    const legacyKey = Buffer.alloc(32);
    Buffer.from(legacyRaw).copy(legacyKey);
    const iv = crypto.createHash('sha256').update(value).digest().subarray(0, 16);
    const cipher = crypto.createCipheriv('aes-256-gcm', legacyKey, iv);
    const encrypted = Buffer.concat([cipher.update(value), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}:${cipher.getAuthTag().toString('hex')}`;
};

test('uses randomized versioned encryption and a stable normalized CPF blind index', () => {
    const encryption = createEncryption({
        ENCRYPTION_KEY: key(1),
        LEGACY_ENCRYPTION_KEY: legacyRaw,
        PATIENT_INDEX_KEY: key(2)
    });

    const first = encryption.encrypt('histórico clínico');
    const second = encryption.encrypt('histórico clínico');
    assert.match(first, /^v2:[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
    assert.notEqual(first, second);
    assert.equal(encryption.decrypt(first), 'histórico clínico');
    assert.equal(encryption.blindIndex('123.456.789-00'), encryption.blindIndex('12345678900'));
    assert.notEqual(encryption.blindIndex('12345678900'), encryption.blindIndex('12345678901'));
});

test('decrypts legacy ciphertext only with an explicitly supplied legacy key', () => {
    const legacyCiphertext = encryptLegacy('12345678900');
    const encryption = createEncryption({
        ENCRYPTION_KEY: key(3),
        LEGACY_ENCRYPTION_KEY: legacyRaw,
        PATIENT_INDEX_KEY: key(4)
    });
    assert.equal(encryption.decrypt(legacyCiphertext), '12345678900');
    assert.throws(
        () => createEncryption({ ENCRYPTION_KEY: key(3), PATIENT_INDEX_KEY: key(4) }).decrypt(legacyCiphertext),
        /Unable to decrypt protected value/,
    );
});

test('rejects absent or malformed primary encryption and index keys', () => {
    assert.throws(
        () => createEncryption({ ENCRYPTION_KEY: 'not-a-valid-key', PATIENT_INDEX_KEY: key(5) }),
        /Invalid encryption configuration/,
    );
    assert.throws(
        () => createEncryption({ ENCRYPTION_KEY: key(5) }),
        /Invalid encryption configuration/,
    );
});
