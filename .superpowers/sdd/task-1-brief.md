# Task 1: Establish the bucket asset layer

You own only the bucket asset boundary for this task. You are not alone in the codebase: do not revert existing changes, and keep the implementation compatible with the existing patient-document storage and auth behavior.

## Files

- Create `server/utils/assetStorage.js`.
- Modify `server/index.js` around the current Cloudinary storage and `/upload` route.
- Create or extend `server/test/file-scheduling-patient-contract.test.js`.

## Global constraints

- Public uploads (blog, treatments, stories, and logo) use the configured bucket and public delivery.
- Clinical photos and patient PDFs are private and require an authenticated staff session.
- Database records store bucket references or stable API paths, never expiring signed URLs.
- Preserve existing authentication, route permissions, legacy media URLs, and patient-document behavior.
- Do not add a drag-and-drop calendar, reminders, or unrelated refactoring.

## Interfaces

Produce:

- `uploadAsset({ scope, body, contentType, extension, ownerId }) -> Promise<{ reference, deliveryPath, contentType }>`.
- `isAssetReference(value) -> boolean`.
- `parseAssetReference(value) -> { scope, key } | null`.
- `createPublicAssetUrl(reference) -> Promise<string>`.
- `createPrivateAssetUrl(reference) -> Promise<string>`.

Use stable references shaped as `bucket://<scope>/<key>`. Use the existing environment aliases from `server/utils/patientDocumentStorage.js`: `BUCKET_ENDPOINT`, `BUCKET_REGION`, `BUCKET_NAME`, `BUCKET_ACCESS_KEY_ID`, and `BUCKET_SECRET_ACCESS_KEY`, with the existing fallback aliases. Use S3-compatible `PutObjectCommand`, `DeleteObjectCommand`, `GetObjectCommand`, and `getSignedUrl`; private signed URLs expire after 300 seconds.

## Required behavior

1. Replace the general Cloudinary-backed `/upload` route with authenticated Multer memory storage. Keep the existing supported image/video/PDF formats and a 25 MB limit.
2. Read `req.body.scope`, default to `public`, and accept only `public` or `clinical`.
3. Store public keys under a public prefix and clinical keys under a private prefix. Return `{ reference, url }`, with the URL being a stable API delivery path, not an expiring signed URL.
4. Add query-based delivery routes because a full `bucket://...` reference contains slashes:
   - `GET /assets?reference=<encoded-reference>` accepts only `bucket://public/...` and does not require auth.
   - `GET /clinical-assets?reference=<encoded-reference>` requires `authenticateToken` and accepts only `bucket://clinical/...`.
5. Public delivery may use the configured bucket public URL or a signed redirect for public references. Clinical delivery must use a 300-second signed redirect.
6. Reject malformed references and wrong scopes with 400/403. Missing bucket configuration must produce a clear error naming the required configuration without leaking credentials.
7. Delete the bucket object if upload succeeds but response construction fails.

## Failing tests to add first

```js
test('general uploads use bucket storage and expose separate public/private delivery routes', () => {
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    assert.match(source, /require\(['"]\.\/utils\/assetStorage['"]\)/);
    assert.match(source, /app\.post\(['"]\/upload['"]/);
    assert.match(source, /app\.get\(['"]\/assets/);
    assert.match(source, /app\.get\(['"]\/clinical-assets/);
    assert.match(source, /authenticateToken/);
    assert.doesNotMatch(
        source.slice(source.indexOf("app.post('/upload'"), source.indexOf("app.post('/patient-documents")),
        /CloudinaryStorage/
    );
});

test('asset storage exports stable reference and signed URL helpers', () => {
    const storage = require('../utils/assetStorage');
    assert.equal(typeof storage.uploadAsset, 'function');
    assert.equal(typeof storage.createPublicAssetUrl, 'function');
    assert.equal(typeof storage.createPrivateAssetUrl, 'function');
    assert.equal(storage.isAssetReference('bucket://clinical/appointments/1/a.jpg'), true);
    assert.equal(storage.isAssetReference('/images/logo-oficial.png'), false);
});
```

Run from `server/` before implementation:

```powershell
node --test test/file-scheduling-patient-contract.test.js
```

The new tests must fail for the missing utility/routes, then pass after the implementation. Run the relevant tests again after the code, and run `npm run build` from `server/` if Prisma/client imports require it.

## Report contract

Write your report to `.superpowers/sdd/task-1-report.md`. Include status (`DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`, or `BLOCKED`), commit SHA(s), exact test commands and outputs, files changed, and any concerns. Commit the implementation yourself. Do not modify the approved design or implementation plan.
