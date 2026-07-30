import test from 'node:test';
import assert from 'node:assert/strict';
import { runBackup } from '../src/backup.js';

const env = {
  DATABASE_URL: 'postgresql://backup-user:backup-password@postgres.railway.internal:5432/railway',
  BACKUP_R2_ENDPOINT: 'https://account-id.r2.cloudflarestorage.com',
  BACKUP_R2_BUCKET: 'odontoeharmonizacao-db-backups',
  BACKUP_R2_ACCESS_KEY_ID: 'access-id',
  BACKUP_R2_SECRET_ACCESS_KEY: 'secret-key',
  BACKUP_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64')
};

test('runs dump validation encryption upload verification and cleanup in order', async () => {
  const calls = [];
  const result = await runBackup({
    env,
    now: new Date('2026-07-30T06:00:00.000Z'),
    suffix: 'test',
    makeTempDir: async () => '/tmp/backup-job',
    cleanup: async () => calls.push('cleanup'),
    createPgPassFile: async () => { calls.push('pgpass'); return '/tmp/backup-job/pgpass'; },
    runPgDump: async () => calls.push('dump'),
    validateDump: async () => calls.push('validate'),
    encryptFile: async () => { calls.push('encrypt'); return { size: 99, sha256: 'b'.repeat(64) }; },
    createR2Client: () => { calls.push('client'); return {}; },
    uploadBackup: async ({ objectKey }) => { calls.push(`upload:${objectKey}`); return { manifestKey: `${objectKey}.manifest.json` }; },
    log: () => calls.push('log')
  });

  assert.deepEqual(calls, [
    'pgpass', 'dump', 'validate', 'encrypt', 'client',
    'upload:daily/2026/07/postgres-20260730T060000000Z-test.dump.enc',
    'log', 'cleanup'
  ]);
  assert.equal(result.objects.length, 1);
  assert.equal(result.objects[0].bytes, 99);
});

test('adds a monthly backup and cleans up after a failed dump', async () => {
  const monthlyCalls = [];
  const common = {
    env,
    makeTempDir: async () => '/tmp/backup-job',
    cleanup: async () => monthlyCalls.push('cleanup'),
    createPgPassFile: async () => '/tmp/backup-job/pgpass',
    validateDump: async () => {},
    encryptFile: async () => ({ size: 99, sha256: 'b'.repeat(64) }),
    createR2Client: () => ({}),
    uploadBackup: async ({ objectKey }) => { monthlyCalls.push(objectKey); return { manifestKey: `${objectKey}.manifest.json` }; },
    log: () => {}
  };

  await runBackup({ ...common, now: new Date('2026-08-01T06:00:00.000Z'), runPgDump: async () => {} });
  assert.equal(monthlyCalls.filter((key) => key.startsWith('monthly/')).length, 1);

  monthlyCalls.length = 0;
  await assert.rejects(() => runBackup({
    ...common,
    now: new Date('2026-08-02T06:00:00.000Z'),
    runPgDump: async () => { throw new Error('database unavailable'); }
  }));
  assert.deepEqual(monthlyCalls, ['cleanup']);
});
