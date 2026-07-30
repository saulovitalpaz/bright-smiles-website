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

2. No `Backend` → **Variables**, adicione estas variáveis de serviço e mantenha as demais existentes:

   | Variável | Valor |
   | --- | --- |
   | `ENCRYPTION_KEY` | nova chave Base64 de 32 bytes |
   | `PATIENT_INDEX_KEY` | nova chave Base64 de 32 bytes, diferente da anterior |
   | `JWT_SECRET` | nova chave Base64 de 32 bytes, diferente das duas anteriores |
   | `LEGACY_ENCRYPTION_KEY` | chave legada preservada do Backend atual |
   | `MAINTENANCE_MODE` | `true` |

3. Antes de aplicar as variáveis, pause o serviço `Backend`. Em **Settings** → Source, altere apenas a branch para `security-migration`, preservando a raiz de código atual (`server`). Aplique as mudanças e faça deploy. O `/health` deve responder normalmente e os demais endpoints devem retornar `503` durante a migração.

4. Abra a aba **Console** do próprio `Backend` e execute:

   ```text
   npm run migrate:patient-encryption
   ```

   O log esperado contém apenas contagens:

   ```text
   Patient encryption migration completed: <n> migrated, <n> already current.
   ```

5. Execute o mesmo comando novamente. O segundo resultado deve informar `0 migrated`. Isso confirma que a migração pode ser retomada sem alterar dados já convertidos.
6. Em **Variables** do Backend, remova `LEGACY_ENCRYPTION_KEY` e `MAINTENANCE_MODE`. Faça deploy uma vez ainda na branch `security-migration` e confirme `/health` e o login administrativo.

## Publicar o portal protegido

1. Publique `main`, então retorne o Backend para a branch `main` e faça deploy do Backend e do Frontend. O Backend aplica apenas migrations versionadas no startup; ele não executa mais `prisma db push`.
2. Entre novamente no admin e teste pesquisa/cadastro de paciente, agendamento, financeiro e logout. A troca de `JWT_SECRET` encerra sessões antigas, como esperado.
3. Remova o workflow de backup antigo do GitHub e o proxy TCP público do PostgreSQL somente depois de registrar esses testes como aprovados.
