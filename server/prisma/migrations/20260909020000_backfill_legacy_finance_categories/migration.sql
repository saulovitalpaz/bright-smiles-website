INSERT INTO "FinanceCategory" ("name", "updatedAt")
SELECT DISTINCT TRIM("category"), CURRENT_TIMESTAMP
FROM "FinanceTransaction"
WHERE TRIM("category") <> ''
ON CONFLICT ("name") DO NOTHING;

UPDATE "FinanceTransaction"
SET "categoryId" = "FinanceCategory"."id"
FROM "FinanceCategory"
WHERE "FinanceTransaction"."categoryId" IS NULL
  AND TRIM("FinanceTransaction"."category") <> ''
  AND "FinanceCategory"."name" = TRIM("FinanceTransaction"."category");
