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

## Review follow-up

- The dashboard's successful lead-completion action now invalidates `['leads']` before refetching dashboard stats, so the request list cannot retain a completed lead in its cache.
- Extracted the dashboard stats handler into `server/routes/dashboard.js` with injected Prisma and schedule dependencies. This keeps the existing authenticated route wiring intact while making its response contract testable without a database.
- Replaced the source-only checks with runtime coverage: the test evaluates the actual `fetchClient` implementation against a mocked `fetch` and invokes the dashboard handler against a deterministic mocked Prisma client. No patient data is created or asserted.

### Review follow-up verification output

`node --test server/test/requests-dashboard-contract.test.js`

```text
1..3
# tests 3
# pass 3
# fail 0
```

`npm run lint -- --no-warn-ignored src/pages/AdminLeads.tsx src/pages/AdminDashboard.tsx`

```text
> vite_react_shadcn_ts@0.0.0 lint
> eslint . --no-warn-ignored src/pages/AdminLeads.tsx src/pages/AdminDashboard.tsx
```

`git diff --check` completed with exit code 0.
