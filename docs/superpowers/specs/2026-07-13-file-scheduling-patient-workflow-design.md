# Files, Scheduling, and Patient Workflow

## Goal

Repair uploaded media and document delivery, protect clinical files with authenticated access, add confirmed scheduling to the existing lead and quick-start consultation workflow, make patient creation reliable, improve admin navigation density, and make temporal evolution use the clinical appointment type rather than free-text procedure names.

## Scope

### In scope

- Move the general authenticated upload endpoint from Cloudinary to the configured bucket storage.
- Deliver public content assets (blog, treatments, stories, and logo) through bucket-backed public URLs.
- Keep consultation photos and patient PDFs private, with authenticated access and short-lived signed bucket URLs.
- Normalize frontend URL handling and correct references to missing local image/PDF filenames.
- Add editable scheduled date/time data for confirmed requests and consultations while retaining `createdAt` for internal management.
- Add an upcoming agenda card with an action to start the existing consultation quick-start.
- Repair patient creation date serialization and keep patient records visible/searchable in the patient and document flows.
- Group Comentários, Tratamentos, Blog, and Stories into a Content sidebar submenu sized like Consultas.
- Make Evolução Temporal classify odontogram/facial content by `appointmentType` and show `procedure` only as descriptive text.

### Out of scope

- A drag-and-drop month/week calendar, recurring availability, conflict detection, reminders, or external calendar synchronization.
- Public access to clinical photos, patient PDFs, or other patient-linked files.
- Replacing the existing homepage WhatsApp chat/lead experience.
- Unrelated visual redesign or broad refactoring of the admin application.

## Current root causes

- `server/index.js` uses Cloudinary for `/upload`, while private patient documents use a separate bucket helper.
- Several static references in `src/data` and seeded records point to filenames that are not present under `public/images`.
- Patient document listing only exposes `fileUrl` for `storageKey` records and drops legacy `pdfUrl` records from the usable URL field.
- Frontend consumers concatenate relative document URLs inconsistently and uploaded URLs are not normalized by scope.
- `Lead` has status but no scheduled date; dashboard “Agendamentos” currently lists recent leads without a date-based agenda model.
- `Appointment.date` is used as the primary display date, but there is no separate confirmed/scheduled date.
- Patient create passes `consentDate` strings directly to Prisma, whereas update converts the value to a `Date`.
- The sidebar keeps four content destinations as top-level entries, consuming vertical space.
- Evolution UI already has `appointmentType`, but its category badge uses free-text `procedure` and can misrepresent variable procedure descriptions.

## Architecture

### Storage boundaries

Add a shared bucket storage utility for public and private assets. It will use the existing bucket environment variable aliases and S3-compatible client configuration already used by `patientDocumentStorage.js`.

- Public asset keys use a stable public prefix, such as `public-assets/<uuid>-<safe-name>`.
- Clinical asset keys use private prefixes, such as `clinical/appointments/<appointment-or-pending-id>/<uuid>.<ext>`.
- Patient document keys remain under the existing private patient-document prefix.
- The database stores bucket keys or API asset URLs, never expiring signed URLs.

Expose two delivery paths:

1. A public asset route that resolves a public key to a bucket-backed URL without authentication.
2. An authenticated private asset route that validates the logged-in request and redirects to a short-lived signed bucket URL.

The `/upload` endpoint remains authenticated and returns an explicit scope-aware URL. Public admin upload consumers use the public scope. Consultation photo uploads use the clinical scope. Existing legacy absolute URLs remain readable for compatibility, but new clinical uploads do not use public URLs.

### Scheduling model

Add nullable `scheduledAt` to `Lead` and `Appointment`.

- A homepage submission creates a lead/chat with `status = new` and no schedule.
- Staff may update the lead to `scheduled` and set `scheduledAt` in the request-management screen.
- Starting an attendance from a scheduled lead carries the lead’s exact patient identity and `scheduledAt` into the existing quick-start form.
- A direct “Novo Atendimento” remains available and can set its own scheduled value.
- `createdAt` remains read-only audit information.
- `date` remains the clinical record date for existing records; `scheduledAt` is the calendar date/time.
- After a lead is converted into an attendance, the lead is marked completed as it is today; the appointment retains the scheduled value.

The dashboard agenda card queries the existing dashboard data and displays scheduled leads/appointments ordered by `scheduledAt`. Each item includes patient name, service/procedure, type, scheduled date/time, created date when useful for internal context, and “Iniciar consulta”.

### Patient and evolution behavior

Normalize `consentDate` before both create and update persistence. Patient create continues using exact CPF upsert and encrypted CPF/history. The response shape includes the newly persisted patient ID and decrypted display fields.

Patient list/search remains backed by `/patients?search=`, while document pickers continue using the same authenticated endpoint. No approximate name matching is introduced.

Evolution timeline requests only the selected patient’s appointments, excludes the current appointment, sorts by clinical date, and uses `appointmentType` for odontologia/harmonização panels and labels. `procedure` remains visible as free-text context and cannot change the category logic.

## Frontend changes

- Add a small media URL helper for local paths, API-relative private routes, and absolute bucket URLs.
- Use the helper in blog, treatment, story, logo, document, consultation photo, and evolution consumers.
- Add upload error messages that surface the server response and reset file inputs after success/failure.
- Add schedule date/time input and an explicit “Criado em” versus “Agendado para” presentation in request and consultation views.
- Preserve the existing quick-start routes and patient picker behavior.
- Replace four content top-level sidebar entries with a nested “Conteúdo” group while preserving route permissions.

## Backend changes

- Add bucket asset upload and public/private delivery helpers.
- Change `/upload` from Cloudinary storage to bucket storage with explicit public/clinical scope handling.
- Keep patient document upload and authenticated delivery on bucket storage, and make list responses expose both new and legacy file URLs consistently.
- Extend Prisma schema and request validation for `scheduledAt`.
- Normalize date values on lead/appointment update and create paths, rejecting invalid values with clear 400 responses.
- Include scheduled fields in dashboard and appointment responses used by the agenda.
- Keep private asset routes authenticated and avoid returning private signed URLs to unauthenticated callers.

## Error handling

- Missing bucket configuration produces a clear server error naming the required configuration, without leaking credentials.
- Unsupported upload types and size violations return user-readable 400 responses.
- Signed URL generation failures return 500 responses and do not expose the bucket key unnecessarily.
- Invalid schedule values return 400 responses; the UI keeps the form open and displays the API message.
- Patient persistence errors return the existing user-readable error contract; date conversion errors are caught before Prisma.
- Broken public media uses a local placeholder/fallback and does not block the rest of the page.
- Legacy public URLs remain supported; legacy private document records with `pdfUrl` continue to resolve through the existing authenticated document route.

## Testing and verification

Add focused server contract/unit coverage for:

- bucket configuration and public/private upload route behavior;
- private document URL exposure and legacy `pdfUrl` fallback;
- scheduled fields in schema/routes and date normalization;
- dashboard ordering/action data for scheduled entries;
- patient create with `consentDate` and searchable response shape;
- evolution classification by `appointmentType`;
- sidebar grouping and URL helper consumer contracts;
- static asset references resolving to files under `public`.

Run the following before completion:

- `node --test` for all server tests;
- server Prisma generation/build;
- `npm run lint`;
- `npm run build`;
- `git diff --check`;
- a local frontend smoke check for public images, authenticated clinical images/PDFs, patient creation, scheduled request, dashboard “Iniciar consulta”, and evolution display.

## Acceptance criteria

1. New public uploads appear correctly on blog, treatment, stories, and logo consumers using the configured bucket.
2. New consultation photos and patient PDFs cannot be retrieved without an authenticated staff session.
3. Existing patient PDFs with either `storageKey` or legacy `pdfUrl` open from the document history.
4. Static treatment/blog/logo references do not request nonexistent local files.
5. Staff can set and edit a confirmed request’s scheduled date/time, and the dashboard agenda shows it separately from created-at.
6. “Iniciar consulta” opens the existing quick-start with the correct patient and schedule context.
7. Creating a new patient from Pacientes persists successfully, including when consent is recorded, and the patient is searchable in patients/documents.
8. Content sidebar entries are grouped under a nested submenu with Consultas-like dimensions.
9. Evolution panels and labels follow `appointmentType`, while variable procedure text remains descriptive.
10. Existing authentication, permissions, WhatsApp lead behavior, and clinical data are preserved.
