ALTER TABLE "Appointment"
ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);

UPDATE "Appointment"
SET "scheduledAt" = "date"
WHERE "scheduledAt" IS NULL;
