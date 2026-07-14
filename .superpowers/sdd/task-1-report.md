Status: DONE_WITH_CONCERNS

Commit SHA(s):
- e3b8e29 feat: add bucket-backed asset upload boundary

Files changed:
- server/index.js
- server/utils/assetStorage.js
- server/test/file-scheduling-patient-contract.test.js

Exact test commands and outputs:

1. Red verification before implementation

```powershell
node --test test/file-scheduling-patient-contract.test.js
```

```text
not ok 1 - general uploads use bucket storage and expose separate public/private delivery routes
  error: The input did not match the regular expression /require\(['"]\.\/utils\/assetStorage['"]\)/
not ok 2 - asset storage exports stable reference and signed URL helpers
  error: Cannot find module '../utils/assetStorage'
tests 2
pass 0
fail 2
```

2. Green verification for the new contract

```powershell
node --test test/file-scheduling-patient-contract.test.js
```

```text
ok 1 - general uploads use bucket storage and expose separate public/private delivery routes
ok 2 - asset storage exports stable reference and signed URL helpers
tests 2
pass 2
fail 0
```

3. Covering regression check

```powershell
node --test test/file-scheduling-patient-contract.test.js test/patient-workflow-contract.test.js
```

```text
ok 1 - general uploads use bucket storage and expose separate public/private delivery routes
ok 2 - asset storage exports stable reference and signed URL helpers
ok 3 - appointments can filter history by patient and completed requests are hidden
ok 4 - attendance navigation preserves the selected patient
ok 5 - lead attendance resolves patients by exact contact identity
ok 6 - patient schema and routes support safe updates and deletion protection
ok 7 - admin patients page is registered and exposed in the admin navigation
tests 7
pass 7
fail 0
```

4. Build verification

```powershell
npm run build
```

```text
> bright-smiles-server@1.0.0 build
> npx prisma generate

Prisma schema loaded from prisma\schema.prisma
✔ Generated Prisma Client (v5.22.0) to .\node_modules\@prisma\client in 166ms
```

Implementation summary:
- Replaced the general `/upload` route’s Cloudinary storage with authenticated Multer memory storage and a 25 MB limit.
- Added `server/utils/assetStorage.js` with stable `bucket://<scope>/<key>` references, S3-compatible upload/delete/signing helpers, and 300-second private URLs.
- Added `/assets` and `/clinical-assets` delivery routes with public/private scope enforcement.
- Kept existing patient-document upload/access behavior intact.

Concerns:
- Frontend callers still need follow-up wiring to send `scope=clinical` for clinical media and to consume `/clinical-assets` delivery paths where appropriate.
- Some existing frontend upload flows appear to rely on auth patterns outside this task’s boundary; this backend work preserves the current server-side session middleware but does not reconcile those client flows.
