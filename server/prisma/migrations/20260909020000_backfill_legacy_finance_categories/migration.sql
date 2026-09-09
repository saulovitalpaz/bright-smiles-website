INSERT INTO "FinanceCategory" ("name", "updatedAt")
SELECT DISTINCT TRIM("category"), CURRENT_TIMESTAMP
FROM "FinanceTransaction"
WHERE TRIM("category") <> ''
ON CONFLICT ("name") DO NOTHING;
