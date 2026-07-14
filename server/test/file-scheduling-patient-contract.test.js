const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.resolve(__dirname, '..');

test('general uploads use bucket storage and expose separate public/private delivery routes', () => {
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    assert.match(source, /require\(['"]\.\/utils\/assetStorage['"]\)/);
    assert.match(source, /app\.post\(['"]\/upload['"]/);
    assert.match(source, /app\.get\(['"]\/assets/);
    assert.match(source, /app\.get\(['"]\/clinical-assets/);
    assert.match(source, /authenticateToken/);
    assert.doesNotMatch(
        source.slice(source.indexOf("app.post('/upload'"), source.indexOf("app.post('/patient-documents")),
        /CloudinaryStorage/
    );
});

test('asset storage exports stable reference and signed URL helpers', () => {
    const storage = require('../utils/assetStorage');
    assert.equal(typeof storage.uploadAsset, 'function');
    assert.equal(typeof storage.createPublicAssetUrl, 'function');
    assert.equal(typeof storage.createPrivateAssetUrl, 'function');
    assert.equal(storage.isAssetReference('bucket://clinical/appointments/1/a.jpg'), true);
    assert.equal(storage.isAssetReference('/images/logo-oficial.png'), false);
});
