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

