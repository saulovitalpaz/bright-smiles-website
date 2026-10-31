# Uploaded image outage — 2026-10-31

## Confirmed cause and repair

The public API was healthy and returned a fresh signed redirect, but storage returned HTTP 403 / SignatureDoesNotMatch. The backend BUCKET_SECRET_ACCESS_KEY did not match the current secret for its configured bucket. The access key ID, bucket, endpoint and region matched. Both SDK reads and presigned GETs failed with the backend configuration; the same public logo returned HTTP 200 with the current bucket credentials.

The backend variable was changed to a Railway variable reference to SECRET_ACCESS_KEY on the existing bucket (HD noeh), rather than another manually copied secret. No bucket credentials were rotated, no database/encryption keys changed, and no stored files were modified or made public. Deployment is required to apply environment changes to running instances.

The October 16 commit did not alter the media URL resolver, asset redirect handlers, S3 client configuration or SDK lockfile. The precise time or action that caused the runtime credential divergence was not established.

## Verification before future releases

Use the same environment as the backend and set BUCKET_CHECK_PUBLIC_REFERENCE to a known public bucket reference (for example, the stored site_logo setting). Run:

```powershell
node server/scripts/check-bucket-access.js
```

The script signs and performs a real GET using the existing storage helper. It exits nonzero on invalid configuration, rejected authentication, missing objects or network failure. It prints only a safe result code and HTTP status; never the signed URL, credentials or object contents. It performs no writes and accepts only public references. A health response or successful URL generation alone does not prove storage access works.

After deployment, verify the actual API redirect and image response, several public uploaded images, and anonymous denial on clinical/financial asset routes. Private storage remains private and those routes must continue requiring the appropriate authenticated role.
