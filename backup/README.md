# Serviço de backup do banco

Este diretório é a raiz do serviço Railway `database-backup`. Ele usa o cliente PostgreSQL 17, produz um dump no formato customizado, valida-o com `pg_restore --list`, cifra-o com AES-256-GCM e envia o objeto cifrado e seu manifesto para um bucket R2 privado.

## Operação normal

O cron definido em `railway.json` roda às `06:00 UTC` (`03:00` no horário de Brasília enquanto UTC−3) diariamente. Em todo primeiro dia UTC do mês ele envia também uma cópia sob `monthly/`.

As variáveis obrigatórias e exclusivas do serviço são:

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `BACKUP_R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`
- `BACKUP_R2_BUCKET=odontoeharmonizacao-db-backups`
- `BACKUP_R2_ACCESS_KEY_ID`
- `BACKUP_R2_SECRET_ACCESS_KEY`
- `BACKUP_ENCRYPTION_KEY` — uma chave base64 de exatamente 32 bytes.

Nunca registre essas variáveis no Git, em ticket, chat, logs ou no frontend. O serviço não precisa de domínio público nem de volume.

## Verificação de recuperação

`npm run inspect` exige `BACKUP_OBJECT_KEY` com uma chave existente, por exemplo `daily/2026/07/postgres-...dump.enc`. Ele baixa o objeto e o manifesto, confere tamanho e SHA-256, decifra em diretório temporário e executa `pg_restore --list`. Não executa comandos de alteração ou substituição de banco. Veja o runbook para o teste de restauração em uma instância PostgreSQL 17 temporária.
