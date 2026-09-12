# Finance Task 2 implementation report

## Scope delivered

- Added `FinanceCategory`, nullable transaction category links, optional transaction descriptions, and a forward-only PostgreSQL migration that seeds `Geral` without rewriting existing transactions.
- Added deterministic São Paulo transaction-date parsing and cumulative-period filters.
- Added authenticated category routes: read access for `admin`/`manager`; create and delete access for `admin` only. Inputs are trimmed and capped at 80 characters; duplicate and referenced-category conflicts return 409; database failures use fixed safe errors.
- Updated `POST /finance` to require a valid date, a finite positive amount, and an `income` or `expense` type. Expense categories must exist. It writes both `categoryId` and the legacy `category`, leaves `appointmentId` unaccepted, and never returns raw database errors.
- Added `monthlyBalance`, `openingBalance`, and `closingBalance` to `/finance/stats` without removing legacy fields. Monthly and opening aggregates retain the existing realized, pending, and voided accounting rules and run independently through `Promise.all`.

## TDD evidence

- Initial focused contract run: 3 expected red failures for missing date helper, cumulative helper, and dated route behavior.
- Extended contracts before implementation: 7 expected red failures covering the remaining schema, migration, category-route, and validation requirements.
- Self-review added a migration-seed timestamp contract; it failed as expected, then passed after the seed was corrected.

## Verification

```powershell
Push-Location server; npx prisma generate; node --test test/finance-period-contract.test.js; Pop-Location
```

- Prisma Client generated successfully (v5.22.0).
- `node --test test/finance-period-contract.test.js`: 12 passed, 0 failed.
- `git diff --check` completed without whitespace errors for the Task 2 code files.

## Self-review

- Confirmed all new finance routes use `authenticateToken` and least-privilege `authorizeRole` middleware.
- Confirmed public responses do not return raw Prisma errors and no sensitive values are logged.
- Confirmed the migration is additive, uses `ON DELETE SET NULL`, retains the compatibility category column, drops only the description nullability constraint, and seeds `Geral` with a required `updatedAt` value.

## Review-fix follow-up

- Replaced the separate POST and PUT validation paths with `validateFinanceTransactionInput`. Creation and updates now apply the same date, type, finite-positive amount, optional trimmed description, and category-name rules.
- PUT loads the existing transaction before validation, derives the effective type and category, requires every expense category to exist, and always persists the matching legacy `category` and `categoryId` pair. Managers therefore cannot change a transaction into an expense or alter its category without satisfying the global-category contract.
- Hardened transaction identifiers to reject malformed values. Finance PUT now returns fixed 400 validation, 404 not-found, 409 Prisma relationship/uniqueness conflict, and 500 unexpected-error responses. Finance DELETE returns fixed 400, 404, and 500 responses. Neither handler returns `error.message`.
- Added `20260909010000_restrict_finance_category_deletion`, a follow-up migration because the original category migration is already committed. It replaces the `FinanceTransaction_categoryId_fkey` action with `ON DELETE RESTRICT`; the Prisma schema declares `onDelete: Restrict`. The server-side reference pre-check and P2003 conflict response remain in place as defense in depth.
- Extended the focused backend source contracts to cover shared PUT validation, fixed PUT/DELETE errors, the restrictive Prisma relation, and the follow-up migration.

## Review-fix verification

```powershell
Push-Location server; npx prisma generate; node --test test/finance-period-contract.test.js; Pop-Location
```

- Prisma Client generated successfully (v5.22.0).
- `node --test test/finance-period-contract.test.js`: 14 passed, 0 failed.
- The new source contracts were first run red: three intended failures exposed the non-restrictive schema, absent shared update validator, and missing follow-up migration. After the repair, the focused suite passed.
- Per the stop request, no files were staged and no commit was attempted in this follow-up.

## Legacy-category preservation follow-up

- Added `20260909020000_backfill_legacy_finance_categories` after the restrictive-FK migration. It creates `FinanceCategory` rows for each distinct trimmed, non-empty legacy `FinanceTransaction.category` value with conflict-safe insertion, then backfills a matching `categoryId` only where the link is currently null. The legacy category strings are not rewritten or removed.
- Hardened `DELETE /finance/categories/:id` to load the category first and count transaction references using both `categoryId` and the category's legacy name. It returns 404 when the category does not exist and 409 whenever either representation is in use; the restrictive FK remains the race-safe final guard.
- Added a focused source contract for the backfill SQL and the combined legacy/relational reference check.

## Legacy-category preservation verification

```powershell
Push-Location server; npx prisma generate; node --test test/finance-period-contract.test.js; Pop-Location
```

- Prisma Client generated successfully (v5.22.0).
- `node --test test/finance-period-contract.test.js`: 15 passed, 0 failed.
- The new legacy-preservation contract was run red before implementation and failed because the follow-up migration did not yet exist.
- Commit attempt `fix: preserve legacy finance categories` was blocked before staging: `fatal: Unable to create 'C:/Users/saulo/Desktop/SAULO/Karol/bright-smiles-website/.git/index.lock': Permission denied`.

## Immutable legacy-transaction follow-up

- Revised `20260909020000_backfill_legacy_finance_categories` to preserve the Task 2 migration constraint: it only conflict-safely inserts distinct trimmed, non-empty legacy category names and performs no `UPDATE` or `DELETE` against `FinanceTransaction`.
- Retained compatibility for existing transaction edits through `validateFinanceTransactionInput`, which resolves the legacy category name at write time. Category deletion still checks both `categoryId` and the legacy category string.
- Changed `DELETE /finance/categories/:id` to parse with `Number(req.params.id)`, so values such as `1abc` are rejected instead of being partially accepted by `parseInt`.
- Updated the focused source contract to assert that the backfill migration never updates or deletes `FinanceTransaction`, and that category deletion uses strict numeric parsing.

## Immutable legacy-transaction verification

```powershell
Push-Location server; npx prisma generate; node --test test/finance-period-contract.test.js; Pop-Location
```

- Prisma Client generated successfully (v5.22.0).
- `node --test test/finance-period-contract.test.js`: 15 passed, 0 failed.
- The revised source contract was run red before implementation and failed because the migration updated `FinanceTransaction`.
- Commit attempt `fix: keep legacy transactions immutable during backfill` was blocked before staging: `fatal: Unable to create 'C:/Users/saulo/Desktop/SAULO/Karol/bright-smiles-website/.git/index.lock': Permission denied`.

## Trimmed legacy-category deletion follow-up

- Updated `DELETE /finance/categories/:id` to run the relational `categoryId` count and a parameterized Prisma `$queryRaw` existence check in parallel. The raw check matches rows only when `categoryId IS NULL` and `TRIM(category)` equals the fetched category name, closing the whitespace-padded legacy-category gap without modifying transaction rows.
- The delete route returns the existing 409 conflict response when either query finds a reference. The restrictive FK remains the final race-safe protection for relational links.
- Updated the focused source contract to require the parameterized `TRIM` raw query, null-link predicate, and retained relational count.

## Trimmed legacy-category deletion verification

```powershell
Push-Location server; npx prisma generate; node --test test/finance-period-contract.test.js; Pop-Location
```

- Prisma Client generated successfully (v5.22.0).
- `node --test test/finance-period-contract.test.js`: 15 passed, 0 failed.
- The new contract was run red before implementation because the delete route had no parameterized trimmed-legacy lookup.
- Commit attempt `fix: protect trimmed legacy finance categories` was blocked before staging: `fatal: Unable to create 'C:/Users/saulo/Desktop/SAULO/Karol/bright-smiles-website/.git/index.lock': Permission denied`.
