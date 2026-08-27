# Admin Responsive Navigation and Print Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir a navegação responsiva do painel e tornar os fluxos de impressão de odontograma, prescrição e documentos previsíveis em todas as larguras.

**Architecture:** Manter o `AdminLayout` como dono da sidebar/drawer e introduzir um único estado de grupo aberto, com itens pai expansíveis e links filhos independentes. Cada tela imprimível renderizará um `print-root` somente após definir explicitamente o alvo, permitindo que o DOM esteja pronto antes de `window.print()` e evitando que o shell oculto reserve uma página. A prescrição terá dois alvos (`prescription` e `odontogram`); documentos terão um alvo geral.

**Tech Stack:** React 18, TypeScript, Vite, React Router, Tailwind CSS, shadcn/ui, Vitest e Testing Library.

## Global Constraints

- Não alterar backend, banco, autenticação, permissões, APIs ou dados persistidos.
- Manter controles com área mínima de toque de 44px e foco visível.
- Em mobile, manter 16px de gutter; em tablet, 24px; em desktop, 32px através do container administrativo existente.
- Qualquer conteúdo largo deve ficar contido em sua própria região de rolagem; a página não pode ganhar overflow horizontal.
- O odontograma da prescrição ocupa a primeira página e a receita começa na segunda quando o mapa for incluído.
- `Imprimir odontograma` imprime apenas o mapa carregado/atualizado e seu contexto mínimo, sem prescrição.
- O shell administrativo, controles e editor não aparecem na impressão.
- Não adicionar credenciais, tokens, URLs assinadas, assinaturas ou dados de pacientes a logs, testes ou documentação.
- Preservar arquivos não rastreados e alterações existentes fora dos arquivos explicitamente listados.

---

### Task 1: Codify responsive navigation and print contracts

**Files:**
- Modify: `src/components/admin/navigation-contract.test.tsx`
- Test: `src/components/admin/navigation-contract.test.tsx`

**Interfaces:**
- Consumes: the current source-contract test helper and `AdminLayout`/page source.
- Produces: executable regression contracts for the sticky mobile trigger, disclosure navigation, explicit print targets, and controlled page breaks.

- [ ] **Step 1: Write the failing tests**

Add these source reads beside the existing ones:

```ts
const prescriptionSource = readSource("src/pages/AdminPrescription.tsx");
const documentsSource = readSource("src/pages/AdminDocuments.tsx");
const cssSource = readSource("src/index.css");
```

Add these assertions:

```ts
it("keeps the mobile menu trigger available during page scroll", () => {
  expect(layoutSource).toMatch(/admin-mobile-bar[\s\S]*sticky top-0/);
  expect(layoutSource).toContain("safe-area-inset-top");
});

it("uses disclosure buttons instead of default links for grouped navigation", () => {
  expect(layoutSource).toContain('type="button"');
  expect(layoutSource).toContain("aria-expanded={isGroupOpen}");
  expect(layoutSource).toContain("aria-controls={submenuId}");
  expect(layoutSource).toContain("renderNestedItems(item, isGroupOpen)");
});

it("exposes separate prescription and odontogram print targets", () => {
  expect(prescriptionSource).toContain('type PrintTarget = "prescription" | "odontogram"');
  expect(prescriptionSource).toContain('setPrintTarget("odontogram")');
  expect(prescriptionSource).toContain('data-print-target={printTarget}');
  expect(prescriptionSource).toContain("print-page-odontogram");
});

it("waits for the document print root before invoking browser print", () => {
  expect(prescriptionSource).toContain("requestAnimationFrame");
  expect(prescriptionSource).toContain('addEventListener("afterprint"');
  expect(documentsSource).toContain("requestAnimationFrame");
  expect(documentsSource).toContain('addEventListener("afterprint"');
});

it("keeps the print flow fragmentable and page-break controlled", () => {
  expect(cssSource).toMatch(/\.print-root\s*\{[\s\S]*display:\s*none/);
  expect(cssSource).toMatch(/\.print-document\s*\{[\s\S]*display:\s*block\s*!important/);
  expect(cssSource).toContain(".print-page-odontogram");
});
```

- [ ] **Step 2: Run the focused test to verify it fails for the missing behavior**

Run: `npm test -- src/components/admin/navigation-contract.test.tsx`

Expected: FAIL because the current layout uses a relative mobile bar, grouped parents are links, and the print screens do not have explicit print-target state.

- [ ] **Step 3: Commit the red contract tests**

Run:

```powershell
git add -- src/components/admin/navigation-contract.test.tsx
git commit -m "test: cover admin navigation and print targets"
```

### Task 2: Make the admin shell sticky and submenu-safe

**Files:**
- Modify: `src/components/admin/AdminLayout.tsx:29-276`
- Modify: `src/index.css:217-275`
- Test: `src/components/admin/navigation-contract.test.tsx`

**Interfaces:**
- Consumes: the existing `menuItems`, role filtering, `useLocation`, `logout`, and `isCollapsed` state.
- Produces: accessible parent disclosure controls; nested links remain the only navigation targets for grouped items; `admin-mobile-bar` remains visible while scrolling.

- [ ] **Step 1: Add a stable open-group state and active-group synchronization**

Use a memoized menu collection and synchronize only the active group:

```tsx
const [openGroup, setOpenGroup] = React.useState<string | null>(null);

const activeGroupLabel = menuItems.find((item) =>
  item.subItems?.some((sub) => location.pathname.startsWith(sub.href)),
)?.label ?? null;

React.useEffect(() => {
  if (activeGroupLabel) setOpenGroup(activeGroupLabel);
}, [activeGroupLabel]);

const toggleGroup = (label: string) => {
  setOpenGroup((current) => current === label ? null : label);
};
```

Keep direct links for items without `subItems`. For grouped items, render a `button type="button"` with `aria-expanded={isGroupOpen}`, `aria-controls={submenuId}`, and a chevron that rotates from the state. In the collapsed desktop rail, clicking a grouped item must call `setIsCollapsed(false)` and `setOpenGroup(item.label)`; it must never use `to={item.href}`.

- [ ] **Step 2: Render nested links from the disclosure state**

Change the nested renderer to receive `isGroupOpen`, give each group a stable id such as ``admin-submenu-${item.label.toLowerCase().replaceAll(" ", "-")}``, and render the nested wrapper with that id. Keep the current route-based selected styling on each child link. The parent button should show an active visual state when either its own route or a child route is active, while expansion remains independently toggleable.

- [ ] **Step 3: Make the mobile trigger sticky and safe-area aware**

Replace the mobile bar classes with a sticky surface:

```tsx
<div className="admin-mobile-bar no-print sticky top-0 z-20 flex h-[var(--admin-topbar-mobile)] items-center border-b border-slate-200 bg-background/95 px-4 backdrop-blur-md lg:hidden">
```

Add in the shared component layer:

```css
.admin-mobile-bar {
  padding-top: env(safe-area-inset-top);
}
```

Use `h-dvh max-h-dvh min-h-0` on the fixed sidebar and `overscroll-contain` on its internal nav so the drawer scrolls independently without leaking horizontal/vertical gestures to the page.

- [ ] **Step 4: Run the focused contract test**

Run: `npm test -- src/components/admin/navigation-contract.test.tsx`

Expected: PASS, including the existing route and permission assertions.

- [ ] **Step 5: Commit the navigation fix**

Run:

```powershell
git add -- src/components/admin/AdminLayout.tsx src/index.css src/components/admin/navigation-contract.test.tsx
git commit -m "fix: keep admin navigation responsive and expandable"
```

### Task 3: Add explicit prescription print targets

**Files:**
- Modify: `src/pages/AdminPrescription.tsx:1-580`
- Modify: `src/components/admin/navigation-contract.test.tsx`
- Test: `src/components/admin/navigation-contract.test.tsx`

**Interfaces:**
- Consumes: existing patient selection, last-record odontogram loading, `Odontogram`, `ProfessionalSignature`, and `printDocumentClass`.
- Produces: `PrintTarget = "prescription" | "odontogram"`, `handlePrintOdontogram`, and a print root that is mounted before `window.print()`.

- [ ] **Step 1: Write the failing standalone-print assertions**

Extend the prescription contract with:

```ts
it("offers a standalone odontogram print action in the odontogram card", () => {
  expect(prescriptionSource).toContain("Imprimir odontograma");
  expect(prescriptionSource).toContain("handlePrintOdontogram");
  expect(prescriptionSource).toContain("Object.keys(normalizeOdontogram");
});

it("preserves the page break only for a prescription that includes the odontogram", () => {
  expect(prescriptionSource).toContain('printTarget === "prescription"');
  expect(prescriptionSource).toContain("print-page-odontogram");
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- src/components/admin/navigation-contract.test.tsx`

Expected: FAIL because the card has no standalone action and the page has no print target state.

- [ ] **Step 3: Add print target state and afterprint cleanup**

Add:

```tsx
type PrintTarget = "prescription" | "odontogram";
const [printTarget, setPrintTarget] = useState<PrintTarget | null>(null);

useEffect(() => {
  if (!printTarget) return;
  const clearPrintTarget = () => setPrintTarget(null);
  window.addEventListener("afterprint", clearPrintTarget);
  const frame = window.requestAnimationFrame(() => window.print());
  return () => {
    window.cancelAnimationFrame(frame);
    window.removeEventListener("afterprint", clearPrintTarget);
  };
}, [printTarget]);
```

Change `handlePrint` to validate the prescription and call `setPrintTarget("prescription")`. Add `handlePrintOdontogram` that normalizes `patientData.odontogram`, checks `Object.keys(normalized.teeth).length`, shows a toast when empty, and otherwise calls `setPrintTarget("odontogram")`. Keep the existing professional identity guard for official prescription printing.

- [ ] **Step 4: Add the standalone card action with touch-safe sizing**

Place a `Button` in the odontogram card header/action row:

```tsx
<Button
  type="button"
  variant="outline"
  size="sm"
  className="min-h-11 w-full gap-2 sm:w-auto"
  onClick={handlePrintOdontogram}
>
  <Printer size={16} /> Imprimir odontograma
</Button>
```

The action must be visible whenever the card is visible and must use the same odontogram that was loaded from the latest patient record or edited in the current screen.

- [ ] **Step 5: Render only the selected print target**

Mount the print root conditionally with `hidden print-only print-root`, `data-print-target={printTarget}`, and `printDocumentClass("clinic")`. For `prescription`, keep the current odontogram block first and retain `print-page-odontogram` only when a normalized odontogram exists, followed by the patient/prescription/signature flow. For `odontogram`, render clinic header, patient name/CPF when available, and the read-only printable odontogram only; do not render the prescription body or prescription signature block.

- [ ] **Step 6: Run focused tests and commit**

Run: `npm test -- src/components/admin/navigation-contract.test.tsx`

Expected: PASS.

```powershell
git add -- src/pages/AdminPrescription.tsx src/components/admin/navigation-contract.test.tsx
git commit -m "feat: print prescription and odontogram separately"
```

### Task 4: Synchronize document printing with the rendered print root

**Files:**
- Modify: `src/pages/AdminDocuments.tsx:1-490`
- Modify: `src/index.css:587-801`
- Modify: `src/components/admin/navigation-contract.test.tsx`
- Test: `src/components/admin/navigation-contract.test.tsx`

**Interfaces:**
- Consumes: existing document content, professional signature state, and `printDocumentClass`.
- Produces: a document print root mounted only for the active print request; no shell or editor layout can reserve the first printed page.

- [ ] **Step 1: Write the failing document-print contract**

Add:

```ts
it("mounts the document print root only for an active print request", () => {
  expect(documentsSource).toContain("isPrintReady");
  expect(documentsSource).toContain('setIsPrintReady(true)');
  expect(documentsSource).toContain('data-print-target="document"');
  expect(documentsSource).toContain("hidden print-only print-root");
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- src/components/admin/navigation-contract.test.tsx`

Expected: FAIL because the document print root is always mounted and `handlePrint` calls `window.print()` immediately.

- [ ] **Step 3: Add a synchronized print-ready state**

Add `const [isPrintReady, setIsPrintReady] = useState(false);` and an effect with the same `afterprint`/`requestAnimationFrame` lifecycle as the prescription. Change `handlePrint` to keep the existing validation and call `setIsPrintReady(true)`.

- [ ] **Step 4: Conditionally mount the print root**

Wrap the current printable markup in `{isPrintReady && (...)}` and add `data-print-target="document"`. Keep the editor grid entirely outside the root. Do not add a flex/min-height wrapper around the print root. The root must contain only the document header, flowing sanitized document content, signature block and date.

- [ ] **Step 5: Harden common print CSS against blank leading pages**

Add a non-print default so the root cannot flash into the screen layout:

```css
.print-root {
  display: none;
}
```

Inside `@media print`, keep `.print-root { display: block !important; position: static !important; transform: none !important; }`, reset `#root`, `.admin-shell`, `.admin-main`, `.admin-content`, and `main` to auto height/block flow, and hide direct admin content siblings with:

```css
body:has(.print-root) .admin-content > :not(.print-root) {
  display: none !important;
}
```

Keep `.print-document` as a fragmentable block and keep `.print-page-odontogram` as the only explicit `break-after: page` rule. Do not add a break to the standalone odontogram target.

- [ ] **Step 6: Run focused tests and commit**

Run: `npm test -- src/components/admin/navigation-contract.test.tsx`

Expected: PASS.

```powershell
git add -- src/pages/AdminDocuments.tsx src/index.css src/components/admin/navigation-contract.test.tsx
git commit -m "fix: prevent blank leading pages in admin print flow"
```

### Task 5: Apply targeted visual and narrow-screen polish

**Files:**
- Modify: `src/pages/AdminPrescription.tsx:246-472`
- Modify: `src/pages/AdminDocuments.tsx:260-458`
- Modify: `src/index.css:277-368`
- Test: `src/components/admin/navigation-contract.test.tsx`

**Interfaces:**
- Consumes: existing card and form components; no behavior/API changes.
- Produces: bounded mobile cards/forms, touch-visible actions, and consistent shared admin surface behavior.

- [ ] **Step 1: Add regression assertions for touch and containment**

Add:

```ts
it("keeps key admin card actions reachable without hover", () => {
  expect(prescriptionSource).toContain("opacity-100 sm:opacity-0");
  expect(documentsSource).toContain("min-h-11");
});

it("keeps shared admin content bounded", () => {
  expect(cssSource).toMatch(/\.admin-content[\s\S]*min-width:\s*0/);
  expect(cssSource).toMatch(/\.admin-card[\s\S]*max-width:\s*100%/);
});
```

- [ ] **Step 2: Run the focused test to verify missing polish is detected**

Run: `npm test -- src/components/admin/navigation-contract.test.tsx`

Expected: FAIL if the current action visibility/spacing strings are not present.

- [ ] **Step 3: Make card content and actions mobile-safe**

Add `min-w-0` to the page grid columns and editor wrappers in the two document screens. Give template/history delete buttons `min-h-11 min-w-11` and `aria-label` values. Change hover-only actions to `opacity-100 sm:opacity-0 sm:group-hover:opacity-100`. Keep long names and URLs wrapping with the existing `overflow-wrap:anywhere` behavior.

- [ ] **Step 4: Normalize shared surface and safe scrolling rules**

Keep `.admin-card` at `min-width: 0`, `max-width: 100%`, 16px radius, warm surface, restrained shadow, 200ms transition, visible focus styles, and reduced-motion transform removal. Add `min-width: 0`/`max-width: 100%` to direct children of `.admin-content` where needed without changing contained calendar/odontogram scrolling.

- [ ] **Step 5: Run focused tests and commit**

Run: `npm test -- src/components/admin/navigation-contract.test.tsx`

Expected: PASS.

```powershell
git add -- src/pages/AdminPrescription.tsx src/pages/AdminDocuments.tsx src/index.css src/components/admin/navigation-contract.test.tsx
git commit -m "fix: polish admin cards for touch and narrow screens"
```

### Task 6: Full verification and main push

**Files:**
- Modify only files from Tasks 1–5 if verification identifies a concrete regression.
- Preserve all unrelated tracked/untracked worktree files.

**Interfaces:**
- Consumes: all corrected admin navigation and print flows.
- Produces: verified commits on `main`, pushed to `origin/main`.

- [ ] **Step 1: Run the complete frontend test suite**

Run: `npm test`

Expected: all Vitest tests pass with no startup/configuration errors.

- [ ] **Step 2: Run lint, build, source contracts, and whitespace validation**

Run:

```powershell
npm run lint
npm run build
& .\scripts\verify-admin-responsive.ps1
& .\scripts\verify-document-print.ps1
git diff --check
```

Expected: all commands exit 0. If a command fails, diagnose the concrete failure, update the smallest affected plan step, add/adjust a regression test first, and rerun the complete affected sequence.

- [ ] **Step 3: Inspect rendered routes at target widths**

Start the local app with `npm.cmd run dev -- --host 127.0.0.1` and inspect authenticated representative routes at 360px, 390px, 768px, and desktop width. Verify sticky menu trigger after scrolling, drawer close/body scroll lock, submenu selection, no page-level horizontal overflow, 44px actions, and reduced-motion behavior.

- [ ] **Step 4: Verify browser print flows**

With a patient that has a latest odontogram record, verify:

- prescription print with odontogram: map on page 1 and prescription text from page 2;
- standalone odontogram print: only context and odontogram, no prescription;
- prescription without odontogram: content starts on page 1;
- documents print: content starts on page 1, with no blank leading page.

- [ ] **Step 5: Review status and push only intended commits**

Run `git status --short` and confirm unrelated `.superpowers/sdd` files remain untouched and uncommitted. Then push the authored commits:

```powershell
git push origin main
```

Expected: `main` is updated on `origin` and no user-owned unrelated files are included in any commit.
