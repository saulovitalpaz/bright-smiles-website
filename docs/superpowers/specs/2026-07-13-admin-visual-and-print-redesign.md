# Admin Visual and Print Redesign

## Context

The authenticated admin pages currently mix several spacing systems, card styles, and shell dimensions. The fixed sidebar is oversized on some screens and the mobile drawer can compete with the content. Cards and navigation have limited motion feedback. Printed documents and PDFs also use page-specific margins, which produces inconsistent page density and poor use of A4 paper.

## Goals

1. Give every authenticated page a cohesive warm-modern clinic visual language.
2. Make the sidebar and content frame predictable at desktop, tablet, and mobile widths.
3. Add subtle, accessible motion to cards, navigation, and common interactive surfaces.
4. Make browser print output and generated PDFs use intentional A4 dimensions with two supported density modes.
5. Preserve existing routes, permissions, data fetching, and document content while improving presentation.

## Non-goals

- Replacing the component library or routing system.
- Changing backend APIs, authentication, or patient/appointment data models.
- Adding a receipt printer format in this iteration.
- Introducing a new brand logo or image asset.

## Visual direction

Use the approved warm-modern direction: cream and warm-gray page surfaces, deep espresso navigation, muted gold accents, soft borders, and restrained shadows. Keep Playfair Display for headings and Inter for interface text. Cards use 16px radius and a single shared surface treatment. Keep contrast accessible and avoid gold as the only status indicator.

## Admin shell

- Desktop expanded sidebar: 248px fixed width; collapsed rail: 76px.
- Main content uses a matching left offset and a max-width container so the shell never shifts when navigation changes.
- Mobile uses a fixed 64px top bar and a drawer capped at 320px (or 86vw), with backdrop, close control, and body scroll lock while open.
- Navigation items keep 44px minimum touch height, clear active state, and consistent nested-item indentation.
- Header contains page title/context, optional breadcrumb, and actions that wrap instead of overflowing.
- Shell chrome is marked `.no-print` and is removed from all print modes.

## Motion and responsive rules

- Shared `.admin-card` transition: 180–220ms for transform, shadow, and border color; hover lift is no more than 2px.
- Shared interactive controls use the same duration/easing and visible focus ring.
- Add `@media (prefers-reduced-motion: reduce)` to disable transforms and shorten transitions.
- Responsive grids use explicit breakpoints and preserve readable minimum widths; tables gain horizontal scrolling rather than shrinking text below legibility.
- Avoid route-level animation that delays primary actions or causes content jumps.

## Print and PDF modes

Expose two named modes from shared print tokens:

### Formal A4 (`clinic`)

- `@page { size: A4; margin: 14mm 14mm 16mm; }`.
- Content width is the printable A4 area (182mm) with consistent header/footer spacing.
- Use readable body text, generous section spacing, and `break-inside: avoid` for patient blocks, signature blocks, and cards.
- Intended for prescriptions, signed terms, official documents, and patient-facing records.

### Compact A4 (`compact`)

- `@page { size: A4; margin: 9mm; }`.
- Reduce section gaps and table cell padding while keeping body text at a readable minimum.
- Repeat table headers and allow long histories to flow across pages without clipped content.
- Intended for internal reports and long treatment histories.

Browser print output will use shared classes (`print-document`, `print-clinic`, `print-compact`) and a common print stylesheet. The app shell, controls, inputs, shadows, and background decorations are hidden/reset. Existing page-specific print rules are consolidated so margins and page-break behavior are not overridden unpredictably.

React-PDF documents will accept a `mode` prop and use the same semantic token names for page padding, typography, table spacing, and section gaps. Existing download buttons keep their filenames and loading states.

### Mode selection

Formal document screens default to `clinic`; long-history/report screens default to `compact`. Where a page offers both print/download actions, add a small accessible mode selector next to the action so staff can override the default without changing document content. The selected mode is passed to both `window.print()` preview classes and the React-PDF document component.

## Affected areas

- `src/components/admin/AdminLayout.tsx`: shell sizing, mobile drawer behavior, active navigation, and shared header classes.
- `src/index.css`: warm-modern tokens, admin utility classes, reduced-motion rules, and centralized print styles.
- Authenticated pages under `src/pages/Admin*.tsx`: replace ad hoc card/layout classes with shared primitives where needed, and assign the correct print mode.
- `src/components/PrescriptionGenerator.tsx` and `src/components/admin/FinanceReportPDF.tsx`: add formal/compact mode tokens and page-break-safe sections.
- Document/prescription print previews: remove duplicated inline `@media print` blocks and use shared print classes.

## Acceptance criteria

- At 1440px, the expanded sidebar is 248px and the main content aligns without overlap; collapsed rail is 76px.
- At 390px, the drawer fits within the viewport, can be opened/closed without horizontal scrolling, and locks body scroll while open.
- Representative dashboard, appointments, patients, documents, prescription, finance, and settings pages share card radius, border, spacing, and hover/focus behavior.
- Reduced-motion users receive no transform-based card movement.
- Browser print preview for a formal document uses A4 with 14mm/14mm/16mm margins and no admin chrome.
- Browser print preview for a compact report uses A4 with 9mm margins and denser rows.
- Generated prescription and finance PDFs remain valid A4 PDFs and support both modes without clipped text or tables.
- Existing routes, permissions, and data behavior remain unchanged.

## Verification approach

- Run typecheck/build and relevant tests.
- Use the browser companion or local preview at desktop and mobile widths to inspect shell geometry and card behavior.
- Render representative formal and compact print pages to PDF and inspect page margins, overflow, page breaks, and repeated table headers.
- Verify reduced-motion CSS and keyboard focus states in source and browser inspection.
