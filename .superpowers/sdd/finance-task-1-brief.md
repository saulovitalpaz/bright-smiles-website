# Task 1: Codificar contratos regressivos para navegação, datas, categorias e saldo

## Files

- Modify: `server/test/finance-period-contract.test.js`
- Modify: `src/pages/finance-pages-layout.test.ts`
- Modify: `src/pages/AdminSettings.test.tsx`
- Create: `src/components/admin/finance-contract.test.ts`

## Requirements

Add backend tests for:

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

Create `src/components/admin/finance-contract.test.ts` with source assertions for:

- `Header.tsx` has no `{ label: "Stories"` or `{ label: "Contato"`.
- `AdminFinance.tsx` contains `type="date"`, `newDate`, `description: newDesc.trim() || null`, and `date: newDate`.
- Neither finance page nor PDF contains `appointmentId`, atendimento number labels, or `nº do atendimento`; the finance page contains `t.patient?.name`.
- `AdminFinance.tsx` contains `openingBalance`, `closingBalance`, `categorySummary`, and no `window.print()` or `<Printer`.
- `AdminSettings.tsx` contains `/finance/categories` and `Categorias financeiras`, but not `"finance_categories"`.

Extend `src/pages/AdminSettings.test.tsx` to return `[{ id: 1, name: "Materiais" }]` for `${API_URL}/finance/categories` and verify:

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

Run focused frontend and backend tests first and capture RED evidence, then leave the tests failing until the next task implements behavior. Commit only Task 1 test files with:

```powershell
git add -- server/test/finance-period-contract.test.js src/pages/finance-pages-layout.test.ts src/pages/AdminSettings.test.tsx src/components/admin/finance-contract.test.ts
git commit -m "test: cover finance date categories and accounting flow"
```

Global constraints: preserve existing `.superpowers/sdd` files; finance data is private; do not add real patient/financial data; do not alter unrelated routes.
