# Bird ID — progresso e critérios de ativação

Atualizado em 16/10/2026. Implementação autorizada pelo usuário; integração externa ainda não homologada.

## Retomada em novo chat

O usuário solicitou a documentação à Soluti e decidiu retomar a integração quando receber o retorno. Autorizou commit e push em origin/main das alterações atuais, incluindo o seletor visual A1/Bird ID para revisar o design. O seletor está nas configurações e aparece no receituário ao ativar “Incluir assinatura”; Bird ID continua desabilitado.

A documentação pública já descreve o OAuth Authorization Code com PKCE e o cadastro de aplicações. Não é necessário obter documentação privada adicional para começar essa etapa. Para operar, precisamos cadastrar a aplicação e sua URL HTTPS de retorno, configurar credenciais próprias no servidor e confirmar o ambiente/escopo de assinatura. O caminho proposto é `/digital-signatures/bird-id/callback`; o domínio público da API deve ser confirmado antes do cadastro. Essa rota ainda não existe.

- Cadastro: https://docs.vaultid.com.br/workspace/cloud/api/manutencao/cadastro-de-aplicacao
- OAuth/PKCE: https://docs.vaultid.com.br/workspace/cloud/api/autenticacao-de-usuarios/autenticacao-em-sistemas-web
- Assinatura de hashes: https://docs.vaultid.com.br/workspace/cloud/api/uso-de-certificado/assinatura-digital
- Contato de integração: https://soluti.com.br/integracoes-sistemas/

O plano atual usa CESS. A alternativa de assinar hashes pela API e montar o PDF no backend foi explicada ao usuário, mas não implementada nem adotada como substituição do plano. Confirmar a estratégia após o retorno da Soluti. Não solicitar tokens, senhas ou client_secret pelo chat.

## Implementado localmente

- Contratos A1/BIRD_ID e endpoint autenticado de disponibilidade, limitado ao papel clínico atual.
- Requisições legadas continuam A1; tentativa de Bird ID não executa A1 como alternativa.
- Cofre AES-256-GCM independente, vinculado a usuário/sessão, com teste de restauração e adulteração.
- Schema e migração aditiva para sessões persistidas e identificação do provedor. Migração **não aplicada** em banco real.
- Store transacional com compare-and-set, consumo de state e token de lease. Teste de concorrência com adaptador sintético; ainda requer validação em PostgreSQL isolado.
- Interface informa que Bird ID aguarda homologação; seleção permanece desabilitada.
- Cabeçalho, identificação compacta do paciente e imagem ilustrativa incorporada ao PDF antes da assinatura A1. A validação criptográfica existente permanece exigida.

## Pendente antes de implementar o adaptador externo

O plano aprovado exige contrato de homologação com versão/modalidade CESS, autenticação de serviço, endpoints/campos reais, escopo OAuth, compatibilidade do token e regras de recuperação de transações. Esses dados não estão registrados no repositório e foram solicitados ao usuário, sem pedir credenciais pelo chat.

Não foram implementados nem ativados os endpoints OAuth/callback/advance, cliente CESS, validação de identidade A3, emissão remota ou retomada no navegador. Nenhuma requisição foi enviada à Soluti. Variáveis de ambiente, sozinhas, não habilitam Bird ID nesta versão.

## Verificações e implantação

- Testes locais do cofre, contratos, store e autorização clínica.
- Validação estrutural Prisma sem conexão de produção.
- PDF sintético com imagem ilustrativa, nome/CPF/endereço/telefone; assinatura A1 validada no motor e renderização visual inspecionada.
- Homologação real, backup/restauração de banco e bucket, migração e deploy permanecem pendentes. Nenhum dado real, segredo ou certificado de paciente foi utilizado nos testes.

O plano em `docs/superpowers/plans/2026-10-15-bird-id-second-signing-provider.md` permanece parcialmente executado. Não considerar este documento evidência de integração Bird ID concluída.
