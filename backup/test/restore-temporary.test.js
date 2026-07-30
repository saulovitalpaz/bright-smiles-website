import test from 'node:test';
import assert from 'node:assert/strict';

import { restoreBackupToTemporaryDatabase } from '../src/restore-test.js';

const env = {
  DATABASE_URL: 'postgresql://backup-user:backup-password@postgres.railway.internal:5432/railway',
  RESTORE_DATABASE_URL: 'postgresql://restore-user:restore-password@restore-test.railway.internal:5432/railway',
  RESTORE_TEST_CONFIRM: 'RESTORE_TO_TEMPORARY_DATABASE',
  BACKUP_R2_ENDPOINT: 'https://account-id.r2.cloudflarestorage.com',
  BACKUP_R2_BUCKET: 'odontoeharmonizacao-db-backups',
  BACKUP_R2_ACCESS_KEY_ID: 'access-id',
  BACKUP_R2_SECRET_ACCESS_KEY: 'secret-key',
  BACKUP_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64')
};

test('restores a verified backup only to a distinct confirmed target database', async () => {
  const calls = [];
  const objectKey = 'daily/2026/07/postgres-20260730T060000000Z-test.dump.enc';

  const result = await restoreBackupToTemporaryDatabase({
    env,
    objectKey,
    makeTempDir: async () => '/tmp/restore-test-job',
    cleanup: async () => calls.push('cleanup'),
    createR2Client: () => { calls.push('client'); return {}; },
    fetchManifest: async () => ({ objectKey, sha256: 'a'.repeat(64), bytes: 99 }),
    downloadObject: async () => ({ size: 99, sha256: 'a'.repeat(64) }),
    decryptFile: async () => calls.push('decrypt'),
    validateDump: async () => calls.push('validate'),
    createPgPassFile: async () => { calls.push('pgpass'); return '/tmp/.pgpass'; },
    runPgRestore: async () => calls.push('restore'),
    log: () => calls.push('log')
  });

  assert.deepEqual(calls, ['client', 'decrypt', 'validate', 'pgpass', 'restore', 'log', 'cleanup']);
  assert.deepEqual(result, { objectKey, target: 'restore-test.railway.internal:5432/railway' });
});

test('refuses missing confirmation and a target equal to the source database', async () => {
  const objectKey = 'daily/2026/07/postgres-20260730T060000000Z-test.dump.enc';

  await assert.rejects(
    () => restoreBackupToTemporaryDatabase({ env: { ...env, RESTORE_TEST_CONFIRM: '' }, objectKey }),
    /Invalid restore test configuration/,
  );
  await assert.rejects(
    () => restoreBackupToTemporaryDatabase({ env: { ...env, RESTORE_DATABASE_URL: env.DATABASE_URL }, objectKey }),
    /Invalid restore test configuration/,
  );
});
