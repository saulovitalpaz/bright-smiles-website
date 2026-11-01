# Treatment plan printing correction

The treatment-plan page now uses the shared clinic header and A4 print-root contract, including the clinic's configured address, phone and registration. Printing reloads the plan and clinic details, waits for fonts and logo, and clears the print snapshot after printing. Failed refreshes do not print stale amounts.

The printed document shows quoted and authorized values separately, clinical completion, unapproved procedures, discounts, total received, outstanding authorized balance and receipt date/method/amount. A fully paid authorized subset is labelled as settled without implying that the unapproved items were paid.

The page includes an optional compact odontogram before the procedure table. It reuses the existing anatomical drawings, marks teeth referenced by plan items and omits the detailed clinical list and occlusal drawings only in this print reference. The normal consultation odontogram remains unchanged.

Validation used synthetic fixtures only:

- Full frontend suite: 345 tests passed before the final compact-reference addition; final targeted printing/odontogram suite: 28 tests passed, including the new optional-reference regression.
- Backend suite: 230 passed, two optional tests skipped; no backend or database changes in this correction.
- TypeScript, scoped ESLint, production build and changed-file secret scan passed.
- Real Edge-generated A4 PDFs rendered and inspected: partial payment and settled short plans each fit on one page with the reference chart. A 45-item long description fixture paginated across five pages with repeating table headers and no blank pages.
- The new print stylesheet uses the shared default A4 page dimensions to avoid a blank first page caused by switching named pages within the admin layout.
