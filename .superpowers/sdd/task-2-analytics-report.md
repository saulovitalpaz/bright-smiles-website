## Task 2 analytics frontend report

- Date: 2026-08-15
- Authoritative brief: `.superpowers/sdd/task-2-brief-generated.md`

### Scope completed

- Added `src/lib/analytics.ts` with `trackAnalyticsEvent`, `keepalive: true`, and silent failure handling.
- Added focused helper tests in `src/lib/analytics.test.ts`.
- Replaced duplicated analytics POST calls in:
  - `src/components/PageTracker.tsx`
  - `src/pages/BlogPost.tsx`
  - `src/components/sections/Stories.tsx`
- Reworked `src/pages/AdminAnalytics.tsx` to:
  - load protected stats through `fetchClient('/analytics/stats')`;
  - load public posts through `fetch(`${API_URL}/posts`)`;
  - run both requests in parallel with independent outcomes;
  - keep stats visible when posts fail;
  - show a visible retry state when stats fail;
  - render backend aggregate sections for `topPaths`, `devices`, and `regions`;
  - rename the old neighborhood card to approximate regions;
  - compute percentages with `analytics.totalVisits || 1`.
- Added page tests in `src/pages/AdminAnalytics.test.tsx`.

### TDD evidence

1. Wrote the new helper and page tests first.
2. Ran:

   `npx vitest run src/lib/analytics.test.ts src/pages/AdminAnalytics.test.tsx`

3. Initial RED result:
   - helper module absent;
   - `AdminAnalytics` still used Axios and never called `fetchClient('/analytics/stats')`;
   - no retry alert existed for stats failure.
4. Implemented the minimum production changes above.
5. Re-ran the same focused suite to GREEN.

### Verification

- Focused tests:

  `npx vitest run src/lib/analytics.test.ts src/pages/AdminAnalytics.test.tsx`

  Result: 2 files passed, 5 tests passed.

- Diff hygiene:

  `git diff --check -- src/lib/analytics.ts src/lib/analytics.test.ts src/components/PageTracker.tsx src/pages/BlogPost.tsx src/components/sections/Stories.tsx src/pages/AdminAnalytics.tsx src/pages/AdminAnalytics.test.tsx`

  Result: no whitespace errors; Git only warned that LF will normalize to CRLF on checkout.

- Geolocation guard:

  `rg -n "navigator\.geolocation" src\lib\analytics.ts src\components\PageTracker.tsx src\pages\BlogPost.tsx src\components\sections\Stories.tsx src\pages\AdminAnalytics.tsx src\pages\AdminAnalytics.test.tsx`

  Result: no matches.

### Notes / concerns

- The repository already had unrelated user-owned changes under `.superpowers/sdd`; they were preserved untouched.
- `AdminAnalytics` still shows the existing label typo `Vistantes Únicos` because this task focused on behavior, auth, and aggregation rather than copy edits.
