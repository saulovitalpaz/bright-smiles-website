const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key_must_be_32_bytes_long!!'; // Must be 32 chars
const IV_LENGTH = 16; // For AES, this is always 16

function encrypt(text, deterministic = false) {
    if (!text) return text;
    
    let iv;
    if (deterministic) {
        // Create a deterministic IV based on the text 
        // Note: Deterministic encryption leaks equality patterns but allows searching
        iv = crypto.createHash('sha256').update(text).digest().subarray(0, IV_LENGTH);
    } else {
        iv = crypto.randomBytes(IV_LENGTH);
    }
    
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString('hex') + ':' + encrypted.toString('hex') + ':' + cipher.getAuthTag().toString('hex');
}

function decrypt(text) {
    if (!text) return text;
    if (!text.includes(':')) return text; // Not encrypted

    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.shift(), 'hex');
    const authTag = Buffer.from(textParts.shift(), 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
}

module.exports = { encrypt, decrypt };
