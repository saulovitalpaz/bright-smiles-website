import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadConfig } from './config.js';
import { decryptFile } from './crypto.js';
import { validateDump } from './postgres.js';
import { createR2Client, downloadObject, fetchManifest } from './r2.js';

const isBackupObjectKey = (value) => (
  typeof value === 'string'
  && /^(?:daily\/\d{4}\/\d{2}|monthly\/\d{4})\/postgres-[A-Za-z0-9_.-]+\.dump\.enc$/.test(value)
);

export async function inspectBackup(dependencies = {}) {
  const objectKey = dependencies.objectKey ?? process.env.BACKUP_OBJECT_KEY;
  if (!isBackupObjectKey(objectKey)) throw new Error('Invalid backup object key.');

  const config = loadConfig(dependencies.env ?? process.env);
  const makeTempDir = dependencies.makeTempDir ?? ((prefix) => mkdtemp(prefix));
  const cleanup = dependencies.cleanup ?? ((path) => rm(path, { recursive: true, force: true }));
  const log = dependencies.log ?? console.log;
  const tempDir = await makeTempDir(join(tmpdir(), 'bright-smiles-restore-'));

  try {
    const encryptedPath = join(tempDir, 'database.dump.enc');
    const dumpPath = join(tempDir, 'database.dump');
    const client = (dependencies.createR2Client ?? createR2Client)(config);
    const manifest = await (dependencies.fetchManifest ?? fetchManifest)({
      client,
      bucket: config.r2Bucket,
      objectKey,
    });
    const downloaded = await (dependencies.downloadObject ?? downloadObject)({
      client,
      bucket: config.r2Bucket,
      objectKey,
      outputPath: encryptedPath,
    });
    if (
      manifest?.objectKey !== objectKey
      || manifest?.bytes !== downloaded.size
      || !/^[a-f0-9]{64}$/.test(manifest?.sha256 ?? '')
      || manifest.sha256 !== downloaded.sha256
    ) {
      throw new Error('Backup manifest verification failed.');
    }

    await (dependencies.decryptFile ?? decryptFile)(encryptedPath, dumpPath, config.encryptionKey);
    await (dependencies.validateDump ?? validateDump)({ dumpPath });
    log(`Backup inspection completed: ${objectKey}.`);
    return { objectKey, bytes: downloaded.size };
  } finally {
    await cleanup(tempDir);
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  inspectBackup().catch(() => {
    console.error('Backup inspection failed.');
    process.exitCode = 1;
  });
}
