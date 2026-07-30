import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadConfig } from './config.js';
import { decryptFile } from './crypto.js';
import { createPgPassFile, runPgRestore, validateDump } from './postgres.js';
import { createR2Client, downloadObject, fetchManifest } from './r2.js';

const RESTORE_CONFIRMATION = 'RESTORE_TO_TEMPORARY_DATABASE';

const isBackupObjectKey = (value) => (
  typeof value === 'string'
  && /^(?:daily\/\d{4}\/\d{2}|monthly\/\d{4})\/postgres-[A-Za-z0-9_.-]+\.dump\.enc$/.test(value)
);

const parsePostgresUrl = (value) => {
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error();
    const connection = {
      host: url.hostname,
      port: url.port || '5432',
      database: decodeURIComponent(url.pathname.replace(/^\//, '')),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      sslMode: url.searchParams.get('sslmode') || 'prefer'
    };
    if (!connection.host || !connection.database || !connection.user || !connection.password) throw new Error();
    return connection;
  } catch {
    throw new Error('Invalid restore test configuration.');
  }
};

const sameDatabase = (left, right) => (
  left.host === right.host
  && left.port === right.port
  && left.database === right.database
);

const validateManifest = ({ manifest, objectKey, downloaded }) => (
  manifest?.objectKey === objectKey
  && manifest?.bytes === downloaded.size
  && /^[a-f0-9]{64}$/.test(manifest?.sha256 ?? '')
  && manifest.sha256 === downloaded.sha256
);

export async function restoreBackupToTemporaryDatabase(dependencies = {}) {
  const env = dependencies.env ?? process.env;
  const objectKey = dependencies.objectKey ?? env.BACKUP_OBJECT_KEY;
  if (!isBackupObjectKey(objectKey)) throw new Error('Invalid backup object key.');

  const config = loadConfig(env);
  const target = parsePostgresUrl(env.RESTORE_DATABASE_URL);
  if (env.RESTORE_TEST_CONFIRM !== RESTORE_CONFIRMATION || sameDatabase(config.postgres, target)) {
    throw new Error('Invalid restore test configuration.');
  }

  const makeTempDir = dependencies.makeTempDir ?? ((prefix) => mkdtemp(prefix));
  const cleanup = dependencies.cleanup ?? ((path) => rm(path, { recursive: true, force: true }));
  const log = dependencies.log ?? console.log;
  const tempDir = await makeTempDir(join(tmpdir(), 'bright-smiles-restore-test-'));

  try {
    const encryptedPath = join(tempDir, 'database.dump.enc');
    const dumpPath = join(tempDir, 'database.dump');
    const client = (dependencies.createR2Client ?? createR2Client)(config);
    const manifest = await (dependencies.fetchManifest ?? fetchManifest)({
      client, bucket: config.r2Bucket, objectKey
    });
    const downloaded = await (dependencies.downloadObject ?? downloadObject)({
      client, bucket: config.r2Bucket, objectKey, outputPath: encryptedPath
    });
    if (!validateManifest({ manifest, objectKey, downloaded })) {
      throw new Error('Backup manifest verification failed.');
    }

    await (dependencies.decryptFile ?? decryptFile)(encryptedPath, dumpPath, config.encryptionKey);
    await (dependencies.validateDump ?? validateDump)({ dumpPath });
    const pgPassFile = await (dependencies.createPgPassFile ?? createPgPassFile)({
      connection: target, directory: tempDir
    });
    await (dependencies.runPgRestore ?? runPgRestore)({
      connection: target, pgPassFile, dumpPath
    });
    const targetName = `${target.host}:${target.port}/${target.database}`;
    log(`Temporary restore completed: ${targetName}.`);
    return { objectKey, target: targetName };
  } finally {
    await cleanup(tempDir);
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  restoreBackupToTemporaryDatabase().catch(() => {
    console.error('Temporary restore test failed.');
    process.exitCode = 1;
  });
}
