-- Keep databases that already applied the historical migrations compatible with
-- fields used by the current Prisma schema. Every operation is additive.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "signatureUrl" TEXT;

ALTER TABLE "Post"
ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0;
