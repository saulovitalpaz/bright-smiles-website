ALTER TABLE "Appointment"
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'scheduled';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Appointment_status_check'
    ) THEN
        ALTER TABLE "Appointment"
        ADD CONSTRAINT "Appointment_status_check"
        CHECK ("status" IN ('scheduled', 'attended', 'cancelled'));
    END IF;
END $$;
