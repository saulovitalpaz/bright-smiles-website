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
        throw new Error('Railway Bucket is not configured. Set ENDPOINT, BUCKET, ACCESS_KEY_ID and SECRET_ACCESS_KEY.');
    }
    return client;
}

function createDocumentKey(patientId) {
    return `patient-documents/${patientId}/${crypto.randomUUID()}.pdf`;
}

async function uploadPatientDocument({ patientId, body }) {
    const key = createDocumentKey(patientId);
    await requireStorage().send(new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ContentType: 'application/pdf',
        ContentDisposition: 'inline'
    }));
    return key;
}

async function deletePatientDocument(key) {
    if (!key || !client) return;
    await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
}

async function createPatientDocumentUrl(key) {
    return getSignedUrl(requireStorage(), new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ResponseContentType: 'application/pdf',
        ResponseContentDisposition: 'inline'
    }), { expiresIn: 300 });
}

module.exports = { uploadPatientDocument, deletePatientDocument, createPatientDocumentUrl };
