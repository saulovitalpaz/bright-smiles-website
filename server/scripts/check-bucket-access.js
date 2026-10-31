const { createPublicAssetUrl } = require('../utils/assetStorage');

async function checkBucketAccess(reference, { sign = createPublicAssetUrl, request = fetch } = {}) {
    if (typeof reference !== 'string' || reference.length > 2048 || !/^bucket:\/\/public\/.+/.test(reference)) {
        return { ok: false, code: 'PUBLIC_REFERENCE_REQUIRED' };
    }
    let url;
    try { url = await sign(reference); }
    catch { return { ok: false, code: 'BUCKET_SIGNING_FAILED' }; }
    try {
        // A signed GET must be checked with GET, not HEAD. Never print the URL.
        const response = await request(url, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(15000) });
        await response.body?.cancel();
        const ok = response.status === 200;
        const code = ok ? 'BUCKET_ACCESS_OK' : [401, 403].includes(response.status) ? 'BUCKET_ACCESS_DENIED' : response.status === 404 ? 'BUCKET_OBJECT_NOT_FOUND' : 'BUCKET_HTTP_ERROR';
        return { ok, code, httpStatus: response.status };
    } catch { return { ok: false, code: 'BUCKET_REQUEST_FAILED' }; }
}

if (require.main === module) {
    checkBucketAccess(process.env.BUCKET_CHECK_PUBLIC_REFERENCE).then(result => {
        console.log(JSON.stringify(result));
        process.exitCode = result.ok ? 0 : 1;
    }).catch(() => {
        console.log(JSON.stringify({ ok: false, code: 'BUCKET_CHECK_FAILED' }));
        process.exitCode = 1;
    });
}

module.exports = { checkBucketAccess };
