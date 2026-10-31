const test = require('node:test');
const assert = require('node:assert/strict');
const { checkBucketAccess } = require('../scripts/check-bucket-access');
const reference = 'bucket://public/fixture/logo.png';

test('bucket check performs GET against a newly signed URL and releases the response', async () => {
    let cancelled = false;
    const result = await checkBucketAccess(reference, {
        sign: async value => { assert.equal(value, reference); return 'https://storage.invalid/fixture?signature=synthetic'; },
        request: async (url, options) => {
            assert.equal(url, 'https://storage.invalid/fixture?signature=synthetic');
            assert.equal(options.method, 'GET');
            assert.equal(options.redirect, 'error');
            return { status: 200, body: { cancel: async () => { cancelled = true; } } };
        },
    });
    assert.deepEqual(result, { ok: true, code: 'BUCKET_ACCESS_OK', httpStatus: 200 });
    assert.equal(cancelled, true);
});

test('bucket check detects rejected signatures without exposing the URL or credentials', async () => {
    const result = await checkBucketAccess(reference, {
        sign: async () => 'https://storage.invalid/?signature=private',
        request: async () => ({ status: 403, body: { cancel: async () => {} } }),
    });
    assert.deepEqual(result, { ok: false, code: 'BUCKET_ACCESS_DENIED', httpStatus: 403 });
    assert.equal(JSON.stringify(result).includes('private'), false);
});

test('bucket check rejects private references and sanitizes signing and network failures', async () => {
    for (const value of ['bucket://clinical/fixture.png', 'bucket://financial/fixture.png', 'https://example.invalid', '']) {
        assert.deepEqual(await checkBucketAccess(value, { sign: async () => { throw Error('must not run'); } }), { ok: false, code: 'PUBLIC_REFERENCE_REQUIRED' });
    }
    assert.deepEqual(await checkBucketAccess(reference, { sign: async () => { throw Error('secret'); } }), { ok: false, code: 'BUCKET_SIGNING_FAILED' });
    assert.deepEqual(await checkBucketAccess(reference, { sign: async () => 'https://storage.invalid', request: async () => { throw Error('secret'); } }), { ok: false, code: 'BUCKET_REQUEST_FAILED' });
});
