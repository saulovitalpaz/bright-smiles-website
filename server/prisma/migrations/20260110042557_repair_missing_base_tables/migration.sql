-- The initial migration was created before the clinical tables were added to
-- the Prisma schema. Bootstrap only the base tables needed by the historical
-- migrations; every statement is additive and safe for an existing database.
CREATE TABLE IF NOT EXISTS "Patient" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "history" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "consentDate" TIMESTAMP(3),
    "odontogram" JSONB,
    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Patient_cpf_key" ON "Patient"("cpf");

CREATE TABLE IF NOT EXISTS "Prescription" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Prescription_patientId_idx" ON "Prescription"("patientId");

CREATE TABLE IF NOT EXISTS "FinanceTransaction" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patientId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "nfeUrl" TEXT,
    CONSTRAINT "FinanceTransaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FinanceTransaction_patientId_idx" ON "FinanceTransaction"("patientId");

CREATE TABLE IF NOT EXISTS "DocumentTemplate" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PatientDocument" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pdfUrl" TEXT,
    "storageKey" TEXT,
    CONSTRAINT "PatientDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PatientDocument_patientId_idx" ON "PatientDocument"("patientId");

ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "patientId" INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE c.conname = 'Appointment_patientId_fkey'
          AND t.relname = 'Appointment' AND n.nspname = 'public'
    ) THEN
        ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey"
        FOREIGN KEY ("patientId") REFERENCES "Patient"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE c.conname = 'Prescription_patientId_fkey'
          AND t.relname = 'Prescription' AND n.nspname = 'public'
    ) THEN
        ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey"
        FOREIGN KEY ("patientId") REFERENCES "Patient"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE c.conname = 'FinanceTransaction_patientId_fkey'
          AND t.relname = 'FinanceTransaction' AND n.nspname = 'public'
    ) THEN
        ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_patientId_fkey"
        FOREIGN KEY ("patientId") REFERENCES "Patient"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE c.conname = 'PatientDocument_patientId_fkey'
          AND t.relname = 'PatientDocument' AND n.nspname = 'public'
    ) THEN
        ALTER TABLE "PatientDocument" ADD CONSTRAINT "PatientDocument_patientId_fkey"
        FOREIGN KEY ("patientId") REFERENCES "Patient"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
