ALTER TABLE "DigitalCertificate"
    ADD COLUMN "fingerprint" TEXT,
    ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN "suspendedAt" TIMESTAMP(3),
    ADD COLUMN "lastVerificationCode" TEXT;

UPDATE "DigitalCertificate"
SET "fingerprint" = "metadata"->>'fingerprint';

ALTER TABLE "DigitalCertificate"
    ADD CONSTRAINT "DigitalCertificate_status_check"
    CHECK ("status" IN ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED', 'VERIFICATION_UNAVAILABLE'));
