# Produtos inativos no estoque e dashboard

## Objetivo

Quando um produto de estoque for inativado, ele deixa de aparecer no dashboard operacional, mas continua armazenado para referência histórica de uso e movimentações. A página de cadastro deve preservar o acesso administrativo sem ocupar espaço desnecessário.

## Comportamento

- O endpoint de estatísticas do dashboard consulta somente produtos ativos para `recentStock` e `stockTotalValue`.
- A página de estoque mantém todos os produtos carregados para permitir consulta e edição.
- Produtos ativos permanecem na tabela principal com os dados atuais.
- Produtos inativos aparecem em uma seção inicialmente recolhida, com apresentação resumida.
- A seção de inativos permite abrir o produto para edição e consultar seu histórico; ajustar saldo continua disponível quando o produto for selecionado.
- Nenhum produto, uso ou movimentação é removido ou alterado no banco.
- As ações da tabela deixam de usar botões textuais laterais e passam a ser controles compactos apenas com ícones: editar, ajustar e histórico.
- Cada botão iconográfico mantém nome acessível via `aria-label`, foco visível, feedback de hover e área de interação adequada.

## Componentes e dados

- `server/routes/dashboard.js`: filtrar `active: true` na consulta de estoque e no cálculo do valor.
- `src/pages/AdminDashboard.tsx`: contrato permanece compatível; a UI recebe somente dados operacionais ativos.
- `src/pages/AdminStock.tsx`: separar produtos ativos/inativos, controlar expansão da seção inativa e substituir os textos das ações por ícones acessíveis.
- Os endpoints de estoque e o modelo Prisma permanecem sem exclusão física ou mudança de schema.

## Validação focada

- Teste do dashboard garantindo que produto inativo não seja renderizado quando a resposta contiver ambos os estados.
- Teste da página de estoque garantindo seção recolhida de inativos e ações iconográficas com nomes acessíveis.
- Verificação direcionada dos testes desses dois módulos e `git diff --check`; não executar a suíte completa sem necessidade.

## Fora de escopo

- Alterar regras de uso clínico, baixa de estoque ou histórico.
- Criar migração de banco.
- Remover definitivamente produtos inativos.
