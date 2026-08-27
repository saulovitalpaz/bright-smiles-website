# Prescrições, Documentos e Odontograma por Faixa Etária — Especificação

## Objetivo

Corrigir a persistência de novas prescrições, melhorar a composição e impressão dos documentos clínicos, ampliar a edição de texto, permitir modelos de termos em PDF com emissão vinculada ao paciente e introduzir classificação etária sem quebrar pacientes ou odontogramas já registrados.

Os dados clínicos, prescrições, arquivos e autenticação continuam sujeitos às regras de `SECURITY.md`. Nenhum dado existente será apagado ou convertido de forma destrutiva.

## Decisões aprovadas

- A data de nascimento será armazenada; idade e faixa etária serão derivadas no momento da leitura.
- Criança: menor de 12 anos; adolescente: 12 a 17 anos; adulto: 18 anos ou mais.
- A dentição inicial será escolhida pela idade, mas o profissional poderá ajustá-la clinicamente.
- Modelos textuais e modelos PDF serão aceitos.
- Paciente será obrigatório na emissão mesmo quando o modelo não tiver tags.
- A ausência de tags não bloqueará a emissão.
- Emissões terão histórico próprio e poderão ter múltiplos anexos PDF ou imagem do termo assinado.
- O odontograma da prescrição será buscado na consulta mais recente e salvo como snapshot histórico.
- A primeira página da prescrição com odontograma conterá somente a identificação e o odontograma; o texto começará na página seguinte.

## Diagnóstico confirmado

- `AdminPrescription` salva o paciente antes da prescrição e não exibe o erro específico quando `POST /prescriptions` falha.
- `AdminPrescription` envia dados de odontograma em formatos que podem não satisfazer o contrato atual de paciente, o que pode interromper a sequência de salvamento.
- `POST /prescriptions` usa `req.body` diretamente, sem validação explícita, verificação de paciente ou normalização de conteúdo.
- A tela de prescrição mantém o odontograma em estado editável e não busca a versão mais recente salva em uma consulta.
- O PDF de prescrição usa uma única página React PDF, portanto o odontograma não é uma página isolada.
- Os contêineres de impressão misturam classes `hidden`, layout administrativo e conteúdo imprimível, possibilitando paginação inicial vazia.
- `AdminDocuments` importa `RichTextEditor`, mas usa `Textarea`, e a barra atual possui apenas parte dos comandos de edição.
- O sanitizador existente não cobre todas as propriedades de formatação necessárias.
- `DocumentTemplate` só armazena texto e `PatientDocument` só possui o anexo PDF legado `storageKey`.
- O upload de documentos aceita somente PDF, embora termos assinados possam ser digitalizados como fotos.
- O cadastro de pacientes ainda exibe e envia o checkbox `consent`.
- O odontograma atual conhece somente a dentição permanente e tem normalização de legado/V2.

## Arquitetura escolhida

A implementação será uma extensão compatível em quatro camadas:

1. **Contratos e persistência:** migração Prisma aditiva, validação Zod, sanitização de HTML, armazenamento privado e endpoints com autorização explícita.
2. **Domínio clínico:** normalizador de odontogramas legado/V2/novo, cálculo de idade e dentição, busca do último odontograma de consulta e snapshot na prescrição.
3. **Interface administrativa:** editor rico compartilhado, emissão de documentos com paciente obrigatório, histórico de emissão e anexos múltiplos.
4. **Impressão:** raiz imprimível isolada e páginas explícitas para o navegador e para `@react-pdf/renderer`.

Os limites são mantidos pequenos: o módulo de odontograma não conhece impressão; o módulo de impressão não conhece APIs; armazenamento privado não expõe URLs permanentes; o editor produz HTML e o backend decide o que pode ser persistido.

## Modelo de dados

### Patient

Adicionar:

- `birthDate DateTime?`.

Manter `consent`, `consentDate` e `odontogram` por compatibilidade. A interface de criação/edição não exibirá mais `consent`; as colunas e a rota de consentimento permanecerão enquanto registros e fluxos antigos puderem usá-las.

### Odontogramas

O normalizador aceitará:

- registro legado como mapa de dentes permanentes;
- V2 atual `{ version: 2, dentition: "permanent", teeth }`;
- novo formato discriminado por dentição, com versão maior que 2 e `dentition` em `deciduous`, `mixed` ou `permanent`.

O novo formato manterá o catálogo de condições clínicas, notas sanitizadas e alvos existentes. O conjunto de dentes decíduos utilizará a numeração FDI `51–55`, `61–65`, `71–75` e `81–85`. O conjunto misto aceitará dentes decíduos e permanentes.

A idade só escolherá o modo inicial:

- abaixo de 6 anos: decíduo;
- de 6 a 11 anos: misto;
- a partir de 12 anos: permanente.

Quando o nascimento estiver ausente, o modo permanente e o formato legado continuarão sendo usados.

### Prescription

Adicionar campos opcionais e aditivos:

- `odontogramSnapshot Json?`;
- `odontogramSourceAppointmentId Int?` com relação opcional à consulta e `onDelete: SetNull`.

O conteúdo continuará sendo HTML, mas passará pelo sanitizador antes da persistência. O endpoint aceitará apenas `content` não vazio, `patientId` inteiro positivo e snapshot compatível. O snapshot será imutável depois da criação.

### DocumentTemplate

Manter `content` como texto para registros atuais e adicionar:

- `kind String @default("text")` — `text` ou `pdf`;
- `storageKey String?` — chave privada do PDF original;
- `mimeType String?`;
- `originalName String?`;
- `archivedAt DateTime?`.

Modelos textuais existentes continuarão funcionando. A exclusão da interface passará a arquivar o modelo; modelos usados por emissões não perderão sua referência.

### PatientDocument

Manter os campos atuais e adicionar:

- `templateId Int?` com relação opcional a `DocumentTemplate`;
- `status String @default("issued")`;
- `issuedAt DateTime @default(now())`;
- `issuedById Int?` com relação opcional a `User`;
- `sourceKind String @default("text")` — `text` ou `pdf`.

O conteúdo textual da emissão será copiado para o histórico. Para PDF, a emissão manterá a chave privada do modelo enquanto o modelo permanecer arquivado. Registros legados sem esses campos terão valores padrão.

### PatientDocumentAttachment

Criar uma tabela para anexos múltiplos:

- `id Int`;
- `patientDocumentId Int`;
- `storageKey String`;
- `mimeType String`;
- `originalName String`;
- `size Int`;
- `createdAt DateTime`;
- `uploadedById Int?`.

O relacionamento será em cascata com a emissão; a exclusão de uma emissão removerá os objetos privados associados somente depois de localizar e tentar apagar as chaves. O `storageKey` e `pdfUrl` legados de `PatientDocument` continuarão sendo lidos como fallback.

## Fluxo de prescrição

1. O usuário seleciona ou informa o paciente.
2. O frontend carrega em paralelo o histórico de prescrições e `GET /patients/:id/odontogram/latest`.
3. O endpoint retorna o odontograma da consulta mais recente com `dentalNotes` válido, a data e o `appointmentId`.
4. Sem consulta válida, o frontend usa `Patient.odontogram` como fallback e sinaliza a origem.
5. O odontograma exibido na prescrição é somente leitura.
6. Ao salvar, o frontend envia conteúdo e snapshot ao endpoint de prescrição.
7. O backend valida o paciente e, quando informado, confirma que a consulta de origem pertence ao mesmo paciente.
8. A resposta salva atualiza o histórico por setter funcional e a interface mostra erros específicos.

O salvamento não atualizará automaticamente o odontograma do paciente. Alterações clínicas continuarão sendo feitas no atendimento ou na tela clínica apropriada.

## Fluxo de modelos e emissão de documentos

### Criação de modelo

`POST /document-templates` aceitará multipart com título, conteúdo opcional e PDF opcional. O backend validará autorização, título, conteúdo sanitizado e bytes `%PDF-` quando houver arquivo. O PDF será armazenado em bucket privado; falha posterior de banco removerá o objeto recém-criado.

Tags textuais aceitas:

`#NOME`, `#CPF`, `#DATA`, `#PROCEDIMENTO`, `#PROFISSIONAL`, `#NASCIMENTO`, `#IDADE` e `#FAIXA_ETARIA`.

Tags serão substituídas em nós de texto, preservando a marcação HTML. Valores do paciente nunca serão concatenados como HTML.

### Emissão

Ao aplicar um modelo, a seleção do paciente será obrigatória. Para modelo textual, o conteúdo processado será editável no editor rico. Para modelo PDF, o arquivo original será mantido como documento fonte e o paciente/profissional/data ficarão registrados na emissão mesmo sem preenchimento dentro do PDF.

`POST /patient-documents` validará o paciente, modelo opcional, tipo de origem e conteúdo. A criação registrará data, profissional, status `issued` e uma entrada de auditoria sem dados clínicos no texto do log.

### Anexos assinados

Criar:

- `POST /patient-documents/:id/attachments` para PDF, JPEG, PNG e WebP;
- `GET /patient-documents/:id/attachments/:attachmentId/file` para acesso autenticado por URL assinada de curta duração.

Cada upload terá limite de 25 MB, filtro de MIME e validação de assinatura binária. O backend usará extensão derivada do MIME permitido e nunca confiará no nome do arquivo para segurança. O histórico listará todos os anexos e manterá a confirmação de emissão independentemente de haver assinatura anexada.

## Editor rico

O componente compartilhado oferecerá desfazer/refazer, família e tamanho da fonte, cor do texto, marca-texto, negrito, itálico, sublinhado, tachado, títulos, alinhamentos, listas, recuo, links e limpeza de formatação. A seleção será preservada com controles acionados em `onMouseDown` e todos os controles terão nome acessível.

O sanitizador aceitará somente tags e estilos necessários: estrutura textual, alinhamento, fonte, tamanho, cor, fundo, espaçamento e links com protocolos permitidos. Atributos de evento, `script`, `style` arbitrário, `javascript:` e URLs não permitidas serão removidos. Conteúdo de modelo, prescrição e emissão será sanitizado no backend antes de persistir.

## Impressão

Toda tela que imprime terá uma única raiz `print-root`; layout administrativo, navegação e editores ficarão fora da raiz imprimível ou serão ocultados por regras sem altura mínima. O CSS de impressão será compartilhado e não sobrescreverá `display: none` de forma a reintroduzir uma área vazia.

### Prescrição com odontograma

No navegador:

- página 1: cabeçalho, paciente e odontograma, com `break-after: page` somente quando houver snapshot;
- página 2 em diante: conteúdo HTML e assinatura.

No React PDF, serão usadas páginas `<Page>` distintas com a mesma regra. Sem odontograma, o conteúdo ocupará a primeira página.

Documentos textuais e relatórios financeiros também terão raiz imprimível única, sem `min-height` herdado de telas administrativas. Nenhuma regra adicionará quebra de página no final do conteúdo.

## Tratamento de erros e autorização

- Rotas de pacientes, prescrições, modelos, emissões e anexos exigem sessão e função `admin` ou `dentist`.
- Acesso a arquivo sempre passa pela rota autenticada; nenhum link de bucket será público ou persistido como URL assinada permanente.
- Dados inválidos retornam `400` com mensagem segura e sem stack trace.
- Falha de upload remove o objeto recém-criado e não salva referência incompleta.
- Falha na busca do odontograma permite usar fallback, mas é informada ao usuário.
- Falha de criação da prescrição não mostra sucesso nem perde o conteúdo do editor.
- Logs não conterão conteúdo clínico completo, HTML, CPF, token, cookie, URL assinada, arquivo ou dados de paciente.

## Estratégia de testes

### Backend

- esquema e migração aceitam `birthDate`, snapshots e emissões legadas;
- prescrição valida paciente, conteúdo, snapshot e consulta pertencente ao paciente;
- busca do último odontograma ignora consultas sem odontograma e ordena pela data mais recente;
- modelos textuais e PDF são criados com autorização e limpeza em caso de falha;
- anexos aceitam somente formatos e bytes permitidos, com limite e autorização;
- conteúdo HTML remove scripts, eventos e estilos não permitidos;
- registros antigos sem novos campos continuam sendo retornados;
- auditoria de emissão não registra dados sensíveis.

### Frontend

- salvar nova prescrição cria histórico e exibe erro quando a API falha;
- seleção do paciente carrega o último odontograma de consulta e usa fallback;
- snapshot é passado ao PDF e o odontograma fica em página separada;
- não há página vazia nas raízes de prescrição, documentos e relatório;
- editor aparece em prescrição e documentos com todos os controles definidos;
- tags preenchem somente nós de texto;
- modelo PDF exige paciente na emissão;
- anexos múltiplos aparecem no histórico;
- idade, faixa etária e modo inicial de dentição são calculados corretamente;
- odontograma legado/V2 permanece renderizável;
- odontogramas decíduo e misto renderizam a numeração correta;
- checkbox de consentimento não aparece no cadastro/edição de paciente.

### Verificação final

Executar frontend tests, backend tests, lint, build, testes de backup, varredura de segredos e `git diff --check`. Mudanças no schema exigem também verificar migração e compatibilidade do cliente Prisma. Não haverá rotação de chaves nem migração de criptografia.

## Critérios de aceite

1. Nova prescrição é persistida com paciente válido e aparece no histórico.
2. Falha de prescrição mostra erro específico e preserva o conteúdo na tela.
3. Último odontograma de consulta é usado antes do fallback do paciente.
4. Snapshot da prescrição não muda quando o odontograma clínico é alterado depois.
5. Odontograma da prescrição ocupa página própria e o texto começa depois dela.
6. Impressões de prescrição, termo e relatório não começam com página vazia.
7. Prescrição e documento oferecem a mesma barra de edição rica.
8. Modelo PDF é salvo em armazenamento privado e pode ser emitido sem tags.
9. Toda emissão fica vinculada a `patientId`, data, profissional e status.
10. Uma emissão aceita vários anexos assinados PDF/imagem com acesso protegido.
11. Paciente pode ser cadastrado sem checkbox de consentimento.
12. Idade derivada define criança/adolescente/adulto e o odontograma correspondente.
13. Dados antigos, odontogramas legados e modelos textuais continuam funcionando.
14. Nenhum teste, lint, build ou verificação de segurança apresenta regressão ligada à mudança.
