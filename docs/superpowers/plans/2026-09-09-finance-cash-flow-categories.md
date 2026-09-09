# Menu público e melhorias do fluxo de caixa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar a homepage e o fluxo financeiro administrativo para aceitar datas históricas, usar categorias globais, exibir saldos contábeis acumulados e exportar um PDF mensal mais claro.

**Architecture:** Manter React/Vite no frontend e Express/Prisma no backend. As categorias serão uma entidade financeira privada e global, enquanto a data do lançamento será validada e convertida no backend para o fuso de São Paulo. A tela financeira continuará carregando transações e estatísticas por mês selecionado, com o card de despesas derivado das transações carregadas e o PDF recebendo um snapshot explícito do período e dos saldos.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, `@react-pdf/renderer`, Express, Prisma/PostgreSQL, Vitest e Node test runner.

## Global Constraints

- Seguir `SECURITY.md`: dados financeiros e de pacientes são sensíveis por padrão.
- Manter categorias financeiras fora de `/public-settings`.
- Manter autenticação e autorização em todas as rotas financeiras; somente administradores criam/removem categorias.
- Persistir descrições vazias como `null` e nunca renderizar `Despesa sem descrição`.
- Interpretar datas `YYYY-MM-DD` no fuso `America/Sao_Paulo`; a data enviada deve definir o mês do fluxo.
- Remover `Stories` e `Contato` apenas do menu superior público; não remover seções ou rotas.
- Remover impressão do navegador de `/admin/finance`; o PDF deve corresponder ao mês/ano selecionado.
- Remover número/referência de atendimento da tela e do PDF; paciente é a menção principal.
- Preservar modificações existentes em `.superpowers/sdd` e arquivos não relacionados.
- Não adicionar credenciais, dados reais, tokens, CPF ou endereço a código, testes, logs ou documentação.

---

### Task 1: Codificar contratos regressivos para navegação, datas, categorias e saldo

**Files:**
- Modify: `server/test/finance-period-contract.test.js`
- Modify: `src/pages/finance-pages-layout.test.ts`
- Modify: `src/pages/AdminSettings.test.tsx`
- Create: `src/components/admin/finance-contract.test.ts`

**Interfaces:**
- Consumes: `parseFinancePeriod`, source contracts existentes e mocks de Axios de `AdminSettings`.
- Produces: testes falhando que fixam os nomes de campos e os comportamentos usados pelas tarefas seguintes.

- [ ] **Step 1: Write the failing backend period tests**

Adicionar ao `server/test/finance-period-contract.test.js`:

```js
const { parseFinanceTransactionDate, financeCumulativeWhere } = require('../utils/financePeriod');

test('parseFinanceTransactionDate keeps YYYY-MM-DD at São Paulo midnight', () => {
    assert.equal(parseFinanceTransactionDate('2026-08-15').toISOString(), '2026-08-15T03:00:00.000Z');
});

test('parseFinanceTransactionDate rejects missing and malformed dates', () => {
    assert.throws(() => parseFinanceTransactionDate(), /date/i);
    assert.throws(() => parseFinanceTransactionDate('2026-02-31'), /date/i);
});

test('financeCumulativeWhere stops before the selected period', () => {
    const period = parseFinancePeriod({ month: '3', year: '2026' });
    assert.deepEqual(financeCumulativeWhere(period), { date: { lt: period.start } });
});

test('finance routes expose dated input and accounting totals', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../index.js'), 'utf8');
    const createRoute = source.slice(source.indexOf("app.post('/finance'"), source.indexOf("app.put('/finance/:id'"));
    const statsRoute = source.slice(source.indexOf("app.get('/finance/stats'"), source.indexOf('// NEW: NF-e'));
    assert.match(createRoute, /parseFinanceTransactionDate/);
    assert.match(createRoute, /description:.*null/);
    assert.match(statsRoute, /openingBalance/);
    assert.match(statsRoute, /closingBalance/);
});
```

- [ ] **Step 2: Write the failing frontend source contracts**

Criar `src/components/admin/finance-contract.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("finance cash flow contracts", () => {
  const header = read("src/components/layout/Header.tsx");
  const finance = read("src/pages/AdminFinance.tsx");
  const pdf = read("src/components/admin/FinanceReportPDF.tsx");
  const settings = read("src/pages/AdminSettings.tsx");

  it("removes low-value public shortcuts", () => {
    expect(header).not.toContain('{ label: "Stories"');
    expect(header).not.toContain('{ label: "Contato"');
  });

  it("sends selected date and optional description", () => {
    expect(finance).toContain('type="date"');
    expect(finance).toContain("newDate");
    expect(finance).toContain("description: newDesc.trim() || null");
    expect(finance).toContain("date: newDate");
  });

  it("keeps appointment identifiers out of the presentation", () => {
    expect(finance).not.toMatch(/appointmentId|atendimento\s*#|n[ºo]\s*do atendimento/i);
    expect(pdf).not.toMatch(/appointmentId|atendimento\s*#|n[ºo]\s*do atendimento/i);
    expect(finance).toContain("t.patient?.name");
  });

  it("uses accounting totals and category breakdowns", () => {
    expect(finance).toContain("openingBalance");
    expect(finance).toContain("closingBalance");
    expect(finance).toContain("categorySummary");
    expect(finance).not.toContain("window.print()");
    expect(finance).not.toContain("<Printer");
  });

  it("keeps categories private and editable from settings", () => {
    expect(settings).toContain("/finance/categories");
    expect(settings).toContain("Categorias financeiras");
    expect(settings).not.toContain('"finance_categories"');
  });
});
```

- [ ] **Step 3: Add failing settings interaction coverage**

Estender `src/pages/AdminSettings.test.tsx` para responder a `${API_URL}/finance/categories` com `[{ id: 1, name: "Materiais" }]` e adicionar:

```tsx
it("lista e cadastra categorias financeiras globalmente", async () => {
    const user = userEvent.setup();
    await renderLoadedSettings();
    expect(await screen.findByText("Materiais")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nova categoria financeira"), "Laboratório");
    await user.click(screen.getByRole("button", { name: "Adicionar categoria" }));
    expect(axiosPostMock).toHaveBeenCalledWith(
        `${API_URL}/finance/categories`,
        { name: "Laboratório" },
        { withCredentials: true },
    );
});
```

- [ ] **Step 4: Run focused tests and confirm the new contracts fail**

```powershell
npm test -- src/components/admin/finance-contract.test.ts src/pages/AdminSettings.test.tsx
Push-Location server; node --test test/finance-period-contract.test.js; Pop-Location
```

Expected: failure only on behavior not yet implemented; existing initialization tests must still run.

- [ ] **Step 5: Commit only the red contracts**

```powershell
git add -- server/test/finance-period-contract.test.js src/pages/finance-pages-layout.test.ts src/pages/AdminSettings.test.tsx src/components/admin/finance-contract.test.ts
git commit -m "test: cover finance date categories and accounting flow"
```

### Task 2: Implement private global categories and dated finance persistence

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/20260909000000_add_finance_categories_and_optional_description/migration.sql`
- Modify: `server/utils/financePeriod.js`
- Modify: `server/index.js`
- Modify: `server/test/finance-period-contract.test.js`

**Interfaces:**
- Consumes: existing auth middleware, `FinanceTransaction`, `parseFinancePeriod` and Prisma migration conventions.
- Produces: `FinanceCategory`, `parseFinanceTransactionDate`, `financeCumulativeWhere`, private category endpoints, dated transaction creation and stats fields `monthlyBalance`, `openingBalance`, `closingBalance`.

- [ ] **Step 1: Extend Prisma schema and migration**

Add `FinanceCategory`:

```prisma
model FinanceCategory {
  id           Int                 @id @default(autoincrement())
  name         String              @unique
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt
  transactions FinanceTransaction[]
}
```

Add nullable `categoryId Int?`, `categoryRef FinanceCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)` and an index to `FinanceTransaction`; change `description` to `String?`, while retaining the existing `category String` compatibility column. The migration must create the table, add the nullable column/index/foreign key, drop the description `NOT NULL`, and insert `Geral` with `ON CONFLICT (name) DO NOTHING`. Do not rewrite or delete existing transactions.

- [ ] **Step 2: Add deterministic date and cumulative helpers**

In `server/utils/financePeriod.js`, add and export:

```js
const parseFinanceTransactionDate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw invalidPeriod('date must use YYYY-MM-DD');
    }
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(`${value}T00:00:00-03:00`);
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        throw invalidPeriod('date is invalid');
    }
    return date;
};

const financeCumulativeWhere = (period = {}) => period.overview !== false
    ? {}
    : { date: { lt: period.start } };
```

- [ ] **Step 3: Add private category routes with validation**

Add authenticated `GET /finance/categories` for `admin`/`manager`, `POST /finance/categories` for `admin`, and `DELETE /finance/categories/:id` for `admin`. Trim and limit names to 80 characters, return 400 for invalid input, 409 for duplicates or categories referenced by transactions, and never expose raw database errors. Every handler must include `authenticateToken` and `authorizeRole`.

- [ ] **Step 4: Validate dated transaction creation**

Change `POST /finance` to require `date`, finite positive `amount`, valid `type`, optional trimmed description, and a category that exists when `type === 'expense'`. Persist `date: parseFinanceTransactionDate(date)` and `description: description?.trim() || null`. Persist `categoryId` plus the compatibility string `category`. Do not accept `appointmentId` from the request body.

- [ ] **Step 5: Add cumulative stats without removing legacy fields**

Update `GET /finance/stats` to aggregate the selected month and the range before its start using the same realized/pending/voided rules. Return `balance` as the monthly net and also return `monthlyBalance`, `openingBalance` and `closingBalance`, where `closingBalance = openingBalance + monthlyBalance`. For overview, use zero opening balance and the all-time realized total as closing balance. Use `Promise.all` for independent aggregates.

- [ ] **Step 6: Run backend tests and Prisma generation**

```powershell
Push-Location server; npx prisma generate; node --test test/finance-period-contract.test.js; Pop-Location
```

Expected: contracts pass and Prisma Client generates without schema errors.

- [ ] **Step 7: Commit the backend data contract**

```powershell
git add -- server/prisma/schema.prisma server/prisma/migrations/20260909000000_add_finance_categories_and_optional_description/migration.sql server/utils/financePeriod.js server/index.js server/test/finance-period-contract.test.js
git commit -m "feat: add dated finance categories and cumulative balances"
```

### Task 3: Add global category management to `/admin/settings`

**Files:**
- Modify: `src/pages/AdminSettings.tsx`
- Modify: `src/pages/AdminSettings.test.tsx`

**Interfaces:**
- Consumes: `GET/POST/DELETE /finance/categories` and existing authenticated settings state.
- Produces: accessible global category management without adding financial data to public settings.

- [ ] **Step 1: Add category state and loading**

Add `FinanceCategory`, `financeCategories`, `newFinanceCategory` and `isCategorySaving` state. Fetch categories with `withCredentials: true` alongside the existing `/settings` load using `Promise.all`; do not add categories to `settings` or `EDITABLE_SETTING_KEYS`.

- [ ] **Step 2: Add create/delete handlers**

Implement create with `axios.post(`${API_URL}/finance/categories`, { name }, { withCredentials: true })`, trim and reject empty input in the UI, append the returned category sorted by name, clear the input and show success/error toast. Implement delete with `axios.delete(`${API_URL}/finance/categories/${id}`, { withCredentials: true })`; on 409 show `Não é possível remover uma categoria usada em transações.` and keep the item visible.

- [ ] **Step 3: Render the settings card**

Add a `Card` titled `Categorias financeiras` with `Label htmlFor="new-finance-category"`, input accessible as `Nova categoria financeira`, `Adicionar categoria` button, list of names and delete buttons with `aria-label={`Remover categoria ${category.name}`}` and 44px touch targets.

- [ ] **Step 4: Run settings tests**

Run: `npm test -- src/pages/AdminSettings.test.tsx`

Expected: existing profile/settings tests and category CRUD coverage pass.

- [ ] **Step 5: Commit settings category management**

```powershell
git add -- src/pages/AdminSettings.tsx src/pages/AdminSettings.test.tsx
git commit -m "feat: manage global finance categories in settings"
```

### Task 4: Update homepage navigation and the finance page interaction model

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/pages/AdminFinance.tsx`
- Modify: `src/lib/finance.ts`
- Modify: `src/pages/finance-pages-layout.test.ts`
- Modify: `src/components/admin/finance-contract.test.ts`

**Interfaces:**
- Consumes: category endpoints and stats response from Tasks 2–3.
- Produces: editable `newDate`, `newCategoryId`, `openingBalance`, `closingBalance`, `categorySummary`, patient-first rows and selected-period PDF action.

- [ ] **Step 1: Remove only the two public nav entries**

Delete the `Stories` and `Contato` objects from `Header.tsx`; leave `Início`, `Tratamentos`, `Equipe`, `Blog` and the `Agendar` CTA unchanged.

- [ ] **Step 2: Add date/category state and fetch categories**

Remove `PrintMode`, `printDocumentClass` and `Printer` imports. Add `todayInput`, `newDate`, `newCategoryId` and `financeCategories` state. Load `/finance/categories` with the finance data and set the first category id when no current selection is available. Keep the form enabled regardless of the selected month.

- [ ] **Step 3: Send date, optional description and category id**

Update `handleAddTransaction` to send `type`, `description: newDesc.trim() || null`, `amount`, `date: newDate`, `categoryId` for expenses, `patientId` for income and `receiptUrl`. Reset description, amount, patient, receipt and `newDate` to today after success. Remove `required` from description; require date, amount and expense category.

- [ ] **Step 4: Add date/category controls**

Render an `Input id="transaction-date" type="date"` labelled `Data da transação`. For expenses render a `Select` labelled `Categoria`, using category ids as values and category names as labels. When the list is empty, show a link to `/admin/settings` without disabling the transaction form for other transaction types.

- [ ] **Step 5: Add accounting cards and category summary**

Extend `stats` with `monthlyBalance`, `openingBalance` and `closingBalance`. Derive `categorySummary` from valid expense transactions using a `Map`, sorted descending by amount, with `{ name, amount, percentage }`. Show real categories as compact proportional bars under the expense total. Show on saldo: `Líquido do mês`, `Total em conta: R$ ${stats.closingBalance.toLocaleString("pt-BR")}` and `Inclui o fechamento anterior`.

- [ ] **Step 6: Rebuild patient-first transaction rows**

For desktop and mobile use `t.patient?.name || (t.description || t.category)` as the primary line; render `t.description` only when non-empty and a patient exists; render category as a small uppercase secondary legend. Do not render `appointmentId`, atendimento numbers, CPF or address. Keep receipt/NF-e/delete actions secondary.

- [ ] **Step 7: Replace browser print controls**

Remove the format selector and `window.print()` button. Keep one `DownloadFinanceReportButton` labelled `PDF do período selecionado`, pass the selected `financePeriodTitle`, all loaded transactions, monthly/opening/closing values and clinic branding. The export represents the selected month even when a type filter is active.

- [ ] **Step 8: Run focused frontend tests and commit**

```powershell
npm test -- src/components/admin/finance-contract.test.ts src/pages/finance-pages-layout.test.ts src/pages/AdminSettings.test.tsx
git add -- src/components/layout/Header.tsx src/pages/AdminFinance.tsx src/lib/finance.ts src/pages/finance-pages-layout.test.ts src/components/admin/finance-contract.test.ts
git commit -m "feat: align finance page with dated cash flow"
```

### Task 5: Upgrade the finance PDF report

**Files:**
- Modify: `src/components/admin/FinanceReportPDF.tsx`
- Modify: `src/pages/AdminFinance.tsx`
- Modify: `src/components/admin/finance-contract.test.ts`

**Interfaces:**
- Consumes: transaction rows, period label, clinic branding and accounting totals from Task 4.
- Produces: deterministic monthly PDF with patient-first hierarchy and no browser-print dependency.

- [ ] **Step 1: Expand PDF props**

Define `FinanceReportStats` with `income`, `expense`, `monthlyBalance`, `openingBalance`, `closingBalance`; add `reportTitle`, `periodLabel`, optional `clinicName`, `clinicSlogan` and `logoUrl` to `FinanceReportProps`.

- [ ] **Step 2: Replace header and summary**

Render supplied logo/name/slogan, selected period, generated timestamp and four summaries: `Receitas`, `Despesas`, `Líquido do mês`, `Total em conta`. Remove `Math.random()` hash output.

- [ ] **Step 3: Replace table hierarchy**

Use columns `Data`, `Movimentação`, `Categoria`, `Valor`. In `Movimentação`, render patient name first, optional description below and no appointment identifiers. Do not include CPF/address.

- [ ] **Step 4: Make filename period-specific**

Pass explicit `year` and `month` or a derived file-safe period into `DownloadFinanceReportButton` and set `relatorio-financeiro-YYYY-MM.pdf`. Keep the selected period in `reportTitle` and `periodLabel`.

- [ ] **Step 5: Run focused tests and commit**

```powershell
npm test -- src/components/admin/finance-contract.test.ts src/pages/finance-pages-layout.test.ts
git add -- src/components/admin/FinanceReportPDF.tsx src/pages/AdminFinance.tsx src/components/admin/finance-contract.test.ts
git commit -m "feat: improve monthly finance PDF report"
```

### Task 6: Full verification, migration check, push and deploy

**Files:**
- Modify only files from Tasks 1–5 if a concrete verification failure requires a targeted fix.

**Interfaces:**
- Consumes: all frontend/backend changes and migration from previous tasks.
- Produces: verified `main`, pushed `origin/main`, and deployment status or an explicit external deployment blocker.

- [ ] **Step 1: Run all tests**

```powershell
npm test
Push-Location server; node --test test/*.test.js; Pop-Location
```

Expected: all tests pass. Diagnose failures concretely, add a regression test before a fix, and rerun the affected suite.

- [ ] **Step 2: Run lint, build, Prisma generation and whitespace checks**

```powershell
npm run lint
npm run build
Push-Location server; npx prisma generate; Pop-Location
git diff --check
```

Expected: exit code 0 and no whitespace errors. Run any repository secret scan under `scripts` without printing secret values.

- [ ] **Step 3: Check migration status without mutating production**

```powershell
Push-Location server; npx prisma migrate status; Pop-Location
```

If a configured local database is available, run `npx prisma migrate deploy` against that local target only. Never copy a production `DATABASE_URL` into chat or source control.

- [ ] **Step 4: Review the authored diff**

```powershell
git status --short
git diff origin/main..HEAD --stat
git diff origin/main..HEAD --check
```

Confirm only the design, plan, finance/header/settings/PDF/backend/schema/migration/test files authored for this request are in the new commits. Existing `.superpowers/sdd` changes remain uncommitted and untouched.

- [ ] **Step 5: Push main**

If the worktree is clean except for preserved user files, run:

```powershell
git push origin main
```

If the remote rejects because it advanced, stop before rebasing or resetting and report the exact rejection for approval; never overwrite remote history.

- [ ] **Step 6: Deploy and verify**

Inspect deployment tooling and remotes without exposing credentials:

```powershell
git remote -v
Get-Command railway -ErrorAction SilentlyContinue
Get-Command gh -ErrorAction SilentlyContinue
```

Use the configured CI/Railway path after pushing. If Railway is authenticated and linked, use its non-destructive deploy/status commands. Otherwise treat a successful `origin/main` push as the deployment trigger and verify only a URL already configured locally or returned by the deployment tool. Do not invent production URLs or change DNS/variables without existing configuration.

- [ ] **Step 7: Report evidence**

Report commit range, tests/lint/build, migration verification, push result, deployment result/URL if returned, and preserved dirty files. Never claim deployment success without command or service evidence.
