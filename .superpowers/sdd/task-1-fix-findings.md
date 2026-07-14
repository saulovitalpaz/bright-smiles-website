# Task 1 review fixes

The Task 1 review is not approved. Fix both findings below, keep the approved scope, and do not revert unrelated changes.

## Important: add runtime-focused coverage

Current tests in `server/test/file-scheduling-patient-contract.test.js` only match source text and exported symbol names. Add focused behavioral tests for the core asset contract. At minimum, exercise:

- stable `bucket://<scope>/<key>` reference parsing and rejection of malformed references;
- scope validation for public versus clinical references;
- stable query delivery path generation for encoded references;
- wrong-scope/malformed delivery behavior at the route boundary, or the smallest dependency-free runtime equivalent if importing the full Express app requires a database connection;
- cleanup-on-failure behavior if the storage helper exposes it without requiring a live bucket.

Use real helper behavior rather than tests that only assert regexes. Keep tests deterministic and independent of live bucket credentials. If route extraction is necessary, factor the pure validation/path logic into the utility so it can be tested directly.

## Minor: correct the report metadata

Update `.superpowers/sdd/task-1-report.md` so its implementation commit SHA matches the actual reviewed commit `e3b8e29` (the prior report incorrectly lists `47e1969`). Include the final focused test command and its output.

## Required verification/report

Run:

```powershell
node --test server/test/file-scheduling-patient-contract.test.js server/test/patient-workflow-contract.test.js
```

Also run `npm run build` from `server/`. Append the fix details and exact outputs to `.superpowers/sdd/task-1-report.md`, commit the fixes, and return the new commit SHA plus test summary.
