const crypto = require('node:crypto');

function createCertificateVault(env = process.env) {
    const encoded = env.DIGITAL_CERTIFICATE_KEY || '';
    const key = Buffer.from(encoded, 'base64');
    const available = key.length === 32 && key.toString('base64') === encoded;
    function requireKey() { if (!available) throw new Error('Certificate vault unavailable.'); }
    return {
        available,
        seal(userId, value) {
            requireKey();
            const iv = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
            cipher.setAAD(Buffer.from(`digital-certificate:v1:${userId}`));
            const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
            return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
        },
        open(userId, value) {
            requireKey();
            const bytes = Buffer.from(value, 'base64');
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
            decipher.setAAD(Buffer.from(`digital-certificate:v1:${userId}`));
            decipher.setAuthTag(bytes.subarray(12, 28));
            return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8'));
        }
    };
}

function validCpf(value) {
    if (!/^\d{11}$/.test(value || '') || /^(\d)\1{10}$/.test(value)) return false;
    for (let digit = 9; digit <= 10; digit++) {
        let sum = 0;
        for (let index = 0; index < digit; index++) sum += Number(value[index]) * (digit + 1 - index);
        if (((sum * 10) % 11) % 10 !== Number(value[digit])) return false;
    }
    return true;
}

function validPkcs12(bytes) {
    if (!Buffer.isBuffer(bytes) || bytes.length < 5 || bytes.length > 1024 * 1024 || bytes[0] !== 0x30) return false;
    // PKCS#12 permits BER. This is only preflight; the isolated worker parses
    // the full structure strictly and verifies the key, identity and trust.
    if (bytes[1] === 0x80) return bytes.length >= 7 && bytes[2] === 2 && bytes[3] === 1 && bytes[4] === 3 && bytes[bytes.length - 2] === 0 && bytes[bytes.length - 1] === 0;
    let offset = 2;
    let length = bytes[1];
    if (length & 0x80) {
        const count = length & 0x7f;
        if (!count || count > 4 || bytes.length < count + 5) return false;
        length = 0;
        for (let index = 0; index < count; index++) length = length * 256 + bytes[offset++];
    }
    return offset + length === bytes.length && bytes[offset] === 2 && bytes[offset + 1] === 1 && bytes[offset + 2] === 3;
}

module.exports = { createCertificateVault, validCpf, validPkcs12 };
