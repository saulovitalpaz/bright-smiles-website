# Task 1 Report: Authenticated Requests and Dashboard Counts

## Implementation

- Replaced every lead read, update, and delete request in `AdminLeads` with `fetchClient`, preserving the browser's HttpOnly-cookie authentication flow.
- Added JSON error-body parsing with the existing Portuguese fallback messages for lead mutations.
- Invalidated both the `leads` and `dashboard-stats` React Query keys after lead updates and deletions.
- Converted dashboard stats loading to the shared `dashboard-stats` React Query key so invalidation causes the next mounted/active dashboard to refresh.
- Added a database-backed `pendingLeadCount` to `GET /dashboard/stats` for `new`, `contacted`, and `scheduled` leads; the Solicitações card uses it with a `0` fallback only while older responses lack the field.

## Regression coverage

- Added `server/test/requests-dashboard-contract.test.js`, which verifies the credentialed lead-client contract, mutation cache invalidation, the database status count, API response field, and that the card no longer derives its total from `recentLeads`.

## Verification

- `node --test server/test/requests-dashboard-contract.test.js` — 2 passing tests.
- `npm run lint -- --no-warn-ignored src/pages/AdminLeads.tsx src/pages/AdminDashboard.tsx` — passed.
- `git diff --check` — passed.

## Scope and security

- No schema, finance, calendar-creation, role, or authorization changes.
- The existing authenticated dashboard and lead route guards remain unchanged.
