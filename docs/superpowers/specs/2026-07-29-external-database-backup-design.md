# Backup externo criptografado do PostgreSQL

## Status

Proposto para revisão do usuário.

## Objetivo

Garantir recuperação dos dados clínicos, financeiros e administrativos mesmo quando um deploy falhar, o banco for alterado por engano ou o projeto Railway ficar indisponível. A solução não deve expor dumps no GitHub, no frontend, em logs ou em um endpoint público.

## Decisão

Adicionar um serviço Railway separado, chamado `database-backup`, configurado como Cron e conectado ao PostgreSQL pela variável privada `${{Postgres.DATABASE_URL}}`. A cada execução, o serviço:

1. gera um dump PostgreSQL no formato customizado;
2. valida o dump localmente com `pg_restore --list`;
3. cifra o arquivo localmente com uma chave fornecida somente por variável secreta;
4. calcula o SHA-256 do arquivo cifrado;
5. envia o arquivo e o manifesto de integridade ao bucket privado R2 `odontoeharmonizacao-db-backups`;
6. confirma a existência e o tamanho dos objetos enviados;
7. encerra com código diferente de zero quando qualquer etapa falha.

O serviço não terá domínio público, volume persistente ou acesso ao frontend. O token R2 terá somente `Object Read & Write` para esse bucket. A aplicação não terá permissão para alterar configurações do bucket.

## Retenção e recuperação

Os objetos serão separados por prefixo:

- `daily/`: retenção de 35 dias;
- `monthly/`: retenção de 400 dias.

As regras de lifecycle e bucket lock já foram configuradas no R2. A execução diária ocorrerá às 06:00 UTC (03:00 em Brasília), com cópia mensal adicional no primeiro dia de cada mês. O backup mantém RPO máximo de aproximadamente 24 horas no plano atual; o R2 não substitui PITR do Railway caso o plano Pro seja contratado no futuro.

O procedimento de restauração será documentado e testado: baixar o objeto, validar SHA-256, decifrar, inspecionar com `pg_restore --list` e restaurar primeiro em uma instância PostgreSQL temporária. A restauração em produção será sempre uma ação manual, com confirmação e backup adicional antes da troca.

## Variáveis do serviço `database-backup`

Todas ficam no escopo do serviço, nunca no Frontend ou no serviço Postgres:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
BACKUP_R2_ENDPOINT=(endpoint S3 exibido pelo R2)
BACKUP_R2_BUCKET=odontoeharmonizacao-db-backups
BACKUP_R2_ACCESS_KEY_ID=(Access Key ID do token R2)
BACKUP_R2_SECRET_ACCESS_KEY=(Secret Access Key do token R2)
BACKUP_ENCRYPTION_KEY=(chave forte gerada uma única vez)
```

O valor da chave e o Secret Access Key nunca serão commitados, exibidos em logs ou enviados pelo chat. A rotação de uma chave exige preservar a chave anterior até que os backups antigos sejam migrados ou deixem de ser necessários.

## Tratamento de erros e observabilidade

- qualquer falha interrompe a execução e retorna código não zero;
- arquivos temporários são apagados em `finally`;
- mensagens de erro não imprimem URLs com senha, chaves, dumps ou dados de pacientes;
- o log informa somente etapa, timestamp, nome lógico do objeto, tamanho e resultado;
- o serviço não sobrescreve objetos existentes: cada execução usa timestamp e identificador único;
- falhas devem ser acompanhadas pelos alertas de deployment/cron do Railway.

## Alternativas descartadas

### GitHub Actions com artefato

Foi descartado como solução principal porque o workflow existente dependia do TCP público, gerava dump sem criptografia e falhou por usar `pg_dump` 16 contra PostgreSQL 17. Artefatos do GitHub também não oferecem a separação operacional desejada.

### Backup dentro do processo do Backend

Foi descartado porque o processo HTTP não é um agendador confiável: deploys, reinícios e falhas podem impedir a execução, além de misturar credenciais de backup com a API.

### Segundo banco Railway

Foi descartado como backup primário porque permanece no mesmo projeto e não protege contra exclusão ou comprometimento da conta. Pode ser usado futuramente como réplica/ambiente de restauração, não como única cópia.

## Testes obrigatórios

Antes do deploy:

- teste unitário da seleção de prefixo diário/mensal;
- teste unitário da criação de nomes sem colisão;
- teste de falha quando variável obrigatória está ausente;
- teste de integridade do manifesto SHA-256;
- execução contra um PostgreSQL temporário para gerar e inspecionar dump;
- teste de upload para R2 sem registrar segredos;
- teste de restauração em banco temporário antes de considerar o backup válido.

Após o deploy:

- execução manual do Cron;
- confirmação de dois objetos no bucket (dump e manifesto);
- verificação de logs sem segredos;
- simulação de restauração documentada;
- revisão mensal da retenção e teste trimestral de restauração.

## Relação com segurança do portal

O serviço de backup é isolado do portal e não altera as permissões das rotas. A revisão completa de autenticação, autorização, headers, validação, uploads, criptografia e limpeza de segredos continua sendo uma etapa separada, após a proteção dos dados persistidos.
