# Admin Panel Mobile Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or **superpowers:executing-plans** to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Make every \`/admin/*\` route usable at phone, tablet, and desktop widths, with no page-level horizontal overflow and with the requested interactive finance summary cards.

**Architecture:** Establish responsive viewport, gutter, overflow, and shell behavior in \`src/App.css\`, \`src/index.css\`, and \`src/components/admin/AdminLayout.tsx\`. Keep one semantic component tree per page, using responsive grid/flex utilities and mobile-specific presentation branches only where a dense desktop table cannot be made readable. Keep finance filter state local to \`AdminFinance\` and preserve existing API, permissions, print, and export behavior.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, shadcn/Radix primitives, lucide-react, React Router.

## Global Constraints

- Use 16px mobile gutters, 24px tablet gutters, and 32px desktop gutters through the shared admin content container.
- Prevent horizontal overflow at the page level. Any intentional wide content must be contained inside its own scroll region.
- Keep interactive controls at least 44px high/wide where practical, with visible focus and pressed states.
- Default to a single-column task flow on phones.
- Do not duplicate page content for mobile and desktop unless the data is inherently two-dimensional and cannot be made readable as one-dimensional content.
- No backend, API contract, authentication, or data-model changes.
- No dependency additions.
- Preserve existing print classes, route permissions, and API behavior.
- No deployment or git push.

---

### Task 1: Establish the global responsive viewport and admin shell

**Files:**
- Modify: \`src/App.css\`
- Modify: \`src/index.css\`
- Modify: \`src/components/admin/AdminLayout.tsx\`

**Interfaces:**
- Consumes: existing \`AdminLayoutProps\`, auth state, route location, and menu permission logic.
- Produces: a full-width root, a mobile header that occupies layout space, a safe drawer, and a content wrapper with stable responsive gutters for every admin route.

- [ ] **Step 1: Replace starter root constraints with a full-width app root**

In \`src/App.css\`, remove the Vite starter \`#root\` max-width, padding, and text alignment rules. Keep the file limited to:

~~~css
#root {
  min-height: 100vh;
  width: 100%;
}
~~~

- [ ] **Step 2: Add shared admin layout utilities and safe-area tokens**

In \`src/index.css\`, extend \`.admin-shell\` with:

~~~css
.admin-shell {
  --admin-sidebar-expanded: 248px;
  --admin-sidebar-collapsed: 76px;
  --admin-topbar-mobile: 56px;
  --admin-gutter: 1rem;
  min-width: 0;
  overflow-x: clip;
}

.admin-content {
  min-width: 0;
  width: 100%;
  padding-inline: var(--admin-gutter);
}

.admin-scroll-region {
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
}

@media (min-width: 640px) {
  .admin-shell { --admin-gutter: 1.5rem; }
}

@media (min-width: 1024px) {
  .admin-shell { --admin-gutter: 2rem; }
}
~~~

Do not add global body overflow hiding as a substitute for fixing overflowing children.

- [ ] **Step 3: Make the mobile bar part of the page flow**

In \`AdminLayout.tsx\`, change the mobile bar from \`fixed inset-x-0 top-0\` to a sticky/flow-safe header that occupies \`var(--admin-topbar-mobile)\` space. Keep its menu button at least \`h-11 w-11\`, add \`aria-expanded={isMobileMenuOpen}\`, and connect it with \`aria-controls="admin-navigation"\`.

Keep the sidebar fixed only as the drawer surface. Add \`id="admin-navigation"\`, \`role="dialog"\` when the mobile drawer is open, and \`aria-label="Navegação administrativa"\`. Preserve desktop fixed positioning and permission filtering.

- [ ] **Step 4: Remove duplicate top padding and stabilize the page header**

Update \`<main>\` so the mobile bar is not compensated by a second fixed-height top padding. Keep the page header sticky only on desktop, or make it normal flow on small screens. The title must use \`min-w-0\`, \`break-words\`, and a bounded flex child instead of relying on \`max-w-[200px]\`.

- [ ] **Step 5: Verify the shell**

Run:

~~~powershell
npm run lint
npm run build
~~~

Expected: both commands exit 0.

- [ ] **Step 6: Commit locally**

~~~powershell
git add src/App.css src/index.css src/components/admin/AdminLayout.tsx
git commit -m "fix: make admin shell responsive on mobile"
~~~

Do not stage unrelated files such as the existing untracked calendar plan.

### Task 2: Redesign the general finance page for mobile-first flow and filters

**Files:**
- Modify: \`src/pages/AdminFinance.tsx\`

**Interfaces:**
- Consumes: existing \`/finance?month=&year=\` and \`/finance/stats\` responses, \`Transaction\` shape, print/export callbacks.
- Produces: local \`transactionTypeFilter\` behavior and responsive report/form ordering without changing API payloads.

- [ ] **Step 1: Add local filter state**

Add:

~~~tsx
const [transactionTypeFilter, setTransactionTypeFilter] =
  useState<"income" | "expense" | null>(null);

const displayedTransactions = transactionTypeFilter
  ? transactions.filter((transaction) => transaction.type === transactionTypeFilter)
  : transactions;
~~~

Clear the type filter when month or year changes. Keep the existing \`Promise.all\` request.

- [ ] **Step 2: Make summary cards accessible filter controls**

Use \`type="button"\`, \`aria-pressed\`, visible active border/ring, and:

~~~tsx
const toggleTransactionTypeFilter = (type: "income" | "expense") => {
  setTransactionTypeFilter((current) => current === type ? null : type);
};

const resetTransactionTypeFilter = () => setTransactionTypeFilter(null);
~~~

Receita selects income, Despesas selects expense, and Saldo Líquido resets. Clicking an active type card toggles back to all.

- [ ] **Step 3: Merge month/year controls into the cash-flow card**

Remove the standalone month selector card. Put both selects in the cash-flow card header or the content directly below it. Stack the title, selectors, active filter label, and clear action on phones; align them beside the title on desktop.

- [ ] **Step 4: Render filtered data and preserve exports**

Use \`displayedTransactions.map\` only for the visible report. Keep CSV/PDF export semantics based on the selected period. Add a clear-filter action and distinguish filtered empty states from an empty period.

- [ ] **Step 5: Add a phone transaction-card presentation**

Keep the desktop table at \`lg\` and render a phone list from the same \`displayedTransactions\` data. Each phone card includes date, type icon, description, patient, amount, receipt/NF-e actions, confirm NF-e when applicable, and a visible delete button. Use \`lg:hidden\` and \`hidden lg:block\` for presentation only.

- [ ] **Step 6: Set finance ordering**

Phone order: cash-flow plus period controls, new transaction, NF-e/export, summary cards. Desktop: summary cards, then cash-flow/report beside new transaction/NF-e. Keep print classes and do not rely only on CSS \`order\` to reverse keyboard order.

- [ ] **Step 7: Verify finance behavior**

Run lint/build and exercise month/year changes, income filter, expense filter, active-card toggle, Saldo Líquido reset, phone actions, print, CSV/PDF, NF-e confirmation, and delete.

- [ ] **Step 8: Commit locally**

~~~powershell
git add src/pages/AdminFinance.tsx
git commit -m "feat: make finance dashboard responsive and filterable"
~~~

### Task 3: Fix shared dense controls and overlays

**Files:**
- Modify: \`src/components/admin/PatientPicker.tsx\`
- Modify: \`src/components/admin/appointments/CalendarView.tsx\`
- Modify: \`src/components/admin/RichTextEditor.tsx\`
- Modify: \`src/components/admin/attendance/Odontogram.tsx\`
- Modify: \`src/components/admin/attendance/PhotoEditor.tsx\`
- Modify: \`src/components/admin/attendance/DicomViewerModal.tsx\`

**Interfaces:**
- Consumes: existing component props and callbacks.
- Produces: contained wide data regions, viewport-fit popovers/modals, and touch-sized actions without API changes.

- [ ] **Step 1: Contain intentional wide regions**

Apply \`.admin-scroll-region\` to calendar and odontogram wrappers. Keep existing \`min-w-[700px]\`/\`min-w-[680px]\` only inside those wrappers. Add clear borders/backgrounds and prevent scroll leakage to the page.

- [ ] **Step 2: Make PatientPicker fit the viewport**

Replace \`w-[400px]\` with \`w-[min(calc(100vw-2rem),400px)] max-w-[calc(100vw-2rem)]\`. Wrap/truncate results inside the popover and give each result a minimum 44px row height.

- [ ] **Step 3: Make editors viewport-aware**

Use \`min-h-[280px] sm:min-h-[360px] lg:min-h-[500px]\` where fixed editor heights currently clip phone use. Keep toolbar scrolling internal.

- [ ] **Step 4: Make image/DICOM modals phone-safe**

Use \`inset-0 p-0 sm:p-4\`, \`max-h-[100dvh]\`, and \`min-h-0\` on modal flex children. Keep controls at least 44px and let tool/content areas scroll independently.

- [ ] **Step 5: Verify and commit**

~~~powershell
npm run lint
npm run build
git diff --check
git add src/components/admin/PatientPicker.tsx src/components/admin/appointments/CalendarView.tsx src/components/admin/RichTextEditor.tsx src/components/admin/attendance/Odontogram.tsx src/components/admin/attendance/PhotoEditor.tsx src/components/admin/attendance/DicomViewerModal.tsx
git commit -m "fix: contain dense admin controls on mobile"
~~~

### Task 4: Audit dashboard, analytics, leads, comments, blog, and stories

**Files:**
- Modify: \`src/pages/AdminDashboard.tsx\`
- Modify: \`src/pages/AdminAnalytics.tsx\`
- Modify: \`src/pages/AdminLeads.tsx\`
- Modify: \`src/pages/AdminComments.tsx\`
- Modify: \`src/pages/AdminBlog.tsx\`
- Modify: \`src/pages/AdminStories.tsx\`

**Interfaces:**
- Consumes: existing page data, navigation, dialogs, and row actions.
- Produces: readable mobile cards/lists, reachable actions, and bounded metadata.

- [ ] **Step 1: Fix dashboard and analytics cards**

Add \`min-w-0\` to grid children, allow metric labels to wrap, and change fixed action rows to \`flex-col sm:flex-row w-full sm:w-auto\`. Keep agenda/history before secondary summaries on phones.

- [ ] **Step 2: Fix leads and comments rows**

Use \`flex-col sm:flex-row\`, make action groups \`w-full sm:w-auto\`, and remove phone-level \`min-w-[240px]\`. Bound email/phone text with \`min-w-0\` and wrapping/truncation.

- [ ] **Step 3: Convert blog and stories tables to phone cards**

Keep one data map, render the desktop table at \`lg\`, and render phone cards below \`lg\`. Every card exposes edit/delete/publish/media actions without hover-only opacity. Contain any intermediate-width table scroll.

- [ ] **Step 4: Fit content dialogs**

Use \`w-[calc(100vw-2rem)] max-w-3xl max-h-[calc(100dvh-2rem)] overflow-y-auto\`, stacked fields on phones, and non-overlapping footer actions.

- [ ] **Step 5: Verify and commit**

~~~powershell
npm run lint
npm run build
git diff --check
git add src/pages/AdminDashboard.tsx src/pages/AdminAnalytics.tsx src/pages/AdminLeads.tsx src/pages/AdminComments.tsx src/pages/AdminBlog.tsx src/pages/AdminStories.tsx
git commit -m "fix: make admin content lists responsive"
~~~

### Task 5: Audit appointments and clinical attendance workflows

**Files:**
- Modify: \`src/pages/AdminAppointments.tsx\`
- Modify: \`src/pages/AdminAttendanceDetail.tsx\`
- Modify: \`src/components/admin/attendance/FaceMap.tsx\`
- Modify: \`src/components/admin/attendance/EvolutionTimeline.tsx\`
- Modify: \`src/components/admin/attendance/PhotoGallery.tsx\`

**Interfaces:**
- Consumes: existing appointment/attendance state, tabs, dialogs, and clinical components.
- Produces: touch-friendly clinical workflows with intentional dense-tool exceptions.

- [ ] **Step 1: Stack appointment controls and history rows**

Stack header action/filter regions on phones. Scope \`min-w-[250px]\` to \`md:\`. Keep patient history readable with \`min-w-0\`, wrapping date/status metadata, and visible touch actions.

- [ ] **Step 2: Make attendance detail single-column on phones**

Keep tabs full-width and at least 44px tall. Stack clinical fields and actions on phones; preserve multi-column layouts from tablet/desktop breakpoints.

- [ ] **Step 3: Bound clinical media and timeline**

Add \`min-w-0\` to photo/timeline parents, keep only odontogram’s intentional horizontal scroll, and give image/action buttons visible touch states.

- [ ] **Step 4: Verify and commit**

~~~powershell
npm run lint
npm run build
git diff --check
git add src/pages/AdminAppointments.tsx src/pages/AdminAttendanceDetail.tsx src/components/admin/attendance/FaceMap.tsx src/components/admin/attendance/EvolutionTimeline.tsx src/components/admin/attendance/PhotoGallery.tsx
git commit -m "fix: improve mobile clinical admin workflows"
~~~

### Task 6: Audit documents, prescription, guide, treatments, users, patients, settings, personal finance, and login

**Files:**
- Modify: \`src/pages/AdminDocuments.tsx\`
- Modify: \`src/pages/AdminPrescription.tsx\`
- Modify: \`src/pages/AdminDigitalGuide.tsx\`
- Modify: \`src/pages/AdminTreatments.tsx\`
- Modify: \`src/pages/AdminUsers.tsx\`
- Modify: \`src/pages/AdminPatients.tsx\`
- Modify: \`src/pages/AdminSettings.tsx\`
- Modify: \`src/pages/AdminPersonalFinance.tsx\`
- Modify: \`src/pages/AdminLogin.tsx\`

**Interfaces:**
- Consumes: existing forms, dialogs, editors, print controls, and API handlers.
- Produces: one-column phone flows, viewport-fit editors/dialogs, and reachable actions while preserving existing behavior.

- [ ] **Step 1: Fix documents and prescription editors**

Stack side panels before editors on phones, use responsive viewport-aware heights, and wrap toolbar/action rows. Keep print-only sections unaffected.

- [ ] **Step 2: Fix guide, treatment, and settings forms**

Use single-column fields and full-width submit actions on phones. Allow tabs to scroll inside their own row. Scope multi-column grids and sticky footers to \`sm\`/\`md\`.

- [ ] **Step 3: Fix users and patients cards/forms**

Add \`min-w-0\` to grid children and stack action rows and picker/form controls without overflow.

- [ ] **Step 4: Fix personal finance**

Apply shared shell/list/form rules, remove phone-unfriendly sticky side behavior, stack summary cards and transaction rows, and preserve existing data behavior.

- [ ] **Step 5: Fix login spacing**

Use \`w-full max-w-md\`, mobile-safe padding, and full-width controls without relying on removed root padding.

- [ ] **Step 6: Verify and commit**

~~~powershell
npm run lint
npm run build
git diff --check
git add src/pages/AdminDocuments.tsx src/pages/AdminPrescription.tsx src/pages/AdminDigitalGuide.tsx src/pages/AdminTreatments.tsx src/pages/AdminUsers.tsx src/pages/AdminPatients.tsx src/pages/AdminSettings.tsx src/pages/AdminPersonalFinance.tsx src/pages/AdminLogin.tsx
git commit -m "fix: finish responsive admin page audit"
~~~

### Task 7: Run full responsive verification and address regressions

**Files:**
- Modify: any file identified by verification.
- Test: all \`/admin/*\` routes at 360px, 390px, 768px, and desktop widths.

**Interfaces:**
- Consumes: completed shell, page, and component changes.
- Produces: verified responsive behavior and a clean local working tree except for unrelated user files.

- [ ] **Step 1: Start the Vite app**

~~~powershell
npm run dev -- --host 127.0.0.1
~~~

Use the in-app browser to inspect authenticated routes with existing local credentials. Do not change auth or seed data.

- [ ] **Step 2: Check the shared shell on every route**

Verify the mobile menu opens/closes without background scroll, title/user controls stay inside the viewport, no page-level horizontal scrollbar appears, actions do not require hover, and long content is not hidden beneath the header.

- [ ] **Step 3: Check intentional dense scroll regions**

Run in the browser console:

~~~js
({ viewport: window.innerWidth, documentWidth: document.documentElement.scrollWidth })
~~~

Expected for ordinary page states: \`documentWidth <= viewport\`. Only calendar/odontogram and explicitly marked dense regions may scroll horizontally.

- [ ] **Step 4: Exercise finance at phone width**

Verify period selectors, income/expense/reset interactions, empty states, phone transaction actions, print/export, and visible active state.

- [ ] **Step 5: Run final checks**

~~~powershell
npm run lint
npm run build
git diff --check
git status --short
~~~

Expected: lint/build exit 0, diff check clean, and status shows only intended changes plus pre-existing unrelated files.

- [ ] **Step 6: Commit verification fixes locally if needed**

~~~powershell
Stage only the exact paths fixed during verification, for example:

\`git add src/pages/AdminFinance.tsx src/components/admin/AdminLayout.tsx\`
git commit -m "fix: verify admin responsive layouts"
~~~

Do not run \`git push\`.

## Plan self-review

- Spec coverage: shared root/shell is Task 1; finance ordering and interactions are Task 2; dense exceptions are Task 3; all route families are covered by Tasks 4–6; verification requirements are Task 7.
- Placeholder scan: no TBD/TODO/FIXME or unspecified implementation task is required.
- Type consistency: \`transactionTypeFilter\` is \`"income" | "expense" | null\`; \`displayedTransactions\` is a \`Transaction[]\`; existing handlers continue to consume numeric IDs and existing response shapes.
- Scope: no backend, auth, dependency, or deployment work is included. The existing unrelated untracked calendar plan must not be staged.
