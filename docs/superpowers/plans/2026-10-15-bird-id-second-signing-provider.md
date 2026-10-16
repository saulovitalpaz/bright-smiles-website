# Bird ID como segunda opção de assinatura — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. A delegação só deve ocorrer quando autorizada pelo usuário ou pelas instruções aplicáveis.

**Goal:** Oferecer “Certificado A1” e “Bird ID em nuvem” na emissão de receitas simples, preservando assinatura verificável, PDF canônico, armazenamento privado e validação por token.

**Architecture:** A1 permanece no motor pyHanko existente. Bird ID usa autorização hospedada pela Soluti, OAuth Authorization Code com PKCE e um adaptador CESS para assinar PDFs; Express coordena a operação persistida e valida o resultado antes de publicar o documento. React permite escolher o método e acompanhar a operação, sem receber credenciais do fornecedor.

**Tech Stack:** React/TypeScript, Express/Node, Prisma/PostgreSQL, S3 privado, pyHanko/ReportLab e API Bird ID/CESS.

**Status:** planejamento iniciado; nenhuma rota, dependência, migração ou credencial Bird ID ativada. Base dos upgrades: commit cf8931d, enviado a origin/main. Data de elaboração: 15/10/2026.

## Global Constraints

- Seguir SECURITY.md integralmente. Dados de pacientes, receitas, autenticação e storage são sensíveis.
- A1 continua disponível e é o padrão; requisições antigas sem provider conservam seu comportamento.
- Bird ID é opcional e desabilitado por padrão. Ausência de configuração nunca simula assinatura nem marca documento como válido.
- Apenas admin/dentist com papel atual conferido no banco podem iniciar, consultar ou cancelar suas operações.
- Conservar as regras existentes de login recente/reautenticação, consentimento e conferência de perfil/paciente.
- Nenhuma alteração na chave, envelope ou dados existentes de DigitalCertificate.
- O token público de documento continua independente de OAuth, state, ID de operação e TCN.
- A1 e Bird ID compartilham o mesmo formato canônico de receita e link/QR antes da assinatura.
- Não assinar automaticamente por A1 quando o usuário escolheu Bird ID.
- Nenhum PDF anterior é regravado; nenhum certificado real ou conteúdo clínico é usado em testes.
- Homologação e produção têm configurações separadas. Não enviar dados reais ao ambiente de testes do fornecedor.
- Aceitação pelo Acrobat/AATL e confiança ICP-Brasil devem ser verificadas separadamente; não prometer aceitação automática de todo A3.

## Decisões e dependências externas

A implementação planejada usa CESS para produzir PAdES. A API simples de assinatura de hashes não devolve um PDF pronto. O uso de RAW com montagem remota por pyHanko fica fora desta primeira versão.

Recomendação de implantação: avaliar CESS em serviço privado sob controle da clínica, conectado ao PSC Soluti. Isso evita expor o PDF completo a um serviço público não contratado. Se for escolhido CESS gerenciado, confirmar previamente contrato, retenção e processamento de dados clínicos. Não conceder credenciais gerais do bucket ao CESS: o backend envia apenas o documento autorizado e recupera o resultado.

Antes de implementar o adaptador externo real, registrar num documento de homologação, sem segredos:

- [ ] Aplicação aprovada pela Soluti; identificador da aplicação e credenciais inseridos exclusivamente no gerenciador de segredos.
- [ ] Redirect URI HTTPS cadastrada e escopo específico de assinatura confirmado.
- [ ] Ambiente de homologação, certificado fictício e conta de teste disponibilizados.
- [ ] Modalidade CESS, imagem/versão suportada, licença, endpoint e autenticação de serviço confirmados.
- [ ] Compatibilidade do token OAuth com a instância CESS contratada demonstrada com uma chamada sintética.
- [ ] Perfil PAdES, requisitos de carimbo do tempo e ACT definidos com a Soluti.
- [ ] Limites de tamanho, duração, retenção de arquivos e recuperação de transações documentados.
- [ ] Procedimento de reconciliação para timeout de criação de TCN confirmado. Não presumir suporte de idempotência do fornecedor.
- [ ] URLs de revogação/AIA necessárias revisadas a partir da cadeia pública oficial.

As tarefas de contratos locais, persistência, UI e testes simulados podem avançar sem credenciais. A homologação externa e a ativação ficam condicionadas aos itens acima. Não pedir senha/OTP/chave pelo chat.

## Fluxo proposto

1. Usuário ativa “Incluir assinatura” e escolhe A1 ou Bird ID.
2. A1 segue a emissão atual. Bird ID cria uma operação vinculada ao usuário, conteúdo e versão revisada.
3. Backend gera state e verifier aleatórios, guarda dados cifrados e devolve apenas a URL de autorização e o ID opaco da sessão.
4. Usuário autoriza no site/app do fornecedor; callback volta ao backend.
5. Backend valida state, expiração e vínculo com a sessão do usuário e faz troca do código uma única vez.
6. Certificado público selecionado é conferido: identidade do profissional, cadeia, validade, política A3 admitida e revogação. Uma associação inicial de identidade deve ser confirmada pelo profissional autenticado; nunca inferir CPF de username nem de texto livre.
7. Backend gera o PDF canônico e o token do documento, submete ao CESS e acompanha a transação.
8. Resultado é recuperado, validado localmente e comparado ao documento autorizado; só então é persistido e concluído.
9. Interface disponibiliza o PDF final e a página oficial de validação. Cancelamento ou falha preserva o histórico de operação sem emitir receita válida.

## Contratos da aplicação

Os caminhos abaixo são propostas internas do projeto, não endpoints Soluti:

| Endpoint proposto | Resposta e autorização |
|---|---|
| GET /digital-signatures/providers | Métodos disponíveis; conta clínica autenticada. |
| POST /digital-signatures/bird-id/sessions | 201 com sessionId, status e authorizationUrl; valida receita e titular atual. |
| GET /digital-signatures/bird-id/callback | Retorno OAuth; exige sessão clínica do iniciador, state válido e expiração; não depende de Origin de navegação externa. |
| POST /digital-signatures/bird-id/sessions/:id/advance | Avança uma etapa mediante bloqueio/lease e papel atual; idempotente. |
| GET /digital-signatures/bird-id/sessions/:id | Estado resumido do próprio usuário; sem segredo/TCN/URL do fornecedor. |
| POST /digital-signatures/bird-id/sessions/:id/cancel | Cancela o fluxo local; não promete desfazer uma assinatura já executada no fornecedor. |

Não reutilizar GET de status para criar assinaturas ou trocar códigos. O endpoint advance controla explicitamente os efeitos de rede. A primeira versão usa consulta autenticada ao fornecedor, sem webhook público.

~~~ts
type SigningProvider = 'A1' | 'BIRD_ID';
type BirdIdStatus =
  | 'AWAITING_AUTHORIZATION' | 'EXCHANGING_CODE' | 'AUTHORIZED'
  | 'SUBMITTING' | 'SIGNING' | 'VALIDATING'
  | 'COMPLETE' | 'CANCELLED' | 'EXPIRED' | 'FAILED'
  | 'RECONCILIATION_REQUIRED';

type StartBirdIdInput = {
  requestId: string;
  patientId: number;
  content: string;
  prescriptionType: 'SIMPLE';
  expectedPatient: { name: string; cpf: string };
  accountPassword?: string;
};
type BirdIdSessionView = {
  sessionId: string;
  status: BirdIdStatus;
  expiresAt: string;
  errorCode?: string;
  issue?: DigitalIssue;
};
~~~

DigitalIssue é o tipo já definido em src/lib/digital-prescriptions.ts. Somente COMPLETE pode retorná-lo. authorizationUrl só aparece na criação/renovação explícita de autorização e não é persistida no navegador.

## Tarefa 1 — contratos e disponibilidade dos métodos

**Arquivos**
- Criar server/services/signingProviders.js.
- Criar server/test/signing-providers.test.js.
- Modificar server/routes/digitalSigning.js e src/lib/digital-prescriptions.ts.

**Interface produzida:** normalizeProvider(value) retorna A1 ou BIRD_ID; providerAvailability(config) retorna somente disponibilidade e códigos de motivo seguros. Configuração secreta nunca sai da API.

- [ ] Escrever o teste abaixo e executar para confirmar falha antes da implementação.
~~~js
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeProvider } = require('../services/signingProviders');
test('legacy requests remain A1 and unsupported methods fail closed', () => {
  assert.equal(normalizeProvider(undefined), 'A1');
  assert.equal(normalizeProvider('BIRD_ID'), 'BIRD_ID');
  assert.throws(() => normalizeProvider('OTHER'));
});
~~~
- [ ] Implementar a normalização mínima:
~~~js
function normalizeProvider(value = 'A1') {
  if (value !== 'A1' && value !== 'BIRD_ID') {
    throw Object.assign(new Error('Método de assinatura inválido.'), { status: 400 });
  }
  return value;
}
module.exports = { normalizeProvider };
~~~
- [ ] Acrescentar disponibilidade somente quando BIRD_ID_ENABLED=true e a configuração completa tiver sido validada. Sem configuração, retornar BIRD_ID_NOT_CONFIGURED e preservar o estado A1.
- [ ] Testar ausência de autenticação (401), papel manager (403), configuração incompleta e ausência de segredos no JSON.
- [ ] Executar node --test server/test/signing-providers.test.js server/test/digital-signing.test.js; exigir zero falhas.
- [ ] Commit: feat: define optional digital signing providers.

Configurações propostas: BIRD_ID_ENABLED, BIRD_ID_API_BASE_URL, BIRD_ID_CLIENT_ID, BIRD_ID_CLIENT_SECRET, BIRD_ID_REDIRECT_URI, BIRD_ID_SIGNATURE_SCOPE, BIRD_ID_SESSION_KEY, BIRD_ID_CESS_BASE_URL. Autenticação de serviço CESS será configurada conforme o contrato verificado, sem inventar headers. Endpoints são configuração administrativa allowlisted; nunca aceitos do navegador.

## Tarefa 2 — persistência cifrada e concorrência

**Arquivos**
- Modificar server/prisma/schema.prisma.
- Criar migração aditiva em server/prisma/migrations, com timestamp da execução.
- Criar server/services/birdId/sessionStore.js e server/utils/birdIdSessionVault.js.
- Criar server/test/bird-id-session-store.test.js e server/test/bird-id-vault.test.js.

**Interfaces**
- createSession({ userId, requestId, inputHash, sealedRequest, expiresAt }) retorna sessão persistida.
- claimStage({ sessionId, userId, expectedStatus, nextStatus, leaseUntil }) realiza transição atômica e devolve apenas a sessão adquirida.
- finishSession({ sessionId, userId, expectedStatus, nextStatus, updates }) exige o estado/lease esperado.
- sealSession(userId, sessionId, payload) / openSession(userId, sessionId, envelope) usam AES-256-GCM com chave independente e AAD incluindo usuário/sessão.

Persistir uma BirdIdSession relacionada a DigitalIssueOperation: id, operationId único, userId, status, stateDigest único e anulável após consumo, sealedRequest, sealedOAuth anulável, sealedTransaction anulável, unsignedStorageKey anulável, unsignedHash anulável, expiresAt, leaseUntil, errorCode, createdAt e updatedAt. Dados de estado são metadados; CPF, conteúdo, PKCE, tokens e TCN ficam somente nos envelopes cifrados ou no storage privado.

Adicionar provider com default A1 a DigitalIssueOperation e DigitalPrescription. Preservar a restrição única userId/requestId; reutilizar o mesmo requestId com outro método deve retornar conflito. Manter exatamente o inputHash legado A1 para que retentativas de emissões antigas continuem válidas; usar uma versão identificável para hash Bird ID.

- [ ] Testar que envelope de uma sessão não abre em outro usuário/sessão, e adulteração falha.
- [ ] Testar duas instâncias concorrentes adquirindo o mesmo estágio: somente uma executa o efeito externo.
- [ ] Testar state consumido, expiração, replay, operação cancelada e troca de provider com requestId reaproveitado.
- [ ] Implementar store com compare-and-set no banco; Map em memória não é controle de concorrência suficiente.
- [ ] Testar restauração com chave Bird ID e dados sintéticos, e garantir que o cofre A1 permanece legível.
- [ ] Aplicar a migração somente em banco isolado de teste nesta etapa; verificar registros históricos default A1 e constraints.
- [ ] Executar node --test server/test/bird-id-session-store.test.js server/test/bird-id-vault.test.js.
- [ ] Commit: feat: persist encrypted Bird ID signing sessions.

Retenção inicial proposta: state/autorizações de iniciação até 10 minutos, sempre respeitando um TTL menor devolvido pelo provedor. Apagar tokens e verifier ao concluir/cancelar/expirar; manter metadados mínimos para reconciliação. Timeouts incertos de efeitos externos usam RECONCILIATION_REQUIRED, sem reenviar automaticamente.

## Tarefa 3 — OAuth e identidade do signatário

**Arquivos**
- Criar server/services/birdId/oauthClient.js.
- Criar server/routes/birdIdSigning.js e registrar em server/index.js.
- Criar server/test/bird-id-oauth.test.js e server/test/bird-id-routes.test.js.
- Criar server/signing/remote_certificate.py e server/signing/test_remote_certificate.py.
- Modificar server/signing/engine.py somente para expor inspeção do certificado público remoto.

**Interfaces**
- createAuthorization({ state, challenge, scope }) retorna URL do host configurado.
- exchangeCode({ code, verifier }) retorna token e expiração apenas no backend.
- discoverCertificate({ accessToken }) retorna certificado público selecionado.
- Operação worker inspect_remote_certificate recebe cadeia pública e identidade esperada; retorna metadados saneados ou erro explícito.

A inspeção remota precisa admitir a política A3 selecionada e verificar confiança/revogação independentemente da inspeção de PFX A1. Não relaxar a regra A1 atual para “qualquer certificado”.

- [ ] Escrever testes: state incorreto/expirado/usado, callback sem sessão, sessão de outro usuário, papel alterado, erro/recusa do fornecedor e indisponibilidade na troca.
- [ ] Gerar state/verifier com crypto.randomBytes; PKCE S256 = Base64URL(SHA-256(verifier)).
- [ ] Guardar state pelo digest e consumir atomicamente antes da troca. Tratar retorno repetido como operação já processada.
- [ ] Callback devolve 303 para rota fixa do frontend, sem code/state/token na URL final. Aplicar no-store e no-referrer; remover query sensível de logs do proxy.
- [ ] Se cookie de sessão não acompanhar o retorno por política do navegador, solicitar novo início após login; nunca aceitar apenas state como identificação do usuário.
- [ ] Validar a identidade autorizada pelo provedor e certificado contra o vínculo profissional; divergência interrompe o fluxo.
- [ ] Usar cliente HTTP com timeout, limite de resposta, redirecionamentos desativados e hosts fixos. Não imprimir erro bruto do provedor.
- [ ] Executar os testes Node acima e unittest de test_remote_certificate.py usando cadeia sintética.
- [ ] Commit: feat: authorize Bird ID sessions with PKCE.

## Tarefa 4 — PDF canônico, CESS e validação antes de concluir

**Arquivos**
- Criar server/services/birdId/cessClient.js e server/services/birdId/issueService.js.
- Criar server/test/bird-id-issuance.test.js e server/test/bird-id-cess-contract.test.js.
- Criar server/signing/test_remote_pdf.py.
- Modificar server/signing/engine.py, server/utils/patientDocumentStorage.js e server/routes/birdIdSigning.js.

**Interface do adaptador interno CESS** — formato deliberadamente independente do JSON do fornecedor:
~~~ts
interface CessAdapter {
  submit(input: {
    pdf: Uint8Array;
    certificateAlias: string;
    accessToken: string;
    operationId: string;
  }): Promise<{ transactionId: string }>;
  status(transactionId: string): Promise<'WAITING' | 'SIGNED' | 'ERROR'>;
  download(transactionId: string): Promise<Uint8Array>;
}
~~~

- [ ] Contrato de homologação deve fixar os campos reais de submit e autenticação antes de codificar o adaptador. Não copiar campos de exemplo não documentados.
- [ ] Escrever teste completo com adaptador sintético: autorizar → preparar PDF → assinar → recuperar → validar → persistir → recuperar por token.
- [ ] Acrescentar testes para PDF sem assinatura, outra identidade, conteúdo diferente, hash inválido, limite excedido, assinatura indeterminada e TCN já concluído.
- [ ] Expor preparação canônica sem assinatura como operação interna do worker. Gerar token uma vez, incluí-lo em QR/link e armazenar bytes/hash antes de submeter.
- [ ] Verificar o resultado como assinatura incremental do PDF autorizado, com o prefixo de bytes original preservado e diff permitido apenas para assinatura/evidências. Exigir identidade/fingerprint esperado, cobertura adequada, confiança e revogação.
- [ ] Configurar CESS sem auto-reparação/reformatação do conteúdo. Se o produto contratado não preservar a revisão original, bloquear homologação e revisar a estratégia; comparação apenas de texto extraído não é prova suficiente.
- [ ] Nunca aceitar a resposta SIGNED do CESS como prova criptográfica. Apenas resultado local VALID habilita persistência.
- [ ] Usar registro único por operação e transação para criar Prescription e DigitalPrescription. Revalidar perfil/paciente/consentimento antes do envio; conferir novamente antes de concluir. Divergências após envio ficam registradas sem disponibilizar documento como receita vigente.
- [ ] Falha após envio, upload ou commit exige reconciliação; nunca apagar um PDF já ativado por perda de confirmação de commit.
- [ ] Acrescentar retomada de operações com TCN conhecido. SUBMITTING sem TCN após timeout fica em RECONCILIATION_REQUIRED.
- [ ] Executar node --test server/test/bird-id-issuance.test.js server/test/bird-id-cess-contract.test.js e testes Python remotos.
- [ ] Commit: feat: issue and verify canonical prescriptions through Bird ID.

Não há dependência da migração A1 para outra biblioteca nem necessidade de bucket público. Restrição da leitura por token e hash permanece idêntica.

## Tarefa 5 — escolha de método e retomada na interface

**Arquivos**
- Criar src/hooks/useBirdIdPrescription.ts e seu teste.
- Criar src/components/admin/BirdIdSignatureStatus.tsx e seu teste.
- Modificar src/pages/AdminPrescription.tsx, src/hooks/useDigitalPrescription.ts e src/lib/digital-prescriptions.ts.
- Modificar src/pages/AdminSettings.tsx para mostrar disponibilidade Bird ID sem formulário de PFX/OTP.
- Criar src/pages/BirdIdSignatureReturn.tsx e registrar a rota conforme o router atual.

**Interface produzida:** useBirdIdPrescription expõe start(input), advance(sessionId), cancel(sessionId), session, pending e error. Usa os contratos internos definidos acima. O retorno OAuth mostra status; não executa assinatura em um GET automaticamente.

- [ ] Testar A1 como padrão e ausência de regressão no caminho sem assinatura.
- [ ] Testar escolha Bird ID indisponível com motivo claro, sem iniciar requisições ao fornecedor.
- [ ] Testar mudanças em paciente/conteúdo/método invalidando resultado anterior e chave idempotente apropriada.
- [ ] Mostrar etapas “Aguardando autorização”, “Assinando”, “Conferindo documento” e “Concluído”.
- [ ] Persistir apenas ID opaco de sessão temporariamente em sessionStorage se necessário para retomada; autorização continua sendo feita no servidor. Nenhum segredo/CPF/conteúdo vai para storage do navegador.
- [ ] Cancelamento, janela fechada e autorização expirada devem oferecer ação explícita de retomada ou novo início.
- [ ] Conclusão reaproveita os botões existentes de PDF, impressão e validação; não reconstruir o PDF no navegador.
- [ ] Testar navegação/retorno em desktop e celular, teclado, estados anunciados, popup bloqueado e ausência de overflow.
- [ ] Executar testes dos hooks/componentes e suite de impressão existente.
- [ ] Commit: feat: offer Bird ID alongside A1 in prescriptions.

## Tarefa 6 — homologação, implantação e rollback

**Arquivos**
- Criar docs/integrations/bird-id-acceptance.md com evidências sem dados reais/segredos.
- Atualizar docs/integrations/bird-id-research.md e docs/integrations/digital-signatures.md.
- Acrescentar teste opcional server/test/bird-id-provider-integration.test.js condicionado ao ambiente de homologação.

- [ ] Rodar um documento sintético no fornecedor real com certificado de teste. Comparar identidade, política, PDF original, QR/link, bytes baixados e estado de revogação.
- [ ] Conferir PAdES em validador local, ITI e Acrobat/AATL, registrando versões e diferenças de confiança sem ocultar rejeições.
- [ ] Simular expiração, indisponibilidade, mudança de perfil, recusa, concorrência, replay e timeout de efeito incerto.
- [ ] Verificar backup privado e restauração isolada de banco, bucket, chave A1 e nova chave Bird ID antes de aplicar migração/configuração em produção.
- [ ] Executar frontend completo, backend completo, integração A1, testes Bird ID, Python, TypeScript, build, scanner de segredos e git diff --check.
- [ ] Publicar código com Bird ID desabilitado, aplicar migração aditiva e verificar A1/histórico.
- [ ] Habilitar Bird ID somente após credenciais, contrato e evidências de homologação concluídos.
- [ ] Rollback: desabilitar Bird ID, interromper novas submissões e preservar reconciliação de operações em andamento. A1 e os PDFs já emitidos continuam acessíveis.
- [ ] Commit: docs: record Bird ID acceptance and operational recovery.

## Comandos de verificação

~~~powershell
node --test server/test/*.test.js
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json
node node_modules/vite/bin/vite.js build
node scripts/check-changed-secrets.mjs
git diff --check
~~~

Para o worker, usar SIGNING_TEST_PYTHON apontando para um runtime validado com server/signing/requirements-qa.txt. Executar unittest discover em server/signing e a integração digital-worker-integration.test.js. Não alterar o allowlist de ambiente do worker apenas para adaptar uma instalação local de Python.

## Fontes e verificação do plano

- [Pesquisa do projeto](../../integrations/bird-id-research.md).
- [OAuth Authorization Code/PKCE](https://docs.vaultid.com.br/workspace/cloud/api/autenticacao-de-usuarios/autenticacao-em-sistemas-web).
- [API básica de hashes](https://docs.vaultid.com.br/workspace/cloud/api/uso-de-certificado/assinatura-digital).
- [Fluxo CESS para documentos](https://docs.vaultid.com.br/workspace/cess/api/assinatura-de-documento-s).
- [Instalação e requisitos comerciais/técnicos CESS](https://docs.vaultid.com.br/workspace/cess/instalacao-e-configuracao).

O desenho interno é uma proposta para este repositório, não uma declaração de garantia do fornecedor. A revisão do plano conferiu: preservação do A1; identidade/PKCE; persistência/concorrência; integridade do PDF autorizado; privacidade; UI; homologação e rollback. Os contratos de funções e caminhos são únicos neste documento. Dependências externas estão explicitadas como critérios de entrada, sem credenciais fictícias ou integração simulada apresentada como pronta.
