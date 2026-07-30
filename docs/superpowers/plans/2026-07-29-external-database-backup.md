# External Database Backup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy a private Railway Cron service that creates verified, encrypted PostgreSQL backups in the scoped Cloudflare R2 bucket and supports a tested restore drill.

**Architecture:** A dedicated `backup/` service runs on the PostgreSQL 17 Alpine image with Node.js and the AWS S3-compatible R2 SDK. It receives the private `DATABASE_URL` by Railway reference, streams a custom-format `pg_dump` through a local AES-256-GCM envelope, uploads immutable timestamped objects and a SHA-256 manifest, and exits non-zero on any failure. Restore tooling is kept separate from the Cron entrypoint and is documented as a manual operation against a temporary database first.

**Tech Stack:** Node.js 20, PostgreSQL 17 client (`pg_dump`/`pg_restore`), `@aws-sdk/client-s3`, Node `crypto`, Node built-in test runner, Railway Cron, Cloudflare R2 S3 API.

## Global Constraints

- The service is named `database-backup`, has no public domain, no volume, and no frontend access.
- `DATABASE_URL` is `${{Postgres.DATABASE_URL}}`; R2 credentials are service-scoped variables only.
- R2 bucket is `odontoeharmonizacao-db-backups`; use `Object Read & Write` scoped only to this bucket.
- Uploads use `daily/` and `monthly/` prefixes; lifecycle and bucket-lock retention are 35 and 400 days.
- No password, token, encryption key, database URL, dump content, or patient data may appear in logs, tests, commits, or chat.
- No production code is written before its failing test is run.
- The legacy GitHub Actions workflow and shell backup script are removed only after the new job has passed its manual verification.

---

### Task 1: Create the isolated backup package and configuration boundary

**Files:**
- Create: `backup/package.json`
- Create: `backup/railway.json`
- Create: `backup/Dockerfile`
- Create: `backup/src/config.js`
- Create: `backup/test/config.test.js`

**Interfaces:**
- Produces `loadConfig(env)` returning `{ databaseUrl, r2Endpoint, r2Bucket, r2AccessKeyId, r2SecretAccessKey, encryptionKey }`.
- `loadConfig` rejects with a generic configuration error when any required variable is absent or malformed.

- [ ] **Step 1: Write the failing tests.** Add tests using `node:test` and `node:assert/strict`:

```js
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

test('loads the complete backup configuration without returning secret text in errors', () => {
  const config = loadConfig(valid);
  assert.equal(config.r2Bucket, valid.BACKUP_R2_BUCKET);
  assert.equal(config.encryptionKey.length, 32);
});

test('rejects missing required variables', () => {
  assert.throws(() => loadConfig({ ...valid, BACKUP_R2_SECRET_ACCESS_KEY: '' }), /backup configuration/i);
});

test('rejects an encryption key that is not exactly 32 bytes of base64', () => {
  assert.throws(() => loadConfig({ ...valid, BACKUP_ENCRYPTION_KEY: 'too-short' }), /encryption key/i);
});
```

- [ ] **Step 2: Run the tests to verify RED.**

Run: `node --test backup/test/config.test.js`

Expected: FAIL because `backup/src/config.js` does not yet export `loadConfig`.

- [ ] **Step 3: Implement the minimal configuration loader.** Validate non-empty strings, require `https://` for `BACKUP_R2_ENDPOINT`, parse `BACKUP_ENCRYPTION_KEY` with `Buffer.from(value, 'base64')`, and require exactly 32 bytes. Never interpolate values into thrown messages.

- [ ] **Step 4: Add package and runtime configuration.** Use this package contract:

```json
{
  "name": "bright-smiles-database-backup",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test test/*.test.js", "backup": "node src/backup.js" },
  "dependencies": { "@aws-sdk/client-s3": "^3.864.0" }
}
```

Add `backup/railway.json` with Dockerfile builder, `cronSchedule: "0 6 * * *"`, and `restartPolicyType: "ON_FAILURE"` with three retries. Add a Dockerfile based on `postgres:17-alpine`, install `nodejs` and `npm`, install only the backup package dependencies with `npm ci --omit=dev`, copy `src`, and set `CMD ["node", "src/backup.js"]`. Do not copy the repository root or server `.env` files into the image.

- [ ] **Step 5: Run the configuration tests.**

Run: `node --test backup/test/config.test.js`

Expected: PASS with three tests.

- [ ] **Step 6: Commit the isolated package boundary.**

```bash
git add backup/package.json backup/railway.json backup/Dockerfile backup/src/config.js backup/test/config.test.js
git commit -m "feat: scaffold isolated database backup service"
```

### Task 2: Implement authenticated encryption, naming, and integrity manifests

**Files:**
- Create: `backup/src/crypto.js`
- Create: `backup/src/naming.js`
- Create: `backup/src/manifest.js`
- Create: `backup/test/crypto.test.js`
- Create: `backup/test/naming.test.js`
- Create: `backup/test/manifest.test.js`

**Interfaces:**
- `encryptFile(inputPath, outputPath, key)` writes a versioned AES-256-GCM envelope and returns `{ size, sha256 }` for the encrypted file.
- `decryptFile(inputPath, outputPath, key)` verifies the GCM tag before writing the restored dump.
- `backupKeys(date)` returns `{ dailyKey, monthlyKey }` and never contains secrets.
- `createManifest({ key, timestamp, size, sha256 })` returns JSON-safe metadata with schema version `1`.

- [ ] **Step 1: Write failing tests for round-trip encryption and tamper rejection.** Use a temporary directory, write a small dump fixture, encrypt/decrypt it with a 32-byte test key, assert exact equality, then flip one ciphertext byte and assert decryption rejects without leaving a usable output file. Add assertions that the encrypted bytes do not contain the fixture text.

- [ ] **Step 2: Run the crypto tests to verify RED.**

Run: `node --test backup/test/crypto.test.js`

Expected: FAIL because `encryptFile` and `decryptFile` are not defined.

- [ ] **Step 3: Implement a streaming AES-256-GCM envelope.** Write a fixed magic/version header, a random 12-byte IV, ciphertext, and a final 16-byte authentication tag. Hash the encrypted bytes with SHA-256 while writing. On decryption, read the tag from the final 16 bytes, verify it before renaming the temporary output into place, and delete partial files on error.

- [ ] **Step 4: Write and run failing naming/manifest tests.** Assert a UTC timestamp produces keys under `daily/YYYY/MM/` and `monthly/YYYY/`, that the first UTC day gets a monthly key, that later days do not, and that a manifest contains only version, timestamp, object key, byte size, SHA-256 and schema metadata.

Run: `node --test backup/test/naming.test.js backup/test/manifest.test.js`

Expected: FAIL because the naming and manifest modules do not exist.

- [ ] **Step 5: Implement naming and manifest modules.** Use ISO UTC timestamps, a unique suffix derived from milliseconds, and JSON serialization with stable field order. Do not include database URLs, bucket credentials, hostnames, patient records, or encryption keys.

- [ ] **Step 6: Run all cryptographic unit tests.**

Run: `node --test backup/test/crypto.test.js backup/test/naming.test.js backup/test/manifest.test.js`

Expected: PASS.

- [ ] **Step 7: Commit the cryptographic boundary.**

```bash
git add backup/src/crypto.js backup/src/naming.js backup/src/manifest.js backup/test/crypto.test.js backup/test/naming.test.js backup/test/manifest.test.js
git commit -m "feat: encrypt and identify database backups"
```

### Task 3: Add PostgreSQL dump validation and R2 storage adapters

**Files:**
- Create: `backup/src/postgres.js`
- Create: `backup/src/r2.js`
- Create: `backup/test/postgres.test.js`
- Create: `backup/test/r2.test.js`

**Interfaces:**
- `runPgDump({ databaseUrl, outputPath, spawn })` invokes `pg_dump --format=custom --no-owner --no-privileges --file outputPath databaseUrl` without logging the URL.
- `validateDump({ dumpPath, spawn })` invokes `pg_restore --list dumpPath` and rejects non-zero exit codes.
- `createR2Client(config)` returns an `S3Client` configured for `region: "auto"` and the R2 endpoint.
- `uploadBackup({ client, bucket, objectKey, bodyPath, manifest })` sends `PutObjectCommand` for the encrypted dump and manifest, then `HeadObjectCommand` for both and checks byte lengths.

- [ ] **Step 1: Write failing adapter tests.** Inject a fake `spawn` and fake S3 client. Assert the PostgreSQL command uses the exact PostgreSQL 17 flags, never prints the connection string, rejects a failed process, and that the R2 adapter sends only the expected bucket/key/metadata and performs post-upload HEAD checks.

- [ ] **Step 2: Run adapter tests to verify RED.**

Run: `node --test backup/test/postgres.test.js backup/test/r2.test.js`

Expected: FAIL because the adapters do not exist.

- [ ] **Step 3: Implement process handling.** Use `spawn` with argument arrays, not shell strings or `execSync`, capture only bounded stderr for generic diagnostics, and resolve only after the child exits with code zero. Ensure temporary paths are generated inside a process-specific temporary directory.

- [ ] **Step 4: Implement the R2 S3 adapter.** Use `@aws-sdk/client-s3`, `PutObjectCommand`, `HeadObjectCommand`, `ContentType`, `ContentLength`, and a SHA-256 metadata field. Never call bucket configuration or delete APIs. Convert upload errors to generic errors while retaining a safe operation name for logs.

- [ ] **Step 5: Run adapter tests to verify GREEN.**

Run: `node --test backup/test/postgres.test.js backup/test/r2.test.js`

Expected: PASS.

- [ ] **Step 6: Commit the adapters.**

```bash
git add backup/src/postgres.js backup/src/r2.js backup/test/postgres.test.js backup/test/r2.test.js
git commit -m "feat: validate postgres dumps and upload to R2"
```

### Task 4: Compose the Cron backup command and restore tooling

**Files:**
- Create: `backup/src/backup.js`
- Create: `backup/src/restore.js`
- Create: `backup/test/backup.test.js`
- Create: `backup/README.md`
- Create: `docs/backup-restore-runbook.md`

**Interfaces:**
- `runBackup(dependencies)` performs one complete backup and returns `{ dumpKey, manifestKey, bytes, sha256 }`.
- `restoreBackup({ encryptedPath, manifestPath, key, outputPath })` validates the manifest/hash and decrypts without contacting production.
- The CLI exits `0` only after both objects pass HEAD verification and exits `1` on any error.

- [ ] **Step 1: Write failing orchestration tests.** Inject config, filesystem, date, PostgreSQL adapter, encryption adapter and R2 adapter. Assert the order `dump → validate → encrypt → hash → upload → HEAD → cleanup`, daily/monthly key choice, no overwrite, cleanup on failure, and generic safe logs. Assert a monthly object is uploaded only on the first UTC day.

- [ ] **Step 2: Run the orchestration tests to verify RED.**

Run: `node --test backup/test/backup.test.js`

Expected: FAIL because the orchestration modules do not exist.

- [ ] **Step 3: Implement `runBackup`.** Load configuration once, create a temporary directory, use a unique timestamped key, run and validate `pg_dump`, encrypt the dump, build the manifest, upload both objects, verify both objects, and remove every temporary file in `finally`. Log only safe stage names and sizes.

- [ ] **Step 4: Implement restore tooling.** `restore.js` must require an explicit input path, output path and key, reject production-looking output targets, validate the manifest SHA-256 before decrypting, and call `pg_restore --list` on the decrypted file. It must not contain a command that drops or replaces a production database.

- [ ] **Step 5: Add operator documentation.** Document the six Railway variables, `0 6 * * *` UTC schedule, manual run, expected R2 object layout, log checks, local restore into a temporary PostgreSQL 17 instance, and the rule that production cutover requires a separately approved maintenance action. Include a reminder that the old GitHub workflow is disabled after verification.

- [ ] **Step 6: Run orchestration and restore tests.**

Run: `npm test --prefix backup`

Expected: PASS with all backup tests and no secrets printed.

- [ ] **Step 7: Commit the complete backup command.**

```bash
git add backup/src/backup.js backup/src/restore.js backup/test/backup.test.js backup/README.md docs/backup-restore-runbook.md
git commit -m "feat: add encrypted database backup cron"
```

### Task 5: Remove the unsafe legacy workflow and validate the image

**Files:**
- Delete: `.github/workflows/db-backup.yml`
- Delete: `scripts/backup-db.js`
- Modify: `.gitignore` only if the backup test creates a local temp path outside the ignored system directory
- Test: `backup/` test suite and Docker build

- [ ] **Step 1: Run the new backup tests and image build before deletion.**

Run: `npm test --prefix backup`

Run: `docker build -t bright-smiles-database-backup ./backup`

Expected: all tests pass and the image builds from PostgreSQL 17 without copying repository secrets.

- [ ] **Step 2: Delete only the superseded unsafe workflow and shell script.** The old workflow is no longer needed because it stores unencrypted GitHub artifacts and requires the public database proxy. Do not delete construction guides, Prisma migrations, or the user JPEG.

- [ ] **Step 3: Run repository checks.**

Run: `git diff --check`

Run: `npm test --prefix backup`

Run: `git status --short`

Expected: no backup secrets, legacy backup files absent, and unrelated user changes preserved.

- [ ] **Step 4: Commit the cleanup.**

```bash
git add -u .github/workflows/db-backup.yml scripts/backup-db.js
git commit -m "chore: remove unsafe legacy database backup"
```

### Task 6: Configure Railway and execute the restore drill

**Files:**
- Modify only Railway service configuration and private variables; no source files.

- [ ] **Step 1: Set the `database-backup` service root and deploy source.** Point the service to the repository `backup/` root. Confirm the service uses `backup/railway.json` and the PostgreSQL 17 Dockerfile. Do not add a public domain or volume.

- [ ] **Step 2: Add service-scoped variables.** Set `DATABASE_URL` to `${{Postgres.DATABASE_URL}}`, the R2 endpoint from the R2 token page, bucket name, Access Key ID, Secret Access Key and one generated 32-byte base64 `BACKUP_ENCRYPTION_KEY`. Never paste the key into Git or chat.

- [ ] **Step 3: Run one manual deployment.** Inspect logs for stage names, object sizes and success only. A successful run must create exactly one dump object and one manifest object under `daily/` (and under `monthly/` if it is the first UTC day).

- [ ] **Step 4: Verify R2 objects and integrity.** Check the two objects exist, the manifest SHA-256 matches the encrypted object, and no object is public. Do not download the dump into the repository.

- [ ] **Step 5: Perform the restore drill.** Use a temporary PostgreSQL 17 instance, download the encrypted object through the scoped token, verify the manifest, decrypt, run `pg_restore --list`, restore into the temporary database, and verify representative table counts. Record only pass/fail and non-sensitive metadata in the runbook.

- [ ] **Step 6: Remove the database public TCP proxy after the backup service is verified.** Confirm Backend and backup service both use the private Postgres reference first. Then remove the Postgres public proxy and verify health, login, a patient read, and a backup run.

- [ ] **Step 7: Commit documentation updates and record the deployment identifiers.**

```bash
git add docs/backup-restore-runbook.md backup/README.md
git commit -m "docs: record encrypted backup deployment and restore drill"
```

## Verification Checklist

- [ ] Unit tests pass with no secrets in output.
- [ ] Docker image uses PostgreSQL 17 client tools.
- [ ] Manual Cron run uploads encrypted dump plus manifest.
- [ ] R2 object is private and scoped token cannot access another bucket.
- [ ] Lifecycle and bucket locks are active for both prefixes.
- [ ] Restore drill succeeds against a temporary PostgreSQL 17 instance.
- [ ] Legacy GitHub backup is removed only after the new path succeeds.
- [ ] Public Postgres TCP access is removed after private-path verification.
