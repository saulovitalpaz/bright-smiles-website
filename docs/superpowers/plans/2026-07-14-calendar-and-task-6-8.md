# Calendar Upgrade and Tasks 6–8 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Complete Tasks 6, 7, and 8 from the prior patient workflow plan and add a confirmed drag-and-drop scheduling calendar with professional assignment details.

**Architecture:** Preserve the current appointment list and API contracts, add an optional professional field to leads, and normalize appointments/leads into a focused calendar view model. A custom date-fns week grid handles drag targets; AdminAppointments owns confirmation and persistence while a separate calendar component owns rendering. Evolution classification remains type-driven, public media remains bucket-backed, and final verification covers the whole repository.

**Tech Stack:** React, TypeScript, Tailwind CSS, date-fns, Radix/shadcn dialogs and selects, Express, Prisma/PostgreSQL, Node built-in test runner, Vite.

## Global Constraints

- Preserve the existing list view, route structure, authentication behavior, WhatsApp behavior, and appointment/lead schedule APIs.
- Keep the existing Appointment.professional string field compatible with historical data.
- Add an optional Lead.professional string so scheduled leads can carry the same professional metadata as appointments.
- Drag-and-drop changes only scheduledAt; it never changes the professional.
- Professional changes happen only from the opened event details card.
- Do not add recurring availability, conflict detection, reminders, external calendar synchronization, or approximate patient matching.
- Preserve unrelated user changes already present in the worktree, including the current public image changes.
- Use the existing date-fns dependency; do not add a calendar package.
- Production code must be preceded by a failing test or source contract, then the smallest implementation that makes it pass.

---

### Task 1: Add lead professional persistence and calendar contracts

**Files:**
- Modify: \`server/prisma/schema.prisma\`
- Modify: \`server/routes/leads.js\`
- Create: \`server/test/calendar-contract.test.js\`

**Interfaces:**
- \`Lead.professional: string | null\` is persisted by Prisma.
- \`PUT /leads/:id\` accepts \`{ professional: string | null }\` and continues to normalize \`scheduledAt\`.
- The calendar contract test verifies the backend field and frontend event/update boundaries before UI implementation.

- [ ] **Step 1: Write the failing backend/calendar contract.**

Create \`server/test/calendar-contract.test.js\`:

~~~js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(serverRoot, '..');

test('leads persist an optional professional assignment', () => {
    const schema = fs.readFileSync(path.join(serverRoot, 'prisma/schema.prisma'), 'utf8');
    const leads = fs.readFileSync(path.join(serverRoot, 'routes/leads.js'), 'utf8');

    assert.match(schema, /model Lead[\\s\\S]*professional\\s+String\\?/);
    assert.match(leads, /scheduledAt/);
    assert.match(leads, /professional/);
});

~~~

- [ ] **Step 2: Run the new contract and verify the expected failure.**

Run from \`server/\`:

~~~powershell
node --test test/calendar-contract.test.js
~~~

Expected: the lead field test fails because \`Lead.professional\` is absent.

- [ ] **Step 3: Add the nullable Prisma field.**

In \`model Lead\`, add:

~~~prisma
  professional  String?
~~~

Do not change existing appointment fields or lead defaults. The server start script already runs \`prisma db push\`; run \`npm run build\` from \`server/\` after the schema edit.

- [ ] **Step 4: Preserve only supported fields in the lead update handler.**

In \`server/routes/leads.js\`, replace the unrestricted request spread with:

~~~js
const data = {};
for (const field of ['status', 'scheduledAt', 'professional']) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        data[field] = req.body[field];
    }
}

if (data.scheduledAt !== undefined) {
    data.scheduledAt = normalizeScheduledAt(data.scheduledAt);
}

if (data.professional === '') {
    data.professional = null;
}
~~~

Keep the existing Prisma update, integer id parsing, and JSON error response.

- [ ] **Step 5: Run the contract and backend build.**

~~~powershell
node --test test/calendar-contract.test.js
npm run build
~~~

Expected: the lead field test passes and Prisma generation succeeds.

- [ ] **Step 6: Commit the data boundary.**

~~~powershell
git add server/prisma/schema.prisma server/routes/leads.js server/test/calendar-contract.test.js
git commit -m "feat: persist professional assignments for scheduled leads"
~~~

---

### Task 2: Create the calendar view model and week-grid renderer

**Files:**
- Create: \`src/lib/calendar.ts\`
- Create: \`src/components/admin/appointments/CalendarView.tsx\`
- Modify: \`server/test/calendar-contract.test.js\`

**Interfaces:**
- \`CalendarEntry\` is the shared appointment/lead view model.
- \`buildCalendarEntries(appointments, leads)\` returns scheduled, non-completed entries sorted by \`scheduledAt\`.
- \`getWeekDays(anchorDate)\` returns seven local dates beginning Monday.
- \`getDropDateTime(day, minutes)\` returns an ISO string for the local slot.
- \`professionalColor(professional)\` returns a stable color token.
- \`CalendarView\` renders only and calls parent callbacks for opening/dropping events.

- [ ] **Step 1: Add the failing helper/source contract.**

Append to \`server/test/calendar-contract.test.js\`:

~~~js
test('calendar helper exposes shared entries and local week calculations', () => {
    const helper = fs.readFileSync(path.join(repoRoot, 'src/lib/calendar.ts'), 'utf8');
    const calendar = fs.readFileSync(path.join(repoRoot, 'src/components/admin/appointments/CalendarView.tsx'), 'utf8');

    assert.match(helper, /export interface CalendarEntry/);
    assert.match(helper, /export const buildCalendarEntries/);
    assert.match(helper, /export const getWeekDays/);
    assert.match(helper, /export const getDropDateTime/);
    assert.match(helper, /export const professionalColor/);
    assert.match(calendar, /onEventDrop/);
    assert.match(calendar, /onEventOpen/);
    assert.match(calendar, /data-drop-minutes/);
});
~~~

Run \`node --test test/calendar-contract.test.js\`; expected: FAIL because both TypeScript files are absent.

- [ ] **Step 2: Implement the pure calendar helpers.**

Create \`src/lib/calendar.ts\` with:

~~~ts
import { addDays, endOfWeek, startOfWeek } from "date-fns";

export type CalendarEntryKind = "appointment" | "lead";

export interface CalendarEntry {
    kind: CalendarEntryKind;
    id: number;
    patientName: string;
    treatment: string | null;
    procedure: string | null;
    appointmentType: string | null;
    scheduledAt: string;
    createdAt?: string | null;
    patientId: number | null;
    leadId: number | null;
    professional: string | null;
}

export const buildCalendarEntries = (appointments: any[] = [], leads: any[] = []): CalendarEntry[] => [
    ...appointments.filter((item) => item?.scheduledAt && !Number.isNaN(new Date(item.scheduledAt).getTime())).map((item) => ({
        kind: "appointment" as const,
        id: item.id,
        patientName: item.patientName || item.patient?.name || "Paciente sem nome",
        treatment: null,
        procedure: item.procedure || null,
        appointmentType: item.appointmentType || "odontologia",
        scheduledAt: item.scheduledAt,
        createdAt: item.createdAt || null,
        patientId: item.patientId ?? null,
        leadId: null,
        professional: item.professional || null
    })),
    ...leads.filter((item) => item?.scheduledAt && item.status !== "completed" && !Number.isNaN(new Date(item.scheduledAt).getTime())).map((item) => ({
        kind: "lead" as const,
        id: item.id,
        patientName: item.name || "Solicitação sem nome",
        treatment: item.treatment || null,
        procedure: null,
        appointmentType: null,
        scheduledAt: item.scheduledAt,
        createdAt: item.createdAt || null,
        patientId: null,
        leadId: item.id,
        professional: item.professional || null
    }))
].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

export const getWeekDays = (anchorDate: Date) => {
    const monday = startOfWeek(anchorDate, { weekStartsOn: 1 });
    const sunday = endOfWeek(anchorDate, { weekStartsOn: 1 });
    const days: Date[] = [];
    for (let day = monday; day <= sunday; day = addDays(day, 1)) days.push(day);
    return days;
};

export const getDropDateTime = (day: Date, minutes: number) => {
    const value = new Date(day);
    value.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return value.toISOString();
};

const PROFESSIONAL_COLORS = ["blue", "emerald", "violet", "amber", "rose", "cyan"] as const;

export const professionalColor = (professional: string | null | undefined) => {
    if (!professional) return "slate";
    return PROFESSIONAL_COLORS[[...professional].reduce((sum, char) => sum + char.charCodeAt(0), 0) % PROFESSIONAL_COLORS.length];
};
~~~

- [ ] **Step 3: Implement the week grid without persistence.**

Create \`CalendarView.tsx\` with props:

~~~tsx
interface CalendarViewProps {
    entries: CalendarEntry[];
    anchorDate: Date;
    onAnchorDateChange: (date: Date) => void;
    onEventOpen: (entry: CalendarEntry) => void;
    onEventDrop: (entry: CalendarEntry, scheduledAt: string) => void;
}
~~~

Render seven columns from \`getWeekDays(anchorDate)\` and 30-minute slots from 08:00 through 20:00. Each slot must have \`data-drop-minutes\`, \`onDragOver={(event) => event.preventDefault()}\`, and an \`onDrop\` that reads the dragged entry id and kind from \`dataTransfer\`, finds the matching entry, and calls \`onEventDrop\` with \`getDropDateTime(day, minutes)\`.

Each event card must be \`draggable\`, set \`text/calendar-entry-id\` and \`text/calendar-entry-kind\`, call \`onEventOpen\` on click, and show the professional tag or \`Profissional não atribuído\`. Use a fixed class map for the six professional colors plus slate; do not construct arbitrary Tailwind class names at runtime. Include previous/next week and Hoje controls. Keep the grid horizontally scrollable on narrow screens.

- [ ] **Step 4: Run the contract and frontend build.**

~~~powershell
node --test server/test/calendar-contract.test.js
npm run build
~~~

Expected: helper/component source contracts pass and Vite exits with code 0. API mutation is not expected until Task 3.

- [ ] **Step 5: Commit the calendar primitives.**

~~~powershell
git add src/lib/calendar.ts src/components/admin/appointments/CalendarView.tsx server/test/calendar-contract.test.js
git commit -m "feat: add professional-tagged calendar grid"
~~~

---

### Task 3: Wire confirmed drag/drop and professional details into appointments

**Files:**
- Modify: \`src/pages/AdminAppointments.tsx\`
- Modify: \`server/test/calendar-contract.test.js\`

**Interfaces:**
- \`AdminAppointments\` fetches appointments, scheduled leads, and staff users.
- \`pendingDrop\` stores \`{ entry, scheduledAt }\` until confirmation/cancellation.
- Confirmed moves call \`PUT /appointments/:id\` or \`PUT /leads/:id\` with only \`{ scheduledAt }\`.
- Professional saves call the same resource route with only \`{ professional: value || null }\`.

- [ ] **Step 1: Add the failing confirmation/update contract.**

Append:

~~~js
test('calendar UI exposes confirmed schedule moves and professional details', () => {
    const appointments = fs.readFileSync(path.join(repoRoot, 'src/pages/AdminAppointments.tsx'), 'utf8');
    const calendar = fs.readFileSync(path.join(repoRoot, 'src/components/admin/appointments/CalendarView.tsx'), 'utf8');

    assert.match(appointments, /pendingDrop/);
    assert.match(appointments, /scheduledAt/);
    assert.match(appointments, /professional/);
    assert.match(appointments, /\\/appointments\\//);
    assert.match(appointments, /\\/leads\\//);
    assert.match(calendar, /draggable/);
    assert.match(calendar, /onDrop/);
});

test('calendar moves wait for confirmation and professional changes use separate updates', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'src/pages/AdminAppointments.tsx'), 'utf8');
    assert.match(source, /setPendingDrop\\(/);
    assert.match(source, /scheduledAt/);
    assert.match(source, /professional/);
    assert.match(source, /Confirmar/);
    assert.match(source, /Cancelar/);
    assert.match(source, /buildCalendarEntries/);
});
~~~

Run \`node --test test/calendar-contract.test.js\`; expected: FAIL until the page owns these states and payloads.

- [ ] **Step 2: Add view state and fetch calendar data.**

Keep the existing appointment list fetch. Add:

~~~ts
const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
const [leads, setLeads] = useState<any[]>([]);
const [staff, setStaff] = useState<any[]>([]);
const [calendarDate, setCalendarDate] = useState(new Date());
const [pendingDrop, setPendingDrop] = useState<{ entry: CalendarEntry; scheduledAt: string } | null>(null);
const [pendingDetails, setPendingDetails] = useState<CalendarEntry | null>(null);
const [professionalDraft, setProfessionalDraft] = useState("");
const [isSavingCalendarChange, setIsSavingCalendarChange] = useState(false);
~~~

Fetch \`/leads\` and \`/users\` with \`fetchClient\), require \`response.ok\`, and toast \`body.error || "Erro ao carregar agenda."\` on failure. Use \`users.filter((user) => user.role !== "manager")\` for selector options and store names to preserve the existing string field.

- [ ] **Step 3: Add the minimal update helper and confirmation action.**

Define:

~~~ts
const updateCalendarEntry = async (
    entry: CalendarEntry,
    payload: { scheduledAt?: string | null; professional?: string | null }
) => {
    const endpoint = entry.kind === "lead" ? "/leads/" + entry.leadId : "/appointments/" + entry.id;
    const response = await fetchClient(endpoint, {
        method: "PUT",
        body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Não foi possível atualizar a agenda.");
    return body;
};
~~~

\`confirmDrop\` calls this helper with only \`{ scheduledAt: pendingDrop.scheduledAt }\`, then refreshes records and closes the dialog. On failure, leave fetched state unchanged and show \`error.message\`. \`saveProfessional\` calls only \`{ professional: professionalDraft || null }\`, then refreshes and closes the details dialog. Disable both save actions while \`isSavingCalendarChange\` is true.

- [ ] **Step 4: Add list/calendar toggle and render the calendar.**

Keep the current list JSX intact behind \`viewMode === "list"\`. Add a toggle with Lista and Calendário buttons. In calendar mode render:

~~~tsx
<CalendarView
    entries={buildCalendarEntries(appointments, leads)}
    anchorDate={calendarDate}
    onAnchorDateChange={setCalendarDate}
    onEventOpen={(entry) => {
        setPendingDetails(entry);
        setProfessionalDraft(entry.professional || "");
    }}
    onEventDrop={(entry, scheduledAt) => setPendingDrop({ entry, scheduledAt })}
/>
~~~

Add an \`AlertDialog\` for \`pendingDrop\` showing patient name, original schedule, proposed schedule, Cancelar, and Confirmar novo horário. Do not alter appointment/lead state before confirmation.

- [ ] **Step 5: Add the event details dialog.**

The details dialog must show patient, treatment/procedure, scheduled date/time, and a professional selector:

~~~tsx
<Select value={professionalDraft || "unassigned"} onValueChange={(value) => setProfessionalDraft(value === "unassigned" ? "" : value)}>
    <SelectTrigger><SelectValue placeholder="Selecione o profissional" /></SelectTrigger>
    <SelectContent>
        <SelectItem value="unassigned">Sem profissional</SelectItem>
        {staff.map((user) => <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>)}
    </SelectContent>
</Select>
~~~

The save action calls \`saveProfessional\`; closing without saving does not persist. State that date/time is changed by dragging or in the existing consultation form, so professional selection and schedule movement remain separate.

- [ ] **Step 6: Run contracts, lint, and build.**

~~~powershell
node --test server/test/calendar-contract.test.js
npm run lint
npm run build
~~~

Expected: calendar contracts pass, ESLint reports no errors, and Vite exits with code 0.

- [ ] **Step 7: Commit the interactive calendar.**

~~~powershell
git add src/pages/AdminAppointments.tsx server/test/calendar-contract.test.js
git commit -m "feat: confirm calendar moves and assign professionals"
~~~

---

### Task 4: Make temporal evolution type-driven (Task 6)

**Files:**
- Modify: \`src/components/admin/attendance/EvolutionTimeline.tsx\`
- Modify: \`src/pages/AdminAttendanceDetail.tsx\`
- Modify: \`server/test/file-scheduling-patient-contract.test.js\`

**Interfaces:**
- \`appointmentType\` remains \`odontologia\`, \`harmonizacao\`, or \`ambos\`.
- \`procedure\` is a descriptive label only.
- Timeline panel visibility is determined only by \`appointmentType\`.

- [ ] **Step 1: Add the failing evolution contract.**

Append:

~~~js
test('evolution classification uses appointmentType for clinical panels', () => {
    const timeline = fs.readFileSync(path.join(repoRoot, 'src/components/admin/attendance/EvolutionTimeline.tsx'), 'utf8');
    assert.match(timeline, /appointmentType === ['"]odontologia['"]/);
    assert.match(timeline, /appointmentType === ['"]harmonizacao['"]/);
    assert.match(timeline, /procedure/);
    assert.match(timeline, /Odontologia/);
    assert.match(timeline, /Harmonização Facial/);
    assert.doesNotMatch(timeline, /procedure === ['"]odontologia['"]|procedure === ['"]harmonizacao['"]/);
});
~~~

Run \`node --test server/test/file-scheduling-patient-contract.test.js\`; expected: FAIL because the current timeline uses procedure as the badge.

- [ ] **Step 2: Normalize historical data before rendering.**

In \`fetchHistory\`, map each item:

~~~ts
const normalized = data.map((app: any) => ({
    ...app,
    appointmentType: app.appointmentType || "odontologia",
    photos: Array.isArray(app.photos) ? app.photos : [],
    dentalNotes: app.dentalNotes && typeof app.dentalNotes === "object" ? app.dentalNotes : {},
    facialNotes: app.facialNotes && typeof app.facialNotes === "object" ? app.facialNotes : {}
}));
~~~

Filter the normalized array by current id and sort by descending \`date\`.

- [ ] **Step 3: Separate category from procedure.**

Use:

~~~tsx
const categoryLabel = {
    odontologia: "Odontologia",
    harmonizacao: "Harmonização Facial",
    ambos: "Odontologia + Harmonização"
} as const;
~~~

Render the badge from \`categoryLabel[appointmentType]\` and render \`procedure\` in a separate text span when present. Keep the odontogram condition as \`appointmentType === "odontologia" || appointmentType === "ambos"\` and face-map condition as \`appointmentType === "harmonizacao" || appointmentType === "ambos"\`.

- [ ] **Step 4: Normalize current attendance defaults.**

In \`AdminAttendanceDetail\`, keep \`appointmentType: "odontologia"\` and use fallback values when loading an existing appointment: \`fetched.appointmentType || "odontologia"\`, array fallback for \`photos\`, and object fallbacks for both notes. This keeps old records renderable.

- [ ] **Step 5: Run the evolution contract and build.**

~~~powershell
node --test server/test/file-scheduling-patient-contract.test.js
npm run build
~~~

Expected: the evolution contract and all existing server tests pass; Vite exits with code 0.

- [ ] **Step 6: Commit Task 6.**

~~~powershell
git add src/components/admin/attendance/EvolutionTimeline.tsx src/pages/AdminAttendanceDetail.tsx server/test/file-scheduling-patient-contract.test.js
git commit -m "fix: classify evolution by appointment type"
~~~

---

### Task 5: Repair public media references and compact navigation (Task 7)

**Files:**
- Create: \`server/test/static-asset-contract.test.js\`
- Modify: \`src/components/admin/AdminLayout.tsx\`
- Modify: \`src/pages/AdminBlog.tsx\`
- Modify: \`src/pages/AdminTreatments.tsx\`
- Modify: \`src/pages/AdminStories.tsx\`
- Modify: \`src/pages/AdminSettings.tsx\`
- Modify: \`src/lib/media.ts\`
- Modify: \`src/data/posts.ts\`
- Modify: \`src/data/treatments.ts\`
- Modify: \`server/seed.js\`

**Interfaces:**
- Public upload forms append \`scope=public\`.
- \`mediaUrl(value)\` resolves bucket references through \`assetDeliveryUrl\`, while preserving absolute/blob/data URLs and local \`/images/...\` paths.
- Content routes remain under a \`Conteúdo\` parent with their existing paths and role filters.

- [ ] **Step 1: Write the failing static asset and navigation tests.**

Create \`server/test/static-asset-contract.test.js\`:

~~~js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

test('all local media references resolve under public', () => {
    const sources = ['src/data/posts.ts', 'src/data/treatments.ts', 'server/seed.js']
        .map((file) => fs.readFileSync(path.join(repoRoot, file), 'utf8'))
        .join('\n');
    const references = [...sources.matchAll(/["'](\/images\/[^"']+)["']/g)].map((match) => match[1]);
    assert.ok(references.length > 0);
    for (const reference of references) {
        assert.equal(fs.existsSync(path.join(repoRoot, 'public', reference.slice(1))), true, reference);
    }
});

test('content admin routes are nested under Conteúdo', () => {
    const layout = fs.readFileSync(path.join(repoRoot, 'src/components/admin/AdminLayout.tsx'), 'utf8');
    assert.match(layout, /label:\s*["']Conteúdo["']/);
    for (const route of ['/admin/comentarios', '/admin/tratamentos', '/admin/blog', '/admin/stories']) {
        assert.match(layout, new RegExp(route.replaceAll('/', '\\\\/')));
    }
});

test('public upload consumers request public scope', () => {
    for (const file of ['AdminBlog.tsx', 'AdminTreatments.tsx', 'AdminStories.tsx', 'AdminSettings.tsx']) {
        const source = fs.readFileSync(path.join(repoRoot, 'src/pages', file), 'utf8');
        assert.match(source, /scope.*public|public.*scope/, file);
    }
});
~~~

Run \`node --test server/test/static-asset-contract.test.js\`; expected: FAIL because numbered media paths are missing and content entries are standalone.

- [ ] **Step 2: Replace missing static references with verified existing files.**

Use this exact mapping from the current \`public/images\` inventory:

| Missing pattern | Replacement |
|---|---|
| \`/images/botox/Botox (1).jpg\` through \`(3).jpg\` | \`/images/botox/Botox capa.png\` |
| \`/images/botox/Botox (2).png\` | \`/images/botox/Botox capa.png\` |
| \`/images/preenchimento/preenchimento - hialuronico (1).jpg\` through \`(11).jpg\` | \`/images/preenchimento/hialuronico.png\` |
| \`/images/preenchimento/preenchimento - hialuronico (1).png\` | \`/images/preenchimento/hialuronico.png\` |
| \`/images/bioestimulador/Bioestimulador (2).jpg\` through \`(13).jpg\` | \`/images/bioestimulador/Bioestimulador (1).jpg\` |

Keep all existing odonto paths, \`Bioestimulador (1).jpg\`, \`Botox capa.png\`, and \`hialuronico.png\`. Apply the mapping to both static data and every matching reference in \`server/seed.js\`. Do not stage or revert the user’s existing image deletion/addition pair.

- [ ] **Step 3: Normalize bucket-backed public URLs.**

Update \`src/lib/media.ts\`:

~~~ts
export const mediaUrl = (value?: string | null) => {
    if (!value) return null;
    const delivered = assetDeliveryUrl(value) || value;
    if (/^(https?:|blob:|data:)/i.test(delivered)) return delivered;
    if (delivered.startsWith('/images/')) return delivered;
    return API_URL + (delivered.startsWith('/') ? delivered : '/' + delivered);
};
~~~

- [ ] **Step 4: Update public upload consumers.**

For each Blog, Treatments, Stories, and Settings upload form, append:

~~~ts
formData.append("scope", "public");
~~~

Persist \`res.data.reference || res.data.url\`, render previews with \`mediaUrl(value)\`, reset file inputs after success, and extract axios errors using \`error.response?.data?.error || error.message\`. Keep existing logo and placeholder fallbacks for image errors.

- [ ] **Step 5: Nest content entries in the sidebar.**

Replace standalone content entries with:

~~~ts
{
    label: "Conteúdo",
    href: "/admin/blog",
    icon: FileText,
    adminOnly: true,
    subItems: [
        { label: "Comentários", href: "/admin/comentarios" },
        { label: "Tratamentos", href: "/admin/tratamentos" },
        { label: "Blog", href: "/admin/blog" },
        { label: "Stories", href: "/admin/stories" }
    ]
}
~~~

Use a helper that marks the parent active when \`location.pathname === item.href\` or starts with any child href. Keep manager filtering and all other routes unchanged.

- [ ] **Step 6: Run static tests, lint, and build.**

~~~powershell
node --test server/test/static-asset-contract.test.js
npm run lint
npm run build
~~~

Expected: static contracts pass, ESLint reports no errors, and Vite exits with code 0.

- [ ] **Step 7: Commit Task 7.**

~~~powershell
git add src/components/admin/AdminLayout.tsx src/pages/AdminBlog.tsx src/pages/AdminTreatments.tsx src/pages/AdminStories.tsx src/pages/AdminSettings.tsx src/lib/media.ts src/data/posts.ts src/data/treatments.ts server/seed.js server/test/static-asset-contract.test.js
git commit -m "fix: repair public media URLs and group content navigation"
~~~

---

### Task 6: Full verification and handoff (Task 8)

**Files:**
- Modify: only files from Tasks 1–5 when a concrete verification failure identifies a regression.

**Interfaces:**
- No new product behavior; this task validates the completed data, calendar, evolution, media, and navigation contracts together.

- [ ] **Step 1: Run the complete server test suite.**

From \`server/\`:

~~~powershell
node --test test/*.test.js
npm run build
~~~

Expected: every Node test passes and Prisma generation exits with code 0.

- [ ] **Step 2: Run frontend lint and production build.**

From the repository root:

~~~powershell
npm run lint
npm run build
~~~

Expected: both commands exit with code 0, with no TypeScript, ESLint, or Vite errors.

- [ ] **Step 3: Run repository integrity checks.**

~~~powershell
git diff --check
git status --short
git diff --stat HEAD~5..HEAD
~~~

Expected: no whitespace errors; only scoped implementation/spec/plan files plus the user’s pre-existing image changes are present; no generated build output is staged.

- [ ] **Step 4: Run the authenticated/public smoke flow.**

Start the server and frontend with the existing project commands. Verify:

1. List mode still loads existing appointment history.
2. Calendar mode shows scheduled appointments and non-completed scheduled leads with treatment/procedure and professional tag/color.
3. Dragging opens confirmation and does not persist before confirmation.
4. Cancel leaves the original time; confirm persists the new time after reload.
5. Opening an event and saving a professional changes only its tag/color, not its schedule.
6. Evolution category badges and odontogram/face-map panels follow appointmentType.
7. Public/admin media surfaces load repaired local references and public bucket URLs.
8. Conteúdo expands to all four content routes and manager filtering remains correct.

- [ ] **Step 5: Review the final diff and report evidence.**

Run:

~~~powershell
git diff --check
git status --short
git log --oneline --decorate -8
~~~

Do not commit generated artifacts, environment files, or the user’s unrelated image changes. Report the exact passing commands and any smoke flow unavailable because local database credentials or services were unavailable.
