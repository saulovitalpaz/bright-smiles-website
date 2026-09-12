# Task 1 analytics report

Date: 2026-08-15
Authoritative brief: `.superpowers/sdd/task-1-brief-generated.md`

## Scope completed

- Created `server/routes/analytics.js`
- Replaced inline analytics collection/statistics handlers in `server/index.js`
- Added `server/test/analytics-contract.test.js`

## TDD evidence

### RED

Observed before implementation existed:

```powershell
node --test test/analytics-contract.test.js
```

```text
TAP version 13
# node:internal/modules/cjs/loader:1368
#   throw err;
#   ^
# Error: Cannot find module '../routes/analytics'
# Require stack:
# - C:\Users\saulo\Desktop\SAULO\Karol\bright-smiles-website\server\test\analytics-contract.test.js
# Subtest: test\analytics-contract.test.js
not ok 1 - test\analytics-contract.test.js
1..1
# tests 1
# pass 0
# fail 1
```

This was the expected contract RED state: the test helper loaded correctly and failed specifically because `server/routes/analytics.js` did not exist yet.

### GREEN

Focused contract verification:

```powershell
node --test server/test/analytics-contract.test.js
```

```text
TAP version 13
# Subtest: collect rejects invalid event types without persisting analytics data
ok 1 - collect rejects invalid event types without persisting analytics data
# Subtest: collect accepts valid events, persists a fingerprint, stores geo fields and never returns the saved event
ok 2 - collect accepts valid events, persists a fingerprint, stores geo fields and never returns the saved event
# Subtest: stats aggregates only pageviews, excludes story events from sources and omits individual event payloads
ok 3 - stats aggregates only pageviews, excludes story events from sources and omits individual event payloads
1..3
# tests 3
# pass 3
# fail 0
```

Required contract + security verification:

```powershell
node --test server/test/analytics-contract.test.js server/test/security-foundations.test.js
```

```text
TAP version 13
# Subtest: collect rejects invalid event types without persisting analytics data
ok 1 - collect rejects invalid event types without persisting analytics data
# Subtest: collect accepts valid events, persists a fingerprint, stores geo fields and never returns the saved event
ok 2 - collect accepts valid events, persists a fingerprint, stores geo fields and never returns the saved event
# Subtest: stats aggregates only pageviews, excludes story events from sources and omits individual event payloads
ok 3 - stats aggregates only pageviews, excludes story events from sources and omits individual event payloads
# Subtest: clinical, operational and administrative endpoints require least-privilege roles
ok 4 - clinical, operational and administrative endpoints require least-privilege roles
# Subtest: content mutation endpoints are admin-only and public testimonials are approved-only
ok 5 - content mutation endpoints are admin-only and public testimonials are approved-only
# Subtest: production CORS does not grant browser credentials to arbitrary Railway domains
ok 6 - production CORS does not grant browser credentials to arbitrary Railway domains
# Subtest: audit logging records outcome metadata without request bodies or credentials
ok 7 - audit logging records outcome metadata without request bodies or credentials
# Subtest: server foundations fail closed in production and set API security headers
ok 8 - server foundations fail closed in production and set API security headers
# Subtest: browser authentication uses an HttpOnly cookie instead of returning a reusable token
ok 9 - browser authentication uses an HttpOnly cookie instead of returning a reusable token
# Subtest: public testimonial submission cannot self-approve or mass-assign moderation fields
ok 10 - public testimonial submission cannot self-approve or mass-assign moderation fields
1..10
# tests 10
# pass 10
# fail 0
```

## Review fix: bounded pruning for public analytics caches

### RED

Focused regression before the fix:

```powershell
node --test server/test/analytics-contract.test.js
```

```text
TAP version 13
# Subtest: memory rate limiter prunes expired buckets before growing indefinitely
not ok 4 - memory rate limiter prunes expired buckets before growing indefinitely
  error: "Cannot read properties of undefined (reading 'createMemoryRateLimiter')"
# Subtest: default geo lookup prunes expired cache entries and reuses bounded storage
not ok 5 - default geo lookup prunes expired cache entries and reuses bounded storage
  error: "Cannot read properties of undefined (reading 'createDefaultGeoLookup')"
1..5
# tests 5
# pass 3
# fail 2
```

This confirmed the current module had no testable pruning hooks and no proof that expired `Map` entries were reclaimed.

### GREEN

After adding bounded pruning plus focused coverage:

```powershell
node --test server/test/analytics-contract.test.js
```

```text
TAP version 13
# Subtest: collect rejects invalid event types without persisting analytics data
ok 1 - collect rejects invalid event types without persisting analytics data
# Subtest: collect accepts valid events, persists a fingerprint, stores geo fields and never returns the saved event
ok 2 - collect accepts valid events, persists a fingerprint, stores geo fields and never returns the saved event
# Subtest: stats aggregates only pageviews, excludes story events from sources and omits individual event payloads
ok 3 - stats aggregates only pageviews, excludes story events from sources and omits individual event payloads
# Subtest: memory rate limiter prunes expired buckets before growing indefinitely
ok 4 - memory rate limiter prunes expired buckets before growing indefinitely
# Subtest: default geo lookup prunes expired cache entries and reuses bounded storage
ok 5 - default geo lookup prunes expired cache entries and reuses bounded storage
1..5
# tests 5
# pass 5
# fail 0
```

Required verification after the review fix:

```powershell
node --test server/test/analytics-contract.test.js server/test/security-foundations.test.js
```

```text
TAP version 13
# tests 12
# pass 12
# fail 0
```

Additional hygiene check:

```powershell
git diff --check -- server/routes/analytics.js server/index.js server/test/analytics-contract.test.js
```

```text
warning: in the working copy of 'server/index.js', LF will be replaced by CRLF the next time Git touches it
```

No diff-format errors were reported.

## Implementation summary

- Moved analytics logic into `createAnalyticsHandlers({ prisma, secret, geoLookup, rateLimiter })`.
- `collect` now:
  - trusts `req.ip` instead of request body or direct `x-forwarded-for` parsing;
  - accepts only `pageview`, `blog_view`, and `story_view`;
  - hashes visitors with HMAC SHA-256 using `analytics-visitor:${ip}`;
  - limits path/source/user-agent lengths;
  - filters common bot user agents;
  - avoids external geo lookup for loopback/private/reserved addresses;
  - uses a deterministic in-memory rate limiter;
  - returns `202` without exposing persisted rows.
- Default geo lookup now:
  - uses only HTTPS `ipwho.is`;
  - uses `AbortController` timeout protection;
  - validates `success`;
  - rounds coordinates to two decimals;
  - caches by visitor fingerprint for 24 hours.
- Review fix:
  - expired entries are pruned in bounded batches at operation time instead of surviving forever in memory;
  - both the rate limiter and the geo cache now enforce deterministic maximum entry counts;
  - the oldest remaining entries are evicted only when the bounded store still exceeds its configured cap after pruning;
  - focused tests now prove expired entries are recycled instead of accumulating.
- `stats` now:
  - returns only aggregate fields;
  - hashes legacy IP values in memory when needed;
  - counts traffic aggregates only from `pageview`;
  - classifies devices as `mobile`, `tablet`, `desktop`, or `other`;
  - omits individual events from responses.

## Self-review

- The old inline implementation persisted raw IP data and returned individual events; the new route removes both behaviors.
- The authenticated `/analytics/stats` registration remains protected by `authenticateToken` plus `authorizeRole(['admin', 'manager'])`.
- Legacy rows with `location` but missing explicit `city/state` still contribute to `locations` and `regions`.
- The review fix keeps the original 24-hour geo TTL and deterministic rate-limit window while bounding retained `Map` entries.
- No frontend or construction-document files were changed for this task.

## Commit

- `7f25b5e` — `fix: harden analytics collection and aggregation`

## Concerns

- No functional blocker found.
- The repository still has unrelated user-owned files outside this task (`.superpowers/sdd/task-1-brief.md` modified and `.superpowers/sdd/task-1-brief-generated.md` untracked), so only the three Task 1 source/test files should be committed.
