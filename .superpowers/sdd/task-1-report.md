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

Task 1 review fixes:
- Corrected the reviewed implementation SHA in this report to `e3b8e29`.
- Expanded `server/test/file-scheduling-patient-contract.test.js` with runtime-focused contract coverage for reference parsing, scope validation, encoded delivery path generation, delivery-route boundary validation, and cleanup-on-failure behavior.
- Extracted the pure delivery validation/path logic into `server/utils/assetStorage.js` and routed `/assets` plus `/clinical-assets` through it so the contract is testable without a live bucket or database-backed app import.

5. Red verification for the focused runtime coverage

```powershell
node --test test/file-scheduling-patient-contract.test.js
```

```text
TAP version 13
# Subtest: general uploads use bucket storage and expose separate public/private delivery routes
ok 1 - general uploads use bucket storage and expose separate public/private delivery routes
# Subtest: asset storage exports stable reference and signed URL helpers
ok 2 - asset storage exports stable reference and signed URL helpers
# Subtest: asset storage parses stable bucket references and rejects malformed ones
ok 3 - asset storage parses stable bucket references and rejects malformed ones
# Subtest: asset storage generates stable encoded delivery paths
not ok 4 - asset storage generates stable encoded delivery paths
  error: 'storage.createAssetDeliveryPath is not a function'
# Subtest: asset storage validates delivery requests at the route boundary
not ok 5 - asset storage validates delivery requests at the route boundary
  error: 'storage.validateAssetDeliveryRequest is not a function'
# Subtest: asset storage cleanup helper deletes uploaded assets when response construction fails
not ok 6 - asset storage cleanup helper deletes uploaded assets when response construction fails
  error: 'storage.withAssetUploadCleanup is not a function'
1..6
# tests 6
# pass 3
# fail 3
```

6. Green verification for the focused runtime coverage

```powershell
node --test test/file-scheduling-patient-contract.test.js
```

```text
TAP version 13
# Subtest: general uploads use bucket storage and expose separate public/private delivery routes
ok 1 - general uploads use bucket storage and expose separate public/private delivery routes
# Subtest: asset storage exports stable reference and signed URL helpers
ok 2 - asset storage exports stable reference and signed URL helpers
# Subtest: asset storage parses stable bucket references and rejects malformed ones
ok 3 - asset storage parses stable bucket references and rejects malformed ones
# Subtest: asset storage generates stable encoded delivery paths
ok 4 - asset storage generates stable encoded delivery paths
# Subtest: asset storage validates delivery requests at the route boundary
ok 5 - asset storage validates delivery requests at the route boundary
# Subtest: asset storage cleanup helper deletes uploaded assets when response construction fails
ok 6 - asset storage cleanup helper deletes uploaded assets when response construction fails
1..6
# tests 6
# pass 6
# fail 0
```

7. Required regression verification

```powershell
node --test server/test/file-scheduling-patient-contract.test.js server/test/patient-workflow-contract.test.js
```

```text
TAP version 13
# Subtest: general uploads use bucket storage and expose separate public/private delivery routes
ok 1 - general uploads use bucket storage and expose separate public/private delivery routes
# Subtest: asset storage exports stable reference and signed URL helpers
ok 2 - asset storage exports stable reference and signed URL helpers
# Subtest: asset storage parses stable bucket references and rejects malformed ones
ok 3 - asset storage parses stable bucket references and rejects malformed ones
# Subtest: asset storage generates stable encoded delivery paths
ok 4 - asset storage generates stable encoded delivery paths
# Subtest: asset storage validates delivery requests at the route boundary
ok 5 - asset storage validates delivery requests at the route boundary
# Subtest: asset storage cleanup helper deletes uploaded assets when response construction fails
ok 6 - asset storage cleanup helper deletes uploaded assets when response construction fails
# Subtest: appointments can filter history by patient and completed requests are hidden
ok 7 - appointments can filter history by patient and completed requests are hidden
# Subtest: attendance navigation preserves the selected patient
ok 8 - attendance navigation preserves the selected patient
# Subtest: lead attendance resolves patients by exact contact identity
ok 9 - lead attendance resolves patients by exact contact identity
# Subtest: patient schema and routes support safe updates and deletion protection
ok 10 - patient schema and routes support safe updates and deletion protection
# Subtest: admin patients page is registered and exposed in the admin navigation
ok 11 - admin patients page is registered and exposed in the admin navigation
1..11
# tests 11
# pass 11
# fail 0
```

8. Required build verification

```powershell
npm run build
```

```text
> bright-smiles-server@1.0.0 build
> npx prisma generate

Prisma schema loaded from prisma\schema.prisma

✔ Generated Prisma Client (v5.22.0) to .\node_modules\@prisma\client in 160ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Interested in query caching in just a few lines of code? Try Accelerate today! https://pris.ly/tip-3-accelerate
```
