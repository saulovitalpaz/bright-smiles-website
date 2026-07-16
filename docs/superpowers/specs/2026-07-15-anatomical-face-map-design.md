# Anatomical Facial Application Map — Design Specification

## Goal

Replace the faceted mask in the harmonization appointment flow with a calm, recognizably human frontal face. The map must remain clinically legible, mobile-first, keyboard accessible, and fully compatible with historical `facialNotes` JSON.

## Data compatibility

The public component contract remains `data`, `onChange`, and `readOnly`, with one optional presentation-only `compact` flag. The persisted region IDs remain exactly:

`frontal`, `glabela`, `periorbital`, `malar`, `nasolabial`, `labios`, `mento`, `mandibula`, `pescoço`.

Bilaterally rendered regions still write one shared record. Updates merge into the existing object so unknown historical keys are preserved. No API, Prisma, or database migration is allowed.

## Visual anatomy

Use a local inline SVG, not a fetched image, raster, or canvas. The base is a neutral frontal adult face with:

- a continuous organic cranium, temples, cheeks, jaw and chin;
- softly modeled ears and neck;
- understated brows, eyes, nose, philtrum and lips as non-interactive landmarks;
- a warm ivory skin gradient and restrained shadows/highlights;
- no polygonal planes, mask facets, pulse animation, or artificial 3D chrome.

Each clinical region is an organic translucent overlay aligned to the visible landmark. Bilateral regions use multiple paths inside one interactive group. Empty, completed, selected, hover and focus states use color plus outline, not color alone.

## Interaction

- The SVG region and its matching text control select the same canonical ID.
- Interactive SVG groups expose `role="button"`, `tabIndex`, `aria-label`, `aria-pressed`, Enter and Space.
- Invisible hit paths enlarge small areas without changing the visible anatomy.
- Touch controls are at least 44 px and use `touch-action: manipulation`.
- A region containing product, dose, or notes is treated as filled everywhere.
- Editable selection opens a responsive detail dialog with associated labels and a one-column mobile form that becomes two columns only when space permits.
- Read-only mode never calls `onChange`, does not expose editing controls, and renders a textual clinical summary.

## Responsive behavior

The card and SVG always use `min-width: 0` and `max-width: 100%`. The SVG scales fluidly without horizontal page scrolling. Region controls use one column on narrow phones, two columns when space permits, and a side rail only on wide cards. The timeline uses `compact` presentation instead of transform scaling or negative margins.

## Verification

Tests must cover the exact nine IDs, bilateral selection, keyboard selection, immutable updates, notes-only filled state, read-only zero-callback behavior, mobile-safe structural classes, and the compact timeline consumer. The production build, focused lint, responsive contract script, and full Vitest suite must pass before push.
