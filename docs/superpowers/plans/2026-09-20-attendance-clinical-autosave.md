# Attendance Clinical Autosave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restrict nearby analytics to 15 km and automatically persist odontogram and facemap changes after an appointment ID is confirmed.

**Architecture:** Keep the analytics filter in its existing backend aggregation and update the matching frontend copy. Add a focused React hook that debounces and serializes clinical snapshots, while `AdminAttendanceDetail` supplies the authenticated save operation and navigation protection without storing clinical data in browser storage.

**Tech Stack:** React 18, TypeScript, React Router 6, Vitest, Testing Library, Express, Node test runner.

## Global Constraints

- Autosave starts only for a persisted numeric appointment ID and never on `/new`.
- Debounce clinical changes for 1 second and serialize requests.
- Persist clinical data only through the authenticated appointment API; never use local or session storage.
- Read-only users never trigger autosave.
- Pending clinical data must activate browser-exit and internal-navigation protection.
- Follow `SECURITY.md`; patient and clinical data must not enter logs, URLs, fixtures, or source control.

---

### Task 1: Nearby analytics radius

**Files:**
- Modify: `server/test/analytics-contract.test.js`
- Modify: `server/routes/analytics.js`
- Modify: `src/pages/AdminAnalytics.test.tsx`
- Modify: `src/pages/AdminAnalytics.tsx`

**Interfaces:**
- Consumes: existing `createAnalyticsHandlers` aggregation and `AnalyticsStats.nearbyRegions`.
- Produces: nearby results limited by `NEARBY_RADIUS_KM = 15` and matching panel copy.

- [ ] **Step 1: Write failing backend and frontend assertions**

Change the analytics fixture so one event is within 15 km and one is beyond it, expect only the near event in `nearbyRegions`, and change the UI assertion to `/até 15 km da clínica/i`.

- [ ] **Step 2: Verify the tests fail**

Run `node --test server/test/analytics-contract.test.js` and `npm test -- src/pages/AdminAnalytics.test.tsx`. Expect the backend to include the event beyond 15 km and the frontend to still render 200 km.

- [ ] **Step 3: Apply the minimal radius change**

Set `NEARBY_RADIUS_KM` to `15` in `server/routes/analytics.js` and change the `CardDescription` in `AdminAnalytics.tsx` to “em até 15 km da clínica”.

- [ ] **Step 4: Verify the focused tests pass**

Run the same two commands and expect zero failures.

### Task 2: Serialized clinical autosave hook

**Files:**
- Create: `src/hooks/useClinicalAutosave.ts`
- Create: `src/hooks/useClinicalAutosave.test.tsx`

**Interfaces:**
- Consumes: `enabled: boolean`, `snapshot: T`, `save(snapshot: T): Promise<void>`, and optional `delayMs`.
- Produces: `{ status, pending, flush }`, where `status` is `idle | pending | saving | saved | error`, `pending` reflects unconfirmed data, and `flush(): Promise<boolean>` immediately attempts the latest version.

- [ ] **Step 1: Test the disabled and debounce behavior**

Render a harness with fake timers. Assert that changing the snapshot while disabled performs no save; after enabling and changing it, 999 ms performs no save and 1000 ms performs one save with the newest snapshot.

- [ ] **Step 2: Run the hook test and verify RED**

Run `npm test -- src/hooks/useClinicalAutosave.test.tsx`. Expect failure because the hook module does not exist.

- [ ] **Step 3: Implement baseline tracking and debounce**

Use refs for the initial confirmed snapshot and timer, compare serialized clinical snapshots, and schedule the supplied save after `delayMs`. Do not persist the snapshot outside React memory.

- [ ] **Step 4: Verify debounce tests pass**

Run the focused hook test and expect zero failures.

- [ ] **Step 5: Test serialization, failure, and flush**

Add tests proving an edit during an unresolved save queues the newest snapshot, rejection leaves `pending === true` with `status === "error"`, and `flush()` returns true only after the current version is confirmed.

- [ ] **Step 6: Verify the new tests fail for the expected missing behavior**

Run the focused hook test. Expect the queued snapshot, error state, or flush assertion to fail.

- [ ] **Step 7: Implement serialized saves**

Track the latest snapshot and monotonically increasing version in refs. Allow one request at a time; after completion, immediately save again when the version advanced. On success mark only the submitted version confirmed. On failure retain pending state. Implement `flush()` by clearing the timer and draining the current latest version.

- [ ] **Step 8: Verify all hook tests pass**

Run `npm test -- src/hooks/useClinicalAutosave.test.tsx` and expect zero failures.

### Task 3: Integrate autosave and exit protection

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/AdminAttendanceDetail.tsx`
- Modify: `src/pages/AdminAttendanceFlow.test.tsx`

**Interfaces:**
- Consumes: `useClinicalAutosave` from Task 2 and existing `fetchClient('/appointments/:id', { method: 'PUT' })`.
- Produces: debounced authenticated clinical saves, visible status, `beforeunload` protection, and blocked internal navigation until save or explicit discard.

- [ ] **Step 1: Add failing integration tests**

Mock `Odontogram` and `FacialHarmonizationWorkspace` with buttons that invoke `onChange`. Mount persisted and new routes through a data router. Assert that persisted edits issue a PUT containing `dentalNotes` and `facialNotes` after 1 second, `/new` issues none, read-only mode issues none, and a pending change prevents `beforeunload`.

- [ ] **Step 2: Run the integration tests and verify RED**

Run `npm test -- src/pages/AdminAttendanceFlow.test.tsx`. Expect no autosave request or status indicator.

- [ ] **Step 3: Add the authenticated clinical save operation**

Build a clinical snapshot from `data.dentalNotes` and `data.facialNotes`. Enable the hook only when `id` parses to a positive integer and the user can edit. Save with `fetchClient('/appointments/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snapshot) })`; reject non-OK responses without logging clinical content.

- [ ] **Step 4: Add visible save state and browser-exit protection**

Render concise `aria-live` text for saving, saved, and failed states. Register `beforeunload` only while `pending` is true, call `preventDefault()`, and set `event.returnValue` for browser compatibility.

- [ ] **Step 5: Add internal navigation protection**

Use React Router's blocker only when pending. When blocked, call `flush()` immediately. Proceed automatically after success; after failure show the existing alert-dialog component with actions to remain or discard and continue.

- [ ] **Step 6: Verify the integration tests pass**

Run `npm test -- src/pages/AdminAttendanceFlow.test.tsx` and expect zero failures.

### Task 4: Full validation and delivery

**Files:**
- Modify if needed: files touched in Tasks 1–3.

**Interfaces:**
- Consumes: all completed changes.
- Produces: a verified main-branch commit pushed to `origin/main`.

- [ ] **Step 1: Run frontend tests and lint**

Run `npm test` and `npm run lint`. Expect zero failures and zero lint errors caused by the change.

- [ ] **Step 2: Run backend tests**

Run `node --test server/test/*.test.js`. Expect zero failures.

- [ ] **Step 3: Run production build and repository checks**

Run `npm run build`, the repository secret scan available in project scripts or a tracked-files pattern scan when no script exists, and `git diff --check`. Expect exit code 0 and no exposed secrets.

- [ ] **Step 4: Review security and diff**

Confirm the endpoint remains behind `authenticateToken` and `authorizeRole(['admin', 'dentist'])`, no clinical payload is logged, no browser storage contains clinical data, and only intended files changed.

- [ ] **Step 5: Commit and push**

Stage only the implementation, tests, and plan. Commit with `feat: autosave clinical maps` and run `git push origin main`. Confirm `origin/main` points to the new commit.
