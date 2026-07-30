# Runbook: backup externo e recuperação

## Serviço Railway

O serviço `database-backup` deve ter raiz de código `backup`, sem domínio público e sem volume. Ele executa diariamente às `06:00 UTC` e cria objetos cifrados no bucket privado `odontoeharmonizacao-db-backups`:

- `daily/YYYY/MM/postgres-<timestamp>-<id>.dump.enc` e `*.manifest.json`
- no primeiro dia UTC: `monthly/YYYY/postgres-<timestamp>-<id>.dump.enc` e `*.manifest.json`

Configurar somente no serviço `database-backup`:

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `BACKUP_R2_ENDPOINT` | Endpoint S3 da conta R2 (`https://<account-id>.r2.cloudflarestorage.com`) |
| `BACKUP_R2_BUCKET` | `odontoeharmonizacao-db-backups` |
| `BACKUP_R2_ACCESS_KEY_ID` | ID da credencial R2 limitada ao bucket |
| `BACKUP_R2_SECRET_ACCESS_KEY` | Segredo da mesma credencial |
| `BACKUP_ENCRYPTION_KEY` | Chave base64 de 32 bytes mantida em cofre de senhas |

Gere a chave localmente, guarde-a no cofre e cole-a diretamente no Railway. Em PowerShell:

```powershell
$bytes = [byte[]]::new(32)
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try {
  $rng.GetBytes($bytes)
  [Convert]::ToBase64String($bytes)
}
finally {
  $rng.Dispose()
}
```

Não envie a saída a ninguém nem a inclua em arquivo. Sem essa chave, o backup é irrecuperável.

## Checagem após uma execução manual

1. Faça um deploy manual do serviço e confirme nos logs apenas `Backup completed: ...`.
2. No R2, confirme um `.dump.enc` e seu `.manifest.json` no prefixo `daily/`. Eles devem continuar privados.
3. Confirme que `bytes` e `sha256` do manifesto correspondem ao objeto cifrado. O manifesto não pode ter URL do banco, credenciais ou dados de pacientes.
4. Depois do primeiro backup aprovado, registre a data/hora e preserve a chave de cifragem no cofre.

## Teste de recuperação (semestral e após mudanças grandes)

1. Crie um PostgreSQL 17 temporário e vazio; nunca aponte o teste ao banco de produção.
2. Em uma máquina segura com as mesmas seis variáveis, defina `BACKUP_OBJECT_KEY` para uma chave do R2 e execute `npm run inspect --prefix backup`. Isso valida download, manifesto, SHA-256, AES-GCM e a leitura de estrutura pelo `pg_restore`.
3. Baixe e decifre apenas em diretório temporário controlado. Restaure no banco temporário com PostgreSQL 17, usando `pg_restore --no-owner --no-privileges --dbname <url-do-banco-temporario> <dump>`.
4. Compare contagens representativas de tabelas e registre apenas o resultado, data e chave do objeto — nunca dados clínicos.
5. Exclua a instância temporária e os arquivos locais logo após o teste.

Uma restauração sobre produção exige janela de manutenção e aprovação explícita separada. O serviço de backup não contém comando que substitua ou apague um banco.

## Retenção e acesso

As regras do bucket devem manter `daily/` por 35 dias e `monthly/` por 400 dias. A credencial R2 deve ter somente `Object Read & Write` no bucket de backup. Após o primeiro backup e teste de recuperação aprovados, remova o workflow legado do GitHub e o proxy TCP público do PostgreSQL, depois de confirmar que backend e backup usam referências privadas Railway.
