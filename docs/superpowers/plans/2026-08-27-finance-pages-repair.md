# Finance Pages Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the visible desktop/mobile rendering of `/admin/finance` and make both finance pages usable without horizontal overflow on narrow screens.

**Architecture:** Keep the existing React pages, admin shell, API calls, and print flow. Change the print scope's screen visibility in `src/index.css`, then apply localized Tailwind layout contracts to `AdminFinance` and `AdminPersonalFinance`; add a small source-level regression test because jsdom does not perform real responsive layout.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, Vitest, Testing Library conventions already present in the repository.

## Global Constraints

- Treat patient, prescription, financial, authentication and storage data as sensitive by default.
- No new API routes, credentials, tokens, storage paths, authorization rules, or sensitive fixtures.
- Preserve the existing private upload flow, authentication, finance payloads, filters, NF-e action, CSV/PDF downloads, and print behavior.
- Preserve existing user-owned and untracked `.superpowers/sdd` files; stage only files belonging to this work.
- Run frontend/backend verification, secret scan, and `git diff --check` before deployment.

---

### Task 1: Add regression coverage for the finance layout contracts

**Files:**
- Create: `src/pages/finance-pages-layout.test.ts`

**Interfaces:**
- Consumes: current source files `src/index.css`, `src/pages/AdminFinance.tsx`, and `src/pages/AdminPersonalFinance.tsx`.
- Produces: automated checks that fail before the visibility and mobile layout changes and pass after them.

- [ ] **Step 1: Write the failing test**

Create the test with this content:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("finance page layout contracts", () => {
  const css = read("src/index.css");
  const clinicFinance = read("src/pages/AdminFinance.tsx");
  const personalFinance = read("src/pages/AdminPersonalFinance.tsx");

  it("keeps the visible finance print scope visible on screen", () => {
    expect(css).toMatch(/\.print-root\s*\{\s*display:\s*block\s*;\s*\}/);
    expect(clinicFinance).toContain("print-root");
    expect(clinicFinance).not.toContain("hidden print-root");
  });

  it("keeps narrow clinic finance content inside flexible containers", () => {
    expect(clinicFinance).toContain('className="space-y-3 lg:hidden"');
    expect(clinicFinance).toContain("min-w-0 flex-col");
  });

  it("stacks personal finance fields and exposes row actions on touch", () => {
    expect(personalFinance).toContain('className="grid grid-cols-1 gap-4 sm:grid-cols-2"');
    expect(personalFinance).toContain("flex min-w-0 flex-col gap-4");
    expect(personalFinance).toContain("sm:opacity-0 sm:group-hover:opacity-100");
    expect(personalFinance).toContain("aria-label={`Excluir ${t.description}`}");
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails for the known contracts**

Run `npm test -- src/pages/finance-pages-layout.test.ts`.

Expected result before implementation: the test fails because `.print-root` is `display: none` and the new responsive class contracts do not yet exist. If the sandbox reports esbuild access denial while loading `vitest.config.ts`, rerun the same command with the approved elevated Git/Node execution context; do not treat a startup error as a passing test.

- [ ] **Step 3: Commit the regression test**

Run:

```text
git add -- src/pages/finance-pages-layout.test.ts
git commit -m "test: cover finance page layout contracts"
```

Expected result: one commit containing only the new test file.

### Task 2: Restore screen visibility without breaking print-only targets

**Files:**
- Modify: `src/index.css:167-169`

**Interfaces:**
- Consumes: existing `.hidden`, `.print-only`, and `@media print` rules.
- Produces: `.print-root` with `display: block` by default; print-only roots remain hidden because their JSX also includes `hidden`, and print rules still force `.print-only` visible during printing.

- [ ] **Step 1: Replace the screen rule**

Change:

```css
.print-root {
  display: none;
}
```

to:

```css
.print-root {
  display: block;
}
```

Do not modify the `@media print` selectors or any print-specific page-break rules.

- [ ] **Step 2: Run the focused test**

Run `npm test -- src/pages/finance-pages-layout.test.ts`.

Expected result: the visibility assertion passes; responsive assertions remain red until Tasks 3 and 4.

- [ ] **Step 3: Commit the visibility fix**

Run:

```text
git add -- src/index.css
git commit -m "fix: restore finance page screen visibility"
```

Expected result: one commit containing only the CSS visibility change.

### Task 3: Harden the clinic finance page at narrow widths

**Files:**
- Modify: `src/pages/AdminFinance.tsx:220-506,581-605`

**Interfaces:**
- Consumes: the existing `printDocumentClass`, finance API data, Radix selects, upload controls, and mobile transaction-card branch.
- Produces: a visible, width-contained clinic finance page with the same actions and data behavior at all viewport widths.

- [ ] **Step 1: Add width containment to the page and main grids**

Update the existing class strings as follows, keeping all handlers and children unchanged:

```tsx
<div className={`print-root ${printDocumentClass(printMode)} flex min-w-0 flex-col`}>
<div className="no-print order-3 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 mb-8 lg:order-1">
<div className="order-2 grid min-w-0 grid-cols-1 gap-6 lg:order-2 lg:grid-cols-3 lg:gap-8">
<div className="print-report order-1 min-w-0 lg:order-2 lg:col-span-2">
```

- [ ] **Step 2: Make the report header controls wrap predictably**

Use these classes for the report card header, inner heading, control group, period label, and native print-format select:

```tsx
<CardHeader className="min-w-0 gap-4 lg:flex-row lg:items-start lg:justify-between">
<div className="min-w-0">
<div className="no-print flex w-full flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
<label className="inline-flex w-full items-center justify-between gap-2 text-sm text-muted-foreground sm:w-auto sm:justify-start">
<select value={printMode} onChange={(e) => setPrintMode(e.target.value as PrintMode)} className="h-10 min-w-0 max-w-full rounded-lg border bg-background px-3">
```

Keep the existing select values, button handlers, PDF props, and `no-print` classes. Add `w-full sm:w-auto` to the nested PDF label button so it fills only the mobile action row and returns to intrinsic width on larger screens.

- [ ] **Step 3: Keep mobile transaction cards from clipping long values**

Add `min-w-0` to the mobile transaction-list wrapper and article, and retain the existing `min-w-0` on the title block. Add `break-words` to the patient chip and description where missing. Do not reintroduce a horizontal table on small screens or change the desktop `hidden lg:block` table branch.

- [ ] **Step 4: Run the focused test and build the frontend**

Run `npm test -- src/pages/finance-pages-layout.test.ts` and then `npm run build`.

Expected result: the clinic width-containment assertion and build pass. The personal responsive assertion is the only remaining test work.

- [ ] **Step 5: Commit the clinic page changes**

Run:

```text
git add -- src/pages/AdminFinance.tsx
git commit -m "fix: harden clinic finance responsive layout"
```

Expected result: one commit containing only `AdminFinance.tsx`.

### Task 4: Reflow personal finance forms and history for touch screens

**Files:**
- Modify: `src/pages/AdminPersonalFinance.tsx:148-379`

**Interfaces:**
- Consumes: existing personal finance data, form handlers, upload controls, and delete action.
- Produces: a narrow-screen layout with no rigid row overflow and an always-visible touch target for deletion.

- [ ] **Step 1: Make summary and form containers width-safe**

Update the summary and content grid classes:

```tsx
<div className="grid min-w-0 grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
<CardContent className="flex min-w-0 items-center gap-3 p-4 sm:gap-4 sm:p-5">
<div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
<Card className="min-w-0 border-slate-200 shadow-lg lg:sticky lg:top-24">
```

Apply `min-w-0` to the value containers so long currency values cannot force the card wider.

- [ ] **Step 2: Collapse the amount/status fields on the smallest screens**

Change only the form field grid from:

```tsx
<div className="grid grid-cols-2 gap-4">
```

to:

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
```

- [ ] **Step 3: Convert history rows to a mobile-first layout**

Update the existing transaction row elements to these exact mobile-first classes, preserving the existing data and handlers:

```tsx
<div className="group flex min-w-0 flex-col gap-4 border-l-4 border-transparent p-4 transition-all hover:border-primary hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between sm:p-5">
  <div className="flex min-w-0 items-start gap-3 sm:gap-5">
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
      {t.type === 'income' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
    </div>
    <div className="min-w-0 flex-1 space-y-1">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p className="min-w-0 break-words font-bold text-slate-900">{t.description}</p>
        <Badge variant={t.status === 'paid' ? "outline" : "secondary"} className={`shrink-0 text-[9px] h-4 uppercase ${t.status === 'paid' ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"}`}>
          {t.status === 'paid' ? 'Pago' : 'Pendente'}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2 break-words text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1"><CalendarIcon size={12} /> {new Date(t.date).toLocaleDateString()}</span>
        <span>•</span>
        <span className="break-words text-primary/70">{t.category}</span>
      </div>
    </div>
  </div>
  <div className="flex w-full min-w-0 items-center justify-between gap-3 sm:w-auto sm:gap-6">
    <div className="min-w-0 text-right">
      <p className={`break-words text-lg font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
      </p>
      {t.receiptUrl && (
        <a href={mediaUrl(t.receiptUrl) || undefined} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 break-words text-[10px] font-black text-primary uppercase hover:underline">
          <Receipt size={10} /> Ver Recibo
        </a>
      )}
    </div>
    <div className="flex shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
      <Button type="button" aria-label={`Excluir ${t.description}`} className="h-10 w-10 text-slate-300 hover:bg-red-50 hover:text-red-500">
        <Trash2 size={16} />
      </Button>
    </div>
  </div>
</div>
```

The action must not depend on hover at mobile widths, and its `onClick` must remain `() => handleDelete(t.id)`. Change the history card height to `min-h-0 sm:min-h-[600px]` so an empty mobile state does not reserve an unnecessary fixed block.

- [ ] **Step 4: Run the focused regression test**

Run `npm test -- src/pages/finance-pages-layout.test.ts`.

Expected result: all finance layout contract tests pass.

- [ ] **Step 5: Commit the personal page changes**

Run:

```text
git add -- src/pages/AdminPersonalFinance.tsx
git commit -m "fix: improve personal finance mobile layout"
```

Expected result: one commit containing only `AdminPersonalFinance.tsx`.

### Task 5: Run complete verification and publish for autodeploy

**Files:**
- Verify: `src/index.css`, `src/pages/AdminFinance.tsx`, `src/pages/AdminPersonalFinance.tsx`, `src/pages/finance-pages-layout.test.ts`
- Do not stage or modify: existing `.superpowers/sdd/*` changes.

**Interfaces:**
- Consumes: all implementation commits above and the existing backend package.
- Produces: verified `main` branch and a push to `origin/main`.

- [ ] **Step 1: Run frontend tests, lint, and production build**

Run each command fully:

```text
npm test
npm run lint
npm run build
```

Expected result: Vitest exits 0 with no failed tests, ESLint exits 0, and Vite reports a successful production build. The existing Browserslist/chunk-size warnings are non-blocking; runtime or compile errors are blocking.

- [ ] **Step 2: Run backend build/tests available in the repository**

Run `npm run build` from `server`. This invokes the repository's Prisma generation script and must exit 0. There is no backend test script in `server/package.json`; record that fact rather than inventing a command.

- [ ] **Step 3: Run security and whitespace checks**

Run:

```text
git diff --check HEAD~5..HEAD
git diff --cached --name-only
```

Also scan the implementation diff for credential-like additions with:

```text
git diff HEAD~5..HEAD | Select-String -Pattern 'AKIA[0-9A-Z]{16}|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|password\s*[:=]|secret\s*[:=]|token\s*[:=]' -CaseSensitive:$false
```

Expected result: whitespace check exits 0; staged-name output is empty after commits; the secret scan returns no matches. If the five-commit range includes unrelated pre-existing commits, inspect only the current implementation commit files before reporting.

- [ ] **Step 4: Verify the diff and route scope before pushing**

Run `git status --short` and `git diff HEAD~4..HEAD --stat`. Confirm that the implementation commits contain only the approved spec/plan, test, CSS, and two finance page files; confirm no backend/API/security file changed.

- [ ] **Step 5: Push the approved commits to origin main**

Run `git push origin main`.

Expected result: the push succeeds and the remote reports the new `main` commit range. This is the deployment trigger explicitly approved by the user.

- [ ] **Step 6: Confirm local post-push state**

Run `git status --short` and `git log -6 --oneline --decorate`. Expected result: the branch is up to date with `origin/main`; pre-existing `.superpowers/sdd` modifications remain present and uncommitted.
