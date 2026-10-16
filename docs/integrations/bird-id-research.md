# Bird ID: pesquisa de integração

Pesquisa em fontes oficiais em 15/10/2026, delegada ao modelo Luna com esforço xHigh. Documento de arquitetura; nenhuma integração Bird ID foi ativada e nenhum documento de paciente foi enviado ao fornecedor.

## Como funciona

Bird ID é a oferta de certificado A3 em nuvem da Soluti. A chave privada permanece no serviço remoto, protegido por HSM; não é um PFX para upload no cofre A1 existente. O titular autoriza o uso pelo fluxo do fornecedor, com aplicativo e OTP. A autenticação e a operação criptográfica são etapas distintas. O modelo de PSC da ICP-Brasil exige proteção da chave e controle de uso pelo titular. Detalhes da instância contratada devem ser conferidos na DPPSC e no contrato técnico.

Fontes: [manual Bird ID](https://manuais.soluti.com.br/manual-de-produtos/certificados-digitais/utilizacao/bird-id), [manual de emissão](https://www.soluti.com.br/wp-content/uploads/2023/06/Manual-Certificado-BirdID-Emissao.pdf), [requisitos de PSC do ITI](https://repositorio.iti.gov.br/instrucoes-normativas/IN2020_20_DOC-ICP-17.01.htm).

## Autorização web

A documentação oferece OAuth Authorization Code com PKCE S256 e URI de retorno cadastrada. O Express deve criar uma sessão curta vinculada ao profissional e à receita revisada, gerar state/verifier, redirecionar para a Soluti, conferir o retorno e trocar o código no backend. React mostra o andamento; segredo de cliente, token OAuth e verifier ficam no servidor. Não coletar OTP no formulário da clínica nem guardar credenciais reutilizáveis no navegador. O escopo precisa autorizar assinatura, não apenas autenticação.

Endpoints de produção documentados:

- GET /v0/oauth/authorize em api.birdid.com.br.
- POST /v0/oauth/token no mesmo host.
- GET /v0/oauth/certificate-discovery para recuperar o certificado selecionado no fluxo.

Conferir identidade do titular, certificado público e vínculo com o profissional antes de emitir. Não confiar somente em um CPF fornecido pelo navegador.

Fontes: [OAuth web](https://docs.vaultid.com.br/workspace/cloud/api/autenticacao-de-usuarios/autenticacao-em-sistemas-web), [descoberta de certificado](https://docs.vaultid.com.br/workspace/cloud/api/auxilio/recuperacao-de-certificado).

## Duas opções para este projeto

| Opção | Funcionamento | Avaliação |
|---|---|---|
| API de hashes + pyHanko | O backend prepara o PDF, calcula os dados exatos a assinar e pede uma assinatura remota; pyHanko incorpora o resultado ao PDF. | Preserva o processamento local do documento, mas exige integração criptográfica e homologação rigorosa. |
| CESS / BirdID Pro | O backend coordena uma transação de assinatura de PDF no CESS, acompanha o resultado e recupera o PDF final. | Recomendação inicial para avaliar com a Soluti: reduz a implementação própria do formato PAdES, com licença e operação adicionais. |

A API básica POST https://api.birdid.com.br/v0/oauth/signature recebe hashes hexadecimais e retorna RAW ou CMS-detached. Ela não recebe um PDF e não devolve automaticamente um PDF PAdES. Enviar o hash do arquivo e anexar a resposta como imagem não produz assinatura válida.

A alternativa local deve usar assinatura interrompida/remota do pyHanko, conferindo o hash dos atributos assinados, algoritmo, certificado e tamanho reservado antes de finalizar o PDF. Isso é uma proposta arquitetural, ainda não implementada nem homologada com Bird ID.

Fontes: [API de assinatura](https://docs.vaultid.com.br/workspace/cloud/api/uso-de-certificado/assinatura-digital), [assinatura remota pyHanko](https://docs.pyhanko.eu/en/stable/lib-guide/signing.html).

CESS documenta transações identificadas por TCN, envio do documento, consulta ou callback e recuperação do resultado. Suporta PDFSignature/PAdES. Confirmar com a Soluti a política e o serviço de carimbo do tempo aplicáveis. Os arquivos no CESS têm retenção temporária; a aplicação precisa recuperar e preservar o resultado. O CESS pode ser operado em implantação contratada; definir onde os dados clínicos serão processados antes da escolha entre serviço gerenciado e instância própria.

Fontes: [fluxo de PDF no CESS](https://docs.vaultid.com.br/workspace/cess/api/assinatura-de-documento-s), [instalação e licenciamento](https://docs.vaultid.com.br/workspace/cess/instalacao-e-configuracao), [retenção e dúvidas](https://docs.vaultid.com.br/workspace/cess/duvidas-frequentes).

## Integração proposta

1. Manter A1 funcional e adicionar um provedor Bird ID separado, sem converter o cofre A1 ou reutilizar sua chave.
2. Criar operação idempotente com estados de autorização, assinatura, validação e conclusão. Associar o conteúdo revisado e o profissional à operação; mudanças exigem nova revisão.
3. Autorizar pelo provedor, conferir o certificado e produzir o PDF com URL/token antes de assinar.
4. Validar criptograficamente o resultado, verificar conteúdo e identidade esperados, persistir os bytes finais no bucket privado e concluir a transação. Callback deve ser autenticado ou confirmado por consulta servidor-servidor.
5. Reutilizar o acesso por token da página oficial. Nunca expor token OAuth, TCN sensível ou URL temporária do fornecedor nesse acesso.
6. Homologar expiração, recusa, indisponibilidade, replay, concorrência, adulteração, timeout e retomada; conferir o mesmo PDF no motor local, ITI e Acrobat.

## Dependências externas

Solicitar à Soluti cadastro de integrador, credenciais de homologação, certificado de teste, redirects/scopes permitidos, limites e SLA. Confirmar o host de homologação para cada API: os documentos citam apihom.birdid.com.br para cloud e cess.lab.vaultid.com.br para CESS. Confirmar licença de produção, opção hospedada ou Docker, retenção, ACT/carimbo e contrato de tratamento de dados. Não há preço público verificado para a integração B2B completa; preço de varejo do certificado não equivale a licença/API/volume.

Fontes: [produtos da plataforma](https://docs.vaultid.com.br/workspace), [configuração CESS](https://docs.vaultid.com.br/workspace/cess/instalacao-e-configuracao).

## Adobe

ICP-Brasil, formato PAdES e confiança AATL são verificações diferentes. Migrar para A3 não garante, por si só, aceitação automática em todo Acrobat: é necessário conferir a política OID e a cadeia do certificado efetivamente emitido. O erro observado no A1 atual é de restrição de política, não de alteração dos bytes do PDF. Não remover verificações de política ou revogação para obter indicação visual de validade.

Fontes: [AATL Adobe](https://helpx.adobe.com/br/acrobat/kb/approved-trust-list1.html), [explicação de funcionário Adobe sobre restrição de política](https://community.adobe.com/questions-9/previously-valid-signing-certificate-shows-invalid-policy-constraint-in-dc-2019-1238567).
