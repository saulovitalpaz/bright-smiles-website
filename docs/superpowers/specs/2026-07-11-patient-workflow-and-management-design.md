# Patient Workflow and Management

## Goals

1. Preserve `patientId` when an atendimento is started from an existing appointment or Solicitação so the evolution timeline shows only the patient's history.
2. Remove completed Solicitações from the active Solicitações page while retaining their records.
3. Add a responsive admin Pacientes area for patient search and CRUD management.

## Root Causes

- `GET /appointments` currently ignores `patientId` query parameters, so evolution history receives unrelated appointments.
- Starting an atendimento from a lead copies only name, treatment, and message. It does not resolve or create a `Patient`, leaving `patientId` null.
- `AdminLeads` renders every lead, including `status = completed`.
- Patient APIs exist, but there is no dedicated management route or navigation item.

## Data Flow

- `GET /appointments?patientId=<id>` adds a Prisma `where.patientId` filter and continues to return all appointments when no filter is supplied.
- Attendance initialization carries an existing appointment's `patientId` through the form state.
- Lead initialization attempts a stable patient match using available CPF/phone data. If no patient exists, the attendance save flow requires a CPF and upserts the patient before saving the appointment, then sends the resulting ID in `patientId`.
- Completed leads remain in the database but are excluded from the active Solicitações query/rendered list.

## Patient Management UI

- Add an admin-only `/admin/pacientes` route and a `Pacientes` sidebar item.
- Provide search by name or CPF and display name, CPF, phone, and latest appointment information.
- Provide create/edit forms for name, CPF, phone, address, history, consent, and odontogram data.
- Use stacked cards and full-width controls on mobile; use table-like rows, grouped fields, and split layout on desktop.
- Reuse the existing authenticated patient API and picker conventions.

## API and Error Handling

- Continue using the existing Zod patient schema and centralized CPF encryption/decryption.
- Add update and delete patient endpoints as needed by the management UI.
- Before deletion, check appointments, prescriptions, documents, and finance transactions. Return `409 Conflict` with a user-readable reason when any related record exists.
- Never link patients by approximate name matching.

## Verification

- Regression-test patient-filtered appointment queries and lead completion filtering.
- Test patient create/update and protected deletion behavior.
- Run TypeScript/Vite and server Prisma builds.
- Verify the management page renders at mobile and desktop breakpoints without horizontal overflow.
