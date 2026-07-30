# Runbook: migração de criptografia de pacientes

## Pré-requisitos

- Um backup R2 diário concluído e uma restauração temporária validada.
- Uma janela curta de manutenção, pois o Backend deve ficar pausado durante a migração para evitar gravações com a chave legada em paralelo.
- `main` ainda não foi publicado com a remoção da chave padrão embutida.

## Chaves

Gere valores diferentes para `ENCRYPTION_KEY`, `PATIENT_INDEX_KEY` e `JWT_SECRET` usando este bloco PowerShell uma vez para cada variável:

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

Guarde cada valor no cofre de senhas. Não cole qualquer valor em chat, Git ou arquivos.

`LEGACY_ENCRYPTION_KEY` deve ser o valor usado pela versão atual do Backend antes desta migração. Como essa versão ainda está em `origin/main`, recupere-o localmente do arquivo `server/utils/encryption.js`, guarde-o no cofre e use-o somente no job temporário. Não crie um valor novo para essa variável.

> Não adicione a nova `ENCRYPTION_KEY` ao Backend em produção antes da migração. A versão antiga passaria a usá-la imediatamente e não conseguiria decifrar os dados legados.

## Executar a migração

1. Publique a versão atual apenas em uma branch de job:

   ```powershell
   git push origin HEAD:security-migration
   ```

2. Pause o serviço `Backend` no Railway.
3. Crie um serviço Railway temporário `patient-encryption-migration` a partir da branch `security-migration`, com raiz `server`, sem domínio, volume ou proxy público. Use este Start Command:

   ```text
   npm run migrate:deploy && npm run migrate:patient-encryption
   ```

4. Configure somente nesse serviço:

   | Variável | Valor |
   | --- | --- |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
   | `ENCRYPTION_KEY` | nova chave Base64 de 32 bytes |
   | `PATIENT_INDEX_KEY` | nova chave Base64 de 32 bytes, diferente da anterior |
   | `LEGACY_ENCRYPTION_KEY` | chave legada preservada do Backend atual |

5. Execute uma vez. O log esperado contém apenas contagens:

   ```text
   Patient encryption migration completed: <n> migrated, <n> already current.
   ```

6. Execute novamente. O segundo resultado deve informar `0 migrated`. Isso confirma que a migração pode ser retomada sem alterar dados já convertidos.
7. Exclua o serviço temporário de migração.

## Publicar o portal protegido

1. No serviço `Backend`, adicione `ENCRYPTION_KEY`, `PATIENT_INDEX_KEY` e `JWT_SECRET` novos a partir do cofre. Não adicione `LEGACY_ENCRYPTION_KEY` se a segunda execução da migração retornou `0 migrated`.
2. Publique `main`, então faça deploy do Backend e do Frontend. O Backend aplica apenas migrations versionadas no startup; ele não executa mais `prisma db push`.
3. Entre novamente no admin e teste pesquisa/cadastro de paciente, agendamento, financeiro e logout. A troca de `JWT_SECRET` encerra sessões antigas, como esperado.
4. Remova o workflow de backup antigo do GitHub e o proxy TCP público do PostgreSQL somente depois de registrar esses testes como aprovados.
