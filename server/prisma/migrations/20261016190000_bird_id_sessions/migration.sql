ALTER TABLE "DigitalIssueOperation" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'A1';
ALTER TABLE "DigitalPrescription" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'A1';
CREATE TABLE "BirdIdSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AWAITING_AUTHORIZATION',
    "stateDigest" TEXT,
    "sealedRequest" TEXT,
    "sealedOAuth" TEXT,
    "sealedTransaction" TEXT,
    "unsignedStorageKey" TEXT,
    "unsignedHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "leaseUntil" TIMESTAMP(3),
    "leaseToken" TEXT,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BirdIdSession_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "DigitalIssueOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BirdIdSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "BirdIdSession_operationId_key" ON "BirdIdSession"("operationId");
CREATE UNIQUE INDEX "BirdIdSession_stateDigest_key" ON "BirdIdSession"("stateDigest");
CREATE INDEX "BirdIdSession_userId_status_idx" ON "BirdIdSession"("userId", "status");
CREATE INDEX "BirdIdSession_expiresAt_idx" ON "BirdIdSession"("expiresAt");
