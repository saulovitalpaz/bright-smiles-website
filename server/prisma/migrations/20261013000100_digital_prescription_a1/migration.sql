CREATE TABLE "DigitalCertificate" (
 "userId" INTEGER NOT NULL PRIMARY KEY,
 "sealedCredentials" TEXT NOT NULL,
 "metadata" JSONB NOT NULL,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "DigitalCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "DigitalIssueOperation" (
 "id" TEXT NOT NULL PRIMARY KEY, "userId" INTEGER NOT NULL, "requestId" TEXT NOT NULL,
 "inputHash" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "DigitalIssueOperation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "DigitalIssueOperation_userId_requestId_key" ON "DigitalIssueOperation"("userId", "requestId");
CREATE TABLE "DigitalPrescription" (
 "id" TEXT NOT NULL PRIMARY KEY, "prescriptionId" INTEGER NOT NULL, "userId" INTEGER NOT NULL,
 "operationId" TEXT NOT NULL, "storageKey" TEXT NOT NULL, "hash" TEXT NOT NULL,
 "tokenDigest" TEXT NOT NULL, "sealedToken" TEXT NOT NULL, "signedAt" TIMESTAMP(3) NOT NULL,
 "professionalName" TEXT NOT NULL, "professionalCro" TEXT NOT NULL, "signatureStatus" TEXT NOT NULL, "validation" JSONB NOT NULL,
 CONSTRAINT "DigitalPrescription_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "DigitalPrescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "DigitalPrescription_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "DigitalIssueOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "DigitalPrescription_prescriptionId_key" ON "DigitalPrescription"("prescriptionId");
CREATE UNIQUE INDEX "DigitalPrescription_operationId_key" ON "DigitalPrescription"("operationId");
CREATE UNIQUE INDEX "DigitalPrescription_tokenDigest_key" ON "DigitalPrescription"("tokenDigest");
CREATE INDEX "DigitalPrescription_userId_signedAt_idx" ON "DigitalPrescription"("userId", "signedAt");
