# Plano de implementação: receitas odontológicas com e-CPF A1, token e validação interna

**Data da pesquisa:** 13/10/2026. **Status:** proposta de implementação; funcionalidades ainda não implementadas.

**Decisão final autorizada:** usuário possui e-CPF A1 e autorizou o processamento interno com cadastro de arquivo, CPF e senha para assinaturas futuras, sem provedor contratado. A implementação local e seus critérios de implantação estão descritos em [assinatura digital interna](../../integrations/digital-signatures.md). Isso substitui a escolha de fornecedor e a premissa de importação a cada assinatura deste plano inicial; cofre próprio com chave independente, verificação fresca e reautenticação protegem o uso futuro. Os documentos iniciais são preservados como histórico de construção.

**Atualização após esclarecimento do usuário:** o CRO já consta do perfil. A pesquisa solicitada diz respeito ao serviço oficial de assinatura do portal CFO/CRO. O [adendo de design e integração](2026-10-13-receituarios-assinatura-design-integracao.md) documenta essa distinção e prevalece sobre a proposta inicial quando houver divergência de fluxo. A API Certillion tem documentação pública e exige credenciamento; não foi confirmada API pública de emissão do próprio CFO. O fluxo Certillion para A1 utiliza assinador local, sem envio do PFX/senha ao backend.

**Objetivo:** importar certificado e-CPF A1, assinar a receita PDF com ICP-Brasil e validar o arquivo ou consultar sua autenticidade por token dentro deste sistema, com identificação e verificação profissional do cirurgião-dentista.

**Arquitetura:** React/Vite mantém o fluxo de emissão e validação; Express autoriza cada operação e coordena persistência; um serviço privado de assinatura processa PKCS#12, assina e verifica PDFs. PostgreSQL/Prisma registra versões e evidências; o armazenamento privado existente guarda os PDFs. Integrações externas são realizadas pelo backend, sem exigir abertura de outro site para assinar ou validar cada receita.

**Tecnologias:** React 18, TypeScript, Express, Prisma/PostgreSQL e armazenamento S3 compatível existentes. Serviço Python com pyHanko como candidato técnico para assinatura e verificação; sua adoção depende de prova de conformidade ICP-Brasil. Não fixar uma versão de biblioteca antes de conferir suporte, licença e vulnerabilidades.

## 1. Premissas e limites do escopo

- “Receita” significa prescrição odontológica, não Receita Federal. O certificado é e-CPF A1 do dentista.
- “Token da receita” é inicialmente um código secreto de consulta acompanhado de QR Code. Token A3 em USB é uma modalidade diferente, descrita como extensão na seção 12.
- Toda emissão, importação, visualização e validação acontece na interface deste sistema. Isso permite chamadas de rede a autoridades certificadoras, carimbo do tempo, cadastro profissional e Anvisa.
- Emissão inicial do certificado, credenciamento do serviço e autorizações sanitárias podem exigir procedimentos externos prévios. O fluxo interno não substitui esses procedimentos.
- Certificado identifica uma pessoa física; não comprova, por si só, inscrição ativa no CRO.
- Código de consulta, imagem da assinatura, nome/CRO impressos e hash isolado não substituem assinatura digital qualificada.
- Uma assinatura criptograficamente válida não comprova automaticamente prazo clínico da receita, habilitação profissional atual, regularidade sanitária ou disponibilidade para dispensação. A interface mostra cada resultado separadamente.
- Não prometer selo oficial ITI, API pública do CFO ou consulta profissional automática enquanto acesso e contrato de integração não estiverem comprovados.
- A proposta contempla importação de PDF para assinatura e importação de PDF já assinado para validação. Só vincular um arquivo externo a um paciente após conferência autenticada; não inferir identidade apenas pelo nome do arquivo ou OCR.

## 2. Diagnóstico do projeto

| Arquivo existente | Situação e alteração prevista |
|---|---|
| `src/pages/AdminPrescription.tsx` | Emissão/histórico; acrescentar assinatura A1, importação e resultados de validação. |
| `src/components/PrescriptionGenerator.tsx` | Renderiza PDF com identidade e assinatura visual; separar apresentação de evidência criptográfica e reutilizar composição no servidor. |
| `src/lib/professional-signature.ts` | Confere nome/CRO e referência de imagem; manter finalidade visual e criar módulo distinto para assinatura digital. |
| `src/pages/AdminSettings.tsx` | Perfil com nome/CRO e imagem; incluir metadados do certificado e situação de verificação profissional. |
| `server/index.js` | Rotas de receitas usam autenticação e papéis; criação ainda não registra emissor nem assinatura, e exclusão é física. Registrar novas rotas em módulos e bloquear exclusão de receitas emitidas. |
| `server/prisma/schema.prisma` | `User` tem CRO textual; `Prescription` tem conteúdo, paciente e odontograma. Acrescentar identidade estruturada, emissor, versões, assinatura e evidências. |
| `server/utils/patientDocumentStorage.js` | Padrão de armazenamento privado; criar funções próprias para receitas assinadas e relatórios. |
| `server/utils/encryption.js` | Criptografia existente; preservar compatibilidade das chaves e dados atuais. |
| `server/utils/validationSchemas.js` | Ampliar schemas para perfil, upload, assinatura e validação. |
| `server/middleware/auditLogger.js` | Integrar eventos sem registrar conteúdo clínico, senhas, chaves ou tokens. |

## 3. Pesquisa oficial e implicações

### CFO e CRO

O portal de prescrição do CFO restringe o acesso a cirurgiões-dentistas ativos com certificado ICP-Brasil. Também informa necessidade de aplicativo auxiliar para A1/A3 em sua própria plataforma. Isso confirma o contexto odontológico, mas não documenta uma API aberta que nosso sistema possa utilizar. Fonte: [acesso à prescrição CFO](https://prescricao.cfo.org.br/login) e [perguntas frequentes CFO](https://prescricao.cfo.org.br/perguntas-frequentes).

**Decisão:** usar certificado pessoal ICP-Brasil e verificar CRO por uma integração autorizada ou por conferência documental registrada internamente. Não copiar endpoints privados nem automatizar login/CAPTCHA do CFO. A conferência manual deve aparecer como “CRO conferido documentalmente”, com data, responsável e validade de revisão, sem afirmar consulta automática ao conselho.

### ITI e validação

O VALIDAR do ITI afere conformidade de assinaturas qualificadas e avançadas. A classificação pode ser aprovada, reprovada ou indeterminada quando faltam evidências. Fontes: [serviço VALIDAR](https://www.gov.br/pt-br/servicos/validar-servico-de-validacao-de-assinaturas-eletronicas) e [glossário do relatório](https://validar.iti.gov.br/glossarioRelatorioDeConformidade.html).

**Decisão:** verificação interna com cadeia ICP-Brasil, integridade, revogação e tempo. Um relatório interno precisa identificar seu motor e política; não deve ser apresentado como relatório emitido pelo ITI. A pesquisa não confirmou uma API pública atual do VALIDAR apropriada para este uso. Não depender de scraping, iframe ou upload automatizado ao portal. Usar o VALIDAR como referência de homologação; essa comparação externa é uma atividade técnica anterior à entrega, não uma etapa exigida do dentista.

### Anvisa e SNCR

A orientação publicada para a nova etapa do SNCR informa que os sistemas de prescrição se comunicam com sua API e que o prescritor continua no próprio sistema. Fonte: [etapa iniciada em setembro de 2026](https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/inicio-de-nova-etapa-do-sncr-o-que-muda-a-partir-de-30-de-setembro).

O informe de 09/10/2026 permite emissão eletrônica de RCE/RET sem numeração SNCR até 29/10/2026, no fluxo de transição e observados os demais requisitos. Relata também correção de numerações atribuídas a outros prescritores. Fonte: [documentação e informes para serviços de prescrição](https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/sncr/documentos-do-sncr).

**Decisão:** classificar o receituário antes da assinatura, implementar integração SNCR para tipos abrangidos e conferir CPF, conselho, UF e titular da numeração retornada. Uma falha externa não libera emissão irregular. Qualquer exceção de transição deve ter data final, base normativa e trilha de auditoria; rever a orientação na implantação. Não reutilizar regras de notícias antigas nem de minutas como se fossem norma vigente.

As orientações da RDC 1000/2025 distinguem assinatura qualificada exigida para controlados de assinatura avançada gov.br. Fonte: [perguntas e respostas da Anvisa](https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/sncr/perguntas-e-respostas/perguntas-e-respostas-rdc-1000-2025-1-ed).

### Motor de assinatura

pyHanko possui suporte a material PKCS#12, assinatura PAdES e verificação de PDF. A documentação alerta que sua validação não comprova sozinha todos os requisitos estruturais de cada perfil PAdES. Fontes: [assinatura](https://github.com/MatthiasValvekens/pyHanko/blob/master/docs/lib-guide/signing.rst) e [validação](https://docs.pyhanko.eu/en/latest/cli-guide/validation.html).

**Decisão:** é candidato para prova técnica, não uma garantia automática de conformidade ICP-Brasil. Validar política brasileira, cadeia, algoritmos, carimbo do tempo e interoperabilidade antes da escolha definitiva.

## 4. Alternativas e recomendação

| Alternativa | Benefícios | Custo/limitação |
|---|---|---|
| **Serviço privado de assinatura integrado — recomendado** | A1 e PDF processados dentro da infraestrutura; interface única; controle das evidências. | Manutenção criptográfica, configuração de confiança e homologação próprias. |
| API contratada de assinatura e validação | Reduz manutenção do motor; pode oferecer conformidade e SLA contratados. | Custos, transferência de dados sensíveis e confirmação de suporte real a A1 sem redirecionamento. |
| Assinatura local por agente instalado | Chave não precisa sair do computador; caminho para A3 USB. | Instalação, drivers, atualizações e suporte em cada estação. |

Adotar a primeira alternativa com A1 temporário. Se a prova de conformidade falhar, selecionar um provedor contratualmente compatível antes de publicar a assinatura digital.

## 5. Experiência completa dentro do sistema

1. **Perfil profissional:** dentista informa CPF, nome e CRO/UF. O backend valida formato e dígitos, e registra evidência de habilitação profissional. CPF é protegido e mascarado na interface.
2. **Receita:** selecionar paciente, preencher medicamentos, posologia, quantidade, data e tipo de receituário; revisar conteúdo final. Conteúdo livre existente pode continuar em rascunhos, mas tipos regulados exigem campos estruturados.
3. **Origem do PDF:** escolher “Gerar PDF da receita” ou “Importar PDF para assinar”. Arquivo importado aparece em visualizador interno antes da confirmação.
4. **Assinatura:** abrir modal, selecionar `.pfx`/`.p12` e informar senha. Exibir titular mascarado, emissor e validade; mostrar erros sem dados sensíveis. Confirmar explicitamente a assinatura do documento revisado.
5. **Processamento:** conferir titular com profissional autenticado, validade, cadeia e revogação; executar integração sanitária necessária; assinar o PDF final e verificar o resultado.
6. **Conclusão:** mostrar assinatura, habilitação profissional e situação sanitária em campos distintos; disponibilizar o arquivo assinado armazenado, token/QR Code e relatório interno.
7. **Validação interna:** aba “Validar receita” aceita arquivo PDF ou código de consulta. Não abre nova aba nem exige acesso ao site do CFO/ITI.
8. **Histórico:** receitas assinadas ficam imutáveis. Correção cria nova versão; cancelamento registra motivo e estado, preservando arquivo e evidências.

Não reutilizar a impressão do navegador como PDF assinado. O download deve entregar exatamente os bytes persistidos após a assinatura. Impressão em papel contém referência para consulta, mas não carrega a assinatura criptográfica verificável do arquivo eletrônico.

## 6. Segurança do A1, PDFs e token

Aplicar `SECURITY.md` integralmente.

- MVP: importar A1 a cada operação, com arquivo e senha apenas em memória durante o processamento. Não armazenar A1 no banco, bucket, localStorage, logs, filas ou auditoria. Metadados públicos mínimos podem ser persistidos.
- HTTPS; sessões por cookie HttpOnly/Secure; proteção CSRF/Origin em operações autenticadas; reautenticação recente antes de assinar.
- Serviço de assinatura sem acesso público, autenticação entre serviços, limites de CPU/memória e tempo. Evitar arquivos temporários persistentes; se indispensáveis, usar armazenamento efêmero isolado e limpeza também em falhas. Impedir captura de corpos por APM e dumps de processos.
- Limites iniciais propostos: A1 de até 1 MiB; PDF de até 10 MiB e 100 páginas. Validar bytes e estrutura no servidor. Rejeitar arquivo disfarçado, PDF criptografado por senha, JavaScript, anexos executáveis e estrutura malformada. Processar parser em sandbox.
- Verificar que o certificado é de pessoa física, contém chave privada utilizável e permite assinatura; conferir CPF nos campos ICP-Brasil apropriados. Não extrair CPF por regex do nome do titular.
- Checar cadeia até raízes ICP-Brasil controladas, validade, algoritmos aceitos e revogação OCSP/LCR. Indisponibilidade de evidência gera resultado indeterminado e impede publicação como validado.
- Carimbo do tempo confiável deve vir de autoridade adequada à política ICP-Brasil escolhida. Horário local do servidor não equivale a carimbo confiável. Meta de assinatura: perfil PAdES com evidências de longo prazo, sujeito à homologação da política específica.
- Restringir egress de OCSP/LCR/TSA e consulta profissional. URLs presentes em PDFs/certificados não podem acessar localhost, rede interna, metadados de nuvem ou redirecionamentos não autorizados; impor limites de download e tempo.
- PDF, relatório e evidências em armazenamento privado; acesso conferido por paciente, emissor e escopo organizacional existente. Papel `admin` isoladamente não autoriza assinar usando a identidade de outro profissional.
- Gerar token com `crypto.randomBytes(32).toString('base64url')`. Persistir somente digest SHA-256; comparar com segurança. Nunca usar ID sequencial, CPF ou número de CRO como token.
- Criar token antes da renderização para embutir QR Code; ativá-lo somente após assinatura, verificação e persistência concluídas. QR Code do sistema e QR Code/numeração regulatória são identificados separadamente.
- URL preferencial de consulta no domínio do sistema: `/validar-receita#token=...`; fragmento evita enviar token ao servidor em logs de URL. Cliente remove o fragmento após leitura e envia código em POST, sem analytics nessa tela.
- Consulta pública é exceção explícita: token habilita somente retorno mínimo de autenticidade e CPF mascarado, sem conteúdo clínico, paciente ou PDF completo. Acesso a esses dados exige autorização autenticada ou fluxo específico de compartilhamento com destinatário e consentimento/base legal definidos.
- Limitar tentativas por origem e recurso, responder genericamente para token inválido, impedir cache com `Cache-Control: no-store`, usar `Referrer-Policy: no-referrer` e registrar auditoria sem segredo.
- Expiração/revogação do token afeta consulta; não altera assinatura matemática do PDF. Cancelamento da receita e revogação do certificado são eventos distintos. Não marcar “dispensada” sem evidência da integração autorizada correspondente.
- Não incluir odontograma na consulta pública. Para circulação em farmácia, gerar receita separada dos documentos clínicos detalhados por padrão.

## 7. Dados e estados propostos

Criar migração aditiva. Receitas existentes recebem estado `LEGACY_UNSIGNED`; não atribuir assinatura retrospectiva nem inventar emissor.

| Entidade | Campos essenciais |
|---|---|
| `ProfessionalCredential` | `userId`, CPF criptografado e índice protegido se necessário, `croNumber`, `croUf`, tipo de inscrição, `verificationMethod`, `verificationStatus`, `verifiedAt`, `reviewAfter`, referência privada de evidência. |
| `ProfessionalCertificate` | `userId`, fingerprint, serial, emissor, titular mascarado, início/fim da validade, revogação conhecida, data da inspeção; nenhuma chave privada/senha/PFX. |
| `Prescription` | `issuerId` nullable para legado, `status`, `prescriptionType`, campos estruturados de medicamentos e vínculo com versões. |
| `PrescriptionVersion` | número de versão, snapshot imutável de paciente/profissional/conteúdo, hash de entrada e final, storage key privado, `signedAt`, `issuedAt`, tipo/política da assinatura e fingerprint. |
| `PrescriptionValidation` | versão/hash do arquivo, estado criptográfico, cadeia, revogação, evidência temporal, resultado CRO com fonte/data, resultado sanitário, motor/versão/política, data da análise e relatório privado. |
| `PrescriptionAccessToken` | vínculo à versão, digest único, finalidade, expiração configurável e revogação. |
| `PrescriptionSigningOperation` | emissor, versão, chave de idempotência, estágio, erro categorizado, referência SNCR e timestamps; sem segredo. |
| `PrescriptionAuditEvent` | ator, recurso, evento, data, código de motivo e identificador de operação; sem conteúdo clínico. |

Estados de emissão: `DRAFT → SIGNING → SIGNED → ISSUED`; falha leva a `FAILED` com operação recuperável. `CANCELLED` encerra a validade operacional sem apagar PDF. Resultados da validação: `VALID`, `INVALID`, `INDETERMINATE`, separados de habilitação CRO e disponibilidade sanitária.

Usar transação para ativar versão/token somente após persistência verificada. Operações de storage/SNCR não participam da transação PostgreSQL: registrar etapas, idempotência e reconciliação. Se uma chamada SNCR expirar após possível aceitação, consultar seu resultado antes de reenviar; não emitir nova numeração automaticamente.

## 8. Contratos HTTP propostos

| Rota | Acesso e comportamento |
|---|---|
| `GET /professional-credentials/me` | Profissional autenticado; retorna perfil e evidências mascaradas. |
| `PUT /professional-credentials/me` | Próprio profissional; alterações invalidam conferência anterior. |
| `POST /professional-credentials/me/verify` | Solicita conferência autorizada; aprovação documental exige responsável autorizado, evidência e data. |
| `POST /professional-certificates/inspect` | Multipart `certificate`, `password`; devolve metadados e erros categorizados, sem guardar segredo. |
| `POST /prescriptions/:id/sign` | Multipart `certificate`, `password`, `source` (`generated`/`uploaded`), `pdf` quando importado, `version`; cabeçalho `Idempotency-Key`. Exige emissor e confirmação recente. |
| `GET /prescriptions/:id/signing-operations/:operationId` | Autoriza acesso à operação; informa estado e motivo seguro. |
| `GET /prescriptions/:id/signed-file` | Usuário autorizado; entrega bytes finais do armazenamento privado. |
| `POST /prescriptions/:id/validate` | Revalida versão persistida sem depender de certificado privado. |
| `POST /prescription-validation/pdf` | Upload de PDF para validação; privado no MVP e sem persistência por padrão. |
| `POST /prescriptions/:id/access-tokens` | Emissor autorizado; emite token, devolvido uma única vez; reemissão revoga o anterior. |
| `POST /prescription-validation/token` | Público documentado; JSON `{token}`; devolve apenas resumo mínimo. |
| `POST /prescriptions/:id/cancel` | Emissor ou autoridade explicitamente autorizada; motivo obrigatório e sincronização sanitária aplicável. |

Envelope de validação proposto:

```ts
type CheckStatus = 'VALID' | 'INVALID' | 'INDETERMINATE';
type ValidationSummary = {
  signature: { status: CheckStatus; reasons: string[]; checkedAt: string };
  professional: {
    name: string;
    croNumber: string;
    croUf: string;
    status: 'VERIFIED' | 'UNVERIFIED' | 'INACTIVE';
    method: 'AUTHORIZED_SOURCE' | 'DOCUMENT_REVIEW' | 'NONE';
    checkedAt: string | null;
  };
  prescription: {
    status: 'ISSUED' | 'CANCELLED' | 'UNKNOWN';
    sanitaryStatus: 'REGULAR' | 'PENDING' | 'NOT_APPLICABLE' | 'UNKNOWN';
  };
};
```

Para PDF externo, retornar campos profissionais ou sanitários desconhecidos se não houver fonte confiável. CRO escrito no PDF pode ser informação declarada; não equivale à validação de inscrição. Validar todas as assinaturas e revisões, não somente a primeira.

Erros definidos: `400` upload/formato inválido; `401` sessão ausente; `403` titular/escopo/perfil incompatível; `409` versão modificada ou estado impeditivo; `422` senha/certificado inelegível; `429` limite de tentativas; `503` dependência necessária indisponível. Mensagens não contêm senhas, CPF integral ou detalhes internos.

## 9. Sequência de implementação

### Etapa 1 — Provar assinatura e conformidade antes da interface

**Criar:** `server/signing-service/app.py`, `server/signing-service/sign_pdf.py`, `server/signing-service/validate_pdf.py`, `server/signing-service/requirements.txt`, `server/signing-service/Dockerfile`, `docs/security/digital-prescriptions.md`.

- [ ] Conferir documentação vigente ICP-Brasil e escolher política/formato aceitos para o caso.
- [ ] Configurar confiança ICP-Brasil, revogação e carimbo do tempo com origens autorizadas.
- [ ] Provar leitura de PKCS#12, extração correta do CPF, assinatura PDF e validação independente.
- [ ] Usar arquivos e certificados exclusivamente de teste, obtidos por processo autorizado fora do repositório. Não versionar PFX, senhas ou dados pessoais.
- [ ] Comparar resultados com referência ITI para assinatura íntegra, adulterada e indeterminada. Registrar evidências sem dados sensíveis.
- [ ] Validar limites do motor e política brasileira; se não houver conformidade demonstrada, trocar motor/provedor antes de liberar emissão.

**Aceite:** PDF válido em verificação independente, adulteração detectada e cadeia desconhecida recusada; serviço inacessível publicamente e sem retenção de segredo.

### Etapa 2 — Identidade profissional e dados imutáveis

**Modificar:** `server/prisma/schema.prisma`, `server/utils/validationSchemas.js`.
**Criar:** `server/prisma/migrations/20261013000000_digital_prescriptions/migration.sql`, `server/routes/professionalCredentials.js`, `server/services/professionalCredentialService.js`, `server/test/professional-credentials.test.js`, `server/test/digital-prescription-schema.test.js`.

- [ ] Criar entidades da seção 7 e índices para versão, digest e idempotência.
- [ ] Estruturar CRO/UF preservando valor textual antigo; exigir conferência de normalização em dados ambíguos.
- [ ] Proteger CPF usando criptografia compatível com os dados atuais, sem rotacionar chave existente.
- [ ] Registrar emissor no servidor a partir da sessão; validar relação do dentista com paciente e escopo de clínica.
- [ ] Implementar fonte profissional autorizada ou conferência documental interna explicitamente identificada.
- [ ] Migrar receitas antigas como não assinadas; impedir exclusão física das versões emitidas.

**Aceite:** nome/CRO localStorage não autorizam emissão; usuário não consegue assinar por outro; legado permanece acessível e claramente não assinado.

### Etapa 3 — PDF canônico, assinatura e persistência

**Modificar:** `src/components/PrescriptionGenerator.tsx`, `server/index.js`, `server/utils/patientDocumentStorage.js`.
**Criar:** `shared/prescriptions/PrescriptionPdf.tsx`, `server/services/prescriptionPdfRenderer.mjs`, `server/services/digitalSignatureClient.js`, `server/services/prescriptionSigningService.js`, `server/routes/digitalPrescriptions.js`, `server/utils/certificateUploadValidation.js`, `server/test/prescription-signing.test.js`.

- [ ] Extrair composição PDF reutilizável sem dependência de DOM ou aliases exclusivos do Vite; definir carregamento compatível com CommonJS do servidor.
- [ ] Gerar PDF a partir do snapshot do servidor. Não confiar em nome, CRO ou conteúdo de emissão enviados como identidade pelo navegador.
- [ ] Implementar importação de PDF, limites e visualização da versão submetida; rejeitar PDF já assinado no fluxo de nova assinatura do MVP e direcionar para validação.
- [ ] Incorporar referências de consulta e numeração aplicável antes da assinatura; nunca inserir QR Code ou rodapé modificando PDF assinado.
- [ ] Assinar com A1 temporário; conferir CPF, validade e autorização do emissor.
- [ ] Verificar assinatura após criação; armazenar PDF privado, hash e evidências.
- [ ] Aplicar idempotência, reconciliação de falhas e limpeza de memória/temporários em todos os caminhos.

**Aceite:** duplo clique não duplica emissão; alteração de rascunho durante assinatura causa conflito; download é byte a byte o arquivo assinado; falha de storage não ativa token.

### Etapa 4 — Token e validação de PDF no sistema

**Criar:** `server/services/prescriptionValidationService.js`, `server/services/prescriptionTokenService.js`, `server/routes/prescriptionValidation.js`, `src/lib/digital-prescription.ts`, `src/pages/PrescriptionValidation.tsx`, `server/test/prescription-validation.test.js`, `server/test/prescription-token-security.test.js`.
**Modificar:** `src/App.tsx` para página de consulta no próprio domínio.

- [ ] Implementar códigos aleatórios, digest, revogação e política configurável de expiração.
- [ ] Criar formulário interno com abas “Arquivo PDF” e “Código da receita”. Upload fica privado no MVP.
- [ ] Mostrar integridade, titular, cadeia, revogação, tempo e dados profissionais com status próprios.
- [ ] Tratar PDF sem assinatura, múltiplas assinaturas, alterações incrementais, certificado desconhecido e indisponibilidade de revogação.
- [ ] Consultar token sem revelar paciente/conteúdo/PDF; impedir indexação, cache e vazamento em telemetria.
- [ ] Separar autenticidade do arquivo de cancelamento e situação sanitária atual.

**Aceite:** PDF íntegro e alterado produzem resultados diferentes; token não exige site externo; token sozinho não entrega dados clínicos.

### Etapa 5 — Interface de emissão e configurações

**Modificar:** `src/pages/AdminPrescription.tsx`, `src/pages/AdminSettings.tsx`.
**Criar:** `src/components/admin/DigitalCertificateDialog.tsx`, `src/components/admin/PrescriptionValidationPanel.tsx`, `src/components/admin/PrescriptionFileImport.tsx`, `src/pages/PrescriptionValidation.test.tsx`, `src/components/admin/DigitalCertificateDialog.test.tsx`.

- [ ] Acrescentar identidade profissional estruturada e evidências mascaradas nas configurações.
- [ ] Implementar modal A1, revisão final, progresso e recuperação de falhas.
- [ ] Exibir selo visual apenas após retorno de assinatura verificada; identificar assinatura visual antiga como imagem.
- [ ] Acrescentar download assinado, consulta por token, importação de PDF e cancelamento com motivo.
- [ ] Limpar senha e referência ao arquivo ao finalizar/fechar modal; não persistir estado sensível.
- [ ] Garantir uso em celular, navegação por teclado, labels e mensagens acessíveis.

**Aceite:** fluxo inteiro concluído sem `window.open`, redirecionamento externo ou download/upload manual em outra plataforma.

### Etapa 6 — Integração sanitária para receituários abrangidos

**Criar:** `server/services/sncrClient.js`, `server/services/prescriptionSanitaryPolicy.js`, `server/test/sncr-prescriptions.test.js`, `docs/integrations/sncr.md`.

- [ ] Obter documentação/API vigente, habilitação e acesso ao ambiente de treinamento; confirmar suporte a prescritor com CRO e os campos de conselho exigidos.
- [ ] Mapear receitas simples, RCE, RET e notificações, requisitos e modelos aplicáveis; não derivar categoria apenas de texto livre.
- [ ] Implementar fluxos de numeração, emissão, consulta e cancelamento conforme contrato efetivamente documentado; não inventar endpoints.
- [ ] Conferir que cada numeração retornada corresponde ao CPF/CRO/UF e ao tipo solicitado.
- [ ] Modelar transição até 29/10/2026 somente onde ainda aplicável; após o limite, não permitir exceção automática baseada em falha da API.
- [ ] Implementar timeout, retentativa segura, reconciliação e estados pendentes sem emissão apresentada como regular.
- [ ] Distinguir consulta de autenticidade de baixa/dispensação; esta última depende do perfil autorizado da farmácia e do fluxo oficial.

**Aceite:** tipo abrangido não é liberado fora das regras; numeração de outro prescritor é rejeitada; falha externa não duplica receita nem registra dispensação fictícia.

### Etapa 7 — Verificação e disponibilização gradual

**Criar:** `server/test/digital-prescription-access.test.js`, `docs/runbooks/digital-prescriptions.md`.

- [ ] Verificar senha errada, PFX inválido, CPF divergente, certificado vencido/revogado, ausência de chave privada, CRO não conferido/inativo e reautenticação expirada.
- [ ] Verificar upload malicioso, PDF alterado, cadeia desconhecida, indisponibilidade OCSP/LCR/TSA, SSRF, token inválido/expirado/revogado e acesso entre usuários/clínicas.
- [ ] Verificar anonimato negado nas rotas privadas; consulta pública retorna só resumo autorizado.
- [ ] Verificar imutabilidade, falhas de persistência, idempotência, datas de transição e cancelamento.
- [ ] Preparar backup e demonstrar restauração de banco, PDFs e evidências antes da migração de produção.
- [ ] Executar verificações exigidas por `SECURITY.md`, inclusive frontend/backend, build, secret scan e diff.
- [ ] Liberar por feature flag somente após conformidade comprovada. Tipos regulados dependem da etapa SNCR e dos respectivos requisitos vigentes.
- [ ] Documentar rollback que desativa novas emissões sem apagar assinaturas ou alterar dados criptografados.

Comandos previstos para execução da implementação:

```powershell
npm test
node --test server/test/*.test.js
npm run build
git diff --check
```

Também executar testes do serviço Python e o secret scan adotado pelo projeto; configurar seus comandos na etapa 1 e no runbook antes da disponibilização. Resultado esperado: testes aprovados, build concluído, nenhuma ocorrência de segredo e nenhuma quebra de acesso/criptografia existente. Este plano não executa os testes nem certifica a implementação.

## 10. Dependências que precisam de evidência antes da publicação

| Dependência | Critério verificável |
|---|---|
| Política ICP-Brasil e motor | PDFs de homologação com conformidade demonstrada e política registrada. |
| Autoridade de carimbo do tempo | Acesso autorizado, cadeia validada, orçamento e SLA definidos. |
| Consulta CRO automática | Documentação, permissão e acesso comprovados; sem isso, conferência documental explícita. |
| SNCR para CRO | Credenciamento, documentação vigente e emissão/consulta em ambiente autorizado comprovados para dentista. |
| Armazenamento e banco | Privacidade, backup, restauração e retenção definidos conforme obrigações aplicáveis. |

Não há base suficiente nesta pesquisa para estimar taxas de integração, disponibilidade contratual de consulta CRO ou prazo de credenciamento. As dependências são critérios de liberação, enquanto rascunhos e fluxo documental existente podem continuar disponíveis.

## 11. Critérios finais de entrega

- Dentista utiliza seu A1 `.pfx`/`.p12` no próprio sistema sem retenção da senha/chave.
- CPF do certificado corresponde ao profissional autorizado e CRO possui evidência identificada.
- Receita gerada ou PDF importado pode ser assinado; arquivo já assinado pode ser validado na interface interna.
- PDF baixado contém assinatura criptográfica verificável independentemente deste sistema.
- Token e QR Code consultam autenticidade; não são apresentados como substitutos da assinatura.
- Resultado diferencia assinatura, habilitação CRO, cancelamento e regularidade sanitária.
- PDFs e dados clínicos continuam privados; consulta pública é mínima e deliberadamente limitada.
- Receitas emitidas são imutáveis; novas versões e cancelamentos têm auditoria.
- Tipos regulados seguem integração e política SNCR vigentes na data de publicação.
- Nenhum passo cotidiano de upload, assinatura ou validação exige abrir o portal CFO, ITI ou outro site.

## 12. Extensão opcional: certificado A3 em token USB

Se “TOKEN” também significar dispositivo criptográfico A3, criar fluxo separado. Não converter A3 em PFX nem tentar exportar chave privada. O navegador comum não fornece acesso genérico direto ao dispositivo PKCS#11; será necessário agente local ou SDK autorizado, cuja instalação deve ser prevista.

O agente recebe hash/desafio e identificação inequívoca da versão aprovada, pede PIN localmente e devolve a assinatura; o backend incorpora e verifica a evidência. Autenticar a comunicação, vincular origem/operação, impedir replay e requisições arbitrárias ao agente. O PIN nunca é enviado ao servidor.

Essa extensão mantém as telas de emissão e validação no sistema, mas exige componente na estação. Planejar Windows/drivers, dispositivos compatíveis, suporte e atualização como entrega própria após A1.

## 13. Revisão do plano

- Requisito A1: seções 5–6, etapas 1 e 3.
- Token/QR Code: seções 6 e 8, etapa 4.
- Dentista/CRO: seções 3 e 7, etapa 2.
- Upload e validação de PDF sem outro site: seção 5, etapas 4 e 5.
- Receituário regulado atual: seção 3, etapa 6.
- Guardrails de segurança, preservação de documentos e compatibilidade criptográfica: seções 6 e 9.
- Nenhum arquivo de construção ou artefato existente será excluído por este plano.

**Próxima entrega de implementação:** prova técnica da assinatura A1 e validação com política ICP-Brasil, antes de integrar o fluxo ao prontuário.
