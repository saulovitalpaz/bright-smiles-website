# Treatment plans: implementation and validation

## Delivered behavior

- Configurações → Minha tabela: procedure prices and clinical associations; groups and conditions can be created, renamed, enabled and archived by administrators.
- Existing odontogram groups and built-in conditions are seeded. Conditions start disabled so the clinic explicitly enables its scope. Only enabled conditions in enabled groups are offered for new occurrences.
- Stable condition keys and a display-name snapshot preserve historical records when catalog names change or entries are archived. Existing anatomical drawing, clinical stages and target rules remain.
- Consultation plan composition supports catalog suggestions and manually priced items. Quote authorization can be partial and discounted. Actual receipts create linked cash-flow entries atomically.
- Patient history combines appointments, treatment plans, legacy pending charges and receipts.

## Verification (2026-11-01)

- Frontend: 57 files, 343 tests passed, including existing consultation autosave and odontogram regressions, new catalog filtering/history tests, and quote creation with patient/appointment IDs.
- Backend: 231 tests passed, one pre-existing optional test skipped. New HTTP tests use actual auth middleware; anonymous and manager access denied on every new endpoint.
- Real PostgreSQL 16 integration: catalog/group CRUD, invalid relationships, partial/full authorization, discounts, immutable approved items, clinical progression, duplicate payment protection, concurrent receipts, foreign keys and preservation of legacy consultation finance.
- New SQL migration applied successfully over the previous committed Prisma schema in an isolated local database. Prisma schema diff reported no differences.
- Local fixture backup via pg_dump and restore via pg_restore succeeded, including linked receipts. No patient data or production database used.
- TypeScript compilation, Vite production build, scoped new-UI lint and changed-file secret scan passed.
- Headless Edge screenshots reviewed for catalog, plan and patient history at 390px and 1440px; no horizontal overflow or runtime page errors. Synthetic API fixtures only; external network intercepted.
- Shared responsive and print source contracts checked. Two stale responsive assertions were updated to the existing component location and field spacing.

## Existing migration-chain limitation

Replaying all historical migrations into an empty database fails at `20260912000000_stock_traceability_patient_weight`: `StockProduct` was not created by the preceding migrations. This precedes this upgrade. The new migration was therefore tested against the previous committed schema, representing an existing installation, and its resulting schema matched Prisma exactly.

Production migration state and production backup restoration were not inspected. This report does not certify a fresh installation from the historical migration chain or claim that the new migration has been applied in production. The backend start script applies pending migrations on deployment.

## Operational notes

- Catalog exclusions archive identities instead of deleting clinical history.
- Existing consultation charges are preserved; plan receipts use a distinct link and do not reuse appointment finance IDs.
- Existing build warnings remain for bundle sizes and outdated Browserslist data.
- Optional real-database tests use `TREATMENT_TEST_DATABASE_URL` and refuse non-local databases or database names outside `upgrade_*`.
