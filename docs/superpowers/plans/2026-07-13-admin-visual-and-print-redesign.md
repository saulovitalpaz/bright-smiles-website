# Admin Visual and Print Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade every authenticated admin page to the approved warm-modern responsive shell and provide consistent formal/compact A4 browser print and PDF output.

**Architecture:** Add shared warm-modern tokens, stable shell dimensions, and a `PrintMode` contract instead of duplicating page-local styles. Keep existing routes/data behavior intact while migrating shell, cards, print previews, and React-PDF generators.

**Tech Stack:** React 18, TypeScript, React Router, Tailwind CSS, `@react-pdf/renderer`, Vite, shadcn/ui.

## Global Constraints

- Desktop expanded sidebar is 248px; collapsed rail is 76px.
- Mobile drawer is capped at 320px (or 86vw) with a 64px top bar and body scroll lock.
- Shared card motion is 180–220ms with no more than a 2px hover lift.
- `prefers-reduced-motion: reduce` disables transform-based movement.
- Formal A4 uses `@page { size: A4; margin: 14mm 14mm 16mm; }`.
- Compact A4 uses `@page { size: A4; margin: 9mm; }`.
- Existing routes, permissions, data fetching, document content, and filenames remain unchanged.

---

### Task 1: Add shared warm-modern and print-mode primitives

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/ui/card.tsx`
- Create: `src/lib/print-layout.ts`

**Interfaces:** `PrintMode = "clinic" | "compact"`, `printModeLabels`, `printModeDescriptions`, and `printDocumentClass(mode)` are consumed by later tasks. CSS contracts are `.admin-shell`, `.admin-card`, `.print-document`, `.print-clinic`, and `.print-compact`.

- [ ] **Step 1: Add `src/lib/print-layout.ts`.**

```ts
export type PrintMode = "clinic" | "compact";
export const printModeLabels: Record<PrintMode, string> = { clinic: "A4 clínico", compact: "A4 compacto" };
export const printModeDescriptions: Record<PrintMode, string> = {
  clinic: "Margens amplas para documentos oficiais e assinatura.",
  compact: "Margens reduzidas para históricos e relatórios longos.",
};
export const printDocumentClass = (mode: PrintMode) => `print-document print-${mode}`;
```

- [ ] **Step 2: Add shared admin CSS to `src/index.css`.** Keep all declarations under `@layer components` and add reduced-motion support:

```css
.admin-shell { --admin-sidebar-expanded: 248px; --admin-sidebar-collapsed: 76px; --admin-topbar-mobile: 64px; background: hsl(32 28% 96%); }
.admin-card { border: 1px solid hsl(30 18% 86% / .9); border-radius: 1rem; background: hsl(30 35% 99%); box-shadow: 0 10px 24px -18px hsl(28 30% 25% / .35); transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease; }
.admin-card:hover { transform: translateY(-2px); border-color: hsl(var(--gold) / .45); box-shadow: 0 16px 30px -20px hsl(28 30% 25% / .45); }
.admin-shell :where(button, a, input, select, textarea):focus-visible { outline: 2px solid hsl(var(--gold)); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .admin-shell *, .admin-shell *::before, .admin-shell *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .01ms !important; } .admin-card:hover { transform: none; } }
```

- [ ] **Step 3: Mark `Card` surfaces.** In `src/components/ui/card.tsx`, add `data-admin-card` to the root `<div>` and add `.admin-shell [data-admin-card] { @apply admin-card; }` (or equivalent declarations) in `index.css`.

- [ ] **Step 4: Replace the global print reset.** Use one `@media print` block that hides shell chrome, resets `#root/main`, and protects `.print-section`, `.print-patient-block`, and `.print-signature`. Set `@page` to `14mm 14mm 16mm` by default and add a compact override with `@page { size: A4; margin: 9mm; }`, compact 10pt text, tighter cell padding, and `thead { display: table-header-group; }`.

- [ ] **Step 5: Run `npm run build`.** Expected: Vite exits 0 with no PostCSS/TypeScript errors.

- [ ] **Step 6: Commit.**

```bash
git add src/index.css src/components/ui/card.tsx src/lib/print-layout.ts
git commit -m "feat: add warm admin and print primitives"
```

### Task 2: Refactor the authenticated shell for desktop and mobile

**Files:**
- Modify: `src/components/admin/AdminLayout.tsx`

**Interfaces:** `AdminLayout` keeps `{ children, title }`; the root exposes `.admin-shell`, `.admin-sidebar`, `.admin-main`, and `.admin-mobile-bar`.

- [ ] **Step 1: Add mobile scroll lock.** Add this effect without changing route or auth logic:

```tsx
React.useEffect(() => {
  if (!isMobileMenuOpen) return;
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => { document.body.style.overflow = previousOverflow; };
}, [isMobileMenuOpen]);
```

- [ ] **Step 2: Set stable shell dimensions.** Use `w-[min(86vw,320px)] lg:w-[var(--admin-sidebar-expanded)]`, swap to `lg:w-[var(--admin-sidebar-collapsed)]` when collapsed, and use `lg:ml-[var(--admin-sidebar-expanded)]`/collapsed on the main region. Mobile gets `pt-[var(--admin-topbar-mobile)]` and zero left margin.

- [ ] **Step 3: Remove render-time `window.innerWidth` checks.** Use responsive utility classes for logo/labels. Keep a 64px mobile top bar, 44px menu button, z-30 backdrop, z-40 drawer, and in-drawer close button.

- [ ] **Step 4: Normalize nav links.** Apply `min-h-11 px-3.5 rounded-xl`, a single warm active state, and 36px nested links. Preserve existing permission filtering and route matching.

- [ ] **Step 5: Normalize page header layout.** Keep `title`, but wrap title/actions with `flex-col gap-3 sm:flex-row sm:items-center sm:justify-between` and `flex-wrap` actions to prevent overflow.

- [ ] **Step 6: Run `npm run lint` and `npm run build`; expected both exit 0.**

- [ ] **Step 7: Commit.**

```bash
git add src/components/admin/AdminLayout.tsx
git commit -m "feat: modernize responsive admin shell"
```

### Task 3: Apply shared cards and print classes to authenticated pages

**Files:**
- Modify: `src/pages/AdminDashboard.tsx`, `AdminSolicitacoes.tsx`, `AdminPatients.tsx`, `AdminConsultas.tsx`, `AdminDocuments.tsx`, `AdminPrescription.tsx`, `AdminFinance.tsx`, `AdminPersonalFinance.tsx`, `AdminSettings.tsx`, and `AdminAnalytics.tsx` where local wrappers override shared surfaces.
- Modify: `src/components/admin/AdminLayout.tsx` only if a header slot is needed.

**Interfaces:** Print-capable pages own `printMode` state and use `printDocumentClass(printMode)`; long-history/report pages default to `compact`, formal documents default to `clinic`.

- [ ] **Step 1: Add a mode selector beside print/download actions.** Use a native, keyboard-safe select:

```tsx
const [printMode, setPrintMode] = useState<PrintMode>("clinic");
<label className="no-print inline-flex items-center gap-2 text-sm text-muted-foreground">
  <span>Formato</span>
  <select value={printMode} onChange={(e) => setPrintMode(e.target.value as PrintMode)} className="h-10 rounded-lg border bg-background px-3">
    <option value="clinic">A4 clínico</option><option value="compact">A4 compacto</option>
  </select>
</label>
```

- [ ] **Step 2: Migrate document/prescription print roots.** Import `printDocumentClass`, remove their inline `@media print` blocks, and apply `className={cn(printDocumentClass(printMode), "text-slate-900")}`. Mark semantic groups with `print-section`, `print-patient-block`, and `print-signature`.

- [ ] **Step 3: Normalize custom cards and grids.** Add `admin-card` to non-`Card` wrappers; remove conflicting one-off shadows/radii/transitions while preserving status colors and actions. Add `overflow-x-auto` to interactive tables and `break-inside-avoid` to print summary/signature blocks.

- [ ] **Step 4: Run `npm run lint` and `npm run build`; expected both exit 0.**

- [ ] **Step 5: Commit.**

```bash
git add src/pages/Admin*.tsx src/components/admin/AdminLayout.tsx
git commit -m "feat: unify admin cards and print previews"
```

### Task 4: Add formal and compact spacing to generated PDFs

**Files:**
- Modify: `src/components/PrescriptionGenerator.tsx`
- Modify: `src/components/admin/FinanceReportPDF.tsx`
- Modify: `src/pages/AdminPrescription.tsx` and `src/pages/AdminFinance.tsx` call sites.

**Interfaces:** `PrescriptionDocument`, `FinanceReportDocument`, `DownloadPrescriptionButton`, and `DownloadFinanceReportButton` accept optional `mode?: PrintMode`, defaulting to `clinic`.

- [ ] **Step 1: Define mode-aware React-PDF tokens.** Use this exact shared shape in both generators:

```ts
const pdfTokens = {
  clinic: { pagePadding: 40, sectionGap: 16, tableCellPadding: 6, bodySize: 10 },
  compact: { pagePadding: 26, sectionGap: 8, tableCellPadding: 3, bodySize: 9 },
} as const;
```

- [ ] **Step 2: Thread `mode` into `<Page size="A4">`.** Set page padding, section margins, table cell padding, and body font size from `pdfTokens[mode]`; keep existing content, logo, and filenames.

- [ ] **Step 3: Forward mode through download links.** Use `<PrescriptionDocument data={data} content={content} mode={mode} />` and the equivalent finance document; default missing mode to `clinic`.

- [ ] **Step 4: Pass the page selector state to both browser print and PDF download.**

- [ ] **Step 5: Run `npm run build`; expected exit 0 and valid A4 PDFs in both modes.**

- [ ] **Step 6: Commit.**

```bash
git add src/components/PrescriptionGenerator.tsx src/components/admin/FinanceReportPDF.tsx src/pages/AdminPrescription.tsx src/pages/AdminFinance.tsx
git commit -m "feat: support formal and compact PDF layouts"
```

### Task 5: Verify responsive and print behavior before handoff

**Files:** Modify only files from Tasks 1–4 if verification finds a regression.

- [ ] **Step 1: Run `npm run lint`, `npm run build`, and `git diff --check`; expected all exit 0.**
- [ ] **Step 2: Start preview with `npm.cmd run dev -- --host 127.0.0.1`; expected no PowerShell execution-policy error.**
- [ ] **Step 3: Inspect authenticated routes at 1440px and 390px.** Confirm 248/76px sidebar geometry, 320px-or-less drawer, no horizontal overflow, body scroll lock, 44px controls, card hover/focus, and reduced-motion behavior.
- [ ] **Step 4: Print a formal document.** Confirm A4, 14mm/14mm/16mm margins, hidden shell chrome, intact signatures, and no clipping.
- [ ] **Step 5: Print/export a compact history and finance report.** Confirm 9mm margins, denser rows, repeated table headers, no overflow, and all four prescription/finance PDFs open.
- [ ] **Step 6: Review `git status --short` for only intentional redesign changes and commit verification fixes with a focused message.**
