const crypto = require('crypto');

const PRIMARY_IV_LENGTH = 12;
const LEGACY_IV_LENGTH = 16;

const invalidConfiguration = () => {
    throw new Error('Invalid encryption configuration.');
};

const decodeBase64Key = (value) => {
    if (typeof value !== 'string' || value.length === 0) invalidConfiguration();
    const key = Buffer.from(value, 'base64');
    if (key.length !== 32 || key.toString('base64') !== value) invalidConfiguration();
    return key;
};

const legacyKeyFromRaw = (value) => {
    if (typeof value !== 'string' || value.length === 0) return null;
    const key = Buffer.alloc(32);
    Buffer.from(value).copy(key);
    return key;
};

const decryptWithKey = ({ iv, ciphertext, authTag, key }) => {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString();
};

const normalizeCpf = (value) => String(value || '').replace(/\D/g, '');

function createEncryption(env = process.env) {
    const primaryKey = decodeBase64Key(env.ENCRYPTION_KEY);
    const indexKey = decodeBase64Key(env.PATIENT_INDEX_KEY);
    const legacyKey = legacyKeyFromRaw(env.LEGACY_ENCRYPTION_KEY);

    const encrypt = (value) => {
        if (!value) return value;
        const iv = crypto.randomBytes(PRIMARY_IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-gcm', primaryKey, iv);
        const ciphertext = Buffer.concat([cipher.update(String(value)), cipher.final()]);
        return `v2:${iv.toString('hex')}:${ciphertext.toString('hex')}:${cipher.getAuthTag().toString('hex')}`;
    };

    const decrypt = (value) => {
        if (!value || !String(value).includes(':')) return value;
        const parts = String(value).split(':');
        const version = parts.shift();
        try {
            if (version === 'v2' && parts.length === 3) {
                const [ivHex, ciphertextHex, tagHex] = parts;
                return decryptWithKey({
                    iv: Buffer.from(ivHex, 'hex'),
                    ciphertext: Buffer.from(ciphertextHex, 'hex'),
                    authTag: Buffer.from(tagHex, 'hex'),
                    key: primaryKey
                });
            }
            if (parts.length !== 2) throw new Error('invalid format');
            const [ciphertextHex, tagHex] = parts;
            const payload = {
                iv: Buffer.from(version, 'hex'),
                ciphertext: Buffer.from(ciphertextHex, 'hex'),
                authTag: Buffer.from(tagHex, 'hex')
            };
            if (payload.iv.length !== LEGACY_IV_LENGTH || !legacyKey) throw new Error('invalid legacy key');
            return decryptWithKey({ ...payload, key: legacyKey });
        } catch {
            throw new Error('Unable to decrypt protected value.');
        }
    };

    const blindIndex = (cpf) => crypto
        .createHmac('sha256', indexKey)
        .update(`patient-cpf-v1:${normalizeCpf(cpf)}`)
        .digest('hex');

    return {
        encrypt,
        decrypt,
        blindIndex,
        isPrimaryEncrypted: (value) => typeof value === 'string' && value.startsWith('v2:')
    };
}

module.exports = { createEncryption };
