ALTER TABLE "StockProduct" ADD COLUMN "batch" TEXT;
ALTER TABLE "StockProduct" ADD COLUMN "reconstitutedAt" DATE;
-- Keep appointment weights as historical records; patient weight is encrypted by the API.
ALTER TABLE "Patient" ADD COLUMN "weight" TEXT;
