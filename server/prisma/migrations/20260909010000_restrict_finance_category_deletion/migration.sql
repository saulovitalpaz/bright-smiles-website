ALTER TABLE "FinanceTransaction"
DROP CONSTRAINT "FinanceTransaction_categoryId_fkey";

ALTER TABLE "FinanceTransaction"
ADD CONSTRAINT "FinanceTransaction_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "FinanceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
