# Admin typography, homepage and TypeScript

## Audit and scope

- Preserve redesign: existing gold/neutral tokens, Inter UI and Playfair public headings, clinic photography, routes, anchors, legal copy and analytics events remain. Existing shadcn/Tailwind stack remains.
- Design reading: trustworthy clinical site, restrained motion and readable information. Variance 3, motion 2, density 4. Improve spacing and typography before replacing blocks.
- Admin: audit all Admin routes and shared/portal components; standardize roles without changing print/PDF, authored rich text, clinical diagrams or sidebar branding.
- Homepage findings: 10px metadata, 12px descriptions, negative mobile margins and hidden horizontal scrolling; contact grid nested inside half-width page column; hidden map iframe still requests an unrelated location; lead form ignores unsuccessful HTTP responses; blog has no loading/error state.
- Outstanding recorded type errors: PDF tests, AdminBlog date, AdminComments rating. Recheck all TypeScript configurations and lint rather than suppressing errors.

## Implementation and verification

1. Correct type contracts and regression tests independently.
2. Consolidate Admin typography by semantic role and test scoping.
3. Improve public card readability, responsive layout, focus/hover transitions and reduced motion. Correct observed request handling with tests first.
4. Run frontend/backend suites, TypeScript, lint, production build, whitespace and secret scan. Retry browser if available; record limitations honestly.
5. Review the combined diff; commit only task files and push origin main. Preserve the personal untracked text file.

## Additional requests implemented

- Retired blog runtime (public/admin/routes/analytics/seed), preserving stored legacy Post data and migration history. Shared HTML sanitization retained under generic name.
- Dashboard shows one total inventory value across all products; recent rows show remaining quantity and reconstitution date only. Existing admin/dentist authorization retained.
- Patient action icons align to existing information rows.
- Entire attendance step one collapses together; odontogram printing belongs to dental/both attendance, not prescription toolbar.
- Whole-face multi-selection retained without new cervical/middle/incisal subdivisions; historical regional findings remain readable and editable without implicit deletion.
- Skin representation is part of validated facialNotes and survives reopening the appointment.
- Manual document model has empty patient fields using the shared clinical print patient card, preserving grid, spacing, borders, logo and professional identity; no selected patient values/content or electronic signature image are printed.
- Browser daily calendar shows previous/selected/next dates, with selected date centered/highlighted; installed PWA retains a single day. Week/month behavior retained.
- Removed unsafe default seed passwords; seed now requires environment secrets and does not overwrite existing accounts. No seed, migration or production-data operation was executed.

## Validation limitations

Browser connection timed out and temporarily stalled tooling. No screenshots, rendered font measurement or physical print inspection are claimed. Layout scoping, field dimensions/classes, print root lifecycle, responsive modes and data behavior are covered by automated checks. Existing large-bundle/Browserslist and unavailable remote PDF image warnings remain; they are not TypeScript errors.

Final verification: 281 frontend tests and 175 backend tests passed. Both TypeScript projects passed with zero errors, ESLint passed, and production build passed. Pattern-based secret scan and `git diff --check` passed. The fetched `origin/main` matched local HEAD before integration. Backup/security contract tests are included in the backend suite; no live backup/restore or database write was attempted.
