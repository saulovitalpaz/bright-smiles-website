# Assinatura interna de receitas com e-CPF A1

## O que foi implementado

Configurações profissionais aceitam arquivo A1 `.pfx`/`.p12`, senha do certificado e confirmação da senha de acesso ao sistema. O CPF é extraído da extensão assinada do certificado e validado no servidor, sem digitação nem novo campo no cadastro do usuário. Clientes anteriores que enviam CPF continuam suportados, com conferência obrigatória de igualdade. O backend confere os dados, a identidade do certificado, a política A1, a validade, a cadeia ICP-Brasil e evidência atual de revogação antes de cadastrar.

O arquivo e a senha ficam juntos em um envelope AES-256-GCM vinculado ao usuário, com chave exclusiva da funcionalidade. Cadastros anteriores também podem conter a afirmação de CPF, que continua sendo conferida. A chave não foi criada no código nem reutiliza a chave de pacientes. Não há persistência de certificado/senha no armazenamento do navegador ou em bucket público. Após uma tentativa, as duas senhas são limpas; em caso de erro, somente a seleção local do arquivo é preservada para repetir o envio. Limpar campos, concluir o cadastro ou sair da tela remove essa seleção. Os buffers de upload são limpos após a operação; strings gerenciadas por JavaScript/Python dependem de coleta de lixo e não têm garantia de apagamento imediato da memória.

## Correção do cadastro em 14/10/2026

A rejeição `Certificado, CPF ou senha inválidos` ocorria antes da abertura criptográfica. O filtro inicial aceitava somente comprimento ASN.1 definido e rejeitava PFX BER com comprimento indefinido, permitido pela [RFC 7292, seção 4](https://www.rfc-editor.org/rfc/rfc7292.html#section-4). A incompatibilidade foi reproduzida com certificado sintético; a inspeção estrutural do arquivo informado pelo usuário confirmou esse mesmo formato. Nenhum certificado, CPF ou segredo real foi copiado para testes ou repositório.

O filtro aceita agora o envelope BER delimitado. O processo isolado faz parsing PKCS#12 estrito, rejeita truncamento e bytes excedentes e normaliza os invólucros ASN.1 em memória antes de abrir a chave. Os octetos cifrados e o MAC permanecem preservados. O certificado original não é alterado. O reconhecimento do envelope não substitui senha, chave privada, identidade e-CPF, política A1, cadeia, validade ou revogação.

O formulário mostra o usuário conectado e explica as duas senhas. O nome completo e CRO podem ser salvos pelo botão junto aos dados profissionais. Alterações ainda não salvas impedem o envio; o servidor repete a conferência do perfil dentro de transação antes de ativar o certificado. Divergência de nome informa como corrigir o perfil e não permite usar certificado de outro titular. A resposta de cadastro mantém o resumo profissional para substituições imediatas.

Erros explícitos permanecem visíveis após atualizar o estado em segundo plano. Uma falha de rede mantém a opção de consultar novamente, sem apagar o erro de envio. Não houve migração de banco nem mudança de chave/formato do cofre.

Verificação: suítes frontend/backend, motor Python, integração HTTP multipart com BER sintético sem CPF digitado, recuperação do cofre e assinatura/validação de PDF; fixture legado BER/RC2/SHA-1 com rejeição de revogação preservada; inspeção estrutural do arquivo fornecido, sem senha; interface desktop/celular com API simulada. Esses testes não equivalem à ativação do certificado real em produção, que exige o envio pelo titular no formulário autenticado.

Na página de prescrição do espaço de consultas, “Incluir assinatura” inicia desligado. Quando ligado, salvar/baixar/imprimir emite um PDF canônico no servidor, assina e valida seu resultado e guarda os bytes finais no bucket privado. Quando desligado, segue o PDF comum e histórico clínico existentes, sem documento/token de validação online.

O CRO é o valor informado no perfil. O sistema não consulta o conselho nem apresenta o cadastro profissional como oficialmente verificado. O A1 e o CPF são suficientes para a operação criptográfica; regularidade de receituários regulados é uma questão separada.

## Arquitetura e limites da entrega

- Express coordena autorização, reautenticação, idempotência, cofre e persistência PostgreSQL/S3.
- `server/signing/worker.py` executa uma operação por processo isolado e recebe segredo somente por stdin, sem argumentos de linha de comando ou logs.
- `cryptography` lê PKCS#12; pyHanko/pyhanko-certvalidator confere cadeia/revogação e produz assinatura PAdES; ReportLab gera o PDF com QR Code.
- Este fluxo não requer API paga nem o portal CFO/Certillion.
- O resultado criptográfico é interno, não um relatório oficial emitido pelo ITI.
- A assinatura não inclui carimbo do tempo confiável nesta entrega. A data é declarada; a interface de validação identifica sua ausência. Não garantir verificabilidade histórica após vencimento/revogação apenas por essa data. Um perfil com carimbo e arquivo de longo prazo deve ser uma evolução específica, com política ICP-Brasil homologada.
- Nesta entrega, emissão digital habilitada apenas para receita simples. O campo `prescriptionType` é validado, mas texto livre não classifica medicamentos automaticamente: não usar o fluxo de receita simples para receituários sujeitos a controle/retenção/numeração sem implementar os requisitos próprios e o SNCR.
- Não foi utilizado o certificado real do usuário na implementação ou na verificação. A prova criptográfica usa identidade e cadeia sintéticas transitórias; interoperabilidade do certificado real com o VALIDAR/ITI continua sendo critério de homologação da implantação, sem exigir esse portal no fluxo cotidiano.

## Configuração do servidor

O backend exige o bucket privado existente e as seguintes configurações:

| Variável | Comportamento |
|---|---|
| `DIGITAL_CERTIFICATE_KEY` | Obrigatória: 32 bytes aleatórios em Base64; guardar no gerenciador de segredos e em backup protegido, sem imprimir em logs/chat. Nunca substituir após cadastro sem migração autorizada. |
| `SIGNING_PYTHON_EXECUTABLE` | Python do ambiente com `signing/requirements.txt`. O Docker usa `/opt/signing-python/bin/python`. |
| `DIGITAL_VERIFICATION_BASE_URL` | Página HTTPS de validação do próprio frontend; default `https://www.odontoeharmonizacao.com.br/validar-receita`. Sem query/fragmento/credenciais na configuração. |
| `SIGNING_TRUST_ROOTS_PATH` | Opcional; default `server/signing/trust/roots.pem`, somente raízes públicas oficiais selecionadas. |
| `SIGNING_CA_BUNDLE_PATH` | Opcional; default `server/signing/trust/authorities.pem`, intermediárias públicas oficiais. |
| `SIGNING_ALLOWED_HOSTS` | Opcional; default `server/signing/trust/allowed-hosts.txt`, hosts de distribuição de revogação/AIA encontrados nas autoridades oficiais. Valor vazio desabilita rede. |
| `SIGNING_CRL_PATH` | Opcional: arquivo/diretório de LCRs verificáveis e atuais para operação sem rede. Arquivos locais sem assinatura/data válida não satisfazem a validação. |

O motor bloqueia cadastro e assinatura quando a confiança/revogação não pode ser comprovada. Um certificado ativo pode falhar temporariamente se sua autoridade não responder ou estiver fora da lista de hosts permitidos. A solução é revisar a fonte oficial e a configuração; não desabilitar a validação.

O Dockerfile do backend agora instala Python em ambiente isolado e pacotes fixados em `signing/requirements.txt`. `server/railway.json` usa o Dockerfile, com contexto do serviço em `server`. A configuração não foi publicada nem aplicada à infraestrutura nesta tarefa.

Em desenvolvimento Windows:

```powershell
py -3 -m venv .tools/signing-python
& ./.tools/signing-python/Scripts/python.exe -m pip install -r server/signing/requirements.txt
$env:SIGNING_PYTHON_EXECUTABLE = (Resolve-Path .tools/signing-python/Scripts/python.exe).Path
```

Definir `DIGITAL_CERTIFICATE_KEY` diretamente no ambiente protegido do backend. Não copiar certificado ou senha para `.env`, repositório, comandos de terminal, documentação ou mensagens. O arquivo A1 e a senha são enviados exclusivamente pelo formulário autenticado.

## Material público de confiança

O diretório `server/signing/trust/` contém certificados **públicos**, sem nenhuma chave privada. Foram obtidos por HTTPS do [repositório oficial do ITI](https://www.gov.br/iti/pt-br/assuntos/repositorio/repositorio-ac-raiz), com verificação do SHA-512 publicado para o arquivo de autoridades. `manifest.json` registra origem, hash do pacote, horário e fingerprints públicos das raízes.

Foram selecionadas as raízes v4, v5, v6, v7, v12 e v13. As raízes revogadas v3/v8/v9 e as raízes específicas de TLS/assinatura de código não são âncoras da assinatura de receitas. As intermediárias do pacote são auxiliares; não se tornam raízes por estarem no arquivo.

Atualização administrativa do material público:

```powershell
& ./.tools/signing-python/Scripts/python.exe server/signing/bootstrap_trust.py
```

O script verifica TLS, rejeita redirecionamento para outro repositório, confere o hash oficial e limita tamanho/quantidade dos arquivos. Revisar o diff/fingerprints e executar a verificação criptográfica antes de implantar a atualização. Não executar atualização de confiança a partir de certificados enviados por usuários.

OCSP/LCR/AIA usam rede com lista explícita de hosts, resolução apenas para IPs públicos, sem proxies de ambiente ou redirecionamentos, com limite de bytes e timeout. PDFs/certificados não podem acessar rede privada ou metadados de nuvem. Uma nova autoridade requer revisão da origem oficial antes de ampliar a lista.

## Migração e implantação

Foi criada a migração aditiva `20261013000100_digital_prescription_a1`, com `DigitalCertificate`, `DigitalIssueOperation` e `DigitalPrescription`. Nenhuma receita antiga recebe assinatura retrospectiva. Documentos assinados impedem exclusão física da receita/usuário referenciado.

Antes de implantar, aplicar os requisitos de `SECURITY.md`:

1. Criar backup privado do banco e do bucket; guardar a chave do cofre em backup separado e protegido.
2. Restaurar uma cópia em ambiente isolado, incluindo PDFs e chave; comprovar que o cofre e os hashes podem ser lidos. Não armazenar dump ou dados de pacientes no repositório.
3. Executar testes, build, secret scan e diff. Homologar o certificado real exclusivamente em ambiente autorizado, sem enviar segredo ao chat.
4. Configurar chave/Python/URL de consulta e verificar privacidade do bucket e acesso de rede às autoridades.
5. Aplicar a migração no ambiente aprovado e publicar frontend/backend compatíveis juntos.
6. Confirmar que cadastro, emissão simples e validação de PDF funcionam, e que o caminho sem assinatura não cria `DigitalPrescription` ou token.

Preparação de produção em 13/10/2026: chave independente do cofre configurada no ambiente protegido, com cópia cifrada no bucket privado e recuperação conferida. As chaves anteriores foram preservadas. Um snapshot atualizado do banco foi cifrado no bucket privado; checksum e recuperação foram conferidos. Uma cópia do banco foi restaurada em banco temporário separado, com contagens representativas conferidas, e ambas as migrações aditivas passaram nessa cópia. O banco temporário foi removido. Nenhum certificado real foi usado nessas verificações. O Docker não foi construído localmente porque não há daemon disponível; a implantação deve confirmar o build Linux e a aplicação das migrações.

## Endpoints e autorização

| Endpoint | Acesso |
|---|---|
| `GET/POST/DELETE /digital-signatures/certificate` | Conta atual admin/dentist, papel conferido no banco; cadastro/remoção exigem senha atual. |
| `POST /digital-signatures/certificate/verify` | Conta clínica atual; verifica novamente o certificado salvo após indisponibilidade temporária. |
| `POST /digital-signatures/certificate/suspend` | Conta clínica atual, com confirmação da senha; suspende novas emissões e preserva histórico. |
| `POST /prescriptions/digital-issue` | Profissional autenticado, consentimento registrado, certificado próprio válido e versão canônica. Login recente até 15 min ou confirmação da senha atual. |
| `GET /prescriptions/digital-documents/patient/:patientId` | Documentos emitidos pelo usuário atual; não retorna chaves de storage/segredos. |
| `GET /prescriptions/digital-documents/:id[/file]` | Emissor atual; download reconfere hash e entrega bytes finais armazenados. |
| `POST /prescription-validation/pdf` | Conta clínica autenticada; PDF validado em memória e processo isolado. |
| `POST /prescription-validation/token` | Exceção pública deliberada: retorna registro mínimo de emissão, sem paciente/conteúdo/PDF. |

No ambiente de produção, operações POST/DELETE continuam sujeitas à verificação de origem já existente no servidor. Todos os endpoints digitais enviam `Cache-Control: no-store` e usam limites de tentativas. O cofre consulta apenas o usuário da sessão, nunca um ID de profissional enviado pelo cliente.

O token público de consulta tem 32 bytes aleatórios. Seu digest é indexado; uma cópia criptografada permite responder de forma idempotente ao próprio emissor. URL usa fragmento `#token=...`; a página remove o fragmento e envia o código por POST, sem analytics. O token consulta **registro de emissão**, não valida qualquer PDF que alguém apresente com o mesmo código. Para um arquivo recebido, usar a validação criptográfica por upload e comparar o hash.

Limites: certificado até 1 MiB; PDF até 10 MiB, 100 páginas e 16 assinaturas. PDFs malformados, criptografados, com ações ativas/JavaScript ou anexos executáveis são rejeitados. Processo em Linux tem limite de CPU/memória e core dump desabilitado; a implantação de produção deve usar Linux/Docker. Windows é suportado para desenvolvimento, com timeout/limites de I/O do coordenador, sem a mesma garantia de isolamento de memória do Unix.

## Recuperação e rollback

O upload válido ativa automaticamente o certificado após conferência de CPF, perfil, cadeia ICP-Brasil, validade e revogação. Essa conferência interna não é homologação oficial do ITI. O arquivo permanece cifrado para uso futuro; cada emissão repete as verificações. Expiração ou revogação impedem novas assinaturas. Suspensão manual exige novo upload para reativar. Uma indisponibilidade temporária pode ser recuperada pelo botão de nova verificação, sem enviar novamente o arquivo. Bloqueios e suspensão concorrente são preservados por bloqueio transacional do registro.

Uma chave de solicitação pertence ao usuário e ao conteúdo. Repetição de emissão concluída reutiliza documento/token; falha confirmada sem documento pode ser retomada com a mesma chave. Operação pendente/incerta retorna conflito e não gera duplicação automática.

Se o processo cair enquanto a operação está pendente, verificar `DigitalIssueOperation`, `DigitalPrescription` e storage privado pelo identificador. Sem evidência de emissão, um responsável pode reconciliar a operação em manutenção controlada; não apagar registros para permitir reenvio às cegas. Uma falha de confirmação de commit não autoriza excluir o PDF sem consultar o banco.

Rollback desativa a assinatura digital/configuração de runtime e preserva os registros/PDFs; o fluxo comum permanece disponível. Remover um certificado do perfil não remove assinaturas históricas. Perder/substituir a chave do cofre impede recuperar certificados/tokens previamente cadastrados; rotação exige migração, backup e autorização explícita.

## Verificações reproduzíveis

```powershell
npm test
node --test server/test/*.test.js
& ./.tools/signing-python/Scripts/python.exe -m unittest discover -s server/signing -p test_worker.py
$env:SIGNING_TEST_PYTHON = (Resolve-Path .tools/signing-python/Scripts/python.exe).Path
node --test server/test/digital-worker-integration.test.js
npm run build
node scripts/check-changed-secrets.mjs
git diff --check
```

O teste de integração Python/Node é opcional na suíte geral quando `SIGNING_TEST_PYTHON` não está definido; na verificação desta funcionalidade ele deve ser executado com runtime configurado. Nenhum teste precisa de CPF, certificado ou senha reais. O scanner de segredos é limitado a padrões nos arquivos alterados; ele complementa a revisão, sem comprovar ausência de todo tipo possível de segredo.

### Evidências desta implementação

- Frontend: 55 arquivos, 319 testes aprovados; a suíte final inclui recuperação e suspensão do certificado.
- Backend: 211 testes aprovados; um teste de integração opcional pulado na suíte geral e executado separadamente com sucesso.
- Motor criptográfico: 10 testes aprovados, incluindo cadeia sintética, senha/CPF inválidos, certificado vencido/revogado, CPF com sufixo alfanumérico de RG, rejeição e-CNPJ, PDF íntegro e adulterado.
- Integração real Node/Python: assinatura, validação, detecção de adulteração e rejeição de senha incorreta aprovadas, usando material sintético temporário.
- TypeScript e build frontend concluídos; build manteve avisos sobre bundles grandes/Browserslist, sem erro.
- Scanner de padrões de segredo e `git diff --check` aprovados.
- Inspeção de interface no Edge em 1440 px e 390 px: configurações, opção inicialmente desligada, orientação quando falta certificado, página pública, foco e ausência de overflow aprovados. APIs foram interceptadas com respostas sintéticas; nenhum dado real foi consultado ou enviado.
- Revisão de segurança conferiu autorização, armazenamento privado, cofre, revogação, bloqueios transacionais, recuperação e distinção do registro público de emissão. Preparação de produção e restauração estão descritas acima; a publicação exige confirmação dos deploys.

### Compatibilidade da revisão certificada

A emissão incorpora certificados e evidências de revogação (DSS) na mesma revisão da assinatura PAdES, com `include_vri=False` e `TOGETHER_WITH_SIGNATURE`. Não acrescenta uma revisão depois da certificação `NO_CHANGES`. O teste de regressão confere que o ByteRange termina no fim do arquivo, preserva certificados/CRLs no DSS e rejeita adulteração. Isso não substitui a validação de confiança do leitor nem fornece carimbo do tempo. PDFs já emitidos permanecem inalterados; a mudança se aplica às novas emissões.

O cabeçalho usa o logo ao lado das duas linhas do nome da clínica, ambas em Helvetica 10 pt, com menos altura antes dos dados do paciente.
