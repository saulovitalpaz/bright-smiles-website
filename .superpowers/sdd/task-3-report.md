# Task 3 report: authenticated cards and print previews

Status: complete with baseline lint findings

## Changes

- Added native keyboard-safe clinic/compact print selectors to `AdminDocuments` and `AdminPrescription`.
- Switched both printable roots to the shared `printDocumentClass(printMode)` contract and removed their page-local `@media print` blocks.
- Added `print-section`, `print-patient-block`, and `print-signature` markers to semantic document groups so the centralized print rules can protect them from page breaks.
- Added `admin-card` to custom authenticated surfaces in the dashboard, appointments, blog, comments, and patient pages, while keeping status colors and actions intact.
- Added horizontal overflow protection to the blog table and retained the existing finance table overflow wrapper.
- The brief names `AdminSolicitacoes.tsx` and `AdminConsultas.tsx`; those files are not present in this branch. The active equivalents are `AdminAppointments.tsx` and `AdminAttendanceDetail.tsx`. The appointments history surface was normalized; `AdminAttendanceDetail.tsx` already uses shared `Card` primitives.

## Verification

- `npm.cmd run build`: passed (Vite transformed 3291 modules and exited 0). Existing Browserslist age and bundle-size warnings remain.
- Targeted ESLint over changed pages: reports the existing repository `@typescript-eslint/no-explicit-any` baseline in dashboard/blog/comments/documents/prescription; no new rule errors from this task. The one touched `prefer-const` finding was fixed.
- `git diff --check`: passed (only Git's existing LF/CRLF normalization warnings were reported).

## Concerns

- Full repository lint remains the known baseline failure described in `.superpowers/sdd/progress.md`; it is not caused by the print/card changes.
- The centralized print stylesheet intentionally owns print resets and chrome hiding; no page-level print media overrides remain in the two print roots.

## Reviewer follow-up

- Preserved the prescription root's `flex min-h-screen flex-col` layout and updated the shared `.print-document` print rule to use `display: flex`, `flex-direction: column`, and `min-height: 100%`. This keeps the signature/footer pushed to the bottom while retaining clinic/compact mode behavior.
- Follow-up verification: `npm.cmd run build` passed (3291 modules; same existing Browserslist and chunk-size warnings). Targeted ESLint remains limited to the same 19 pre-existing `no-explicit-any` findings.
