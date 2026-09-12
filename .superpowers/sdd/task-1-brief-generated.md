## Task 1: Modularizar e proteger a coleta e as estatísticas de analytics

**Files:**
- Create: `server/routes/analytics.js`
- Modify: `server/index.js:1-60,1674-1795`
- Create: `server/test/analytics-contract.test.js`
- Create: `.superpowers/sdd/analytics-calendar-progress.md`

**Interfaces:**
- Produces `createAnalyticsHandlers({ prisma, secret, geoLookup, rateLimiter })` returning `{ collect, stats }` for registration in `server/index.js`.
- `geoLookup(ip)` resolves `{ city, state, country, latitude, longitude } | null` and is the only function that calls IPWhoIs.
- `collect` accepts `POST /analytics` payload `{ type, path, source }` and responds `202` without the persisted event.
- `stats` accepts an authenticated request and returns aggregate fields only: `totalVisits`, `uniqueVisitors`, `leadsCount`, `conversionRate`, `sources`, `locations`, `regions`, `topPaths`, `devices`.

- [ ] **Step 1: Write failing unit/contract tests**

Add tests with `node:test` and fake Prisma/response objects. Cover these exact behaviors:

```js
test('collect rejects an unsupported event type before persistence', async () => {
  const prisma = { analyticsEvent: { create: async () => { throw new Error('must not persist'); } } };
  const { collect } = createAnalyticsHandlers({ prisma, secret: 'test-secret', geoLookup: async () => null });
  const response = makeResponse();

  await collect({ body: { type: 'patient_export', path: '/', source: 'x' }, ip: '203.0.113.5', headers: {} }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(prisma.analyticsEvent.create.called, undefined);
});

test('collect persists a fingerprint and approximate location without raw IP', async () => {
  const rows = [];
  const prisma = { analyticsEvent: { create: async ({ data }) => { rows.push(data); return data; } } };
  const { collect } = createAnalyticsHandlers({
    prisma,
    secret: 'test-secret',
    geoLookup: async () => ({ city: 'Belo Horizonte', state: 'Minas Gerais', country: 'BR', latitude: -19.92, longitude: -43.94 })
  });
  const response = makeResponse();

  await collect({ body: { type: 'pageview', path: '/', source: 'Google' }, ip: '198.51.100.10', headers: { 'user-agent': 'Mozilla/5.0' } }, response);

  assert.equal(response.statusCode, 202);
  assert.equal(rows[0].ip.length, 64);
  assert.notEqual(rows[0].ip, '198.51.100.10');
  assert.equal(rows[0].city, 'Belo Horizonte');
  assert.equal(response.body.event, undefined);
});

test('stats counts only pageviews for traffic percentages and omits individual events', async () => {
  const prisma = {
    analyticsEvent: { findMany: async () => [
      { type: 'pageview', source: 'Google', path: '/', ip: 'legacy-ip', location: 'Belo Horizonte, MG - BR', state: 'Minas Gerais', userAgent: 'Mozilla/5.0 (iPhone)', date: new Date() },
      { type: 'story_view', source: 'Direto', path: '/story/1', ip: 'legacy-ip', location: 'Belo Horizonte, MG - BR', state: 'Minas Gerais', userAgent: 'Mozilla/5.0', date: new Date() }
    ] },
    lead: { count: async () => 1 }
  };
  const { stats } = createAnalyticsHandlers({ prisma, secret: 'test-secret', geoLookup: async () => null });
  const response = makeResponse();

  await stats({ }, response);

  assert.equal(response.body.totalVisits, 1);
  assert.equal(response.body.sources.Google, 1);
  assert.equal(response.body.sources.Direto, undefined);
  assert.equal(response.body.recentEvents, undefined);
  assert.equal(response.body.uniqueVisitors, 1);
});
```

The test helper must expose `status(code)`, `json(body)` and `sendStatus(code)` while recording `statusCode` and `body`; use real handler code, not mocks of the handler itself.

- [ ] **Step 2: Run the focused tests and confirm the expected RED state**

Run:

```powershell
node --test server/test/analytics-contract.test.js
```

Expected: FAIL because `server/routes/analytics.js` and the handler contract do not exist yet. Fix test syntax/setup errors until the failure is specifically about the missing implementation.

- [ ] **Step 3: Implement the isolated analytics module**

Implement `server/routes/analytics.js` with these rules:

```js
const crypto = require('node:crypto');

const EVENT_TYPES = new Set(['pageview', 'blog_view', 'story_view']);
const MAX_PATH_LENGTH = 512;
const MAX_SOURCE_LENGTH = 120;
const hashVisitor = (ip, secret) => crypto.createHmac('sha256', secret).update(`analytics-visitor:${ip}`).digest('hex');

const normalizeEvent = (body) => {
  const type = typeof body?.type === 'string' ? body.type.trim() : 'pageview';
  const path = typeof body?.path === 'string' ? body.path.trim() : '/';
  const source = typeof body?.source === 'string' ? body.source.trim().slice(0, MAX_SOURCE_LENGTH) : 'Direto';
  if (!EVENT_TYPES.has(type) || !path.startsWith('/') || path.length > MAX_PATH_LENGTH) return null;
  return { type, path, source: source || 'Direto' };
};
```

Use `req.ip` (not a client-provided body field), reject loopback/private/reserved addresses for external lookup, identify common bot user agents, and keep the rate limiter in memory with deterministic expiry. `geoLookup` must call `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,city,region,country,latitude,longitude`, use an `AbortController` timeout, validate `success`, and round coordinates to two decimal places. Persist `location` as `city, state - country` only when valid, while saving `city`, `state`, `latitude`, `longitude`, `userAgent.slice(0, 512)`, and the HMAC fingerprint.

For legacy rows in `stats`, normalize every `ip` to the existing 64-character fingerprint when it already has that shape; otherwise hash it in memory with the same secret. Aggregate `pageview` rows for sources, locations, regions, top paths and devices. Device classification must be a small pure function returning `mobile`, `tablet`, `desktop` or `other`.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run:

```powershell
node --test server/test/analytics-contract.test.js
```

Expected: all analytics contract tests pass with no raw IP in persisted test rows or response bodies.

- [ ] **Step 5: Register handlers and remove the old inline implementation**

In `server/index.js`, import `createAnalyticsHandlers`, create handlers after `prisma`/`JWT_SECRET` are available, and replace the inline `/analytics` and `/analytics/stats` blocks with:

```js
const analyticsHandlers = createAnalyticsHandlers({
  prisma,
  secret: JWT_SECRET,
  geoLookup: undefined
});

app.post('/analytics', analyticsHandlers.collect);
app.get('/analytics/stats', authenticateToken, authorizeRole(['admin', 'manager']), analyticsHandlers.stats);
```

The factory may provide its own default `geoLookup`; keep the authenticated middleware on stats exactly as shown. Do not log provider responses or identifiers.

- [ ] **Step 6: Run backend contract/security tests and commit**

Run:

```powershell
node --test server/test/analytics-contract.test.js server/test/security-foundations.test.js
```

Expected: PASS with the existing analytics authorization assertion still green.

Commit:

```powershell
git add server/routes/analytics.js server/index.js server/test/analytics-contract.test.js
git commit -m "fix: harden analytics collection and aggregation"
```

Append `Task 1: complete (commits recorded in git log, review clean)` to `.superpowers/sdd/analytics-calendar-progress.md` only after the task reviewer approves.

---

