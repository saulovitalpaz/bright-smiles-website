# Secure Upload Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put every future public, clinical, financial, and patient-PDF upload in the Railway Bucket with a stable reference, correct permissions, binary validation, and reliable sequential attendance uploads.

**Architecture:** The existing bucket gains the `financial` logical scope beside `public` and `clinical`. The server validates content signatures before storage and exposes a dedicated protected receipt route. Existing URLs are read unchanged.

**Tech Stack:** Express, Multer, AWS SDK S3, Prisma, React/TypeScript, Node test runner, Vite.

## Global Constraints

- Keep all existing Cloudinary URLs, `/images` paths, legacy patient `pdfUrl` values, and existing bucket references readable.
- Never log credentials, signed URLs, filenames, or patient identifiers.
- Scope permissions: public is unauthenticated; clinical is admin/dentist; financial is admin/manager.
- Do not delete existing objects during deployment.
- Do not touch unrelated work except the already requested deletion of `.github/workflows/db-backup.yml`.

## File Structure

- `server/utils/uploadValidation.js`: binary magic-byte checks and permitted MIME/scope matrix.
- `server/utils/assetStorage.js`: adds `financial` reference parsing, prefix, delivery path, and signed URL generation.
- `server/index.js`: validates general uploads, exposes financial upload/delivery endpoints, and cleans replaced patient PDFs after the database update.
- `src/lib/media.ts`: converts `bucket://financial/...` to the private API delivery route while preserving legacy URL handling.
- `src/pages/AdminFinance.tsx` and `src/pages/AdminPersonalFinance.tsx`: upload receipts to the financial endpoint, store stable references, and render API-resolved links.
- `server/test/upload-storage.test.js`: end-to-end unit contracts for scopes, signatures, routes, and legacy resolution.
- `server/test/file-scheduling-patient-contract.test.js`: updated patient-PDF replacement contract.

## Tasks

### Task 1: Add storage scope and binary validation

**Files:** create `server/utils/uploadValidation.js`, create `server/test/upload-storage.test.js`, modify `server/utils/assetStorage.js`.

- [ ] Write tests that expect `bucket://financial/3/receipt.pdf` to be a valid reference, to map to `/financial-assets?reference=...`, and to be rejected by public/clinical route validators when scope mismatches.
- [ ] Add tests for valid and invalid JPEG, PNG, WebP, PDF, MP4/QuickTime, and WebM magic bytes.
- [ ] Run `node --test server/test/upload-storage.test.js`; it must fail because the new scope and validator do not yet exist.
- [ ] Implement minimal helpers: `isSupportedUpload`, `isSupportedUploadForScope`, `createFinancialAssetUrl`, and `financial` prefix mapping. Public allows images/videos, clinical allows images only, financial allows images/PDF only.
- [ ] Re-run the test; it must pass.
- [ ] Commit: `feat: separate secure upload storage scopes`.

### Task 2: Secure Backend upload routes and patient PDFs

**Files:** modify `server/index.js`, `server/utils/patientDocumentStorage.js`, `server/test/upload-storage.test.js`, and `server/test/file-scheduling-patient-contract.test.js`.

- [ ] Write tests requiring `POST /financial-assets` and `GET /financial-assets` to authorize only `admin` and `manager`; require general uploads to call binary validation; require a patient PDF replacement to preserve `previousStorageKey` until after Prisma updates.
- [ ] Run `node --test server/test/upload-storage.test.js server/test/file-scheduling-patient-contract.test.js`; it must fail.
- [ ] Restrict general `/upload` to public/clinical validated payloads. Add a dedicated financial multipart endpoint accepting JPEG/PNG/WebP/PDF and returning only `bucket://financial/...` references. Add matching protected delivery route.
- [ ] When a patient PDF is replaced: upload new object, update the document record, then best-effort delete the old object without rolling back the valid replacement.
- [ ] Re-run focused tests; they must pass.
- [ ] Commit: `fix: secure document and financial uploads`.

### Task 3: Correct finance UI persistence and delivery

**Files:** modify `src/lib/media.ts`, `src/pages/AdminFinance.tsx`, `src/pages/AdminPersonalFinance.tsx`; create or modify `src/lib/media.test.ts`.

- [ ] Write tests for `assetDeliveryUrl('bucket://financial/9/r.pdf')` and legacy `/assets?...` resolution through `API_URL`; add page-source contracts that receipts save `response.data.reference` and call `/financial-assets`.
- [ ] Run `npm test -- --run src/lib/media.test.ts`; it must fail.
- [ ] Add financial reference mapping, post receipts to the financial endpoint, persist returned references, and render every receipt with `mediaUrl` so both old Cloudinary URLs and old relative API paths remain usable.
- [ ] Re-run focused frontend tests; they must pass.
- [ ] Commit: `fix: route financial receipts through private storage`.

### Task 4: Remove inactive integrations and verify

**Files:** modify `server/package.json`, `server/package-lock.json`, `server/test/upload-storage.test.js`; delete `.github/workflows/db-backup.yml`.

- [ ] Write a failing contract that `cloudinary` and `multer-storage-cloudinary` are absent from runtime dependencies while legacy external URLs remain accepted by `mediaUrl`.
- [ ] Run the focused test; it must fail.
- [ ] Remove only those two unused server dependencies, then run `npm install --package-lock-only` inside `server` to refresh its lockfile. Include the user-requested deletion of the obsolete GitHub backup workflow.
- [ ] Verify with `node --test server/test/*.test.js`, `npm test`, `npm run build`, and `npm test --prefix backup`.
- [ ] Commit: `chore: remove obsolete Cloudinary and backup workflow`.

### Task 5: Deploy and smoke-test safely

**Files:** no source changes unless verification reveals a reproducible defect.

- [ ] Deploy Backend and Frontend from the same verified commit; Backend must remain on `postgres.railway.internal:5432`.
- [ ] Upload a public blog image; two clinical photos in sequence, save and reload; a patient PDF then a replacement PDF; and one clinic plus one personal receipt.
- [ ] Verify role boundaries: unauthenticated access is blocked for clinical/financial files, clinical access is admin/dentist only, and receipts are admin/manager only.
- [ ] Verify at least one existing Cloudinary URL and one existing patient document record remain readable. Do not bulk-migrate or delete historical media.
