const test = require('node:test');
const assert = require('node:assert/strict');
const { readProfessionalSignature } = require('../utils/assetStorage');

test('signature reads reject external URLs, other owners and traversal before accessing storage', async () => {
    for (const reference of [
        'https://example.invalid/signature.png',
        'file:///signature.png',
        'bucket://public/2/signature.png',
        'bucket://clinical/1/signature.png',
        'bucket://public/1/../2/signature.png',
        'bucket://public/1/signature.svg',
    ]) {
        await assert.rejects(readProfessionalSignature(reference, 1), /Invalid professional signature reference/);
    }
});
