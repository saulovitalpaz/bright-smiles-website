const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const storage = require('../utils/assetStorage');
const {
    isSupportedUpload,
    isSupportedUploadForScope
} = require('../utils/uploadValidation');

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')]);
const pdf = Buffer.from('%PDF-1.7\n');
const mp4 = Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x18]), Buffer.from('ftypisom')]);
const quicktime = Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x18]), Buffer.from('ftypqt  ')]);
const webm = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x93, 0x42, 0x82, 0x88]);

test('financial references have their own stable private delivery route', () => {
    const reference = 'bucket://financial/3/receipt.pdf';

    assert.equal(storage.isAssetReference(reference), true);
    assert.deepEqual(storage.parseAssetReference(reference), {
        scope: 'financial',
        key: '3/receipt.pdf'
    });
    assert.equal(
        storage.createAssetDeliveryPath(reference),
        '/financial-assets?reference=bucket%3A%2F%2Ffinancial%2F3%2Freceipt.pdf'
    );
});

test('upload validation requires matching binary signatures', () => {
    assert.equal(isSupportedUpload(jpeg, 'image/jpeg'), true);
    assert.equal(isSupportedUpload(png, 'image/png'), true);
    assert.equal(isSupportedUpload(webp, 'image/webp'), true);
    assert.equal(isSupportedUpload(pdf, 'application/pdf'), true);
    assert.equal(isSupportedUpload(mp4, 'video/mp4'), true);
    assert.equal(isSupportedUpload(quicktime, 'video/quicktime'), true);
    assert.equal(isSupportedUpload(webm, 'video/webm'), true);

    assert.equal(isSupportedUpload(Buffer.from('not an image'), 'image/jpeg'), false);
    assert.equal(isSupportedUpload(Buffer.from('not a PDF'), 'application/pdf'), false);
    assert.equal(isSupportedUpload(pdf, 'image/png'), false);
});

test('upload scopes allow only the content appropriate to their audience', () => {
    assert.equal(isSupportedUploadForScope('public', jpeg, 'image/jpeg'), true);
    assert.equal(isSupportedUploadForScope('public', mp4, 'video/mp4'), true);
    assert.equal(isSupportedUploadForScope('public', pdf, 'application/pdf'), false);

    assert.equal(isSupportedUploadForScope('clinical', png, 'image/png'), true);
    assert.equal(isSupportedUploadForScope('clinical', pdf, 'application/pdf'), false);
    assert.equal(isSupportedUploadForScope('clinical', mp4, 'video/mp4'), false);

    assert.equal(isSupportedUploadForScope('financial', pdf, 'application/pdf'), true);
    assert.equal(isSupportedUploadForScope('financial', webp, 'image/webp'), true);
    assert.equal(isSupportedUploadForScope('financial', webm, 'video/webm'), false);
});

test('backend keeps financial and clinical upload authorization separate', () => {
    const indexSource = fs.readFileSync(path.resolve(__dirname, '../index.js'), 'utf8');
    const generalUploadRoute = indexSource.slice(
        indexSource.indexOf("app.post('/upload'"),
        indexSource.indexOf("app.post('/upload/signature'")
    );
    const patientPdfRoute = indexSource.slice(
        indexSource.indexOf("app.post('/patient-documents/:id/file'"),
        indexSource.indexOf("app.get('/patient-documents/:id/file'")
    );

    assert.match(indexSource, /require\(['"]\.\/utils\/uploadValidation['"]\)/);
    assert.match(generalUploadRoute, /isSupportedUploadForScope\(scope, req\.file\.buffer, req\.file\.mimetype\)/);
    assert.match(indexSource, /app\.post\('\/financial-assets', authenticateToken, authorizeRole\(\['admin', 'manager'\]\)/);
    assert.match(indexSource, /app\.get\('\/financial-assets', authenticateToken, authorizeRole\(\['admin', 'manager'\]\)/);
    assert.match(patientPdfRoute, /previousStorageKey/);
    assert.match(patientPdfRoute, /await deletePatientDocument\(previousStorageKey\)/);
});

test('attendance uploads use unique object keys and append each completed clinical photo', () => {
    const storageSource = fs.readFileSync(path.resolve(__dirname, '../utils/assetStorage.js'), 'utf8');
    const gallerySource = fs.readFileSync(
        path.resolve(__dirname, '../../src/components/admin/attendance/PhotoGallery.tsx'),
        'utf8'
    );

    assert.match(storageSource, /\$\{Date\.now\(\)\}-\$\{crypto\.randomUUID\(\)\}/);
    assert.match(gallerySource, /onChange\(\[\.\.\.photos, data\.reference\]\)/);
    assert.match(gallerySource, /disabled=\{uploading\}/);
});

test('Cloudinary is not an active server dependency', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
    const indexSource = fs.readFileSync(path.resolve(__dirname, '../index.js'), 'utf8');

    assert.equal(packageJson.dependencies.cloudinary, undefined);
    assert.equal(packageJson.dependencies['multer-storage-cloudinary'], undefined);
    assert.doesNotMatch(indexSource, /cloudinary/i);
});
