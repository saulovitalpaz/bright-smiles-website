### Task 3: Add scheduled fields and upcoming agenda data

**Files:**
- Modify: `server/prisma/schema.prisma`
- Modify: `server/utils/validationSchemas.js`
- Modify: `server/index.js:295-420,855-894,896-930`
- Modify: `server/test/file-scheduling-patient-contract.test.js`

**Interfaces:**
- `Lead.scheduledAt: DateTime?` and `Appointment.scheduledAt: DateTime?`.
- `appointmentSchema.scheduledAt` and a lead update parser accept an ISO date string, a date-only/browser datetime-local string normalized by the server, or null.
- Dashboard response adds `upcomingSchedule`, an array of `{ kind, id, patientName, treatment, procedure, appointmentType, scheduledAt, createdAt, patientId, leadId }` sorted ascending by `scheduledAt`.

- [ ] **Step 1: Add failing schema and route contracts.**

```js
test('schedule fields are persisted and dashboard exposes ascending upcoming schedule', () => {
    const schema = fs.readFileSync(path.join(serverRoot, 'prisma/schema.prisma'), 'utf8');
    const validation = fs.readFileSync(path.join(serverRoot, 'utils/validationSchemas.js'), 'utf8');
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    assert.match(schema, /model Lead[\s\S]*scheduledAt\s+DateTime\?/);
    assert.match(schema, /model Appointment[\s\S]*scheduledAt\s+DateTime\?/);
    assert.match(validation, /scheduledAt/);
    assert.match(source, /Invalid scheduled date/);
    assert.match(source, /upcomingSchedule/);
    assert.match(source, /orderBy:\s*\{\s*scheduledAt:\s*['"]asc['"]\s*\}/);
});
```

Run the test and verify it fails before implementation.

- [ ] **Step 2: Add nullable Prisma fields and validation.**

Add `scheduledAt DateTime?` to both models. Extend `appointmentSchema` with `scheduledAt: z.string().or(z.date()).optional().nullable()`. Create a shared server helper:

```js
function parseOptionalDate(value, message) {
    if (value === undefined || value === null || value === '') return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new Error(message);
    return parsed;
}
```

Use it for appointment create/update and lead updates when `scheduledAt` is present. Run `npx prisma generate` and `npx prisma db push` only against the configured development database when the environment permits it.

- [ ] **Step 3: Implement upcoming schedule aggregation.**

Query scheduled leads and appointments separately, require `scheduledAt: { not: null }`, exclude completed leads, map them to the shared response shape, combine, sort by `new Date(item.scheduledAt)`, and take the first 10. Keep existing `recentAppointments` and `recentLeads` fields for compatibility.

- [ ] **Step 4: Run server tests and Prisma build.**

```powershell
node --test test/file-scheduling-patient-contract.test.js
npm run build
```

Run the second command from `server/`. Expected: schedule contracts pass and Prisma generation exits with code 0.

- [ ] **Step 5: Commit the schedule API.**

```powershell
git add server/prisma/schema.prisma server/utils/validationSchemas.js server/index.js server/test/file-scheduling-patient-contract.test.js
git commit -m "feat: add scheduled consultation fields and agenda data"
```

