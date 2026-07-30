import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadConfig } from './config.js';
import { encryptFile } from './crypto.js';
import { createManifest } from './manifest.js';
import { backupKeys } from './naming.js';
import { createPgPassFile, runPgDump, validateDump } from './postgres.js';
import { createR2Client, uploadBackup } from './r2.js';

const defaultMakeTempDir = (prefix) => mkdtemp(prefix);
const defaultCleanup = (path) => rm(path, { recursive: true, force: true });

export async function runBackup(dependencies = {}) {
  const config = loadConfig(dependencies.env ?? process.env);
  const now = dependencies.now ?? new Date();
  const makeTempDir = dependencies.makeTempDir ?? defaultMakeTempDir;
  const cleanup = dependencies.cleanup ?? defaultCleanup;
  const log = dependencies.log ?? console.log;
  const tempDir = await makeTempDir(join(tmpdir(), 'bright-smiles-backup-'));

  try {
    const dumpPath = join(tempDir, 'database.dump');
    const encryptedPath = join(tempDir, 'database.dump.enc');
    const pgPassFile = await (dependencies.createPgPassFile ?? createPgPassFile)({
      connection: config.postgres,
      directory: tempDir,
    });

    await (dependencies.runPgDump ?? runPgDump)({
      connection: config.postgres,
      pgPassFile,
      outputPath: dumpPath,
    });
    await (dependencies.validateDump ?? validateDump)({ dumpPath });

    const encrypted = await (dependencies.encryptFile ?? encryptFile)(
      dumpPath,
      encryptedPath,
      config.encryptionKey,
    );
    const { dailyKey, monthlyKey } = backupKeys(now, dependencies.suffix);
    const client = (dependencies.createR2Client ?? createR2Client)(config);
    const objects = [];

    for (const objectKey of [dailyKey, monthlyKey].filter(Boolean)) {
      const manifest = createManifest({
        key: objectKey,
        timestamp: now.toISOString(),
        size: encrypted.size,
        sha256: encrypted.sha256,
      });
      const uploaded = await (dependencies.uploadBackup ?? uploadBackup)({
        client,
        bucket: config.r2Bucket,
        objectKey,
        bodyPath: encryptedPath,
        manifest,
      });
      objects.push({
        key: objectKey,
        manifestKey: uploaded.manifestKey,
        bytes: encrypted.size,
        sha256: encrypted.sha256,
      });
    }

    log(`Backup completed: ${objects.length} object(s), ${encrypted.size} bytes.`);
    return { objects };
  } finally {
    await cleanup(tempDir);
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  runBackup().catch(() => {
    console.error('Database backup failed.');
    process.exitCode = 1;
  });
}
