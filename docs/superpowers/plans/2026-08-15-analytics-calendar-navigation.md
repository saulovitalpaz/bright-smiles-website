# Analytics, Calendário e Navegação Administrativa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restaurar a coleta e leitura de analytics com localização aproximada por IP sem permissão do navegador e separar a lista de consultas do calendário, reorganizando o sidebar conforme a especificação aprovada.

**Architecture:** O backend terá um módulo isolado para coleta, fingerprint HMAC, cache e agregações; a rota de coleta continuará pública apenas para eventos anonimizados e a rota de estatísticas seguirá privada. O frontend usará um helper de analytics e dividirá as responsabilidades entre `AdminAppointments` (lista) e `AdminCalendar` (agenda), com rotas e navegação explícitas.

**Tech Stack:** Express, Prisma, Node `crypto`/`fetch`, React 18, React Router 6, TypeScript, Vitest, Testing Library, Tailwind/shadcn.

## Global Constraints

- Seguir `SECURITY.md`: dados de paciente, autenticação e armazenamento são sensíveis; não registrar IP bruto, HMAC, tokens ou payloads em logs/testes/chat.
- Não usar `navigator.geolocation`, GPS ou pedir permissão de localização.
- Registros novos persistem somente fingerprint HMAC; registros legados não serão apagados nem migrados neste ciclo.
- `/analytics` é uma rota pública excepcional apenas para coleta validada; `/analytics/stats` permanece privado para `admin`/`manager`.
- A geolocalização usa IPWhoIs por HTTPS, com timeout, cache de 24 horas e fallback que não perde o evento.
- Percentuais de tráfego usam somente eventos `pageview` como denominador.
- `AdminAppointments` não renderiza nem carrega calendário; `AdminCalendar` concentra as operações de agenda.
- Não adicionar dependências novas sem necessidade; preservar arquivos não rastreados, backups e documentação existente.
- Antes de declarar conclusão: testes frontend/backend, lint, build, testes de backup, secret scan e `git diff --check`.

---

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

## Task 2: Centralizar o envio e corrigir a página de analytics

**Files:**
- Create: `src/lib/analytics.ts`
- Create: `src/lib/analytics.test.ts`
- Modify: `src/components/PageTracker.tsx`
- Modify: `src/pages/BlogPost.tsx`
- Modify: `src/components/sections/Stories.tsx`
- Modify: `src/pages/AdminAnalytics.tsx`
- Create: `src/pages/AdminAnalytics.test.tsx`

**Interfaces:**
- Produces `trackAnalyticsEvent(event: { type: AnalyticsEventType; path: string; source?: string }): void`.
- `trackAnalyticsEvent` sends JSON to `${API_URL}/analytics` with `fetch`, `keepalive: true`, and never throws to the UI.
- `AdminAnalytics` reads protected data through `fetchClient('/analytics/stats')` and public posts through `fetch(`${API_URL}/posts`)`.

- [ ] **Step 1: Write failing helper and page tests**

Test that the helper sends the exact event contract and silently handles fetch failure:

```ts
it('sends a normalized event with keepalive', () => {
  trackAnalyticsEvent({ type: 'pageview', path: '/blog', source: 'Google' });
  expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/analytics`, expect.objectContaining({
    method: 'POST',
    keepalive: true,
    body: JSON.stringify({ type: 'pageview', path: '/blog', source: 'Google' })
  }));
});
```

Mock `fetchClient` and `fetch` in `AdminAnalytics.test.tsx`; assert that the stats request goes through `fetchClient('/analytics/stats')`, the page renders nonzero stats from the response, and a posts failure leaves the metrics visible.

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```powershell
npx vitest run src/lib/analytics.test.ts src/pages/AdminAnalytics.test.tsx
```

Expected: FAIL because the helper/test page behavior is absent or still uses raw Axios calls.

- [ ] **Step 3: Implement the helper and replace duplicate senders**

Create `src/lib/analytics.ts`:

```ts
import { API_URL } from '@/lib/api';

export type AnalyticsEventType = 'pageview' | 'blog_view' | 'story_view';
export interface AnalyticsEvent { type: AnalyticsEventType; path: string; source?: string; }

export const trackAnalyticsEvent = (event: AnalyticsEvent) => {
  void fetch(`${API_URL}/analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify(event),
  }).catch(() => undefined);
};
```

Use it in `PageTracker`, `BlogPost` and `Stories`, preserving each existing event type/path. `PageTracker` must keep its UTM/referrer source inference and effect dependency on pathname.

- [ ] **Step 4: Replace `AdminAnalytics` loading and aggregation**

Remove the direct Axios import and dashboard request. Load stats and posts in parallel with independent outcomes; use a visible error/retry state for stats and a local empty/error state for posts. Preserve cards and add the aggregate sections from the backend response (`topPaths`, `devices`, regions) while renaming the neighborhood card to approximate regions. Percentages must use `analytics.totalVisits || 1` and never divide content-event totals.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run:

```powershell
npx vitest run src/lib/analytics.test.ts src/pages/AdminAnalytics.test.tsx
```

Expected: all helper/page tests pass without `navigator.geolocation` references.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/analytics.ts src/lib/analytics.test.ts src/components/PageTracker.tsx src/pages/BlogPost.tsx src/components/sections/Stories.tsx src/pages/AdminAnalytics.tsx src/pages/AdminAnalytics.test.tsx
git commit -m "fix: restore authenticated analytics dashboard"
```

---

## Task 3: Separar a lista de consultas do calendário

**Files:**
- Create: `src/pages/AdminCalendar.tsx`
- Create: `src/pages/AdminCalendar.test.tsx`
- Modify: `src/pages/AdminAppointments.tsx`
- Modify: `src/pages/AdminAppointments.test.tsx`

**Interfaces:**
- `AdminAppointments` owns only appointment list state, search text, date filter, deletion and detail navigation.
- `AdminCalendar` owns current calendar state, leads, staff, manual appointment form, drag/drop confirmation and professional editing.
- Both use `fetchClient` and preserve existing `CalendarView`/`buildCalendarEntries` interfaces.

- [ ] **Step 1: Write failing tests for list-only behavior and date filtering**

Add tests that render `AdminAppointments` with appointment records on different dates and assert:

```ts
await user.type(screen.getByLabelText('Pesquisar paciente ou CPF'), 'Marina');
expect(screen.getByText('Marina Alves')).toBeInTheDocument();
await user.clear(screen.getByLabelText('Pesquisar paciente ou CPF'));
await user.type(screen.getByLabelText('Filtrar por data'), '2026-08-20');
expect(screen.getByText('Consulta de avaliação')).toBeInTheDocument();
expect(screen.queryByText('Consulta de retorno')).not.toBeInTheDocument();
expect(screen.queryByRole('button', { name: 'Criar horário de teste' })).not.toBeInTheDocument();
```

Add `AdminCalendar.test.tsx` covering the existing manual create success flow and failed POST preserving the modal values.

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```powershell
npx vitest run src/pages/AdminAppointments.test.tsx src/pages/AdminCalendar.test.tsx
```

Expected: FAIL because the current list still renders the calendar and has no date filter/new page component.

- [ ] **Step 3: Extract calendar responsibilities**

Move the calendar-specific imports, state, data loading, update/create handlers, dialogs and `CalendarView` render from `AdminAppointments.tsx` into `AdminCalendar.tsx`. Keep the existing payload validation and refresh/invalidation sequence. The new component must render:

```tsx
<AdminLayout title="Calendário">
  <div className="admin-card p-6 w-full">
    <CalendarView ... />
  </div>
  {/* existing create, drop confirmation and professional dialogs */}
</AdminLayout>
```

Do not alter backend payload names or existing success/error messages while extracting.

- [ ] **Step 4: Reduce `AdminAppointments` to list and add date filter**

Remove `CalendarView`, leads/staff loading, calendar state, calendar dialogs and `useSearchParams` view switching. Add `dateFilter` state and a labeled `<Input type="date" aria-label="Filtrar por data" />`. Filter with the local calendar day of `record.scheduledAt || record.date`, while the patient input continues matching name or CPF. Keep the existing list, detail navigation, total and authorized delete/new actions.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run:

```powershell
npx vitest run src/pages/AdminAppointments.test.tsx src/pages/AdminCalendar.test.tsx
```

Expected: list tests prove the calendar is absent, date/name filters work, and calendar tests prove create/update behavior remains intact.

- [ ] **Step 6: Commit**

```powershell
git add src/pages/AdminAppointments.tsx src/pages/AdminAppointments.test.tsx src/pages/AdminCalendar.tsx src/pages/AdminCalendar.test.tsx
git commit -m "refactor: separate appointment list from calendar"
```

---

## Task 4: Registrar rotas e reorganizar o sidebar

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/admin/AdminLayout.tsx`
- Modify: `src/pages/AdminDashboard.tsx`
- Modify: `src/hooks/useAuth.tsx`
- Create: `src/components/admin/navigation-contract.test.tsx`

**Interfaces:**
- Registers `/admin/calendario` with the same role protection as `/admin/consultas`.
- Dashboard calendar shortcut navigates to `/admin/calendario`.
- Sidebar hierarchy is `Atendimentos > Consultas, Pacientes, Prescrição, Termos & Documentos` and `Configurações > Geral, Equipe`.

- [ ] **Step 1: Write failing navigation contract tests**

Assert source-level contracts in a small test that reads the four files with `fs.readFileSync`:

```ts
expect(appSource).toMatch(/path="\/admin\/calendario"/);
expect(dashboardSource).toContain("navigate('/admin/calendario')");
expect(layoutSource).toMatch(/label:\s*["']Atendimentos["']/);
expect(layoutSource).toMatch(/label:\s*["']Pacientes["'][\s\S]*href:\s*["']\/admin\/pacientes["']/);
expect(layoutSource).toMatch(/label:\s*["']Configurações["']/);
expect(layoutSource).toMatch(/label:\s*["']Equipe["'][\s\S]*href:\s*["']\/admin\/users["']/);
```

Also assert no `navigate('/admin/consultas?view=calendar')` remains in the dashboard source and that `MANAGER_ALLOWED_ROUTES` is not expanded with clinical calendar access.

- [ ] **Step 2: Run focused test and confirm RED**

Run:

```powershell
npx vitest run src/components/admin/navigation-contract.test.tsx
```

Expected: FAIL because the route, labels and dashboard target still use the old structure.

- [ ] **Step 3: Register the calendar route and update navigation**

Import `AdminCalendar` in `App.tsx` and add:

```tsx
<Route path="/admin/calendario" element={<RoleProtectedRoute><AdminCalendar /></RoleProtectedRoute>} />
```

In `AdminLayout`, make `Atendimentos` the parent with the existing consultation/prescription/document links plus patients, make `Calendário` a top-level item, and make `Configurações` the parent of `Geral` and `Equipe`. Preserve `adminOnly` flags and active route matching for detail paths.

- [ ] **Step 4: Update dashboard shortcut and keep role boundaries**

Change the card shortcut to `navigate('/admin/calendario')`. Do not add the calendar route to `MANAGER_ALLOWED_ROUTES`; the existing `RoleProtectedRoute` must continue redirecting managers away from clinical routes.

- [ ] **Step 5: Run focused test and confirm GREEN**

Run:

```powershell
npx vitest run src/components/admin/navigation-contract.test.tsx
```

Expected: PASS with the exact route and hierarchy assertions.

- [ ] **Step 6: Commit**

```powershell
git add src/App.tsx src/components/admin/AdminLayout.tsx src/pages/AdminDashboard.tsx src/hooks/useAuth.tsx src/components/admin/navigation-contract.test.tsx
git commit -m "feat: add standalone calendar and nested admin navigation"
```

---

## Task 5: Integração e verificação de segurança

**Files:**
- Modify: `.superpowers/sdd/analytics-calendar-progress.md`
- No production source changes unless a verification command identifies a regression tied to Tasks 1–4.

**Interfaces:**
- Consumes all task commits and their focused tests.
- Produces a clean whole-branch verification report and a final reviewer package.

- [ ] **Step 1: Check the progress ledger and working tree**

Run:

```powershell
Get-Content -Raw -LiteralPath '.superpowers/sdd/analytics-calendar-progress.md'
git status --short
```

Expected: Tasks 1–4 have reviewer-clean entries and only intentional task commits are present.

- [ ] **Step 2: Run all frontend tests and lint/build**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: all Vitest tests pass, ESLint exits 0, and Vite produces `dist` without TypeScript/build errors.

- [ ] **Step 3: Run all backend/security/backup checks**

Run:

```powershell
node --test server/test/*.test.js
node --test backup/test/*.test.js
rg -n --hidden --glob '!.git/**' --glob '!node_modules/**' --glob '!dist/**' "(sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|JWT_SECRET=.{0,10}[A-Za-z0-9])" .
git diff --check
```

Expected: backend and backup tests pass, the secret scan returns no newly introduced credential matches, and `git diff --check` is clean. Do not print secret values while investigating a match.

- [ ] **Step 4: Review changed files against `SECURITY.md`**

Confirm manually that:

- no raw IP, HMAC, cookies, tokens, patient data or provider response is logged or returned;
- stats still has `authenticateToken` and `authorizeRole(['admin', 'manager'])`;
- the public collector accepts only the three event types and never exposes persistence details;
- no browser geolocation API or permission prompt exists;
- clinical routes remain inaccessible to managers and anonymous users.

- [ ] **Step 5: Dispatch final whole-branch review**

Create a review package from the merge-base commit through `HEAD` and dispatch the final code reviewer with the spec, plan, progress ledger and all verification output. Resolve every Critical/Important finding with one fix subagent, rerun the covering tests, and re-review before claiming completion.

- [ ] **Step 6: Record final verification**

Append to `.superpowers/sdd/analytics-calendar-progress.md`:

```text
Final verification: npm test, npm run lint, npm run build, backend tests, backup tests, secret scan and git diff --check passed on the verified HEAD commit.
```

Do not mark the goal complete until the final reviewer approves and the verification commands have current passing output.
