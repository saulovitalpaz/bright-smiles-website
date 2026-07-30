import test from 'node:test';
import assert from 'node:assert/strict';
import { createPgPassFile, runPgDump, runPgRestore, validateDump } from '../src/postgres.js';

const connection = {
  host: 'postgres.railway.internal',
  port: '5432',
  database: 'railway',
  user: 'postgres',
  password: 'secret:with\\characters'
};

test('writes an escaped pgpass file and keeps the password out of pg_dump arguments', async () => {
  let written;
  const pgPassFile = await createPgPassFile({
    connection,
    directory: '/tmp',
    writeFile: async (path, content, options) => { written = { path, content, options }; return path; }
  });
  const calls = [];

  await runPgDump({
    connection,
    pgPassFile,
    outputPath: '/tmp/backup.dump',
    run: async (...args) => { calls.push(args); }
  });

  assert.match(written.content, /secret\\:with\\\\characters/);
  assert.equal(written.options.mode, 0o600);
  assert.deepEqual(calls[0][1], [
    '--format=custom', '--no-owner', '--no-privileges', '--file', '/tmp/backup.dump',
    '--host', 'postgres.railway.internal', '--port', '5432', '--username', 'postgres', 'railway'
  ]);
  assert.doesNotMatch(JSON.stringify(calls), /secret/);
});

test('validates a custom dump with pg_restore before upload', async () => {
  const calls = [];
  await validateDump({
    dumpPath: '/tmp/backup.dump',
    run: async (...args) => { calls.push(args); }
  });

  assert.deepEqual(calls, [['pg_restore', ['--list', '/tmp/backup.dump'], {}]]);
});

test('restores only through pg_restore using pgpass instead of credentials in arguments', async () => {
  const calls = [];
  await runPgRestore({
    connection: {
      host: 'restore-test.railway.internal', port: '5432', database: 'railway', user: 'restore-user', password: 'not-an-argument', sslMode: 'require'
    },
    pgPassFile: '/tmp/.pgpass',
    dumpPath: '/tmp/database.dump',
    run: async (file, args, options) => calls.push({ file, args, options })
  });

  assert.equal(calls[0].file, 'pg_restore');
  assert.deepEqual(calls[0].args, [
    '--exit-on-error', '--no-owner', '--no-privileges',
    '--host', 'restore-test.railway.internal', '--port', '5432', '--username', 'restore-user', '--dbname', 'railway',
    '/tmp/database.dump'
  ]);
  assert.deepEqual(calls[0].options.env, { PGPASSFILE: '/tmp/.pgpass', PGSSLMODE: 'require' });
  assert.doesNotMatch(calls[0].args.join(' '), /not-an-argument/);
});
