# Solicitações, Agenda, Retornos e Fluxo de Caixa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer solicitações, agenda manual, retornos, consultas e caixa compartilharem contratos consistentes, autenticados, idempotentes e responsivos.

**Architecture:** Manter `Appointment` como fonte operacional da agenda, acrescentando autorrelação para retornos. Vincular cada lançamento financeiro a no máximo um atendimento e reconciliá-lo no servidor dentro de transação Prisma. Frontend usa `fetchClient`/`adminApi`, React Query/estado atual e componentes de calendário responsivos.

**Tech Stack:** React 18, TypeScript, Vite, React Query, date-fns, Tailwind/shadcn, Express, Prisma PostgreSQL, Vitest, Node test runner.

## Global Constraints

- Seguir `SECURITY.md`: dados clínicos, financeiros e de pacientes são sensíveis por padrão.
- Rotas clínicas exigem `admin`/`dentist`; solicitações e financeiro exigem `admin`/`manager` conforme o contrato atual.
- Usar cookies HttpOnly; não introduzir tokens reutilizáveis em `localStorage`.
- Validar datas, valores, status, IDs e autorização no servidor.
- Fazer backup/restauração verificados antes das migrações de banco.
- Rodar testes backend/frontend, build, lint, secret scan e `git diff --check` antes da entrega.

---

### Task 1: Fix authenticated requests and dashboard counts

**Files:**
- Modify: `src/pages/AdminLeads.tsx`
- Modify: `src/pages/AdminDashboard.tsx`
- Modify: `server/index.js`
- Test: `server/test/requests-dashboard-contract.test.js`

**Interfaces:**
- Produces `pendingLeadCount` in `GET /dashboard/stats`.
- `AdminLeads` uses `fetchClient('/leads')`, `fetchClient('/leads/:id')` and `fetchClient('/leads/:id', { method: 'DELETE' })`.

- [ ] **Step 1: Write failing contract tests** asserting that lead requests use the credentialed client, dashboard exposes `pendingLeadCount`, and count is not derived from `take: 5` recent leads.
- [ ] **Step 2: Run `node --test server/test/requests-dashboard-contract.test.js` and verify the new assertions fail.**
- [ ] **Step 3: Replace direct Axios calls with `fetchClient`, parse safe error bodies, and invalidate/refetch dashboard data after mutations.**
- [ ] **Step 4: Add `pendingLeadCount = prisma.lead.count({ where: { status: { in: ['new', 'contacted', 'scheduled'] } } })` to the dashboard query and render it directly.**
- [ ] **Step 5: Run the focused test and `npm run lint -- --no-warn-ignored src/pages/AdminLeads.tsx src/pages/AdminDashboard.tsx`; expected PASS.**
- [ ] **Step 6: Commit `fix: load authenticated requests and dashboard lead counts`.**

### Task 2: Add appointment status and manual calendar creation

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/<timestamp>_add_appointment_status/migration.sql`
- Modify: `server/utils/validationSchemas.js`
- Modify: `server/index.js`
- Modify: `src/pages/AdminAppointments.tsx`
- Modify: `src/components/admin/appointments/CalendarView.tsx`
- Modify: `src/lib/calendar.ts`
- Test: `server/test/manual-appointment-contract.test.js`

**Interfaces:**
- `POST /appointments` accepts `status = scheduled|attended|cancelled` and existing appointment fields.
- Calendar calls `onEventCreate(date)` and receives a controlled creation modal from `AdminAppointments`.

- [ ] **Step 1: Write failing tests for valid status normalization, anonymous denial, and creating a scheduled appointment from a selected date/time.**
- [ ] **Step 2: Run `node --test server/test/manual-appointment-contract.test.js`; expected FAIL for missing status/create behavior.**
- [ ] **Step 3: Add the status field with default `scheduled`, a check-compatible migration, and server-side validation that rejects unknown statuses.**
- [ ] **Step 4: Replace direct navigation from empty calendar cells with a modal containing patient, procedure, appointment type, professional, scheduled date/time, and optional price/payment status.**
- [ ] **Step 5: Submit the minimal validated appointment payload, refresh appointments/leads, close the modal only after success, and retain form data on failure.**
- [ ] **Step 6: Update list/calendar filters so `attended` appears in history and active scheduled/cancelled items do not pollute the upcoming list.**
- [ ] **Step 7: Run focused tests, frontend build, and keyboard smoke checks for modal open/close/submit.**
- [ ] **Step 8: Commit `feat: create appointments from calendar slots`.**

### Task 3: Model idempotent future returns

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/<timestamp>_link_appointment_returns/migration.sql`
- Modify: `server/utils/validationSchemas.js`
- Modify: `server/index.js`
- Modify: `src/pages/AdminAttendanceDetail.tsx`
- Modify: `src/pages/AdminAppointments.tsx`
- Modify: `server/utils/schedule.js`
- Test: `server/test/return-scheduling-contract.test.js`

**Interfaces:**
- `Appointment.parentAppointmentId: number | null` identifies a return appointment.
- `PUT /appointments/:id` reconciles `{ returnDate }` (an ISO date/time) into one child appointment whose `scheduledAt` equals that value.
- `buildUpcomingSchedule` includes active return appointments exactly once.

- [ ] **Step 1: Write failing tests for create, update, clear, repeat-save idempotency, and dashboard ordering of returns.**
- [ ] **Step 2: Run the focused test and confirm no return relation or reconciliation exists.**
- [ ] **Step 3: Add the self-relation, nullable return schedule field, index, and migration with a safe default for existing records.**
- [ ] **Step 4: Implement a server helper `syncReturnAppointment(tx, sourceAppointment, input)` that upserts one child by `parentAppointmentId`, copies patient/professional/type, and marks cleared returns `cancelled`.**
- [ ] **Step 5: Call the helper inside the same Prisma transaction as appointment create/update; reject invalid past/invalid dates according to the agreed scheduling policy.**
- [ ] **Step 6: Change the UI from date-only to date/time, preserve local timezone conversion, and show the linked return status in the consultation and calendar details.**
- [ ] **Step 7: Run focused tests and verify repeated saves leave one child row.**
- [ ] **Step 8: Commit `feat: schedule idempotent appointment returns`.**

### Task 4: Reconcile consultation payments with the cash flow

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/<timestamp>_link_finance_to_appointments/migration.sql`
- Modify: `server/index.js`
- Modify: `src/pages/AdminAttendanceDetail.tsx`
- Test: `server/test/appointment-finance-contract.test.js`

**Interfaces:**
- `FinanceTransaction.appointmentId: number | null` is unique when present.
- `FinanceTransaction.paymentStatus: received|pending|voided` defaults safely for legacy rows.
- `syncAppointmentFinance(tx, appointment)` creates, updates, or voids one linked transaction.

- [ ] **Step 1: Write failing tests for received/pending/courtesy, update without duplication, deletion behavior, and monthly aggregate inclusion.**
- [ ] **Step 2: Run the focused test; expected FAIL because only `POST /appointments` currently creates finance rows.**
- [ ] **Step 3: Add finance fields, indexes, and a migration that preserves old rows and marks legacy `[A RECEBER]` entries as pending where unambiguous.**
- [ ] **Step 4: Implement `syncAppointmentFinance` with deterministic description/category/date/patient values and `upsert`/`update` semantics.**
- [ ] **Step 5: Wrap appointment persistence plus finance reconciliation in one Prisma transaction for both POST and PUT; keep existing clinical validation and authorization.**
- [ ] **Step 6: Update the consultation UI copy so “Recebido” means realized cash, “A receber” remains pending, and courtesy/zero does not create income.**
- [ ] **Step 7: Run focused backend tests and a migration dry-run against a disposable database.**
- [ ] **Step 8: Commit `feat: reconcile appointment payments with cash flow`.**

### Task 5: Make finance endpoints and cards month-consistent

**Files:**
- Modify: `server/index.js`
- Modify: `src/pages/AdminFinance.tsx`
- Create: `src/lib/finance.ts`
- Test: `server/test/finance-period-contract.test.js`
- Test: `src/lib/finance.test.ts`

**Interfaces:**
- `parseFinancePeriod({ month, year }) -> { start: Date, endExclusive: Date }` uses `America/Sao_Paulo`.
- `GET /finance?month=&year=` and `GET /finance/stats?month=&year=` share the same period and realized/pending rules.

- [ ] **Step 1: Write failing tests for same-period list/stats, invalid month/year, overview mode, and pending exclusion from realized totals.**
- [ ] **Step 2: Run focused Node and Vitest tests; expected FAIL because stats is currently global.**
- [ ] **Step 3: Implement the shared server period parser and use it in both endpoints; return `{ income, pendingIncome, expense, balance }`.**
- [ ] **Step 4: Pass the selected month/year from `AdminFinance` to both requests, preserve error messages, and add explicit “Visão geral”.**
- [ ] **Step 5: Bind all cards to the selected-period stats and keep card clicks as a transaction-type filter only.**
- [ ] **Step 6: Run focused tests, `npm run lint`, and `npm run build`; expected PASS.**
- [ ] **Step 7: Commit `fix: align finance cards with selected period`.**

### Task 6: Harden calendar and dashboard layout for long text and zoom

**Files:**
- Modify: `src/components/admin/appointments/CalendarView.tsx`
- Modify: `src/pages/AdminAppointments.tsx`
- Modify: `src/pages/AdminDashboard.tsx`
- Modify: `src/index.css`
- Test: `src/components/admin/appointments/CalendarView.test.tsx`
- Test: `server/test/responsive-content-contract.test.js`

**Interfaces:**
- Calendar event text remains horizontal, wraps safely, and exposes the complete value through accessible text/title.
- Dashboard cards preserve content hierarchy at 320 px, 200% zoom, and large system font settings.

- [ ] **Step 1: Write failing UI/source tests for `min-w-0`, `overflow-wrap:anywhere`, non-vertical text, accessible full labels, and no essential-data-only truncation.**
- [ ] **Step 2: Run the focused tests and record the current failure.**
- [ ] **Step 3: Add responsive event classes: `min-w-0`, `break-words`, `whitespace-normal`, `overflow-wrap:anywhere`, horizontal writing mode, two-line visual clamp only for secondary text, and `title`/aria-label for full values.**
- [ ] **Step 4: Make calendar grid scroll only inside its explicit calendar region on narrow screens; keep the page itself free of accidental horizontal overflow.**
- [ ] **Step 5: Replace dashboard essential `truncate` usage with wrapping/clamp-plus-title, add `tabular-nums`, and keep action targets at least 44 px.**
- [ ] **Step 6: Add reduced-motion handling and visible focus styles without changing the existing palette or clinical semantics.**
- [ ] **Step 7: Verify at 320 px, 375 px, 768 px, desktop, 200% zoom, keyboard navigation, and long Portuguese names.**
- [ ] **Step 8: Commit `fix: make agenda and dashboard resilient to long text`.**

### Task 7: End-to-end security and deployment verification

**Files:**
- Modify: `server/test/security-foundations.test.js`
- Modify: `server/test/patient-workflow-contract.test.js`
- Create: `scripts/verify-scheduling-finance.ps1`
- Modify: `docs/backup-restore-runbook.md` only if migration verification instructions need an exact command.

- [ ] **Step 1: Add anonymous-denial and role-boundary assertions for all affected routes.**
- [ ] **Step 2: Run `node --test server/test/*.test.js`; expected zero failures.**
- [ ] **Step 3: Run `npx prisma generate` and `npx prisma migrate deploy` against the approved environment only after backup/restore verification.**
- [ ] **Step 4: Run `npm run lint`, `npm run build`, frontend tests, secret scan, and `git diff --check`.**
- [ ] **Step 5: Execute the smoke script for homepage lead → request list → manual schedule → dashboard → return → received payment → monthly finance cards.**
- [ ] **Step 6: Review the final diff for secrets, patient data, broad endpoint exposure, duplicate finance writes, and accidental generated artifacts.**
- [ ] **Step 7: Commit `test: verify scheduling and finance integration`.**

### Task 8: Retire the unused Digital Guide mock

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/admin/AdminLayout.tsx`
- Delete: `src/pages/AdminDigitalGuide.tsx`

- [ ] Remove the protected route, its navigation submenu and the unused mock page together.
- [ ] Add a route/navigation regression assertion so the retired path is no longer exposed.
- [ ] Run the focused frontend test, lint and build.

### Task 9: Make odontogram states visually truthful

**Files:**
- Modify: `src/components/admin/attendance/Odontogram.tsx`
- Modify: `src/components/admin/attendance/odontogram/AnatomicalTooth.tsx`
- Modify: `src/components/admin/attendance/odontogram/OcclusalTooth.tsx`
- Modify: `src/components/admin/attendance/odontogram/odontogramModel.ts`
- Test: odontogram component/model tests

- [ ] Centralize visual semantics by clinical stage: evaluation, planned/treat, in progress, completed, monitored and suspended.
- [ ] Render those semantics consistently in frontal and occlusal views, with a pattern or outline in addition to color.
- [ ] Replace the duplicated legend with the exact states that can appear on a face; keep whole-tooth states distinct.
- [ ] Verify accessible names and visual-state tests.

### Task 10: Simplify anatomical face selection

**Files:**
- Modify: `src/components/admin/attendance/odontogram/ToothSurfaceSelector.tsx`
- Modify: `src/components/admin/attendance/odontogram/ClinicalConditionEditor.tsx`
- Test: selector/editor tests

- [ ] Replace the 15 repeated face/third combinations with direct selection of the five real dental faces: vestibular, palatina/lingual, mesial, distal and oclusal/incisal.
- [ ] Store newly selected face targets as `face inteira`, because subregions were not separately drawable in the odontogram.
- [ ] Restrict whole-tooth procedures to their clinically valid `Dente inteiro` target and retain readable labels for existing records.
- [ ] Verify keyboard use, screen-reader names and the focused tests.

## Handoff

### Addendum: Tasks 8–10 — Guia Digital e odontograma

#### Task 8: Remover o mock “Guia Digital”

Remover a página mock, submenu, imports, rotas e referências órfãs do Guia Digital. Confirmar que a navegação administrativa não aponta para a página removida e que o build não mantém bundle/links inacessíveis.

#### Task 9: Tornar a legenda do odontograma clinicamente útil

Revisar o modelo de estados/cores do odontograma para diferenciar achado, tratamento planejado, tratamento concluído, alerta e condição ausente/normal. Exibir uma legenda única e não redundante, com contraste acessível, tooltip/texto alternativo e persistência compatível com dados existentes; não usar uma cor azul genérica para todos os estados.

#### Task 10: Simplificar regiões anatômicas reais

Substituir a grade redundante de regiões por regiões clinicamente reconhecíveis e não duplicadas (vestibular, lingual/palatina, mesial, distal, oclusal/incisal e cervical, conforme aplicável ao dente). Usar rótulos curtos e consistentes, agrupamento visual por face e testes para impedir aliases/duplicatas confusas.

Critérios comuns: preservar dados clínicos legados, não registrar dados sensíveis em testes/logs, manter teclado/zoom/contraste acessíveis e executar testes focados, lint, build e `git diff --check` antes da entrega.

After the plan is reviewed, implement it with `superpowers:subagent-driven-development` or `superpowers:executing-plans`, preserving the task order because migrations and server contracts precede UI consumers.
