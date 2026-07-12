# Patient Workflow and Management Implementation Plan

> For agentic workers: use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task by task. Steps use checkbox syntax.

**Goal:** Link appointments to patients reliably, remove completed requests from the active queue, and add a responsive admin patient-management area.

**Architecture:** Keep Patient as the canonical record and Appointment.patientId as the relationship used by evolution history. Fix filtering and linking at the Express boundary, then build patient CRUD on the existing authenticated patient API and admin layout. Reject deletion when clinical or financial history exists.

**Tech Stack:** Express, Prisma/PostgreSQL, Zod, React, TypeScript, React Router, TanStack Query, Tailwind CSS, Node built-in test runner.

## Global constraints

- Never link patients by approximate name matching.
- Continue using the existing Zod patient schema and centralized CPF encryption/decryption.
- Completed leads remain in the database but are excluded from the active Solicitações list.
- Return HTTP 409 when patient deletion is blocked by related records.
- Use stacked cards/full-width controls on mobile and table-like rows/grouped fields on desktop.

---

### Task 1: Filter appointment history and completed requests

Files:
- Create server/test/patient-workflow-contract.test.js
- Modify server/index.js appointments and leads list routes

Interfaces:
- Consumes the patientId query parameter and existing lead status values.
- Produces GET /appointments?patientId=<id> filtered by patientId and GET /leads excluding completed records.

- [ ] Step 1: Write the failing contract test.

The test reads server/index.js and asserts that the appointments route reads req.query.patientId and builds a Prisma where clause, and that the leads route uses where: { status: { not: 'completed' } }. Use Node's built-in test runner and assert.match.

- [ ] Step 2: Run node --test test/patient-workflow-contract.test.js from server/ and confirm it fails because both clauses are absent.

- [ ] Step 3: Implement the smallest route change. Parse patientId with Number.parseInt, use an empty where object when it is absent or invalid, and pass where to prisma.appointment.findMany. Add where: { status: { not: 'completed' } } to prisma.lead.findMany.

- [ ] Step 4: Run the contract test again and confirm two tests pass.

- [ ] Step 5: Commit with git add server/index.js server/test/patient-workflow-contract.test.js and git commit -m 'fix: filter appointment history and completed requests'.

### Task 2: Preserve patientId through attendance navigation

Files:
- Modify src/pages/AdminAppointments.tsx
- Modify src/pages/AdminAttendanceDetail.tsx
- Modify src/components/admin/attendance/EvolutionTimeline.tsx
- Modify server/test/patient-workflow-contract.test.js

Interfaces:
- Consumes appointment records containing patientId.
- Produces attendance links and save payloads that preserve the selected patient ID.

- [ ] Step 1: Add a failing contract assertion that AdminAppointments includes patientId in the /admin/consultas navigation URL and that EvolutionTimeline requests appointments?patientId=patientId.

- [ ] Step 2: Run the contract test and confirm the navigation assertion fails.

- [ ] Step 3: Add patientId?: number | null to AppointmentRecord. Navigate to /admin/consultas/id?patientId=value from both the row click and the Ver Evolução button. In AdminAttendanceDetail, read patientId from useSearchParams when creating a draft and prefer fetched.patientId when loading an existing appointment.

- [ ] Step 4: Keep the existing PatientPicker selection as the authoritative choice. If a lead has only a name, do not infer a patient; require CPF and an explicit patient selection or creation before save. Ensure the payload sends the finalPatientId.

- [ ] Step 5: Run node --test test/patient-workflow-contract.test.js from server/ and npm run build from the repository root. Confirm tests and Vite build pass.

- [ ] Step 6: Commit with git add src/pages/AdminAppointments.tsx src/pages/AdminAttendanceDetail.tsx src/components/admin/attendance/EvolutionTimeline.tsx server/test/patient-workflow-contract.test.js and git commit -m 'fix: preserve patient links through attendance workflow'.

### Task 3: Add safe patient update and deletion API

Files:
- Modify server/utils/validationSchemas.js
- Modify server/index.js patient routes
- Modify server/test/patient-workflow-contract.test.js

Interfaces:
- Consumes authenticated JSON requests to /patients and /patients/id.
- Produces PUT /patients/id and DELETE /patients/id with encrypted persistence and deletion protection.

- [ ] Step 1: Add failing assertions for PUT and DELETE patient routes and checks for appointments, prescriptions, documents, and finance relations.

- [ ] Step 2: Run the contract test and confirm the route assertions fail.

- [ ] Step 3: Extend patientSchema with optional consent, consentDate, and odontogram fields. Reuse deterministic CPF encryption and encrypted history in the update route. Return the same decrypted shape as GET /patients.

- [ ] Step 4: Implement DELETE /patients/id. Load the patient with one related row from each relation. Return 404 when absent; return 409 with a clear message when any relation contains a row; otherwise delete and return a success message.

- [ ] Step 5: Run the contract test and npm run build from server/. Confirm all tests pass and Prisma generation succeeds.

- [ ] Step 6: Commit with git add server/index.js server/utils/validationSchemas.js server/test/patient-workflow-contract.test.js and git commit -m 'feat: add safe patient update and deletion api'.

### Task 4: Build the responsive Pacientes admin page

Files:
- Create src/pages/AdminPatients.tsx
- Modify src/App.tsx
- Modify src/components/admin/AdminLayout.tsx

Interfaces:
- Consumes /patients?search=, POST /patients, PUT /patients/id, and DELETE /patients/id.
- Produces the protected /admin/pacientes route and an admin-only Pacientes navigation item.

- [ ] Step 1: Add a failing route/build contract asserting that App.tsx imports AdminPatients and registers /admin/pacientes, and AdminLayout includes a Pacientes item.

- [ ] Step 2: Run the assertion and confirm it fails before implementation.

- [ ] Step 3: Implement AdminPatients with debounced name/CPF search, patient cards, create/edit form, reset action, toasts, and delete confirmation. Use a one-column mobile layout and a responsive desktop two-column layout; every action must be full width on small screens and avoid fixed-width overflow.

- [ ] Step 4: Register the protected route in App.tsx and add an admin-only sidebar item using the Users icon. Keep manager access consistent with the existing role policy.

- [ ] Step 5: Run npm run build from the repository root and inspect the generated page classes for mobile and desktop breakpoints.

- [ ] Step 6: Commit with git add src/pages/AdminPatients.tsx src/App.tsx src/components/admin/AdminLayout.tsx and git commit -m 'feat: add responsive patient management page'.

### Task 5: Full verification

Files: none unless verification exposes a defect.

- [ ] Step 1: Run node --test test/no-redis-runtime.test.js test/patient-workflow-contract.test.js from server/. Expect zero failures.

- [ ] Step 2: Run npm run build from server/ and npm run build from the repository root. Expect both commands to exit 0.

- [ ] Step 3: Run git diff --check and inspect git diff --stat. Confirm no unrelated files changed and no horizontal-overflow layout was introduced.

- [ ] Step 4: Commit only if a final test-only adjustment was required, using git commit -m 'test: verify patient workflow and management integration'.
