# Clinical Document Printing and Signature — Implementation Plan

1. Add failing backend and frontend source contracts for user signature profile, standardized A4 controls, page flow and odontogram propagation.
2. Add `User.signatureUrl`, authenticated current-user update API, and professional profile settings/upload.
3. Replace document format selectors with the signature inclusion control and logged-professional identity.
4. Add browser-print signature blocks, flowing pagination rules and an undistorted printable odontogram.
5. Add signature image/text and anatomical odontogram sections to the React-PDF prescription; remove the random hash.
6. Run frontend/server tests, print contracts, lint, build, independent review, commit and final push to `main`.
