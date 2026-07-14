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

test('asset storage parses stable bucket references and rejects malformed ones', () => {
    const storage = require('../utils/assetStorage');

    assert.deepEqual(
        storage.parseAssetReference('bucket://public/gallery/hero image.png'),
        { scope: 'public', key: 'gallery/hero image.png' }
    );
    assert.deepEqual(
        storage.parseAssetReference('bucket://clinical/patients/42/x-ray.jpg'),
        { scope: 'clinical', key: 'patients/42/x-ray.jpg' }
    );

    for (const malformedReference of [
        '',
        'bucket://public',
        'bucket://public/',
        'bucket://private/patients/42/x-ray.jpg',
        'bucket:/clinical/patients/42/x-ray.jpg',
        '/clinical-assets?reference=bucket://clinical/patients/42/x-ray.jpg'
    ]) {
        assert.equal(
            storage.parseAssetReference(malformedReference),
            null,
            `expected ${malformedReference || '<empty>'} to be rejected`
        );
    }
});

test('asset storage generates stable encoded delivery paths', () => {
    const storage = require('../utils/assetStorage');

    assert.equal(
        storage.createAssetDeliveryPath('bucket://public/gallery/hero image.png'),
        '/assets?reference=bucket%3A%2F%2Fpublic%2Fgallery%2Fhero%20image.png'
    );
    assert.equal(
        storage.createAssetDeliveryPath('bucket://clinical/patients/42/scan #1.pdf'),
        '/clinical-assets?reference=bucket%3A%2F%2Fclinical%2Fpatients%2F42%2Fscan%20%231.pdf'
    );
});

test('asset storage validates delivery requests at the route boundary', () => {
    const storage = require('../utils/assetStorage');

    assert.deepEqual(
        storage.validateAssetDeliveryRequest({
            routeScope: 'public',
            reference: 'bucket://public/gallery/hero.png'
        }),
        {
            ok: true,
            reference: 'bucket://public/gallery/hero.png',
            parsed: { scope: 'public', key: 'gallery/hero.png' }
        }
    );

    assert.deepEqual(
        storage.validateAssetDeliveryRequest({
            routeScope: 'clinical',
            reference: 'bucket://public/gallery/hero.png'
        }),
        {
            ok: false,
            statusCode: 403,
            error: 'Clinical asset route accepts only clinical asset references.'
        }
    );

    assert.deepEqual(
        storage.validateAssetDeliveryRequest({
            routeScope: 'public',
            reference: 'not-a-reference'
        }),
        {
            ok: false,
            statusCode: 400,
            error: 'Invalid asset reference.'
        }
    );
});

test('asset storage cleanup helper deletes uploaded assets when response construction fails', async () => {
    const storage = require('../utils/assetStorage');
    const deletedReferences = [];

    await assert.rejects(
        storage.withAssetUploadCleanup({
            uploadedReference: 'bucket://clinical/patients/42/x-ray.jpg',
            run: async () => {
                throw new Error('response serialization failed');
            },
            cleanup: async (reference) => {
                deletedReferences.push(reference);
            }
        }),
        /response serialization failed/
    );

    assert.deepEqual(deletedReferences, ['bucket://clinical/patients/42/x-ray.jpg']);
});

test('clinical photo uploads use the private scope and documents expose legacy pdfUrl', () => {
    const repoRoot = path.resolve(serverRoot, '..');
    const gallery = fs.readFileSync(path.join(repoRoot, 'src/components/admin/attendance/PhotoGallery.tsx'), 'utf8');
    const indexSource = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    assert.match(gallery, /scope.*clinical|clinical.*scope/);
    assert.match(indexSource, /fileUrl:.*storageKey.*pdfUrl/);
    assert.match(indexSource, /clinical-assets/);
});
