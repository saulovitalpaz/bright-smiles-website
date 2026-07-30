# Portal security hardening design

## Status

Approved by the owner on 2026-07-29 for maximum security, with continuity of clinical operations as the constraint.

## Objective

Protect patient, appointment, prescription, financial and administrative data through deny-by-default API authorization, secure sessions, safe input/output handling, secret management and a recoverable database.

## Decisions

1. Public API surface is limited to website content, public settings, lead/testimonial submission, analytics collection and health. Every clinical, financial, administrative or mutation endpoint requires explicit authentication and role authorization.
2. Roles are least-privilege: `admin` manages users/content/settings; `dentist` and `admin` manage clinical records; `manager` and `admin` manage finance, leads, analytics and testimonial moderation. The implementation must retain existing roles rather than inventing implicit access.
3. The frontend transitions from localStorage bearer persistence to secure, same-site HttpOnly authentication cookies on `api.odontoeharmonizacao.com.br`, with Origin validation for state-changing requests. The existing bearer path remains only during an explicit, short migration window and is removed once all deployed clients use cookie sessions.
4. Production startup fails closed when `JWT_SECRET` or `ENCRYPTION_KEY` are absent, default, or weak. Old values are rotated outside source control.
5. Patient values use authenticated encryption with random IVs and a blind HMAC index for exact CPF lookup. Data migration is explicit, idempotent, tested against a staging copy, and never uses `db push` at application startup.
6. Rich HTML is sanitized at the server boundary and encoded on rendering. Uploads validate file bytes as well as media types, have small type-specific limits and serve clinical documents only through authorized signed links.
7. Logs and audit records contain actor, operation, resource identifier, result and trusted proxy IP only; never request bodies, passwords, tokens, CPF, prescriptions, financial descriptions or URLs with signed credentials.
8. Security is a permanent release criterion. `AGENTS.md` and `SECURITY.md` require threat review, authorization tests, secret scans, dependency review and backup/restore verification for future edits.

## Delivery order

1. Immediate: route access control, CORS/headers/rate limits, safe logging/errors, secrets and public-data filters.
2. Session and browser migration: HttpOnly cookie, CSRF/Origin enforcement, frontend token removal.
3. Sensitive-data migration, upload/content sanitization and operational database migration discipline.
4. Continuous controls, cleanup, public Postgres proxy removal only after the encrypted backup succeeds and a restore drill passes.

## Acceptance criteria

- Anonymous requests to protected data and mutations receive `401`; insufficient roles receive `403` with no sensitive response.
- Invalid/stale credentials yield `401`, allowing the frontend to end the session rather than appearing as a data outage.
- No tracked secret or fallback production secret exists; error payloads and audit logs do not expose PII.
- The public website continues to load only approved/current public content.
- CI covers authorization matrix, session/CSRF behavior, encryption migration and the backup suite.
