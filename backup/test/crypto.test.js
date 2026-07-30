import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decryptFile, encryptFile } from '../src/crypto.js';

const key = Buffer.alloc(32, 7);

test('encrypts and decrypts a dump without storing plaintext in the envelope', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bright-smiles-backup-'));
  const source = join(directory, 'dump.custom');
  const encrypted = join(directory, 'dump.enc');
  const restored = join(directory, 'restored.custom');
  const fixture = Buffer.from('sensitive database fixture');

  try {
    await writeFile(source, fixture);
    const metadata = await encryptFile(source, encrypted, key);

    assert.match(metadata.sha256, /^[a-f0-9]{64}$/);
    assert.ok(metadata.size > fixture.length);
    assert.equal((await readFile(encrypted)).includes(fixture), false);

    await decryptFile(encrypted, restored, key);
    assert.deepEqual(await readFile(restored), fixture);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('rejects a tampered encrypted dump without leaving a restored file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bright-smiles-backup-'));
  const source = join(directory, 'dump.custom');
  const encrypted = join(directory, 'dump.enc');
  const restored = join(directory, 'restored.custom');

  try {
    await writeFile(source, 'fixture');
    await encryptFile(source, encrypted, key);
    const bytes = await readFile(encrypted);
    bytes[24] ^= 1;
    await writeFile(encrypted, bytes);

    await assert.rejects(() => decryptFile(encrypted, restored, key));
    await assert.rejects(() => readFile(restored));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
