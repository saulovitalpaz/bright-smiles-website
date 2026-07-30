import { randomUUID } from 'node:crypto';
import { writeFile as writeFileOnDisk } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const escapePgPass = (value) => String(value).replace(/([:\\])/g, '\\$1');

const runCommand = (file, args, { env = {} } = {}) => new Promise((resolve, reject) => {
  const child = spawn(file, args, {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'ignore', 'pipe']
  });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr = `${stderr}${chunk}`.slice(-1024); });
  child.once('error', () => reject(new Error(`Backup database command failed: ${file}.`)));
  child.once('close', (code) => {
    if (code === 0) return resolve();
    reject(new Error(`Backup database command failed: ${file}${stderr ? '.' : ''}`));
  });
});

export const createPgPassFile = async ({ connection, directory, writeFile = writeFileOnDisk }) => {
  const path = join(directory, `.pgpass-${randomUUID()}`);
  const content = [connection.host, connection.port, connection.database, connection.user, connection.password]
    .map(escapePgPass)
    .join(':');
  await writeFile(path, `${content}\n`, { mode: 0o600 });
  return path;
};

export const runPgDump = async ({ connection, pgPassFile, outputPath, run = runCommand }) => {
  const args = [
    '--format=custom', '--no-owner', '--no-privileges', '--file', outputPath,
    '--host', connection.host, '--port', connection.port, '--username', connection.user, connection.database
  ];
  await run('pg_dump', args, { env: { PGPASSFILE: pgPassFile, PGSSLMODE: connection.sslMode } });
};

export const validateDump = async ({ dumpPath, run = runCommand }) => {
  await run('pg_restore', ['--list', dumpPath], {});
};
