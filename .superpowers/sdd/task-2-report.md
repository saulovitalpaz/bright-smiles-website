# Task 2 report: preserve patientId through attendance navigation

Status: complete

Initial commit SHA: `aaf2c54`
Review-fix commit SHA: `a723f3f`
Safety-fix commit SHA: `ebb1f30`

Review fix: lead-started attendances now resolve an existing patient by exact normalized phone, then exact CPF when supplied. The authenticated patient list endpoint accepts `phone` and `cpf` identity filters; no name matching is used. Leads without a resolved patient must select one or provide a CPF before saving.

## Changes

- Added `patientId?: number | null` to appointment records and propagated it in both appointment-row and “Ver Evolução” navigation URLs.
- Initialized new attendance drafts from the `patientId` query parameter and preserved the fetched appointment relationship when editing an existing attendance.
- Kept `PatientPicker` as the explicit patient selector and retained `finalPatientId` in appointment save payloads.
- Added contract assertions for patient-aware navigation and evolution-history requests.

## Verification

- `node --test test/patient-workflow-contract.test.js` (initial run): failed as expected because the new patient-link contract was not implemented.
- `node --test test/*.test.js` from `server/`: passed, 3 tests.
- `npm run build` from repository root: passed (`vite build`, 3289 modules transformed).
- Review-fix contract test: passed, including exact phone/CPF query and lead resolver assertions.
- `node --test test/*.test.js` from `server/` after review fix: passed, 4 tests.
- `npm run build` from repository root after review fix: passed (`vite build`, 3289 modules transformed).
- Safety-fix contract and full server tests: passed, 4 tests (`node --test server/test/*.test.js` from repository root).
- Frontend build after safety fix: passed (`npm run build` from repository root; `vite build`, 3289 modules transformed).
- Server build after safety fix: passed (`npm run build` from `server/`; Prisma Client generated successfully).

## Concerns

- Appointment rows without a patient relationship navigate with an empty `patientId` query value; existing-record loading still uses the API's fetched relationship as the source of truth.
- Vite reports existing bundle-size and stale Browserslist-data warnings; no build errors.
- Invalid `phone`/`cpf` query values now return an empty patient list instead of all patients; lead-created patients retain their phone for future exact matching.
