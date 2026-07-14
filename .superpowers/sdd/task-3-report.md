# Task 3 Report

## Scope completed

- Added nullable `scheduledAt` fields to `Lead` and `Appointment` in `server/prisma/schema.prisma`.
- Extended `appointmentSchema` to accept nullable/optional `scheduledAt`.
- Added shared `parseOptionalDate(value, message)` handling in `server/index.js`.
- Normalized appointment create/update dates and lead update `scheduledAt` with explicit `400` messages for invalid scheduled dates.
- Added `upcomingSchedule` to `/dashboard/stats`, combining scheduled appointments and non-completed leads, sorting ascending by `scheduledAt`, and limiting to 10 while preserving existing dashboard fields.
- Preserved prior Task 1/2 work and limited edits to the requested worktree files.

## TDD evidence

1. Added a new failing contract test to `server/test/file-scheduling-patient-contract.test.js`.
2. Ran:

```powershell
node --test test/file-scheduling-patient-contract.test.js
```

3. Verified RED: the new test failed because `scheduledAt` fields and dashboard schedule contract were missing.
4. Implemented the minimal changes to satisfy the contract.
5. Re-ran the same test command and verified GREEN: all 8 tests passed.

## Verification

### Passed

```powershell
node --test test/file-scheduling-patient-contract.test.js
npm run build
```

- Contract tests: 8 passed, 0 failed.
- Prisma client generation (`npm run build`): passed.

### Blocked by environment

```powershell
npx prisma db push
```

- Could not run successfully because `DATABASE_URL` is not defined in this worktree environment.
- Prisma reported `P1012` at `prisma/schema.prisma:7`.
- No database schema push was attempted against an unknown target.

## Files changed

- `server/prisma/schema.prisma`
- `server/utils/validationSchemas.js`
- `server/utils/schedule.js`
- `server/index.js`
- `server/test/file-scheduling-patient-contract.test.js`
- `.superpowers/sdd/task-3-report.md`

## Notes / concerns

- The server currently contains duplicate `PUT /leads/:id` and `DELETE /leads/:id` route declarations. I updated both `PUT /leads/:id` handlers so the schedule parsing behavior is consistent with the current file layout, but the duplication remains pre-existing and could be cleaned up separately.
- `Appointment.date` remains required. Empty-string updates now return a clear `400 Invalid appointment date` instead of silently reaching Prisma.

## Review fix: runtime schedule coverage

- Replaced the source-grep-only schedule contract with deterministic runtime tests in `server/test/file-scheduling-patient-contract.test.js`.
- Extracted `parseOptionalDate`, `normalizeScheduledAt`, and `buildUpcomingSchedule` into `server/utils/schedule.js` so schedule normalization and upcoming schedule aggregation can be exercised without a live database.
- Rewired `server/index.js` to use `normalizeScheduledAt` at the route boundary and `buildUpcomingSchedule` for dashboard schedule assembly while keeping the existing schema/validation contracts intact.

### Exact verification output

```powershell
PS C:\Users\saulo\Desktop\SAULO\Karol\bright-smiles-website\.worktrees\files-scheduling-patient-workflow\server> node --test test/file-scheduling-patient-contract.test.js
TAP version 13
# Subtest: general uploads use bucket storage and expose separate public/private delivery routes
ok 1 - general uploads use bucket storage and expose separate public/private delivery routes
  ---
  duration_ms: 1.7823
  type: 'test'
  ...
# Subtest: asset storage exports stable reference and signed URL helpers
ok 2 - asset storage exports stable reference and signed URL helpers
  ---
  duration_ms: 109.0167
  type: 'test'
  ...
# Subtest: asset storage parses stable bucket references and rejects malformed ones
ok 3 - asset storage parses stable bucket references and rejects malformed ones
  ---
  duration_ms: 0.9549
  type: 'test'
  ...
# Subtest: asset storage generates stable encoded delivery paths
ok 4 - asset storage generates stable encoded delivery paths
  ---
  duration_ms: 0.2324
  type: 'test'
  ...
# Subtest: asset storage validates delivery requests at the route boundary
ok 5 - asset storage validates delivery requests at the route boundary
  ---
  duration_ms: 0.3807
  type: 'test'
  ...
# Subtest: asset storage cleanup helper deletes uploaded assets when response construction fails
ok 6 - asset storage cleanup helper deletes uploaded assets when response construction fails
  ---
  duration_ms: 0.6335
  type: 'test'
  ...
# Subtest: clinical photo uploads use the private scope and documents expose legacy pdfUrl
ok 7 - clinical photo uploads use the private scope and documents expose legacy pdfUrl
  ---
  duration_ms: 0.7532
  type: 'test'
  ...
# Subtest: schedule normalization handles nullable, ISO, and datetime-local values at runtime
ok 8 - schedule normalization handles nullable, ISO, and datetime-local values at runtime
  ---
  duration_ms: 1.5595
  type: 'test'
  ...
# Subtest: schedule normalization rejects invalid scheduled values with the clear contract message
ok 9 - schedule normalization rejects invalid scheduled values with the clear contract message
  ---
  duration_ms: 0.4492
  type: 'test'
  ...
# Subtest: upcoming schedule helper returns promised fields in ascending order and excludes completed leads
ok 10 - upcoming schedule helper returns promised fields in ascending order and excludes completed leads
  ---
  duration_ms: 0.8556
  type: 'test'
  ...
# Subtest: schedule contract remains wired through schema and server boundaries
ok 11 - schedule contract remains wired through schema and server boundaries
  ---
  duration_ms: 0.9398
  type: 'test'
  ...
1..11
# tests 11
# suites 0
# pass 11
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 206.6204
```

```powershell
PS C:\Users\saulo\Desktop\SAULO\Karol\bright-smiles-website\.worktrees\files-scheduling-patient-workflow\server> npm run build

> bright-smiles-server@1.0.0 build
> npx prisma generate

Prisma schema loaded from prisma\schema.prisma

✔ Generated Prisma Client (v5.22.0) to .\node_modules\@prisma\client in 163ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Help us improve the Prisma ORM for everyone. Share your feedback in a short 2-min survey: https://pris.ly/orm/survey/release-5-22
```
