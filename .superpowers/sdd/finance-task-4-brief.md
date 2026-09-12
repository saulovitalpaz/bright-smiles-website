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

