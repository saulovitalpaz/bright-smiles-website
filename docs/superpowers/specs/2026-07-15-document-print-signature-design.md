# Clinical Document Printing and Professional Signature — Design Specification

## Goal

Make browser printing and exported prescription PDFs reliable A4 clinical documents. Professional identity must come from the logged-in user, odontograms must remain centered and undistorted, and an uploaded signature image may be included without overlapping text or page boundaries.

## Professional profile

Add optional `signatureUrl` to `User`. An authenticated `PATCH /users/me` updates only the current user's name, CRO and signature URL and never accepts role, username or password changes. Login continues returning the password-free user including `signatureUrl`.

The settings page gains a professional signature card with name, CRO, image preview and public image upload. A successful save updates `admin_user` in local storage so document pages use the current identity without another login.

## Document controls

Remove the clinical/compact selector from the Documents and Prescription pages. Both use one standardized A4 clinical layout. Replace that control with `Inserir assinatura`, enabled when the logged professional has an uploaded signature image.

Name and CRO always appear in printed/exported professional identification. When `Inserir assinatura` is enabled, the block also shows the uploaded image and the exact text `Assinado eletronicamente por: <nome> - <CRO>`. No random hash or claim of ICP-Brasil certification is generated.

## Page flow

- Use A4 margins from the shared print stylesheet.
- Headers, patient blocks, odontogram visual and signature blocks avoid internal page breaks.
- Long document/prescription text remains breakable and wraps unbounded content.
- Signature is normal flow content at the end, never `position: fixed`; if insufficient room remains, the complete block moves to the next page.
- Borders and backgrounds are print-safe, with no application chrome or shadows.

## Odontogram

Browser print renders the read-only odontogram at full document width with no CSS transform, negative margin, sideways offset or horizontal scrolling. Print CSS forces a stable 16-column arch and light clinical colors.

The React-PDF prescription receives the same odontogram data. It renders local anatomical tooth geometry in two centered 16-tooth arches plus a textual summary of recorded whole-tooth and face conditions. The odontogram section is non-splitting and moves as a unit when necessary.

## Verification

Tests and source contracts cover current-user profile persistence, signature text/image inclusion, absence of fake hashes and print transforms, A4 page-flow classes, multipage PDF rendering, odontogram data propagation, and the authenticated profile endpoint. Frontend tests, feature-focused server tests, lint, build and independent code review must pass before push; any unrelated baseline failure must be reproduced against `origin/main` and documented rather than hidden.
