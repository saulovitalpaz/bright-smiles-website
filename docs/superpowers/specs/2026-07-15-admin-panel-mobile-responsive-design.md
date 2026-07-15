# Admin Panel Mobile Responsive Design

## Status

Approved design direction; implementation has not started.

## Design read

This is a clinic admin panel used on phones for operational work. The visual language should remain calm, premium, and editorial, while the interaction model becomes information-first, touch-friendly, and resilient at narrow widths.

## Goal

Make every `/admin/*` route usable on phone, tablet, and desktop widths without page-level horizontal overflow, clipped controls, inaccessible actions, or content hidden behind the mobile shell. Keep the current workflows and APIs intact. Include the requested financial dashboard interaction redesign as a page-specific behavior within the shared responsive system.

## Scope

- Shared `AdminLayout`, mobile drawer/header, content container, and global root styles.
- All admin routes registered in `src/App.tsx`, including dashboard, content management, appointments, attendance, finance, analytics, documents, prescription, settings, users, patients, and login.
- Shared admin components whose fixed dimensions affect mobile use, including patient picker, calendar, rich-text editor, attendance tools, dialogs, and data displays.
- No backend, API contract, authentication, or data-model changes.
- No deployment or git push.

## Responsive foundations

### Viewport and shell

- Remove the starter root constraints that impose a desktop max-width, global padding, or centered text alignment on the application.
- Ensure the app and admin content use the available viewport width with `min-width: 0` on flex/grid children.
- Treat the mobile navigation bar as layout space rather than an overlapping layer. Keep the drawer fixed, respect safe-area insets, lock body scrolling only while open, and restore focus/scroll behavior after close.
- Keep the desktop sidebar fixed and preserve its collapsed/expanded behavior.
- Prevent horizontal overflow at the page level. Any intentional wide content must be contained inside its own scroll region.

### Spacing and interaction

- Use 16px mobile gutters, 24px tablet gutters, and 32px desktop gutters through the shared admin content container.
- Preserve an 8px spacing rhythm for sections, cards, fields, and action groups.
- Keep interactive controls at least 44px high/wide where practical, with visible focus and pressed states.
- Allow long labels, names, and descriptions to wrap or truncate within a bounded region instead of expanding the viewport.
- Keep form labels visible and associate them with their controls.

### Layout behavior

- Default to a single-column task flow on phones.
- Use CSS grid/flex ordering only where it preserves semantic reading and keyboard order; do not duplicate page content for mobile and desktop.
- Stack form actions and controls when they cannot comfortably fit in one row.
- Use full-width inputs, selects, buttons, and dialogs on phones unless a compact control is demonstrably readable.
- Use responsive internal heights for editors and panels; avoid fixed desktop heights that create clipped or unusable areas.

## Page patterns

### Operational dashboards and summaries

Dashboard, analytics, finance, and personal finance pages should put actionable or report content before secondary recap panels on phones. Summary cards can stack in one column and remain readable without shrinking text below usable sizes.

### Lists and tables

- Convert ordinary business tables such as finance history, blog posts, and stories into stacked cards or structured list rows on phones. Preserve the desktop table at larger widths.
- Make row actions visible and reachable on touch; do not rely on hover opacity for essential actions.
- Keep dense two-dimensional tools such as the appointment calendar and odontogram in contained horizontal-scroll regions with clear boundaries. Their scroll must not leak to the page.
- Ensure table/list metadata wraps, and keep amounts/statuses visually associated with their item.

### Forms and editors

Appointment, patient, treatment, prescription, document, settings, and content forms should become one-column phone flows. Multi-column groups may remain at tablet/desktop widths when labels and controls have sufficient room.

Dialogs should use nearly the full phone viewport with internal vertical scrolling, safe padding, and sticky actions only when the action bar does not cover content. Rich-text and document editors should use viewport-aware minimum heights.

## Finance page behavior

The general finance page (`/admin/finance`) will use one connected cash-flow/report card:

- Month and year selectors live inside the cash-flow card, near its title and period description.
- The report list follows immediately after the period controls.
- The new-transaction form follows the report on phones and remains beside it at desktop widths.
- Read-only/supporting NF-e and export content remains after the primary work area on phones.
- The three summary cards are interactive controls for the currently selected period:
  - `Receita` filters the cash-flow list to income transactions.
  - `Despesas` filters the list to expense transactions.
  - `Saldo Líquido` clears the type filter and restores all transactions for the selected month/year.
  - Clicking the active income/expense card toggles back to the unfiltered period.
- Active filter state is visible on the selected card and in the cash-flow header, with a clear-filter action when applicable.
- Month/year changes continue to fetch the selected period; card filtering stays local and must not add API calls.
- Print and CSV/PDF export behavior remains available and dashboard controls remain excluded from print where they are currently marked `no-print`.

The personal finance page will receive the same shell, form, list, and overflow treatment, but its existing data behavior will remain unchanged unless a mobile layout change requires restructuring.

## Route audit checklist

Each route will be checked for the following, with targeted markup changes where needed:

- `AdminDashboard`: metric cards, agenda/history rows, and responsive action regions.
- `AdminLeads`, `AdminComments`, `AdminBlog`, `AdminStories`: list/table conversion, filters, row actions, and dialogs.
- `AdminAppointments`, `AdminAttendanceDetail`: controls, timeline, calendar, modals, photos, odontogram, and clinical forms.
- `AdminFinance`, `AdminPersonalFinance`, `AdminAnalytics`: report order, summary behavior, chart sizing, filters, and tables.
- `AdminDocuments`, `AdminPrescription`, `AdminDigitalGuide`: editor sizing, side panels, dialogs, and print-only boundaries.
- `AdminTreatments`, `AdminUsers`, `AdminPatients`, `AdminSettings`: cards, forms, tabs, dialogs, and action buttons.
- `AdminLogin`: narrow viewport spacing and form control sizing.

## Technical boundaries

- Prefer existing Tailwind utilities, shared `Card`, `Button`, `Dialog`, `Select`, and form primitives.
- Add small shared utility classes in `src/index.css` only when several admin pages need the same behavior.
- Keep page-specific exceptions close to the page/component that owns the behavior.
- Avoid unrelated visual redesign, dependency additions, or API changes.
- Preserve existing print classes and route permissions.

## Verification

Before claiming completion:

- Run the project lint and production build.
- Inspect every admin route at 360px, 390px, 768px, and a desktop width.
- Confirm `document.documentElement.scrollWidth <= window.innerWidth` for normal page states, allowing horizontal scrolling only inside explicitly contained dense tools.
- Exercise the mobile drawer, page navigation, forms, dialogs, tabs, table/list actions, and long content scrolling.
- On finance, verify month/year changes, income filter, expense filter, reset behavior, and export/print controls.
- Check reduced-motion behavior and visible keyboard focus for the shared shell and key actions.
