# Menu público e melhorias do fluxo de caixa

## Contexto

A homepage ainda apresenta `Stories` e `Contato` no menu superior como atalhos de baixo valor para o fluxo principal. A tela `/admin/finance` também precisa alinhar cadastro, apuração contábil, leitura das transações e exportação PDF: lançamentos devem aceitar a data real da movimentação, despesas devem usar categorias globais cadastradas em `/admin/settings`, o saldo deve carregar o fechamento anterior e a identificação visual deve priorizar o paciente sem expor números de atendimento.

## Objetivos

- Remover `Stories` e `Contato` do menu superior público em desktop e mobile.
- Permitir que uma nova transação seja registrada com uma data escolhida, inicialmente preenchida com a data atual.
- Fazer a data informada alimentar o mês correspondente do fluxo de caixa, usando os limites de mês de São Paulo no backend.
- Tornar a descrição opcional e não renderizar texto substituto quando estiver vazia.
- Cadastrar categorias financeiras globais em `/admin/settings` e usá-las na seleção de despesas.
- Exibir no card de despesas uma distribuição discreta por categoria, sem criar dados artificiais.
- Separar o líquido do mês do total acumulado em conta, incluindo o fechamento dos meses anteriores.
- Remover a função de impressão do navegador e manter uma exportação PDF melhor identificada para o mês/ano selecionado.
- Remover números ou referências de atendimento da leitura do fluxo e do PDF.

## Fora de escopo

- Alterar autenticação, permissões existentes ou o fluxo de login.
- Criar lançamentos automáticos a partir de agendamentos.
- Permitir edição de transações existentes pela tela; o campo de data se aplica ao novo lançamento.
- Alterar o fluxo de finanças pessoais.
- Expor categorias ou qualquer dado financeiro na rota pública `/public-settings`.

## Decisões de arquitetura

### Navegação pública

`src/components/layout/Header.tsx` removerá apenas os dois itens da coleção `navItems`. As seções e rotas continuarão existentes e acessíveis por outros links internos.

### Categorias globais

Será criado um modelo `FinanceCategory` com nome único e timestamps. A lista será global para a clínica, não vinculada a usuário. A categoria padrão `Geral` será criada pela migração caso ainda não exista, preservando o funcionamento de instalações existentes.

Serão adicionadas rotas privadas:

- `GET /finance/categories`: administradores e gestores podem consultar categorias.
- `POST /finance/categories`: somente administradores podem criar uma categoria validada e normalizada.
- `DELETE /finance/categories/:id`: somente administradores podem remover uma categoria que não esteja referenciada por transações.

A tela `/admin/settings` terá um card de categorias com adicionar/remover e feedback de erro quando uma categoria já estiver em uso. A rota pública de configurações permanecerá baseada na allowlist existente e não incluirá categorias financeiras.

### Nova transação

O formulário de `/admin/finance` terá `date` como campo obrigatório `input[type=date]`, com o dia atual como valor inicial. O frontend enviará a data sem convertê-la para UTC. O backend interpretará `YYYY-MM-DD` como meia-noite no fuso `America/Sao_Paulo`, validará a data e persistirá o instante correspondente.

O backend não aceitará uma data implícita enviada pelo cliente nem permitirá payloads inválidos. A descrição será persistida como `null` quando vazia; o campo Prisma será tornado opcional por migração. A categoria será obrigatória para despesas e deverá pertencer à lista global cadastrada. Lançamentos de receitas manterão compatibilidade com o comportamento existente, usando a categoria informada ou `Geral`.

Após o salvamento, o formulário será limpo e a data voltará para hoje. A transação aparecerá no filtro mensal correspondente à data escolhida; não haverá bloqueio do formulário ao consultar meses anteriores.

### Apuração contábil

Para o período explícito selecionado, `/finance/stats` retornará os valores atuais e novos campos sem remover os campos legados:

- `income`: receitas realizadas do mês.
- `pendingIncome`: receitas pendentes do mês.
- `expense`: despesas válidas do mês.
- `balance` e `monthlyBalance`: receita menos despesa do mês.
- `openingBalance`: acumulado válido anterior ao início do mês.
- `closingBalance`: `openingBalance + monthlyBalance`, representando o total acumulado em conta até o fim do mês.

Receitas pendentes e lançamentos anulados não entrarão no saldo realizado. A consulta acumulada usará os mesmos critérios de pagamento das estatísticas mensais, com limite exclusivo no início/fim do período para evitar dupla contagem.

### Leitura do fluxo

Cada transação será apresentada sem `appointmentId` ou número de atendimento. Quando houver paciente, o nome será a menção principal. A descrição será uma linha secundária somente se houver conteúdo. A categoria/procedimento ficará como legenda de menor destaque. Em despesas sem paciente, a categoria será a identificação principal; nenhuma string como `Despesa sem descrição` será criada.

O card de despesas manterá sua interação de filtro e passará a exibir uma distribuição calculada apenas com as despesas válidas do período carregado. Cada categoria terá percentual e barra proporcional ao total do período; a lista não exibirá itens quando não houver despesas.

### Exportação PDF

O botão `Imprimir` e o seletor de formato de impressão serão removidos de `/admin/finance`. A ação `Exportar PDF` continuará usando `@react-pdf/renderer`, mas será sempre baseada no mês/ano selecionado na tela e terá nome de arquivo com esse período.

O documento terá:

1. cabeçalho com logo, nome/slogan da clínica, título, período e data de geração;
2. resumo com receitas, despesas, líquido do mês e saldo acumulado;
3. tabela com data, paciente/menção, descrição opcional, categoria e valor;
4. rodapé de relatório interno sem hash aleatório nem referência de atendimento.

O cabeçalho usará a identidade configurada quando disponível e manterá fallback visual seguro para a logo padrão. O PDF não incluirá CPF, endereço, número de atendimento ou dados além dos necessários ao fluxo financeiro exibido.

## Componentes e arquivos previstos

- `src/components/layout/Header.tsx`: remover itens públicos da navegação.
- `src/pages/AdminFinance.tsx`: data editável, categorias, novo saldo, hierarquia das transações, distribuição de despesas e ação PDF.
- `src/pages/AdminSettings.tsx`: cadastro global de categorias.
- `src/components/admin/FinanceReportPDF.tsx`: cabeçalho, resumo acumulado e tabela revisados.
- `src/lib/finance.ts`: helpers de período/data e tipos derivados, se necessário.
- `server/prisma/schema.prisma`: modelo de categorias e descrição opcional.
- `server/prisma/migrations/20260909000000_add_finance_categories_and_optional_description/migration.sql`: alteração compatível do banco e categoria padrão.
- `server/utils/financePeriod.js`: parser/limites compartilhados e critérios acumulados.
- `server/index.js`: rotas de categorias, validação da data/categoria e estatísticas acumuladas.
- Testes de contrato frontend/backend e testes unitários para período, saldo e renderização sem atendimento.

## Segurança e dados

- Todas as rotas de categorias e finanças continuarão protegidas por `authenticateToken` e `authorizeRole`.
- Categorias financeiras não serão adicionadas à allowlist pública.
- A entrada de nome, descrição, data, valor e categoria será validada no servidor; valores não finitos, tipos inválidos e categorias inexistentes serão rejeitados.
- Nenhum token, credencial, CPF, endereço ou dado financeiro real será adicionado a testes, logs ou documentação.
- Upload de comprovantes continuará usando o endpoint privado existente.
- A migração não removerá dados existentes; categorias referenciadas não poderão ser apagadas.

## Tratamento de erros

- Falha ao carregar categorias ou estatísticas exibirá feedback de erro sem limpar dados já carregados.
- Tentativa de salvar despesa sem categoria, data inválida ou categoria inexistente exibirá erro de validação e manterá o formulário preenchido.
- Tentativa de remover categoria em uso exibirá mensagem específica.
- Falha na geração do PDF manterá a ação disponível e exibirá o estado de erro do componente de download.
- Meses sem transações mostrarão zeros nos indicadores e nenhum gráfico de categoria.

## Verificação

- Testar o menu público para garantir ausência de `Stories` e `Contato`.
- Testar contrato do backend para autenticação, validação da data, categoria global, descrição opcional e campos acumulados.
- Testar que uma data anterior é enviada e aparece no período correspondente.
- Testar `openingBalance`, `monthlyBalance` e `closingBalance` com receitas/despesas em meses consecutivos.
- Testar visualização sem texto substituto quando a descrição é vazia e sem menção a atendimento.
- Executar `npm test`, testes Node do servidor, `npm run lint`, `npm run build`, `git diff --check` e o scanner de segredos disponível.
- Inspecionar `/`, `/admin/finance` e `/admin/settings` em desktop e mobile, incluindo o PDF do período selecionado.

## Critérios de aceite

1. `Stories` e `Contato` não aparecem no menu superior da homepage em desktop ou mobile.
2. A nova transação aceita data atual ou anterior e alimenta o mês da data escolhida.
3. A descrição pode ficar vazia e não gera texto de preenchimento na tela ou no PDF.
4. Despesas usam categorias globais cadastradas em `/admin/settings`.
5. O fluxo não exibe número de atendimento; paciente é a menção principal e categoria/procedimento é secundária.
6. O card de despesas mostra categorias reais de forma discreta e proporcional.
7. O card de saldo mostra líquido do mês e total acumulado com o fechamento anterior.
8. A tela não oferece impressão do navegador e o PDF exportado identifica corretamente o período selecionado.
9. Nenhuma rota financeira nova fica pública e a migração preserva os dados existentes.
10. Testes, lint, build e verificação de whitespace passam, ou limitações ambientais são documentadas sem mascarar falhas.
