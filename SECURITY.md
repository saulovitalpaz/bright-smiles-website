# Security requirements

Security takes precedence over convenience and backward compatibility in every future change.

- Treat patient, prescription, financial, authentication and storage data as sensitive by default.
- New API routes are private unless explicitly documented as public, tested for anonymous denial and assigned least-privilege roles.
- Never add credentials, connection strings, encryption keys, tokens, dumps, patient data or signed URLs to source control, logs, tests or chat.
- Preserve encryption-key compatibility with existing data. Any key rotation requires a tested, backed-up migration and explicit approval.
- Use HttpOnly secure cookies for browser sessions; do not store reusable access tokens in localStorage.
- Validate input, upload bytes and authorization server-side. Sanitize rich HTML before storage or rendering.
- Before deploy, run backend and frontend tests, build, secret scan and `git diff --check`. Verify backup and restore after database/security changes.
- Remove public database access and legacy backup paths only after the replacement is verified.
