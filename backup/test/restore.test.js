import test from 'node:test';
import assert from 'node:assert/strict';

import { inspectBackup } from '../src/restore.js';

const env = {
  DATABASE_URL: 'postgresql://backup-user:backup-password@postgres.railway.internal:5432/railway',
  BACKUP_R2_ENDPOINT: 'https://account-id.r2.cloudflarestorage.com',
  BACKUP_R2_BUCKET: 'odontoeharmonizacao-db-backups',
  BACKUP_R2_ACCESS_KEY_ID: 'access-id',
  BACKUP_R2_SECRET_ACCESS_KEY: 'secret-key',
  BACKUP_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64')
};

test('downloads, verifies, decrypts, validates, and cleans up a selected backup', async () => {
  const calls = [];
  const objectKey = 'daily/2026/07/postgres-20260730T060000000Z-test.dump.enc';
  const result = await inspectBackup({
    env,
    objectKey,
    makeTempDir: async () => '/tmp/restore-job',
    cleanup: async () => calls.push('cleanup'),
    createR2Client: () => { calls.push('client'); return {}; },
    fetchManifest: async () => ({ objectKey, sha256: 'a'.repeat(64), bytes: 99 }),
    downloadObject: async () => { calls.push('download'); return { size: 99, sha256: 'a'.repeat(64) }; },
    decryptFile: async () => calls.push('decrypt'),
    validateDump: async () => calls.push('validate'),
    log: () => calls.push('log')
  });

  assert.deepEqual(calls, ['client', 'download', 'decrypt', 'validate', 'log', 'cleanup']);
  assert.deepEqual(result, { objectKey, bytes: 99 });
});

test('refuses an invalid object key or mismatched manifest before decryption', async () => {
  await assert.rejects(
    () => inspectBackup({ env, objectKey: '../sensitive', makeTempDir: async () => '/tmp/restore-job' }),
    /Invalid backup object key/,
  );

  const calls = [];
  await assert.rejects(
    () => inspectBackup({
      env,
      objectKey: 'daily/2026/07/postgres-test.dump.enc',
      makeTempDir: async () => '/tmp/restore-job',
      cleanup: async () => calls.push('cleanup'),
      createR2Client: () => ({}),
      fetchManifest: async () => ({ objectKey: 'daily/other.dump.enc', sha256: 'a'.repeat(64), bytes: 99 }),
      downloadObject: async () => ({ size: 99, sha256: 'a'.repeat(64) }),
    }),
    /Backup manifest verification failed/,
  );
  assert.deepEqual(calls, ['cleanup']);
});
