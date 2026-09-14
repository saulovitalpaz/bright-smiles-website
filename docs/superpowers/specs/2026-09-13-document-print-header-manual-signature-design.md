# Correção de impressão de documentos e modelo manual

## Objetivo

Garantir que a impressão de documentos mantenha o logo e o cabeçalho clínico e remover o campo de assinatura do paciente do modelo de documento para preenchimento manual.

## Contexto e causa

O componente `ClinicDocumentPrint` já contém o logo e o cabeçalho dentro do alvo explícito de impressão, mas `AdminDocuments` chama `window.print()` no primeiro `requestAnimationFrame` depois de montar esse alvo. Nesse momento, o logo ainda pode estar carregando e ser omitido pela prévia/impressão do navegador.

O modo manual usa o mesmo bloco de assinaturas dos documentos normais. Ele esconde apenas o nome e o CPF do paciente, mantendo o traço e o rótulo `Assinatura do Paciente`.

## Design

### Fluxo de impressão

O fluxo de `AdminDocuments` continuará montando `ClinicDocumentPrint` fora da área interativa. Antes de iniciar `window.print()`, aguardará o carregamento dos recursos visuais necessários no alvo de impressão. O cabeçalho continuará sendo conteúdo sem a classe `no-print`, enquanto o shell administrativo seguirá excluído pelo CSS de impressão.

### Modelo manual

`ClinicDocumentPrint` terá duas apresentações explícitas:

- modo normal: conteúdo do documento, dados do paciente, campo de assinatura do paciente e assinatura profissional opcional;
- modo manual: cartão do paciente em branco, área livre para preenchimento, identificação profissional e data, sem qualquer campo ou rótulo de assinatura do paciente e sem imagem de assinatura profissional.

O modo manual continuará exigindo nome e CRO configurados para preservar a identificação profissional do cabeçalho/rodapé impresso.

### Testes e verificação

Os testes de componente validarão a ausência estrutural do campo de assinatura do paciente no modo manual e a preservação desse campo no documento normal. Um teste do fluxo de impressão validará que a chamada de `window.print()` ocorre somente depois que o recurso visual do documento está pronto. A entrega será validada com testes focados, lint, build, contrato de impressão, secret scan e `git diff --check`.

## Limites

Esta mudança não altera o armazenamento de documentos, endpoints, permissões, assinatura profissional configurável ou o conteúdo dos modelos existentes.
