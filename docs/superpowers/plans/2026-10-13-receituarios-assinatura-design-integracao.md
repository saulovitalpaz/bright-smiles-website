# Receituários nas consultas: design e integração de assinatura

Data: 13/10/2026. Adendo ao plano A1/token/CRO. Status: design preparado; conexão real depende da escolha do serviço, das credenciais e da homologação. O projeto ainda não possui endpoints de assinatura implementados.

**Decisão final do usuário:** seguir com o A1 já adquirido, sem contratar serviço. A alternativa interna foi implementada no código, com cofre criptografado para uso futuro e endpoints próprios, conforme [guia de integração](../../integrations/digital-signatures.md). As seções abaixo registram a análise anterior sobre CFO/Certillion; nenhuma credencial de provedor externo é necessária para o caminho interno escolhido.

## Requisitos confirmados

- Utilizar nome e CRO já cadastrados no perfil profissional.
- No receituário do espaço de consultas, “Incluir assinatura” habilita assinatura digital e validação na emissão.
- Desmarcado, gerar PDF comum sem registrar documento online de validação e sem emitir token.
- Manter histórico clínico existente separado do registro de validação online.
- Configurar certificado junto da imagem da assinatura, para uso futuro.
- Assinar e validar PDFs pela interface do sistema, com retorno claro da operação.
- Investigar a integração com o serviço de assinatura utilizado no portal CFO/CRO, em vez de criar busca de número de inscrição.

## Resultado da pesquisa: portal oficial versus integração

O manual do CFO informa login com certificado, obtenção do CPF do titular e verificação na base do conselho. O mesmo manual descreve validação pública de receitas existentes por código, sem login. Isso não documenta emissão pública por formulário de dados do dentista nem uma API aberta do CFO. Fonte: [manual oficial da prescrição](https://prescricao.cfo.org.br/assets/PRESCRI%C3%87%C3%83O_ELETR%C3%94NICA_COM_BAIXA.pdf).

A Certillion publica documentação de sua API, com autenticação da aplicação e autorização do signatário. Seu fluxo para A1/A3 utiliza assinador local. Assim, integrar seu motor não garante acesso à base profissional ou emissão de receitas no portal CFO. Fonte: [tutorial de integração Certillion](https://certillion.com/certillion-api/tutoriais/).

O fornecedor também documenta localização de certificados em nuvem por CPF. Essa busca localiza contas em prestadores de confiança; não encontra arquivos A1 no computador nem autentica o profissional por si só. Fonte: [contrato da API Certillion](https://certillion.com/certillion-api/api-certillion-assinatura-digital-documentacao/).

A OpenAI documenta chamadas de ferramentas externas; isso não estabelece qualquer serviço próprio de autenticação CFO/CRO. Assinatura e verificação continuam a cargo da infraestrutura criptográfica e das fontes autorizadas. Fonte: [function calling](https://developers.openai.com/api/docs/guides/function-calling).

## Decisão de integração necessária

| Caminho | Configurações | Autorização e condição de entrega |
|---|---|---|
| Certillion, motor documentado no fluxo CFO | CPF e seleção de certificado/PSC; A1 configurado no assinador local; manter imagem visual na página. | Credenciais próprias da aplicação, autorização do titular, aplicativo para A1 e homologação do fluxo de retorno. Não coletar PFX/senha no backend nesse caminho. |
| Serviço privado com processamento A1 | Importação temporária de PFX/P12 e senha na operação; metadados para reutilização do perfil. | Implementar ou contratar serviço compatível, comprovar política ICP-Brasil e definir custódia antes de qualquer armazenamento reutilizável de chave/senha. |

A exigência de anexar A1 e guardar senha para assinaturas futuras não pode ser tratada como comportamento da API Certillion. Antes de implementar esse formulário, confirmar qual caminho será utilizado. Não adicionar campos que coletam segredo sem um fluxo criptográfico efetivo e seguro.

## Auditoria de interface e design

Aplicadas as orientações de `web-design-guidelines` e `ui-ux-pro-max`, preservando o estilo existente de React, Tailwind e shadcn. O script de busca UI/UX não pôde executar porque os launchers Python disponíveis falharam; as recomendações abaixo vêm das regras e referências locais da skill, sem resultado de busca inventado.

| Arquivo/área | Problema identificado | Proposta |
|---|---|---|
| `src/pages/AdminPrescription.tsx`: opção de assinatura | Disponibilidade e estado inicial dependem de imagem, não de certificado; PDF pode apresentar imagem como assinatura eletrônica. | Switch explícito “Incluir assinatura”, inicialmente desligado, ligado à capacidade real de assinatura digital. Imagem é apresentação visual. |
| `src/pages/AdminPrescription.tsx`: ações de emissão | Salvar, imprimir e baixar usam fluxos diferentes; assinatura digital precisa de um resultado comum. | Quando ligado, ações de emissão convergem para o PDF assinado persistido. Salvar receita assinada emite e valida; baixar/imprimir reutilizam esse arquivo. |
| `src/pages/AdminSettings.tsx`: bloco profissional | Há imagem e nome/CRO, sem estado do certificado. | Dividir internamente em “Imagem da assinatura” e “Certificado digital”, mantendo um único cartão profissional. |
| Histórico | Não há estado digital separado. | Exibir “PDF comum”, “Assinatura pendente”, “Assinada”, “Validação indeterminada” ou “Cancelada”, com descrição e ação correspondente. |

Não alterar tipografia ou paleta global. Usar tokens semânticos existentes. Formulários com labels visíveis, botões de pelo menos 44 px, foco visível, status anunciado com `aria-live`, erro persistente próximo ao campo e ação de recuperação. Nenhum selo de sucesso antes da assinatura e verificação efetivas.

## Comportamento de “Incluir assinatura”

1. A seleção habilita a modalidade digital; não cria um documento vazio nem faz assinatura de conteúdo ainda em edição.
2. Exibir resumo do certificado vinculado e mensagem: “Ao emitir, a receita será assinada e terá código de validação”.
3. Se faltar configuração/autorização, apresentar ação “Configurar certificado”, mantendo o documento não emitido. Não recuar silenciosamente para imagem ou PDF comum.
4. No comando de emissão, congelar a versão revisada, gerar PDF, obter autorização se necessária, assinar, verificar, persistir arquivo privado e ativar token.
5. Exibir progresso: preparando documento, aguardando autorização, assinando, validando e concluído. Bloquear cliques duplicados durante processamento.
6. Se desligado, o caminho local existente gera PDF comum; nenhum documento/token de validação é criado. Um documento já assinado permanece preservado mesmo se o switch for desligado para a próxima emissão.
7. Alterações posteriores geram nova versão; a interface não apresenta o arquivo de uma versão anterior como correspondente ao novo conteúdo.

## Configuração profissional

- Nome/CRO: reutilizar perfil do usuário; não criar serviço de consulta numérica ao conselho.
- Imagem: manter upload visual existente.
- Certificado: apresentar tipo, titular mascarado, emissor, validade e data da verificação, somente após evidência real do provedor.
- CPF: input com teclado numérico e instruções; valor protegido no servidor e mascarado ao reexibir.
- Certillion/A1: orientar configuração no assinador local e vincular autorização ao usuário. Não disponibilizar upload de PFX ou senha de certificado para esse provedor.
- Nuvem: pesquisa de PSC por CPF não autoriza assinatura; solicitar autorização posterior do titular e conferir CPF retornado com o perfil.
- Senhas e tokens do provedor: nunca em localStorage, logs, analytics ou código; tokens reutilizáveis ficam somente no backend, protegidos e com expiração.
- Não afirmar “validado pelo CRO” apenas porque a assinatura é ICP-Brasil ou porque o CRO foi informado no perfil.

## Mapeamento técnico para Certillion

Rotas abaixo são propostas internas, ainda não existentes. Prefixo externo documentado: `/css/restful/application/oauth/`. A base de produção deve ser a fornecida para a modalidade credenciada; não reutilizar client_id/client_secret do portal CFO.

| Rota interna proposta | Operação externa/documentada | Guarda |
|---|---|---|
| `GET /digital-signatures/capabilities` | Verifica configuração sem revelar segredos. | Usuário admin/dentist autenticado. |
| `POST /digital-signatures/certificates/search` | `POST find-psc-accounts`, com CPF do próprio perfil. | Autenticado, limite de tentativas; segredo da aplicação apenas no servidor. |
| `POST /digital-signatures/authorization` | `authorize` e fluxo PKCE compatível com a modalidade escolhida. | Sessão, origem, state, vínculo com usuário e operação; somente destinos permitidos. |
| Callback de autorização | `token`, após retorno e conferência de state/PKCE. | Callback vinculado à operação, uso único, sem confiar em usuário/CPF da URL. |
| `POST /prescriptions/:id/digital-issue` | `document`, `signature`, download de `document/{transaction}`. | Emissor autenticado, versão imutável, idempotência e autorização do signatário. |
| `POST /prescriptions/:id/digital-validation` | `validate` sobre arquivo assinado. | Acesso clínico autorizado; distinguir estado criptográfico e estado operacional. |
| `POST /prescription-validation/token` | Consulta de registro próprio já persistido. | Público explicitamente documentado, token aleatório e resposta mínima. |

O token OAuth de acesso ao provedor e o código público de consulta da receita são diferentes. Persistir PDF antes do fim da retenção externa, sem depender do fornecedor como arquivo clínico permanente.

Não prometer ausência de qualquer tela de autorização externa no fluxo Certillion antes da homologação; o retorno pode ocorrer no sistema, mas a autorização é controlada pelo provedor. Se “nunca abrir outro site” for requisito absoluto também para autorizar, o caminho privado A1 precisa ser avaliado separadamente.

## Arquivos previstos

- Modificar `src/pages/AdminPrescription.tsx` e `src/pages/AdminSettings.tsx`.
- Criar `src/components/admin/DigitalSignatureSettings.tsx`, `src/components/admin/PrescriptionDigitalStatus.tsx` e `src/lib/digital-signatures.ts`.
- Criar `server/services/certillionClient.js`, `server/services/digitalPrescriptionService.js` e `server/routes/digitalSignatures.js`; registrar em `server/index.js`.
- Acrescentar entidades e migração aditiva em `server/prisma/schema.prisma`, preservando receitas e documentos existentes.
- Adaptar o armazenamento privado existente e a composição PDF para versão canônica emitida pelo servidor.
- Documentar configuração e homologação em `docs/integrations/digital-signatures.md`.

## Ordem e critérios de implementação

- [ ] Confirmar escolha do motor e credenciamento; conferir contratos/respostas e modalidade de autorização.
- [ ] Provar assinatura, download e validação em ambiente autorizado antes de habilitar a emissão na interface.
- [ ] Implementar cliente do provedor com autenticação no backend, limites, timeout e erros sem segredo.
- [ ] Implementar vínculo profissional e versão imutável; armazenar PDF privado e evidências reais.
- [ ] Conectar configuração e opção “Incluir assinatura”; assinatura desligada nunca chama emissão digital.
- [ ] Conectar resultado, token, consulta interna e download dos bytes assinados.
- [ ] Verificar autorização por usuário, proteção CSRF, falhas, repetição, senha/token ausentes e acesso anônimo negado nas rotas privadas.
- [ ] Verificar frontend/backend, build e segurança conforme `SECURITY.md`; tipos SNCR seguem os critérios do plano original.

**Limite atual:** pesquisa e design concluídos; não houve implementação de endpoints nem alteração de tela nesta revisão. A conexão real precisa de serviço definido e credenciais próprias, e o formulário A1 depende da decisão entre assinador local e custódia interna.
