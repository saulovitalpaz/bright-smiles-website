# Files, Scheduling, and Patient Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make uploaded media reliable and privacy-aware, add scheduled consultation management to the existing lead/quick-start workflow, and repair patient, navigation, and temporal-evolution behavior.

**Architecture:** Introduce one S3-compatible bucket asset layer with explicit public and private references. Public references resolve through an unauthenticated bucket-backed route; clinical references are resolved only after authentication and are fetched by the frontend as short-lived object URLs. Add `scheduledAt` to leads and appointments while retaining `createdAt` and the existing clinical `date`, then expose upcoming items through the dashboard and existing quick-start route.

**Tech Stack:** Express, Prisma/PostgreSQL, AWS SDK S3 client, Multer memory storage, React, TypeScript, React Router, TanStack Query, Tailwind CSS, Node built-in test runner, Vite.

## Global Constraints

- Public uploads (blog, treatments, stories, and logo) use the configured bucket and public delivery.
- Clinical photos and patient PDFs are private and require an authenticated staff session.
- Database records store bucket references or stable API paths, never expiring signed URLs.
- Homepage submissions remain leads/chat requests and continue linking to WhatsApp.
- The existing “Novo Atendimento” quick-start remains available.
- `createdAt` remains internal audit information; `scheduledAt` is the calendar date/time.
- No approximate patient-name matching is allowed.
- Evolution category behavior is controlled by `appointmentType`, not free-text `procedure`.
- Do not add a drag-and-drop calendar, availability rules, reminders, or external calendar synchronization.
- Preserve existing authentication, route permissions, WhatsApp behavior, and legacy media URLs.

## Out of Scope

- A drag-and-drop month/week calendar, recurring availability, conflict detection, reminders, or external calendar synchronization.
- Public access to clinical photos, patient PDFs, or other patient-linked files.
- Replacing the existing homepage WhatsApp chat/lead experience.
- Unrelated visual redesign or broad refactoring of the admin application.

## File Map

- Create `server/utils/assetStorage.js`: shared bucket configuration, stable references, upload/delete, public URL, and private signed URL helpers.
- Create `src/lib/media.ts`: frontend URL normalization and authenticated private-asset-to-object-URL loading.
- Modify `server/index.js`: bucket upload/delivery routes, appointment/lead schedule parsing, dashboard upcoming data, patient create normalization, and private document URL fallback.
- Modify `server/prisma/schema.prisma`: nullable `scheduledAt` on `Lead` and `Appointment`.
- Modify `server/utils/validationSchemas.js`: optional validated `scheduledAt` fields.
- Create or extend `server/test/file-scheduling-patient-contract.test.js`: route, schema, privacy, schedule, patient, and evolution contract tests.
- Modify `src/components/admin/attendance/PhotoGallery.tsx`: clinical bucket upload and private preview handling.
- Modify `src/components/admin/attendance/EvolutionTimeline.tsx`: private photo resolution and appointment-type labels.
- Modify `src/pages/AdminDocuments.tsx`: authenticated document URL resolution and upload errors.
- Modify `src/pages/AdminBlog.tsx`, `src/pages/AdminTreatments.tsx`, `src/pages/AdminStories.tsx`, `src/pages/AdminSettings.tsx`: public bucket upload scope, normalized URLs, and API error messages.
- Modify `src/pages/AdminLeads.tsx`, `src/pages/AdminDashboard.tsx`, `src/pages/AdminAttendanceDetail.tsx`, `src/pages/AdminAppointments.tsx`: scheduled date/time workflow and agenda action.
- Modify `src/pages/AdminPatients.tsx`: reliable create response/error flow if the UI contract needs adjustment.
- Modify `src/components/admin/AdminLayout.tsx`: nested Conteúdo submenu.
- Modify `src/data/posts.ts`, `src/data/treatments.ts`, `server/seed.js`, and affected public consumers: correct nonexistent local asset paths and fallback handling.

---

### Task 1: Establish the bucket asset layer

**Files:**
- Create: `server/utils/assetStorage.js`
- Modify: `server/index.js:20-140`
- Create: `server/test/file-scheduling-patient-contract.test.js`

**Interfaces:**
- Produces `uploadAsset({ scope, body, contentType, extension, ownerId }) -> Promise<{ reference, deliveryPath, contentType }>`.
- Produces `isAssetReference(value) -> boolean`, `parseAssetReference(value) -> { scope, key }`, `createPublicAssetUrl(reference) -> Promise<string>`, and `createPrivateAssetUrl(reference) -> Promise<string>`.
- Public upload responses use `scope = 'public'`; consultation photos use `scope = 'clinical'`.

- [ ] **Step 1: Write the failing contract tests.**

Add tests that read the server source and utility module contract:

```js
test('general uploads use bucket storage and expose separate public/private delivery routes', () => {
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    assert.match(source, /require\(['"]\.\/utils\/assetStorage['"]\)/);
    assert.match(source, /app\.post\(['"]\/upload['"]/);
    assert.match(source, /app\.get\(['"]\/assets\//);
    assert.match(source, /app\.get\(['"]\/clinical-assets\//);
    assert.match(source, /authenticateToken/);
    assert.doesNotMatch(source.slice(source.indexOf("app.post('/upload'"), source.indexOf("app.post('/patient-documents")), /CloudinaryStorage/);
});

test('asset storage exports stable reference and signed URL helpers', () => {
    const storage = require('../utils/assetStorage');
    assert.equal(typeof storage.uploadAsset, 'function');
    assert.equal(typeof storage.createPublicAssetUrl, 'function');
    assert.equal(typeof storage.createPrivateAssetUrl, 'function');
    assert.equal(storage.isAssetReference('bucket://clinical/appointments/1/a.jpg'), true);
    assert.equal(storage.isAssetReference('/images/logo-oficial.png'), false);
});
```

- [ ] **Step 2: Run the contract tests and verify the expected failure.**

Run from `server/`:

```powershell
node --test test/file-scheduling-patient-contract.test.js
```

Expected: FAIL because `assetStorage.js` and the bucket delivery routes do not yet exist.

- [ ] **Step 3: Implement the minimal bucket utility.**

Use the existing environment aliases from `patientDocumentStorage.js`. Store references in this shape:

```js
function createReference(scope, key) {
    return `bucket://${scope}/${key}`;
}

function parseAssetReference(value) {
    if (!isAssetReference(value)) return null;
    const [, scope, ...keyParts] = value.split('/');
    return { scope, key: keyParts.join('/') };
}
```

Use `PutObjectCommand` for uploads, `DeleteObjectCommand` for cleanup, `GetObjectCommand` plus `getSignedUrl` for private delivery, and a 300-second expiry. Public delivery must still be bucket-backed; it may use the bucket’s configured public URL when available or a no-auth API redirect that signs only public references.

- [ ] **Step 4: Replace the Cloudinary-backed `/upload` implementation.**

Use `multer.memoryStorage()` with the existing supported image/video/PDF formats and a 25 MB limit. Read `req.body.scope`, default to `public`, and reject any scope other than `public` or `clinical`. Return:

```js
res.json({
    reference,
    url: scope === 'public'
        ? `/assets/${encodeURIComponent(reference)}`
        : `/clinical-assets/${encodeURIComponent(reference)}`
});
```

Keep `/upload` authenticated. Delete the bucket object if response construction fails after upload.

- [ ] **Step 5: Add delivery routes and run the tests.**

`GET /assets/:reference` accepts only a `bucket://public/...` reference and redirects to a public bucket URL or a signed URL. `GET /clinical-assets/:reference` requires `authenticateToken`, accepts only `bucket://clinical/...`, and redirects to a 300-second signed URL. Reject malformed or wrong-scope references with 400/403.

Run:

```powershell
node --test test/file-scheduling-patient-contract.test.js
```

Expected: PASS for the asset contract tests.

- [ ] **Step 6: Commit the storage boundary.**

```powershell
git add server/utils/assetStorage.js server/index.js server/test/file-scheduling-patient-contract.test.js
git commit -m "feat: use bucket storage for application uploads"
```

### Task 2: Protect clinical media and repair document delivery

**Files:**
- Create: `src/lib/media.ts`
- Modify: `src/components/admin/attendance/PhotoGallery.tsx`
- Modify: `src/components/admin/attendance/EvolutionTimeline.tsx`
- Modify: `src/pages/AdminDocuments.tsx`
- Modify: `server/index.js:1285-1335`
- Modify: `server/test/file-scheduling-patient-contract.test.js`

**Interfaces:**
- `mediaUrl(value: string | null | undefined) -> string | null` resolves local paths, API-relative paths, and absolute URLs.
- `loadProtectedAsset(value: string) -> Promise<string>` fetches a private API path with `fetchClient`, converts the response to a blob URL, and throws the server’s error message on failure.
- Clinical appointment `photos` remain stable `bucket://clinical/...` references in persistence; the server may resolve them to short-lived URLs in authenticated appointment responses.

- [ ] **Step 1: Add failing source contracts for privacy and document fallback.**

Append tests:

```js
test('clinical photo uploads use the private scope and documents expose legacy pdfUrl', () => {
    const gallery = fs.readFileSync(path.join(repoRoot, 'src/components/admin/attendance/PhotoGallery.tsx'), 'utf8');
    const indexSource = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    assert.match(gallery, /scope.*clinical|clinical.*scope/);
    assert.match(indexSource, /fileUrl:.*storageKey.*pdfUrl/);
    assert.match(indexSource, /clinical-assets/);
});
```

Run `node --test test/file-scheduling-patient-contract.test.js`; expected: FAIL until the consumers and fallback are updated.

- [ ] **Step 2: Implement `src/lib/media.ts`.**

Use this behavior:

```ts
export const mediaUrl = (value?: string | null) => {
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/images/')) return value;
    return `${API_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

export const loadProtectedAsset = async (value: string) => {
    const response = await fetchClient(value);
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Não foi possível carregar o arquivo clínico.');
    }
    return URL.createObjectURL(await response.blob());
};
```

Track and revoke object URLs in `useEffect` cleanup in components that render private photos.

- [ ] **Step 3: Store clinical references and resolve them only for logged-in display.**

In `PhotoGallery`, append `scope=clinical` to the upload `FormData`, persist `data.reference` through `onChange`, and keep the response `url` in a local preview map until the appointment is reloaded. Render local preview URLs for newly uploaded files and call `loadProtectedAsset(mediaUrl(photo) || photo)` for persisted clinical references. Leave legacy absolute photo URLs readable.

In `EvolutionTimeline`, resolve each stored clinical reference through the same loader before rendering expanded comparison photos. Show a small error placeholder for failed individual images instead of failing the entire timeline.

- [ ] **Step 4: Make patient document URLs consistent.**

Change the document list response to:

```js
fileUrl: doc.storageKey
    ? `/patient-documents/${doc.id}/file`
    : doc.pdfUrl || null
```

In `AdminDocuments`, use `mediaUrl(doc.fileUrl || doc.pdfUrl)` for links and surface the API response body in upload errors. Keep the upload endpoint authenticated and accept only `application/pdf`.

- [ ] **Step 5: Run tests and build the frontend.**

```powershell
node --test server/test/file-scheduling-patient-contract.test.js
npm run build
```

Expected: contract tests pass and Vite exits with code 0.

- [ ] **Step 6: Commit clinical media changes.**

```powershell
git add src/lib/media.ts src/components/admin/attendance/PhotoGallery.tsx src/components/admin/attendance/EvolutionTimeline.tsx src/pages/AdminDocuments.tsx server/index.js server/test/file-scheduling-patient-contract.test.js
git commit -m "fix: protect clinical uploads and repair document URLs"
```

### Task 3: Add scheduled fields and upcoming agenda data

**Files:**
- Modify: `server/prisma/schema.prisma`
- Modify: `server/utils/validationSchemas.js`
- Modify: `server/index.js:295-420,855-894,896-930`
- Modify: `server/test/file-scheduling-patient-contract.test.js`

**Interfaces:**
- `Lead.scheduledAt: DateTime?` and `Appointment.scheduledAt: DateTime?`.
- `appointmentSchema.scheduledAt` and a lead update parser accept an ISO date string, a date-only/browser datetime-local string normalized by the server, or null.
- Dashboard response adds `upcomingSchedule`, an array of `{ kind, id, patientName, treatment, procedure, appointmentType, scheduledAt, createdAt, patientId, leadId }` sorted ascending by `scheduledAt`.

- [ ] **Step 1: Add failing schema and route contracts.**

```js
test('schedule fields are persisted and dashboard exposes ascending upcoming schedule', () => {
    const schema = fs.readFileSync(path.join(serverRoot, 'prisma/schema.prisma'), 'utf8');
    const validation = fs.readFileSync(path.join(serverRoot, 'utils/validationSchemas.js'), 'utf8');
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    assert.match(schema, /model Lead[\s\S]*scheduledAt\s+DateTime\?/);
    assert.match(schema, /model Appointment[\s\S]*scheduledAt\s+DateTime\?/);
    assert.match(validation, /scheduledAt/);
    assert.match(source, /Invalid scheduled date/);
    assert.match(source, /upcomingSchedule/);
    assert.match(source, /orderBy:\s*\{\s*scheduledAt:\s*['"]asc['"]\s*\}/);
});
```

Run the test and verify it fails before implementation.

- [ ] **Step 2: Add nullable Prisma fields and validation.**

Add `scheduledAt DateTime?` to both models. Extend `appointmentSchema` with `scheduledAt: z.string().or(z.date()).optional().nullable()`. Create a shared server helper:

```js
function parseOptionalDate(value, message) {
    if (value === undefined || value === null || value === '') return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new Error(message);
    return parsed;
}
```

Use it for appointment create/update and lead updates when `scheduledAt` is present. Run `npx prisma generate` and `npx prisma db push` only against the configured development database when the environment permits it.

- [ ] **Step 3: Implement upcoming schedule aggregation.**

Query scheduled leads and appointments separately, require `scheduledAt: { not: null }`, exclude completed leads, map them to the shared response shape, combine, sort by `new Date(item.scheduledAt)`, and take the first 10. Keep existing `recentAppointments` and `recentLeads` fields for compatibility.

- [ ] **Step 4: Run server tests and Prisma build.**

```powershell
node --test test/file-scheduling-patient-contract.test.js
npm run build
```

Run the second command from `server/`. Expected: schedule contracts pass and Prisma generation exits with code 0.

- [ ] **Step 5: Commit the schedule API.**

```powershell
git add server/prisma/schema.prisma server/utils/validationSchemas.js server/index.js server/test/file-scheduling-patient-contract.test.js
git commit -m "feat: add scheduled consultation fields and agenda data"
```

### Task 4: Connect request scheduling to the existing consultation quick-start

**Files:**
- Modify: `src/pages/AdminLeads.tsx`
- Modify: `src/pages/AdminDashboard.tsx`
- Modify: `src/pages/AdminAttendanceDetail.tsx`
- Modify: `src/pages/AdminAppointments.tsx`
- Modify: `server/test/file-scheduling-patient-contract.test.js`

**Interfaces:**
- Request update sends `{ status: 'scheduled', scheduledAt: string }` or `{ status: 'new', scheduledAt: null }` to `PUT /leads/:id`.
- Quick-start reads `leadId` and carries the lead’s exact `scheduledAt` into `AppointmentData.scheduledAt`.
- Dashboard “Iniciar consulta” navigates to `/admin/consultas/new?leadId=<leadId>`.

- [ ] **Step 1: Add failing UI contracts.**

```js
test('request, dashboard, and attendance screens distinguish scheduledAt from createdAt', () => {
    const leads = fs.readFileSync(path.join(repoRoot, 'src/pages/AdminLeads.tsx'), 'utf8');
    const dashboard = fs.readFileSync(path.join(repoRoot, 'src/pages/AdminDashboard.tsx'), 'utf8');
    const attendance = fs.readFileSync(path.join(repoRoot, 'src/pages/AdminAttendanceDetail.tsx'), 'utf8');
    assert.match(leads, /type=["']datetime-local["']/);
    assert.match(leads, /scheduledAt/);
    assert.match(dashboard, /upcomingSchedule/);
    assert.match(dashboard, /admin\/consultas\/new\?leadId=/);
    assert.match(attendance, /scheduledAt/);
    assert.match(attendance, /createdAt/);
});
```

Run the contract test and verify it fails.

- [ ] **Step 2: Add schedule controls to requests.**

Store one local `scheduledAt` value per lead or open a controlled scheduling dialog. Convert a `datetime-local` value to `new Date(value).toISOString()` before sending. Disable the save action while the mutation is pending, show `body.error` on failure, and show “Criado em” from `createdAt` plus “Agendado para” from `scheduledAt`. The existing WhatsApp and “Iniciar Atendimento” actions remain.

- [ ] **Step 3: Replace the dashboard confirmed-lead list with the upcoming agenda card.**

Render `stats.upcomingSchedule` in ascending order. Show an empty state when there are no scheduled entries. For lead entries, “Iniciar consulta” uses `/admin/consultas/new?leadId=...`; for appointment entries, use `/admin/consultas/<appointmentId>?patientId=<patientId>`. Display scheduled date/time prominently and created date as secondary metadata.

- [ ] **Step 4: Carry schedule context into attendance and list views.**

Add `scheduledAt: string | null` and `createdAt?: string` to `AppointmentData`. When fetching a lead, copy its `scheduledAt`; when posting an appointment, send `scheduledAt` and keep `date` as the existing clinical date value. Render editable `scheduledAt` in the basic information card and read-only `createdAt` for existing records. In `AdminAppointments`, use `scheduledAt || date` for calendar-facing labels and show both when they differ.

- [ ] **Step 5: Run the contract test and build.**

```powershell
node --test server/test/file-scheduling-patient-contract.test.js
npm run lint
npm run build
```

Expected: UI contracts pass, ESLint reports no errors, and Vite exits with code 0.

- [ ] **Step 6: Commit the scheduling UI.**

```powershell
git add src/pages/AdminLeads.tsx src/pages/AdminDashboard.tsx src/pages/AdminAttendanceDetail.tsx src/pages/AdminAppointments.tsx server/test/file-scheduling-patient-contract.test.js
git commit -m "feat: manage scheduled consultations from the admin agenda"
```

### Task 5: Repair patient creation and patient visibility

**Files:**
- Modify: `server/index.js:700-744`
- Modify: `src/pages/AdminPatients.tsx`
- Modify: `server/test/file-scheduling-patient-contract.test.js`

**Interfaces:**
- `POST /patients` accepts `consentDate` as ISO string or null and persists a `Date` or null.
- The response returns `{ id, name, cpf, history, ... }` with display-safe decrypted `cpf` and `history`.
- `/patients?search=` continues returning the newly created patient.

- [ ] **Step 1: Add a failing patient-create regression test.**

```js
test('patient create converts consentDate before Prisma persistence', () => {
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const route = readRoute(source, "app.post('/patients'", "app.put('/patients/:id'");
    assert.match(route, /consentDate/);
    assert.match(route, /new Date\(consentDate\)/);
    assert.match(route, /res\.json\(\{[\s\S]*id/);
});
```

Run the test and verify it fails because create currently passes the date string unchanged.

- [ ] **Step 2: Normalize create payload fields.**

Destructure `{ cpf, history, consentDate, ...rest }`, convert `consentDate` with the same invalid-date check used by update, encrypt CPF/history, and use the normalized value in both `upsert.update` and `upsert.create`. Return the persisted patient with decrypted display values and original user-facing CPF/history. Never send `consentDate: undefined` to Prisma.

- [ ] **Step 3: Improve the patients page error contract.**

When a create/update response is not OK, display the parsed API `error` text. After success, reset the form and reload using the current search. Preserve exact CPF search and the existing explicit patient picker selection behavior.

- [ ] **Step 4: Run tests and build.**

```powershell
node --test server/test/file-scheduling-patient-contract.test.js
npm run build
```

Expected: patient regression contract passes and frontend build exits with code 0.

- [ ] **Step 5: Commit patient workflow changes.**

```powershell
git add server/index.js src/pages/AdminPatients.tsx server/test/file-scheduling-patient-contract.test.js
git commit -m "fix: persist and return newly created patients reliably"
```

### Task 6: Make temporal evolution type-driven

**Files:**
- Modify: `src/components/admin/attendance/EvolutionTimeline.tsx`
- Modify: `src/pages/AdminAttendanceDetail.tsx`
- Modify: `server/test/file-scheduling-patient-contract.test.js`

**Interfaces:**
- `appointmentType` values remain `odontologia`, `harmonizacao`, or `ambos`.
- `procedure` is rendered as a descriptive label and never gates odontogram or face-map sections.

- [ ] **Step 1: Add the failing evolution contract.**

```js
test('evolution classification uses appointmentType for clinical panels', () => {
    const timeline = fs.readFileSync(path.join(repoRoot, 'src/components/admin/attendance/EvolutionTimeline.tsx'), 'utf8');
    assert.match(timeline, /appointmentType === ['"]odontologia['"]/);
    assert.match(timeline, /appointmentType === ['"]harmonizacao['"]/);
    assert.match(timeline, /procedure/);
    assert.doesNotMatch(timeline, /procedure === ['"]odontologia['"]|procedure === ['"]harmonizacao['"]/);
});
```

Run the contract and verify it fails because the current badge presents procedure as the category.

- [ ] **Step 2: Update timeline labels and data defaults.**

Render a localized category badge from `appointmentType` (`Odontologia`, `Harmonização Facial`, or `Ambos`) and render `procedure` as a separate text label when present. Keep all panel conditions tied to `appointmentType`. Ensure fetched historical records default missing `appointmentType` to `odontologia` and missing arrays/objects to safe empty values.

- [ ] **Step 3: Run the regression test and build.**

```powershell
node --test server/test/file-scheduling-patient-contract.test.js
npm run build
```

Expected: evolution contract passes and Vite exits with code 0.

- [ ] **Step 4: Commit the evolution fix.**

```powershell
git add src/components/admin/attendance/EvolutionTimeline.tsx src/pages/AdminAttendanceDetail.tsx server/test/file-scheduling-patient-contract.test.js
git commit -m "fix: classify evolution by appointment type"
```

### Task 7: Correct public media references and compact the sidebar

**Files:**
- Modify: `src/components/admin/AdminLayout.tsx`
- Modify: `src/pages/AdminBlog.tsx`
- Modify: `src/pages/AdminTreatments.tsx`
- Modify: `src/pages/AdminStories.tsx`
- Modify: `src/pages/AdminSettings.tsx`
- Modify: `src/data/posts.ts`
- Modify: `src/data/treatments.ts`
- Modify: `server/seed.js`
- Create: `server/test/static-asset-contract.test.js`

**Interfaces:**
- Public upload consumers append `scope=public` and save `data.reference` or the returned public URL according to each existing database field.
- Sidebar keeps all existing routes and role filters, but exposes them through a `Conteúdo` nested item.

- [ ] **Step 1: Add the failing static asset and navigation tests.**

Create a test that extracts root-relative paths and verifies each existing local path under `src/data` and `server/seed.js` maps to a real file under `public`:

```js
test('all local media references resolve under public', () => {
    const sources = ['src/data/posts.ts', 'src/data/treatments.ts', 'server/seed.js']
        .map(file => fs.readFileSync(path.join(repoRoot, file), 'utf8'))
        .join('\n');
    const references = [...sources.matchAll(/['"](\/images\/[^'"]+)['"]/g)].map(match => match[1]);
    assert.ok(references.length > 0);
    for (const reference of references) {
        assert.equal(fs.existsSync(path.join(repoRoot, 'public', reference.slice(1))), true, reference);
    }
});

test('content admin routes are nested under Conteúdo', () => {
    const layout = fs.readFileSync(path.join(repoRoot, 'src/components/admin/AdminLayout.tsx'), 'utf8');
    assert.match(layout, /label:\s*['"]Conteúdo['"]/);
    assert.match(layout, /\/admin\/comentarios/);
    assert.match(layout, /\/admin\/tratamentos/);
    assert.match(layout, /\/admin\/blog/);
    assert.match(layout, /\/admin\/stories/);
});
```

Run `node --test server/test/static-asset-contract.test.js`; expected: FAIL because current references include missing numbered JPG/PNG files and no Conteúdo group.

- [ ] **Step 2: Correct only references with verified existing files.**

Use the current `public/images` inventory as the source of truth. Replace missing paths with the closest existing asset in the same treatment/category, preserve URL encoding for spaces, and update both static data and seed data so a fresh seed does not reintroduce broken paths. Do not add fake files to satisfy the test.

- [ ] **Step 3: Update public upload consumers and fallbacks.**

Append `scope=public` to Blog, Treatments, Stories, and Settings upload `FormData`. Store the returned stable reference where the API field can resolve it, and use `mediaUrl` for previews and public rendering. On image error, show `/placeholder.svg` or the existing local logo fallback. Include the API response message in upload toasts and reset inputs after completion.

- [ ] **Step 4: Nest the content navigation.**

Replace the four top-level menu entries with:

```ts
{
    label: 'Conteúdo',
    href: '/admin/blog',
    icon: FileText,
    adminOnly: true,
    subItems: [
        { label: 'Comentários', href: '/admin/comentarios' },
        { label: 'Tratamentos', href: '/admin/tratamentos' },
        { label: 'Blog', href: '/admin/blog' },
        { label: 'Stories', href: '/admin/stories' }
    ]
}
```

Keep the existing `renderNestedItems` route matching and manager filtering. Ensure the parent is active for all four child routes, not only paths beginning with `/admin/blog`.

- [ ] **Step 5: Run static tests, lint, and build.**

```powershell
node --test server/test/static-asset-contract.test.js
npm run lint
npm run build
```

Expected: all static references resolve, lint reports no errors, and Vite exits with code 0.

- [ ] **Step 6: Commit public media and navigation changes.**

```powershell
git add src/components/admin/AdminLayout.tsx src/pages/AdminBlog.tsx src/pages/AdminTreatments.tsx src/pages/AdminStories.tsx src/pages/AdminSettings.tsx src/data/posts.ts src/data/treatments.ts server/seed.js server/test/static-asset-contract.test.js
git commit -m "fix: repair public media URLs and group content navigation"
```

### Task 8: Full verification and handoff

**Files:**
- Modify: any files from Tasks 1–7 only if a verification failure identifies a concrete regression.

- [ ] **Step 1: Run the complete server test suite.**

```powershell
Set-Location server
node --test test/*.test.js
npm run build
Set-Location ..
```

Expected: all Node tests pass and Prisma generation succeeds.

- [ ] **Step 2: Run frontend lint and production build.**

```powershell
npm run lint
npm run build
```

Expected: both commands exit with code 0 and no TypeScript/Vite errors are printed.

- [ ] **Step 3: Run repository integrity checks.**

```powershell
git diff --check
git status --short
git diff --stat HEAD~7..HEAD
```

Expected: no whitespace errors, only the scoped implementation/spec/plan files are changed, and no unrelated generated artifacts are added.

- [ ] **Step 4: Perform the authenticated/public smoke check.**

Verify these concrete flows in a local frontend/API session:

1. Upload a blog image, treatment image, story, and logo; reload homepage/admin previews and confirm they load from bucket-backed URLs.
2. Upload a consultation photo and patient PDF; confirm logged-out requests receive 401 and logged-in staff can view them.
3. Create a patient with consent checked; search it in Pacientes and select it in Documents.
4. Mark a lead as scheduled, confirm the dashboard card shows “Agendado para” separately from “Criado em”, and click “Iniciar consulta”.
5. Open Evolução Temporal with a variable procedure label and verify panels follow Tipo.
6. Check the collapsed/expanded sidebar and confirm Conteúdo children retain their existing routes and permissions.

- [ ] **Step 5: Commit only concrete verification fixes.**

If a fix was required, run the affected test/build again and commit with:

```powershell
git add <only-the-verified-fix-files>
git commit -m "fix: address final workflow verification finding"
```

Do not claim completion until the fresh command output confirms the required tests and builds pass.

## Plan Self-Review

- Storage, public/private delivery, clinical privacy, and PDF fallback are covered by Tasks 1–2.
- Scheduled fields, request confirmation, dashboard agenda, quick-start linking, and created-at distinction are covered by Tasks 3–4.
- Patient create normalization/search visibility is covered by Task 5.
- Type-driven temporal evolution is covered by Task 6.
- Logo/static URL repair, upload consumer scope, and sidebar grouping are covered by Task 7.
- Full tests, builds, diff checks, and manual flows are covered by Task 8.
- Placeholder scan: this plan contains no unfinished placeholder markers and no intentionally unspecified implementation step.
- Interface consistency: all tasks use `scheduledAt`, `bucket://<scope>/<key>`, `mediaUrl`, and `loadProtectedAsset` consistently.
