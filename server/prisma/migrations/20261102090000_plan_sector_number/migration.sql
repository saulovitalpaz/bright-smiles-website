ALTER TABLE "Patient" ADD COLUMN "treatmentPlanCounter" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TreatmentPlan" ADD COLUMN "patientNumber" INTEGER;
WITH numbered AS (SELECT id, ROW_NUMBER() OVER (PARTITION BY "patientId" ORDER BY "createdAt", id)::integer AS n FROM "TreatmentPlan") UPDATE "TreatmentPlan" p SET "patientNumber" = numbered.n FROM numbered WHERE p.id = numbered.id;
UPDATE "Patient" p SET "treatmentPlanCounter" = x.n FROM (SELECT "patientId", MAX("patientNumber") AS n FROM "TreatmentPlan" GROUP BY "patientId") x WHERE p.id = x."patientId";
ALTER TABLE "TreatmentPlan" ALTER COLUMN "patientNumber" SET NOT NULL;
CREATE UNIQUE INDEX "TreatmentPlan_patientId_patientNumber_key" ON "TreatmentPlan"("patientId", "patientNumber");
ALTER TABLE "ClinicalProcedure" ADD COLUMN "sector" TEXT NOT NULL DEFAULT 'odontologia', ADD COLUMN "facialType" TEXT;
ALTER TABLE "TreatmentPlanItem" ADD COLUMN "facialRegion" TEXT;
