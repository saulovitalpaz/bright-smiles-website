const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const PREFIX = 'scrypt';

async function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const derivedKey = await scrypt(password, salt, KEY_LENGTH);
    return `${PREFIX}$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

function timingSafeTextMatch(left, right) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return leftBuffer.length === rightBuffer.length
        && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

async function verifyPassword(candidate, storedPassword) {
    if (typeof candidate !== 'string' || typeof storedPassword !== 'string') {
        return { valid: false, needsUpgrade: false };
    }

    if (!storedPassword.startsWith(`${PREFIX}$`)) {
        const valid = timingSafeTextMatch(candidate, storedPassword);
        return { valid, needsUpgrade: valid };
    }

    const [, saltHex, keyHex, ...extra] = storedPassword.split('$');
    if (extra.length || !/^[a-f0-9]{32}$/i.test(saltHex || '') || !/^[a-f0-9]{128}$/i.test(keyHex || '')) {
        return { valid: false, needsUpgrade: false };
    }

    const expectedKey = Buffer.from(keyHex, 'hex');
    const derivedKey = await scrypt(candidate, Buffer.from(saltHex, 'hex'), KEY_LENGTH);
    return {
        valid: crypto.timingSafeEqual(expectedKey, derivedKey),
        needsUpgrade: false
    };
}

module.exports = { hashPassword, verifyPassword };
