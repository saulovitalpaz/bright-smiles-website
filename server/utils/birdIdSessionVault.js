const crypto = require('node:crypto');

function createBirdIdSessionVault(env = process.env) {
    const encoded = env.BIRD_ID_SESSION_KEY || '';
    const key = Buffer.from(encoded, 'base64');
    const available = key.length === 32 && key.toString('base64') === encoded
        && encoded !== env.DIGITAL_CERTIFICATE_KEY;
    const aad = (userId, sessionId) => {
        if (!available || !Number.isSafeInteger(userId) || userId <= 0 || typeof sessionId !== 'string' || !sessionId || sessionId.length > 128) throw new Error('Bird ID vault unavailable.');
        return Buffer.from(JSON.stringify(['bird-id-session', 1, userId, sessionId]));
    };
    return {
        available,
        sealSession(userId, sessionId, payload) {
            const binding = aad(userId, sessionId);
            const iv = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
            cipher.setAAD(binding);
            const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
            return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
        },
        openSession(userId, sessionId, envelope) {
            const binding = aad(userId, sessionId);
            if (typeof envelope !== 'string' || envelope.length > 2000000) throw new Error('Invalid Bird ID envelope.');
            const bytes = Buffer.from(envelope, 'base64');
            if (bytes.length < 29 || bytes.toString('base64') !== envelope) throw new Error('Invalid Bird ID envelope.');
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
            decipher.setAAD(binding);
            decipher.setAuthTag(bytes.subarray(12, 28));
            return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8'));
        },
    };
}
module.exports = { createBirdIdSessionVault };
