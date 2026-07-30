import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

const valid = {
  DATABASE_URL: 'postgresql://db.example/railway',
  BACKUP_R2_ENDPOINT: 'https://account-id.r2.cloudflarestorage.com',
  BACKUP_R2_BUCKET: 'odontoeharmonizacao-db-backups',
  BACKUP_R2_ACCESS_KEY_ID: 'access-id',
  BACKUP_R2_SECRET_ACCESS_KEY: 'secret-key',
  BACKUP_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64')
};

test('loads the complete backup configuration', () => {
  const config = loadConfig({
    ...valid,
    DATABASE_URL: 'postgresql://backup-user:backup-password@postgres.railway.internal:5432/railway?sslmode=require'
  });

  assert.equal(config.r2Bucket, valid.BACKUP_R2_BUCKET);
  assert.equal(config.encryptionKey.length, 32);
  assert.deepEqual(config.postgres, {
    host: 'postgres.railway.internal',
    port: '5432',
    database: 'railway',
    user: 'backup-user',
    password: 'backup-password',
    sslMode: 'require'
  });
});

test('rejects missing required variables without exposing values', () => {
  assert.throws(
    () => loadConfig({ ...valid, BACKUP_R2_SECRET_ACCESS_KEY: '' }),
    /backup configuration/i
  );
});

test('rejects an encryption key that is not exactly 32 bytes of base64', () => {
  assert.throws(
    () => loadConfig({
      ...valid,
      DATABASE_URL: 'postgresql://backup-user:backup-password@postgres.railway.internal:5432/railway',
      BACKUP_ENCRYPTION_KEY: 'too-short'
    }),
    /encryption key/i
  );
});
