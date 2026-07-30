# Portal security hardening implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate public clinical/admin exposure and establish durable authentication, data protection and operational controls.

**Architecture:** Express authorization is centralized and attached explicitly to every non-public route. Browser sessions migrate to same-site HttpOnly cookies with Origin enforcement. Database encryption migration and Prisma migrations are separate, reversible rollout tasks protected by backups and staging checks.

**Tech Stack:** Express 4, Prisma 5/PostgreSQL 17, React/Vite, Node test runner, Zod, Cloudflare/Railway.

## Global constraints

- Default deny for protected data. A route is public only when listed in the design.
- Do not log secrets, PII, request bodies or signed URLs.
- Every route or session behavior change has a regression test before implementation.
- Do not run destructive migrations or remove the PostgreSQL public proxy until a verified encrypted backup and restore drill exist.

---

### Task 1: Secure server foundations and the authorization matrix

**Files:** `server/index.js`, `server/middleware/auditLogger.js`, `server/test/security-foundations.test.js`.

- [ ] Write failing tests proving anonymous `GET /appointments`, `GET /patients/:cpf`, prescription, dashboard, analytics, template and finance routes are denied; prove roles only receive permitted routes.
- [ ] Add exact `authenticateToken` and `authorizeRole` guards to each protected route, remove duplicate lead declarations, return generic errors, restrict CORS to production/local origins, add security headers, login rate limits and Origin checks for mutations.
- [ ] Replace body logging with post-response metadata-only audit events and validate trusted proxy IP handling.
- [ ] Run `node --test server/test/*.test.js`; manually verify public website routes remain public.
- [ ] Commit `fix: enforce API authorization boundaries`.

### Task 2: Secret, error and deployment safety

**Files:** `server/index.js`, `server/utils/encryption.js`, `server/package.json`, `docker-compose.yml`, `server/test/security-configuration.test.js`.

- [ ] Write tests for missing/weak production secrets, generic error payloads and no application-time `prisma db push`.
- [ ] Fail closed for weak/missing production secrets, remove source-controlled connection values, ensure health output is non-sensitive, and change startup to apply reviewed Prisma migrations rather than schema push.
- [ ] Run the server test suite and production-like startup configuration check.
- [ ] Commit `fix: fail closed for production security configuration`.

### Task 3: Browser session migration

**Files:** `server/index.js`, `src/lib/api.ts`, `src/hooks/useAuth.tsx`, relevant auth tests.

- [ ] Write failing tests for HttpOnly cookie login/logout, CSRF Origin enforcement and stale-session recovery.
- [ ] Issue same-site secure cookies from the custom API domain; remove token persistence from localStorage; send credentialed requests and refresh UI user state safely.
- [ ] Verify login, patient search, appointment creation, finance and logout against Railway staging/production after deployment.
- [ ] Commit `fix: migrate admin session to secure cookies`.

### Task 4: Sensitive data, uploads and HTML boundaries

**Files:** Prisma schema/migrations, `server/utils/encryption.js`, upload routes, rich text components, tests.

- [ ] Write failing tests for random encrypted CPF storage plus blind lookup, malformed encrypted data rejection, file signatures, document authorization and HTML sanitization.
- [ ] Add HMAC blind index with backfill migration, random authenticated encryption, byte-level file validation and sanitization at persistence/render boundaries.
- [ ] Run migration on staging copy, execute restore drill, then deploy with monitored verification.
- [ ] Commit `fix: harden sensitive data and content handling`.

### Task 5: Continuous controls and verified cleanup

**Files:** `AGENTS.md`, `SECURITY.md`, CI workflow, legacy backup workflow/script after successful R2 verification.

- [ ] Add permanent secure-change rules, dependency/secret scan and authorization test commands.
- [ ] After a successful `database-backup` manual run and temporary restore drill, remove the plaintext GitHub backup and public PostgreSQL TCP proxy.
- [ ] Run full tests, build, secret scan and `git diff --check`; preserve construction documentation and user assets.
- [ ] Commit `chore: enforce ongoing portal security controls`.
