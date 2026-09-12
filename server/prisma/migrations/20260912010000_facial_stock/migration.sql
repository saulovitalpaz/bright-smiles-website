CREATE TABLE "StockProduct" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "procedureType" TEXT NOT NULL,
  "stockUnit" TEXT NOT NULL DEFAULT 'ml',
  "quantity" DECIMAL(18,6) NOT NULL CHECK ("quantity" >= 0),
  "concentration" DECIMAL(18,6),
  "price" DECIMAL(12,2) NOT NULL CHECK ("price" >= 0),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StockProduct_unit_check" CHECK ("stockUnit" IN ('ml', 'unit')),
  CONSTRAINT "StockProduct_concentration_check" CHECK ("concentration" IS NULL OR "concentration" > 0)
);
CREATE INDEX "StockProduct_procedureType_active_idx" ON "StockProduct"("procedureType", "active");
CREATE TABLE "StockUsage" (
  "id" SERIAL PRIMARY KEY,
  "appointmentId" INTEGER NOT NULL REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "applicationId" TEXT NOT NULL,
  "productId" TEXT NOT NULL REFERENCES "StockProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "quantity" DECIMAL(18,6) NOT NULL CHECK ("quantity" > 0),
  "concentration" DECIMAL(18,6),
  "unitPrice" DECIMAL(12,2) NOT NULL
);
CREATE UNIQUE INDEX "StockUsage_appointmentId_applicationId_key" ON "StockUsage"("appointmentId", "applicationId");
CREATE INDEX "StockUsage_productId_idx" ON "StockUsage"("productId");
CREATE TABLE "StockMovement" (
  "id" SERIAL PRIMARY KEY,
  "productId" TEXT NOT NULL REFERENCES "StockProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "quantity" DECIMAL(18,6) NOT NULL,
  "reason" TEXT NOT NULL,
  "appointmentId" INTEGER,
  "actorId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");
