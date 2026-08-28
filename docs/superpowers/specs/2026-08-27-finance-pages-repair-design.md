# Correção das telas financeiras e responsividade mobile

## Contexto

As rotas `/admin/finance` e `/admin/personal-finance` precisam permanecer funcionais em desktop e mobile. A tela de Gestão Financeira está invisível porque seu conteúdo inteiro usa `print-root`, uma classe global que atualmente aplica `display: none` fora da impressão. A tela de Finanças Pessoais permanece renderizável, mas seus lançamentos usam uma linha flexível rígida que pode exceder a largura de celulares e esconder a ação de exclusão em dispositivos sem hover.

## Objetivos

- Exibir normalmente o conteúdo de `/admin/finance` em qualquer viewport.
- Preservar o escopo de impressão e os relatórios existentes.
- Impedir overflow horizontal nas duas telas financeiras.
- Tornar formulários, filtros, indicadores, históricos e ações utilizáveis por toque.
- Manter API, autenticação, permissões, upload privado e estrutura dos dados sem alterações.

## Abordagem

Será feita uma correção localizada nos componentes e estilos existentes, sem extrair uma nova camada de componentes compartilhados.

### Visibilidade e impressão

O CSS não ocultará mais globalmente `.print-root` na tela. Os alvos exclusivos de impressão já usam a classe utilitária `hidden` junto com `print-only`, enquanto `AdminFinance` usa o escopo como contêiner do conteúdo visível. Assim, o conteúdo financeiro será visível em tela e continuará sendo selecionado pelo fluxo de impressão por `body:has(.print-root)` e pelas regras de `@media print` existentes.

### `AdminFinance`

- Manter a tabela desktop e os cartões de movimentação mobile.
- Reforçar `min-w-0`, quebra de palavras e largura flexível nos blocos de cabeçalho e controles.
- Fazer os controles de período e exportação se acomodarem em linhas/colunas sem expandir a página.
- Não alterar filtros, chamadas de API, anexos, confirmação de NF-e ou exportações.

### `AdminPersonalFinance`

- Manter os indicadores em uma coluna no celular e em quatro colunas a partir de telas maiores.
- Empilhar valor e status no formulário em telas muito estreitas, retomando duas colunas em `sm`.
- Alterar cada lançamento histórico para um layout vertical no mobile e horizontal em telas maiores.
- Aplicar `min-w-0`, `break-words` e `flex-wrap` aos textos, badges e metadados.
- Manter a exclusão sempre acionável no toque; usar ocultação por hover apenas como refinamento em telas maiores.
- Remover dependência de hover para ações essenciais e garantir alvos mínimos de toque.

## Dados, segurança e erros

Nenhuma rota, payload, permissão, credencial, armazenamento ou regra de autorização será alterada. Falhas existentes de carregamento/upload continuarão sendo tratadas pelas mensagens atuais. A correção não adicionará dados sensíveis a logs, testes ou documentação.

## Verificação

- Adicionar uma regressão automatizada para garantir que `.print-root` não volte a ocultar o conteúdo em tela e cobrir os contratos de layout responsivo relevantes.
- Executar a suíte Vitest, lint e build de produção.
- Executar `git diff --check`.
- Inspecionar as duas rotas em viewport desktop e mobile, verificando visibilidade, ausência de overflow horizontal, leitura dos históricos e acionabilidade das ações.
- Confirmar que somente os arquivos da correção e a especificação sejam incluídos nos commits; alterações existentes em `.superpowers/sdd` serão preservadas.

## Critérios de aceite

1. `/admin/finance` renderiza seu conteúdo fora do modo de impressão em desktop e mobile.
2. `/admin/personal-finance` não corta ou comprime lançamentos, campos ou ações em viewport estreita.
3. Nenhuma das duas rotas cria scroll horizontal da página por causa de seus próprios conteúdos.
4. A impressão e os downloads existentes continuam disponíveis.
5. Testes, lint, build e verificação de whitespace passam, ou qualquer limitação ambiental é documentada sem mascarar falhas reais.
