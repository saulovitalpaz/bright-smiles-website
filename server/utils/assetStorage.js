const crypto = require('crypto');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const config = {
    endpoint: process.env.BUCKET_ENDPOINT || process.env.ENDPOINT || process.env.AWS_ENDPOINT_URL,
    region: process.env.BUCKET_REGION || process.env.REGION || process.env.AWS_DEFAULT_REGION || 'auto',
    bucket: process.env.BUCKET_NAME || process.env.BUCKET || process.env.AWS_S3_BUCKET_NAME,
    accessKeyId: process.env.BUCKET_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
    urlStyle: (process.env.BUCKET_URL_STYLE || process.env.AWS_S3_URL_STYLE || 'virtual').toLowerCase()
};

const REQUIRED_CONFIG_NAMES = [
    'BUCKET_ENDPOINT',
    'BUCKET_NAME',
    'BUCKET_ACCESS_KEY_ID',
    'BUCKET_SECRET_ACCESS_KEY'
];

const client = config.endpoint && config.bucket && config.accessKeyId && config.secretAccessKey
    ? new S3Client({
        endpoint: config.endpoint,
        region: config.region,
        forcePathStyle: config.urlStyle === 'path',
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
        }
    })
    : null;

function requireStorage() {
    if (!client) {
        throw new Error(`Bucket storage is not configured. Set ${REQUIRED_CONFIG_NAMES.join(', ')}.`);
    }
    return client;
}

function normalizeScope(scope) {
    return scope === 'clinical' ? 'clinical' : scope === 'public' ? 'public' : null;
}

function isAssetReference(value) {
    return typeof value === 'string' && /^bucket:\/\/(public|clinical)\/.+$/.test(value);
}

function parseAssetReference(value) {
    if (!isAssetReference(value)) return null;
    const match = value.match(/^bucket:\/\/(public|clinical)\/(.+)$/);
    if (!match) return null;
    return {
        scope: match[1],
        key: match[2]
    };
}

function getObjectPrefix(scope) {
    return scope === 'clinical' ? 'private' : 'public';
}

function getObjectKey(scope, key) {
    return `${getObjectPrefix(scope)}/${key}`;
}

function buildDeliveryPath(reference) {
    const parsed = parseAssetReference(reference);
    if (!parsed) throw new Error('Invalid asset reference.');
    return `${parsed.scope === 'clinical' ? '/clinical-assets' : '/assets'}?reference=${encodeURIComponent(reference)}`;
}

function normalizeExtension(extension, contentType) {
    if (extension) {
        return extension.replace(/^\./, '').toLowerCase();
    }

    const contentTypeMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/quicktime': 'mov',
        'video/webm': 'webm',
        'application/pdf': 'pdf'
    };

    return contentTypeMap[contentType] || 'bin';
}

async function uploadAsset({ scope, body, contentType, extension, ownerId }) {
    const normalizedScope = normalizeScope(scope);
    if (!normalizedScope) {
        throw new Error('Invalid asset scope. Expected public or clinical.');
    }
    if (!body) {
        throw new Error('Asset body is required.');
    }

    const ext = normalizeExtension(extension, contentType);
    const ownerSegment = ownerId === undefined || ownerId === null || ownerId === ''
        ? 'shared'
        : String(ownerId).replace(/[^a-zA-Z0-9_-]/g, '-');
    const key = `${ownerSegment}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const reference = `bucket://${normalizedScope}/${key}`;

    await requireStorage().send(new PutObjectCommand({
        Bucket: config.bucket,
        Key: getObjectKey(normalizedScope, key),
        Body: body,
        ContentType: contentType
    }));

    return {
        reference,
        deliveryPath: buildDeliveryPath(reference),
        contentType
    };
}

async function deleteAsset(reference) {
    const parsed = parseAssetReference(reference);
    if (!parsed || !client) return;

    await client.send(new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: getObjectKey(parsed.scope, parsed.key)
    }));
}

async function createPublicAssetUrl(reference) {
    const parsed = parseAssetReference(reference);
    if (!parsed) throw new Error('Invalid asset reference.');
    if (parsed.scope !== 'public') throw new Error('Public asset route accepts only public asset references.');

    return getSignedUrl(requireStorage(), new GetObjectCommand({
        Bucket: config.bucket,
        Key: getObjectKey(parsed.scope, parsed.key)
    }), { expiresIn: 300 });
}

async function createPrivateAssetUrl(reference) {
    const parsed = parseAssetReference(reference);
    if (!parsed) throw new Error('Invalid asset reference.');
    if (parsed.scope !== 'clinical') throw new Error('Clinical asset route accepts only clinical asset references.');

    return getSignedUrl(requireStorage(), new GetObjectCommand({
        Bucket: config.bucket,
        Key: getObjectKey(parsed.scope, parsed.key)
    }), { expiresIn: 300 });
}

module.exports = {
    uploadAsset,
    deleteAsset,
    isAssetReference,
    parseAssetReference,
    createPublicAssetUrl,
    createPrivateAssetUrl
};
