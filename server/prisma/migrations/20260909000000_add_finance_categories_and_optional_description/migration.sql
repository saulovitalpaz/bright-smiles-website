CREATE TABLE "FinanceCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FinanceCategory_name_key" ON "FinanceCategory"("name");

ALTER TABLE "FinanceTransaction" ADD COLUMN "categoryId" INTEGER;
ALTER TABLE "FinanceTransaction" ALTER COLUMN "description" DROP NOT NULL;

CREATE INDEX "FinanceTransaction_categoryId_idx" ON "FinanceTransaction"("categoryId");

ALTER TABLE "FinanceTransaction"
ADD CONSTRAINT "FinanceTransaction_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "FinanceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "FinanceCategory" ("name", "updatedAt") VALUES ('Geral', CURRENT_TIMESTAMP) ON CONFLICT ("name") DO NOTHING;
