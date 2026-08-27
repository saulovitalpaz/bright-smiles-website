ALTER TABLE "Patient"
ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3);

ALTER TABLE "Prescription"
ADD COLUMN IF NOT EXISTS "odontogramSnapshot" JSONB,
ADD COLUMN IF NOT EXISTS "odontogramSourceAppointmentId" INTEGER;

ALTER TABLE "DocumentTemplate"
ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'text',
ADD COLUMN IF NOT EXISTS "storageKey" TEXT,
ADD COLUMN IF NOT EXISTS "mimeType" TEXT,
ADD COLUMN IF NOT EXISTS "originalName" TEXT,
ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

ALTER TABLE "PatientDocument"
ADD COLUMN IF NOT EXISTS "templateId" INTEGER,
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'issued',
ADD COLUMN IF NOT EXISTS "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "issuedById" INTEGER,
ADD COLUMN IF NOT EXISTS "sourceKind" TEXT NOT NULL DEFAULT 'text';

CREATE TABLE IF NOT EXISTS "PatientDocumentAttachment" (
    "id" SERIAL NOT NULL,
    "patientDocumentId" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" INTEGER,

    CONSTRAINT "PatientDocumentAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PatientDocumentAttachment_patientDocumentId_idx"
ON "PatientDocumentAttachment"("patientDocumentId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Prescription_odontogramSourceAppointmentId_fkey'
    ) THEN
        ALTER TABLE "Prescription"
        ADD CONSTRAINT "Prescription_odontogramSourceAppointmentId_fkey"
        FOREIGN KEY ("odontogramSourceAppointmentId") REFERENCES "Appointment"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'PatientDocument_templateId_fkey'
    ) THEN
        ALTER TABLE "PatientDocument"
        ADD CONSTRAINT "PatientDocument_templateId_fkey"
        FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'PatientDocument_issuedById_fkey'
    ) THEN
        ALTER TABLE "PatientDocument"
        ADD CONSTRAINT "PatientDocument_issuedById_fkey"
        FOREIGN KEY ("issuedById") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'PatientDocumentAttachment_patientDocumentId_fkey'
    ) THEN
        ALTER TABLE "PatientDocumentAttachment"
        ADD CONSTRAINT "PatientDocumentAttachment_patientDocumentId_fkey"
        FOREIGN KEY ("patientDocumentId") REFERENCES "PatientDocument"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'PatientDocumentAttachment_uploadedById_fkey'
    ) THEN
        ALTER TABLE "PatientDocumentAttachment"
        ADD CONSTRAINT "PatientDocumentAttachment_uploadedById_fkey"
        FOREIGN KEY ("uploadedById") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
