import test from 'node:test';
import assert from 'node:assert/strict';
import { createManifest } from '../src/manifest.js';

test('creates a versioned manifest without connection or credential fields', () => {
  const manifest = createManifest({
    key: 'daily/2026/07/postgres.dump.enc',
    timestamp: '2026-07-30T06:00:00.000Z',
    size: 123,
    sha256: 'a'.repeat(64)
  });

  assert.deepEqual(manifest, {
    version: 1,
    timestamp: '2026-07-30T06:00:00.000Z',
    objectKey: 'daily/2026/07/postgres.dump.enc',
    bytes: 123,
    sha256: 'a'.repeat(64),
    format: 'postgres-custom-aes-256-gcm'
  });
});
