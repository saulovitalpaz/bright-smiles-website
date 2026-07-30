import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createReadStream, createWriteStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { sha256File } from './crypto.js';

export const createR2Client = (config) => new S3Client({
  region: 'auto',
  endpoint: config.r2Endpoint,
  credentials: {
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey
  }
});

export const uploadBackup = async ({ client, bucket, objectKey, bodyPath, manifest }) => {
  const dumpStats = await stat(bodyPath);
  const manifestKey = `${objectKey}.manifest.json`;
  const manifestBody = Buffer.from(JSON.stringify(manifest));

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: createReadStream(bodyPath),
    ContentLength: dumpStats.size,
    ContentType: 'application/octet-stream',
    Metadata: { sha256: manifest.sha256 }
  }));
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: manifestKey,
    Body: manifestBody,
    ContentLength: manifestBody.length,
    ContentType: 'application/json'
  }));

  const [dumpHead, manifestHead] = await Promise.all([
    client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey })),
    client.send(new HeadObjectCommand({ Bucket: bucket, Key: manifestKey }))
  ]);
  if (dumpHead.ContentLength !== dumpStats.size || manifestHead.ContentLength !== manifestBody.length) {
    throw new Error('Backup upload verification failed.');
  }

  return { manifestKey, manifestBytes: manifestBody.length };
};

const bodyToString = async (body) => {
  if (!body) throw new Error('Backup download verification failed.');
  if (typeof body.transformToString === 'function') return body.transformToString();
  let text = '';
  for await (const chunk of body) text += chunk;
  return text;
};

export const fetchManifest = async ({ client, bucket, objectKey }) => {
  const response = await client.send(new GetObjectCommand({
    Bucket: bucket,
    Key: `${objectKey}.manifest.json`
  }));
  try {
    return JSON.parse(await bodyToString(response.Body));
  } catch {
    throw new Error('Backup manifest verification failed.');
  }
};

export const downloadObject = async ({ client, bucket, objectKey, outputPath }) => {
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey }));
  if (!response.Body) throw new Error('Backup download verification failed.');
  await pipeline(response.Body, createWriteStream(outputPath, { flags: 'wx' }));
  const details = await stat(outputPath);
  return { size: details.size, sha256: await sha256File(outputPath) };
};
