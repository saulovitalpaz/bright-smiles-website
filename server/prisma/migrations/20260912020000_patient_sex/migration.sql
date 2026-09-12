ALTER TABLE "Patient" ADD COLUMN "sex" TEXT;
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_sex_check" CHECK ("sex" IN ('female', 'male'));
