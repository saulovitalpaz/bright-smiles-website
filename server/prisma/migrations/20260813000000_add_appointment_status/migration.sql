ALTER TABLE "Appointment"
ADD COLUMN IF NOT EXISTS "status" TEXT;

UPDATE public."Appointment"
SET "status" = 'scheduled'
WHERE "status" IS NULL
   OR "status" NOT IN ('scheduled', 'attended', 'cancelled');

ALTER TABLE "Appointment"
ALTER COLUMN "status" SET DEFAULT 'scheduled',
ALTER COLUMN "status" SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE c.conname = 'Appointment_status_check'
          AND n.nspname = 'public'
          AND t.relname = 'Appointment'
    ) THEN
        ALTER TABLE "Appointment"
        ADD CONSTRAINT "Appointment_status_check"
        CHECK ("status" IN ('scheduled', 'attended', 'cancelled'));
    END IF;
END $$;
