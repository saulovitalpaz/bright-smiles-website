ALTER TABLE "Patient" ADD COLUMN "cpfIndex" TEXT;

CREATE UNIQUE INDEX "Patient_cpfIndex_key" ON "Patient"("cpfIndex");
