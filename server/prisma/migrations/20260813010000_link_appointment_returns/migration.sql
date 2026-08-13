ALTER TABLE "Appointment"
ADD COLUMN "parentAppointmentId" INTEGER;

CREATE UNIQUE INDEX "Appointment_parentAppointmentId_key"
ON "Appointment"("parentAppointmentId");

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_parentAppointmentId_fkey"
FOREIGN KEY ("parentAppointmentId") REFERENCES "Appointment"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
