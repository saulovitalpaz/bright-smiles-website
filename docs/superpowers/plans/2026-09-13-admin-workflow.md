# Admin workflow corrections

Goal: apply the requested clinical, document, financial, analytics and stock workflow corrections, then commit and push origin main.

Constraints: follow SECURITY.md; preserve user-owned files and construction documentation; no database migration or production data edits; retain private authorization and encrypted patient weight.

- [x] Consultations: collapse date filter, remove redundant details and upper actions, collapse patient card, normalize typography. Fix request fields so return scheduling succeeds; update cadastral weight atomically only from the latest clinical consultation, with server validation and a per-patient row lock.
- [x] Clinical maps: compact odontogram legend with labels only when expanded; replace skin recoloring with new female/male Black facial illustrations, accessible swatch-only controls.
- [x] Patients/prescriptions/documents: remove consent display and odontogram inclusion card, keep weight internal, share patient picker, constrain editor modal and normalize card typography.
- [x] Finance/analytics: monthly invoice dialog and CSV actions; public-page-only analytics and nearby regions within 200 km, nearest first and honest precision. Keep distinct provider coordinate estimates within the same city and use only nearby visits for regional percentages.
- [x] Stock: contain table scrolling within available width.
- [x] Verify frontend/backend suites, build, secret scan and diff check; review complete diff.

Delivery: commit only task files and push origin main as requested; preserve the user's untracked text file.

Validation: frontend suite 265 passing; backend suite 170 passing. Production build passes. Pattern-based secret scan and whitespace checks pass. Additional TypeScript check reports preexisting errors in untouched AdminBlog.tsx, AdminComments.tsx and PrescriptionGenerator.test.ts. Browser runtime timed out twice, so browser visual verification was unavailable. No schema migration or production data edits were needed.

Image assets: built-in image generation from existing fictional clinical charts; prompts request adult Black Brazilian female/male facial charts with light brown skin, natural features, neutral frontal pose, matched landmarks and white background. Saved to public/facial-chart-front-black.png and public/facial-chart-front-male-black.png.
