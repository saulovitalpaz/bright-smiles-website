import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { uploadBackup } from '../src/r2.js';

test('uploads a dump and manifest then verifies both object sizes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bright-smiles-r2-'));
  const dumpPath = join(directory, 'backup.dump.enc');
  const commands = [];
  const client = {
    async send(command) {
      commands.push(command);
      if (command.constructor.name === 'HeadObjectCommand') {
        const uploaded = commands.find((candidate) => (
          candidate.constructor.name === 'PutObjectCommand' && candidate.input.Key === command.input.Key
        ));
        return { ContentLength: uploaded.input.ContentLength };
      }
      return {};
    }
  };

  try {
    await writeFile(dumpPath, 'encrypted!!');
    const result = await uploadBackup({
      client,
      bucket: 'odontoeharmonizacao-db-backups',
      objectKey: 'daily/2026/07/backup.dump.enc',
      bodyPath: dumpPath,
      manifest: { version: 1, bytes: 11, sha256: 'a'.repeat(64) }
    });

    assert.equal(result.manifestKey, 'daily/2026/07/backup.dump.enc.manifest.json');
    assert.deepEqual(commands.map((command) => command.constructor.name), [
      'PutObjectCommand', 'PutObjectCommand', 'HeadObjectCommand', 'HeadObjectCommand'
    ]);
    assert.equal(commands[0].input.Bucket, 'odontoeharmonizacao-db-backups');
    assert.equal(commands[0].input.Metadata.sha256, 'a'.repeat(64));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
