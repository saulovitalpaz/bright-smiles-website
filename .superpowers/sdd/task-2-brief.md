### Task 2: Protect clinical media and repair document delivery

**Files:**
- Create: `src/lib/media.ts`
- Modify: `src/components/admin/attendance/PhotoGallery.tsx`
- Modify: `src/components/admin/attendance/EvolutionTimeline.tsx`
- Modify: `src/pages/AdminDocuments.tsx`
- Modify: `server/index.js:1285-1335`
- Modify: `server/test/file-scheduling-patient-contract.test.js`

**Interfaces:**
- `mediaUrl(value: string | null | undefined) -> string | null` resolves local paths, API-relative paths, and absolute URLs.
- `loadProtectedAsset(value: string) -> Promise<string>` fetches a private API path with `fetchClient`, converts the response to a blob URL, and throws the server’s error message on failure.
- Clinical appointment `photos` remain stable `bucket://clinical/...` references in persistence; the server may resolve them to short-lived URLs in authenticated appointment responses.

- [ ] **Step 1: Add failing source contracts for privacy and document fallback.**

Append tests:

```js
test('clinical photo uploads use the private scope and documents expose legacy pdfUrl', () => {
    const gallery = fs.readFileSync(path.join(repoRoot, 'src/components/admin/attendance/PhotoGallery.tsx'), 'utf8');
    const indexSource = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    assert.match(gallery, /scope.*clinical|clinical.*scope/);
    assert.match(indexSource, /fileUrl:.*storageKey.*pdfUrl/);
    assert.match(indexSource, /clinical-assets/);
});
```

Run `node --test test/file-scheduling-patient-contract.test.js`; expected: FAIL until the consumers and fallback are updated.

- [ ] **Step 2: Implement `src/lib/media.ts`.**

Use this behavior:

```ts
export const mediaUrl = (value?: string | null) => {
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/images/')) return value;
    return `${API_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

export const loadProtectedAsset = async (value: string) => {
    const response = await fetchClient(value);
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Não foi possível carregar o arquivo clínico.');
    }
    return URL.createObjectURL(await response.blob());
};
```

Track and revoke object URLs in `useEffect` cleanup in components that render private photos.

- [ ] **Step 3: Store clinical references and resolve them only for logged-in display.**

In `PhotoGallery`, append `scope=clinical` to the upload `FormData`, persist `data.reference` through `onChange`, and keep the response `url` in a local preview map until the appointment is reloaded. Render local preview URLs for newly uploaded files and call `loadProtectedAsset(mediaUrl(photo) || photo)` for persisted clinical references. Leave legacy absolute photo URLs readable.

In `EvolutionTimeline`, resolve each stored clinical reference through the same loader before rendering expanded comparison photos. Show a small error placeholder for failed individual images instead of failing the entire timeline.

- [ ] **Step 4: Make patient document URLs consistent.**

Change the document list response to:

```js
fileUrl: doc.storageKey
    ? `/patient-documents/${doc.id}/file`
    : doc.pdfUrl || null
```

In `AdminDocuments`, use `mediaUrl(doc.fileUrl || doc.pdfUrl)` for links and surface the API response body in upload errors. Keep the upload endpoint authenticated and accept only `application/pdf`.

- [ ] **Step 5: Run tests and build the frontend.**

```powershell
node --test server/test/file-scheduling-patient-contract.test.js
npm run build
```

Expected: contract tests pass and Vite exits with code 0.

- [ ] **Step 6: Commit clinical media changes.**

```powershell
git add src/lib/media.ts src/components/admin/attendance/PhotoGallery.tsx src/components/admin/attendance/EvolutionTimeline.tsx src/pages/AdminDocuments.tsx server/index.js server/test/file-scheduling-patient-contract.test.js
git commit -m "fix: protect clinical uploads and repair document URLs"
```

