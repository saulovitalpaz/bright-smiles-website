# Calendar Upgrade and Tasks 6–8 Design

## Goal

Complete the remaining work from the file, scheduling, and patient workflow plan (Tasks 6, 7, and 8) and add a calendar mode to the admin appointments screen. The calendar must support moving scheduled items by date/time with explicit confirmation and must make the associated professional visible and editable from the event details card.

## Scope and compatibility

- Preserve the existing list view, route structure, authentication behavior, WhatsApp behavior, and appointment/lead schedule APIs.
- Keep the existing `Appointment.professional` string field compatible with historical data.
- Add an optional `Lead.professional` string so scheduled leads can carry the same professional metadata as appointments.
- Drag-and-drop changes only `scheduledAt`; it never changes the professional.
- Professional changes happen only from the opened event details card.
- Do not add recurring availability, conflict detection, reminders, external calendar synchronization, or approximate patient matching.
- Preserve unrelated user changes already present in the worktree, including the current public image changes.

## Design

### 1. Calendar mode

`AdminAppointments` will offer a list/calendar view toggle. Calendar mode will use a custom React/Tailwind week grid and the existing `date-fns` dependency. This avoids adding a calendar dependency while providing precise date/time drop targets.

The calendar will load scheduled appointments and scheduled leads, normalize them into a shared view model, and render each event with:

- patient or lead name;
- treatment or procedure;
- formatted scheduled date/time;
- a professional tag when assigned;
- a stable color derived from the professional name, with an unassigned color fallback.

Clicking an event opens a details dialog. The dialog displays the current schedule, patient/treatment information, and a professional selector populated from existing staff users. Saving the dialog persists only the professional field (and any explicitly edited details supported by the current route). For appointments it uses the existing appointment update route; for leads it uses the existing lead update route.

Dragging an event calculates a proposed new date/time but does not update local/server state immediately. A confirmation dialog shows the original and proposed schedule. Cancel leaves the event in its original slot. Confirm sends the minimal update `{ scheduledAt }` to the event’s existing update endpoint, refreshes the calendar, and reports API errors without losing the original event position.

The calendar will support mouse and keyboard-accessible non-drag alternatives through the event details card’s schedule field. Mobile layouts will retain the list view as the primary usable fallback; calendar content will scroll horizontally when necessary.

### 2. Task 6: type-driven evolution

Historical appointments will normalize missing values at the fetch boundary:

- `appointmentType` defaults to `odontologia`;
- `photos` defaults to `[]`;
- `dentalNotes` and `facialNotes` default to `{}`.

The evolution timeline will render a localized category badge from `appointmentType` (`Odontologia`, `Harmonização Facial`, or `Ambos`) and show `procedure` separately as a descriptive label. Odontogram and face-map panels will remain gated only by `appointmentType`; procedure text will never determine clinical panel visibility.

### 3. Task 7: public media and navigation

A static asset contract test will extract root-relative `/images/...` references from the static data and seed sources and verify that each maps to an existing file under `public`. Broken references will be replaced only with verified existing assets from the same category; fake placeholder files will not be introduced.

Public upload consumers (blog, treatments, stories, and settings/logo) will send `scope=public`, persist the stable public reference where supported, normalize display URLs through `mediaUrl`, and expose server error messages in upload feedback. Existing local fallbacks remain available for legacy records.

The sidebar will replace the four standalone content entries with a `Conteúdo` group containing Comments, Treatments, Blog, and Stories. Existing paths, role filters, active-state behavior, and manager visibility will be preserved. The parent group will be active for any child route.

### 4. Task 8: verification

Verification will cover:

1. Complete server test suite and Prisma generation/build.
2. Frontend lint and production build.
3. `git diff --check`, status, and scoped diff review.
4. Authenticated/public smoke flows for media, scheduling, calendar drag/drop confirmation, professional assignment, and type-driven evolution panels.

## Data flow

```text
Appointments + scheduled leads
          │
          ▼
  shared calendar view model
          │
   ┌──────┴──────┐
   │             │
 drag/drop     open card
   │             │
 proposed      professional
 date/time     selection
   │             │
 confirm       save professional
   │             │
 PUT scheduledAt   PUT professional
   └──────┬──────┘
          ▼
       refresh
```

## Error handling

- Invalid schedule values continue to return the existing `Invalid scheduled date` contract.
- A failed drag/drop save leaves the event at its previous schedule and shows the server error.
- A failed professional update leaves the previous professional tag/color and shows the server error.
- Missing or legacy media continues to use normalized legacy URLs or local fallbacks.
- A failed private clinical image remains an individual placeholder and does not break the timeline.

## Testing strategy

- Add source/runtime contracts for type-driven evolution, public asset references, nested content navigation, and lead professional persistence.
- Test calendar transformation and pending-drop confirmation behavior through focused frontend tests where the existing test setup supports it; otherwise retain deterministic source contracts plus production build coverage.
- Run all existing server tests and frontend lint/build after each task boundary and during final handoff.

## Non-goals

- Full month-view scheduling, recurring availability, conflict detection, reminders, notifications, or external calendar integration.
- Replacing the existing appointment list or rebuilding the broader admin visual system.
- Changing appointment ownership semantics beyond the existing professional string field.
