## Task 3: Separar a lista de consultas do calendário

**Files:**
- Create: `src/pages/AdminCalendar.tsx`
- Create: `src/pages/AdminCalendar.test.tsx`
- Modify: `src/pages/AdminAppointments.tsx`
- Modify: `src/pages/AdminAppointments.test.tsx`

**Interfaces:**
- `AdminAppointments` owns only appointment list state, search text, date filter, deletion and detail navigation.
- `AdminCalendar` owns current calendar state, leads, staff, manual appointment form, drag/drop confirmation and professional editing.
- Both use `fetchClient` and preserve existing `CalendarView`/`buildCalendarEntries` interfaces.

- [ ] **Step 1: Write failing tests for list-only behavior and date filtering**

Add tests that render `AdminAppointments` with appointment records on different dates and assert:

```ts
await user.type(screen.getByLabelText('Pesquisar paciente ou CPF'), 'Marina');
expect(screen.getByText('Marina Alves')).toBeInTheDocument();
await user.clear(screen.getByLabelText('Pesquisar paciente ou CPF'));
await user.type(screen.getByLabelText('Filtrar por data'), '2026-08-20');
expect(screen.getByText('Consulta de avaliação')).toBeInTheDocument();
expect(screen.queryByText('Consulta de retorno')).not.toBeInTheDocument();
expect(screen.queryByRole('button', { name: 'Criar horário de teste' })).not.toBeInTheDocument();
```

Add `AdminCalendar.test.tsx` covering the existing manual create success flow and failed POST preserving the modal values.

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```powershell
npx vitest run src/pages/AdminAppointments.test.tsx src/pages/AdminCalendar.test.tsx
```

Expected: FAIL because the current list still renders the calendar and has no date filter/new page component.

- [ ] **Step 3: Extract calendar responsibilities**

Move the calendar-specific imports, state, data loading, update/create handlers, dialogs and `CalendarView` render from `AdminAppointments.tsx` into `AdminCalendar.tsx`. Keep the existing payload validation and refresh/invalidation sequence. The new component must render:

```tsx
<AdminLayout title="Calendário">
  <div className="admin-card p-6 w-full">
    <CalendarView ... />
  </div>
  {/* existing create, drop confirmation and professional dialogs */}
</AdminLayout>
```

Do not alter backend payload names or existing success/error messages while extracting.

- [ ] **Step 4: Reduce `AdminAppointments` to list and add date filter**

Remove `CalendarView`, leads/staff loading, calendar state, calendar dialogs and `useSearchParams` view switching. Add `dateFilter` state and a labeled `<Input type="date" aria-label="Filtrar por data" />`. Filter with the local calendar day of `record.scheduledAt || record.date`, while the patient input continues matching name or CPF. Keep the existing list, detail navigation, total and authorized delete/new actions.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run:

```powershell
npx vitest run src/pages/AdminAppointments.test.tsx src/pages/AdminCalendar.test.tsx
```

Expected: list tests prove the calendar is absent, date/name filters work, and calendar tests prove create/update behavior remains intact.

- [ ] **Step 6: Commit**

```powershell
git add src/pages/AdminAppointments.tsx src/pages/AdminAppointments.test.tsx src/pages/AdminCalendar.tsx src/pages/AdminCalendar.test.tsx
git commit -m "refactor: separate appointment list from calendar"
```

---

