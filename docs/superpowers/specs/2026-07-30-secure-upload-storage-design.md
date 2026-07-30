# Secure Upload Storage Design

## Goal

Make every new attachment durable in the Railway Bucket, correctly scoped by
data sensitivity, and readable through the API without breaking legacy
Cloudinary URLs or existing bucket references.

## Current State and Root Cause

The running upload code no longer calls Cloudinary. General uploads already
write objects to the Railway Bucket with a timestamp and UUID key; clinical
photos are therefore not overwritten when added one after another.

Two inconsistencies remain:

1. Financial receipt screens store the relative delivery path returned by
   `/upload`, then render it as a Frontend link. The request is sent to the
   Frontend domain instead of the API.
2. Financial receipts use the generic public upload scope even though they
   contain private financial information.

Patient PDFs already use a private storage key and signed API delivery. The
replacement of an existing PDF leaves the previous object orphaned. Old
records with a `pdfUrl` must remain accessible as legacy URLs.

Cloudinary packages are still installed but have no runtime consumer.

## Approved Architecture

Use one Railway Bucket with three logical prefixes and stable database
references:

| Scope | Stored reference | Bucket prefix | Writers | Readers |
| --- | --- | --- | --- | --- |
| Public marketing media | `bucket://public/...` | `public/` | admin, dentist | anyone through `/assets` |
| Clinical media | `bucket://clinical/...` | `private/` | admin, dentist | admin, dentist through `/clinical-assets` |
| Financial receipts | `bucket://financial/...` | `financial/` | admin, manager | admin, manager through `/financial-assets` |

Every upload persists the stable `bucket://...` reference, never a signed URL
or a relative API path. Delivery routes translate only bucket references to
short-lived signed R2 URLs. Existing absolute Cloudinary URLs, `/images/...`
files, existing `/patient-documents/...` paths, and legacy `pdfUrl` values
remain valid without conversion.

## Upload Boundaries

- Public uploads remain on `POST /upload` with `scope=public` for blog,
  treatments, stories, and branding.
- Clinical photos remain on `POST /upload` with `scope=clinical`; the UI
  serializes uploads and appends a returned reference only after the upload
  succeeds.
- Financial receipts move to a dedicated authenticated endpoint, accepting
  only JPEG, PNG, WebP, and PDF. It returns a `bucket://financial/...`
  reference.
- Patient terms and signed PDFs remain on their dedicated private document
  endpoint. Replacing a PDF updates the database first and then deletes the
  old bucket object; a failed old-object cleanup is logged but cannot undo a
  successful new document.
- The server verifies both declared MIME type and file signatures before it
  writes to storage. File size limits remain in Multer.

## Compatibility and Safety Rules

- Never delete legacy Cloudinary or existing bucket objects as part of this
  deployment.
- Remove Cloudinary dependencies only after confirming there is no runtime
  import.
- New financial receipts must never use the public delivery route.
- A failed upload must not write a database reference. A failed response after
  a successful generic upload must delete the just-created object.
- Sequential clinical uploads must preserve every returned reference in the
  appointment `photos` array; each generated object key must be unique.
- Do not expose storage credentials, signed URLs, patient identifiers, or
  attachment names in logs.

## Verification

Automated tests will prove unique keys, allowed file signatures, routing and
authorization per scope, PDF replacement cleanup, financial URL resolution,
and sequential-photo persistence. The final manual smoke test will upload a
blog image, two clinical photos in sequence, a patient PDF, and a financial
receipt, then reload each record and verify the expected permission boundary.
