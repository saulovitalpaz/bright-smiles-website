ALTER TABLE "FinanceTransaction" ADD COLUMN "appointmentId" INTEGER;
ALTER TABLE "FinanceTransaction" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'pending';
UPDATE "FinanceTransaction" SET "paymentStatus" = CASE WHEN "description" ILIKE '%[A RECEBER]%' THEN 'pending' ELSE 'received' END;
CREATE UNIQUE INDEX "FinanceTransaction_appointmentId_key" ON "FinanceTransaction"("appointmentId");
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
