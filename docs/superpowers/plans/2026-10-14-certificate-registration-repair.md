# Certificate registration repair

**Goal:** Register valid personal A1 certificates without manual CPF transcription, explain each rejection, and preserve safe retry state.

**Architecture:** Keep the authenticated API, encrypted per-user vault and isolated Python validator. Extract and validate the CPF from the signed certificate; support optional CPF assertions from older clients. No new database column or encryption key is needed. Preserve name/CRO ownership, chain, policy, expiry and revocation checks.

## Evidence and scope

- The initial 403 is account reauthentication, before certificate inspection.
- The subsequent generic 400 combines CPF, password presence/length and ASN.1 envelope failures.
- A synthetic valid BER PFX is accepted by the real cryptographic worker but rejected by the API's DER-only envelope check. RFC 7292 section 4 allows BER.
- The browser clears every field on failure and background focus refresh erases the submitted error.
- Professional identity can be edited above the certificate form but is only saved by the distant global settings button.
- Production CLI authentication is expired. Read-only inspection of the user-provided PFX confirmed a 9,224-byte indefinite BER envelope rejected by the old preflight. Strict parsing and in-memory canonicalization preserve encrypted content and MAC. Its password and successful production activation have not been tested.

## Implementation and verification

- [x] Add failing API/worker tests for valid BER PFX, malformed/trailing content, automatic CPF extraction, explicit mismatches, identity errors, and profile changes during inspection.
- [x] Update `server/utils/certificateVault.js` preflight and enforce strict PKCS#12 parsing in `server/signing/certificates.py`. Keep the original encrypted content intact; canonicalize BER wrappers only in memory for the cryptography reader.
- [x] Make CPF optional in `server/routes/digitalSigning.js`; missing CPF is extracted and validated by the worker, supplied CPF must match. Map actionable worker/profile errors and return only current-user professional summary.
- [x] Add UI regression tests for no CPF entry, correct password guidance, safe retries, focus refresh, and saving professional identity independently.
- [x] Update `DigitalCertificateSettings.tsx`, `AdminSettings.tsx` and error mappings. Clear secrets after submission; retain only the selected file on failure until reset/unmount. Preserve explicit errors during background refresh.
- [x] Run all frontend/backend tests, real Node/Python cryptographic integration, production build, changed-secret scan and `git diff --check`. Review security and compatibility, including legacy vault credentials with CPF.
- [ ] Document findings and remaining real-environment evidence. Commit and push `main` to `origin` after verification. Verify deployment if authenticated access is restored; never claim real-certificate activation from synthetic tests.

## Design choice

Adding a separate CPF profile field would duplicate sensitive information and require migration and restore checks. Reading it from the certificate removes the transcription/autofill failure while preserving independent profile-name checks. Existing clients can continue supplying CPF. No trust or ownership checks are bypassed to make a certificate pass.

Reference: https://www.rfc-editor.org/rfc/rfc7292.html#section-4

## Verification evidence

- Full suites: 217 backend tests (including real isolated-worker integration), 326 frontend tests; subsequent review regressions verified in the affected 29 frontend and 40 signing API tests.
- Python: 13 tests passed, including synthetic legacy BER/RC2/SHA-1 import and revocation rejection.
- TypeScript check, affected-component ESLint, production build and changed-file secret scan passed.
- Browser smoke passed at 1440px and 390px with synthetic API data: profile save, automatic CPF, cleared passwords, retained upload selection, error recovery and no horizontal overflow.
- Independent read-only review reported no critical/important issues; both minor state-recovery findings were fixed and regression-tested.
- No database migration, vault-key rotation, real-certificate upload, or production data mutation was performed during these tests.
