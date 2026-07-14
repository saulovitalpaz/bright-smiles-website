# Task 5 Report

## Outcome

Implemented the Task 5 server-side fix in the isolated `feature/files-scheduling-patient-workflow` worktree with TDD.

## What changed

- Added a failing regression contract test for patient creation to require `consentDate` normalization before Prisma persistence.
- Updated `POST /patients` to:
  - destructure `consentDate` explicitly,
  - normalize it to `Date | null` without sending `undefined` to Prisma,
  - reject invalid consent dates with HTTP 400,
  - reuse the normalized payload for both `upsert.update` and `upsert.create`,
  - return decrypted display-safe `cpf` and `history`.
- Reviewed `src/pages/AdminPatients.tsx` against the Task 5 brief and left it unchanged because it already:
  - parses API `error` text for failed save/delete calls,
  - resets the form after save success,
  - reloads using the current `search` term,
  - preserves the current CPF search and explicit picker/editing behavior.

## Verification

- `node --test server/test/file-scheduling-patient-contract.test.js`
  - initial red run: 13 passed, 1 failed (`patient create converts consentDate before Prisma persistence`)
  - green run after fix: 14 passed, 0 failed
- `npm run build`
  - passed

## Notes / concerns

- `npm run build` still emits pre-existing warnings about stale Browserslist data and large JS chunks; no change made here because they are outside Task 5 scope.
