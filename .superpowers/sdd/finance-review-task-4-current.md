# Revisão independente — Task 4 de finanças

Base comparada: `aee5bc8`  
Escopo revisado: diff atual de `Header.tsx`, `AdminFinance.tsx`, `src/lib/finance.ts`, os dois testes de frontend, além da correção em `server/index.js` e `server/test/finance-period-contract.test.js`. O escopo PWA não foi lido, editado ou avaliado.

## Veredito

Não aprovar ainda o conjunto financeiro para a finalização. O núcleo de data histórica, categorias privadas, saldos acumulados e remoção de `Stories`/`Contato` está coerente. A correção backend de `categoryId` está aplicada no caminho de criação e a validação impede categoria inexistente. Porém há uma divergência contábil no resumo de despesas e o componente PDF ainda é o contrato anterior; ambos precisam ser resolvidos antes do aceite integral.

## Achados

### P1 — Resumo de categorias pode divergir do total contábil

`src/lib/finance.ts:19-30` soma toda transação `expense` positiva com categoria, e `AdminFinance.tsx:94` usa esse resultado diretamente. O backend, por outro lado, exclui despesas `voided` do `stats.expense` em `server/index.js:1754`. Como a lista mensal não é filtrada por `paymentStatus` no frontend, uma despesa anulada pode aparecer nas barras/categorias enquanto não aparece em “Despesas totais”. Percentuais e totais deixam de representar o mesmo caixa.

Recomendação: incluir `paymentStatus` no tipo e excluir anuladas antes da agregação, ou retornar uma agregação de categorias do backend usando exatamente os mesmos critérios de `financeStatsWhere`. Adicionar um teste com despesa anulada e uma despesa válida.

### P1 — PDF ainda não atende o período e a hierarquia financeira completos

O botão em `AdminFinance.tsx:246` passa as transações do período selecionado e o título mensal, o que está correto. Contudo `src/components/admin/FinanceReportPDF.tsx` ainda:

- usa apenas `stats.balance` em `:181-182`, sem `monthlyBalance`, `openingBalance` e `closingBalance`;
- renderiza somente `t.description` em `:210`, sem paciente como menção principal;
- mantém o hash aleatório em `:226`, contrariando o PDF determinístico previsto;
- gera o nome com a data atual em `:240`, em vez de `YYYY-MM` do período selecionado.

Isso parece ser trabalho pendente do Task 5, mas é bloqueador para o requisito combinado do fluxo financeiro. Corrigir no upgrade do PDF antes da finalização; não é necessário alterar o escopo PWA.

### P2 — Descrição de despesa existente é ocultada na tela

Nas linhas desktop e mobile de `AdminFinance.tsx:248-249`, a descrição só é renderizada quando `t.patient` existe. Uma despesa manual com categoria e descrição preenchidas aparece apenas com a categoria, embora a descrição deva ser opcional — não descartada quando fornecida. O fallback de categoria sem descrição está correto e não cria “Despesa sem descrição”.

Recomendação: exibir a descrição sempre que não vazia, mantendo paciente como título quando houver paciente e categoria como fallback/legenda quando não houver.

### P2 — Falhas de carregamento não recebem feedback ao administrador

`loadFinanceData` em `AdminFinance.tsx:61-87` apenas registra erros no console; respostas não-OK de transações, estatísticas ou categorias também são silenciosamente ignoradas. O requisito do plano prevê feedback sem apagar os dados já carregados.

Recomendação: exibir toast/estado de erro por carregamento e preservar o último estado válido.

### P2 — Cobertura backend confirma o contrato textual, não a persistência em execução

Os 15 testes backend passam, mas `finance-period-contract.test.js` verifica principalmente trechos de fonte, schema e helpers. Não há teste HTTP/integração que prove que um `POST /finance` com `date: '2026-08-15'` e `categoryId` grava ambos os valores no Prisma real/mockado. A inspeção do código mostra o caminho correto: `server/index.js:1672-1674` recebe `categoryId`, `validateFinanceTransactionInput` resolve a categoria em `:1560-1589` e devolve `categoryId` em `data`.

Recomendação: adicionar pelo menos um teste de serviço/rota com mock do Prisma para afirmar `date`, `description: null`, `categoryId` e o mês correspondente. Isso reduz o risco de uma regressão futura mascarada por testes de regex.

### P3 — Dado não usado no cálculo

`server/index.js:1749` atribui `endExclusive`, mas o valor não é usado diretamente; os limites já vêm de `financeStatsWhere(period)`. Não altera o resultado, mas deve ser removido ou usado para evitar confusão na manutenção.

## Pontos verificados sem achado

- `Header.tsx` não contém mais os itens `Stories` ou `Contato`.
- A data da nova transação é editável, inicia no dia atual, é enviada como `date: newDate` e não é bloqueada por mês histórico.
- O parser backend preserva `YYYY-MM-DD` em meia-noite de São Paulo e rejeita datas inválidas.
- `description: newDesc.trim() || null` evita placeholder e o fallback visual usa categoria, não “Despesa sem descrição”.
- Despesas enviam `categoryId`; a rota exige categoria existente para `expense` e mantém a rota privada com `authenticateToken`/`authorizeRole`.
- `openingBalance`, `monthlyBalance` e `closingBalance` usam o limite anterior ao início do mês e preservam `balance` como compatibilidade mensal.
- A UI não contém `appointmentId`, número de atendimento, `window.print()` ou o controle `Printer`.
- O carregamento do PDF recebe todas as transações do período selecionado, sem aplicar o filtro visual de tipo ao documento.
- A lista backend ainda seleciona `cpf` e `address` em `server/index.js:1661`. Isso não é exibido pela UI atual e já existia na base; por minimização de dados, recomenda-se remover esses campos da resposta financeira se nenhum consumidor legítimo precisar deles.

## Evidência executada

- `npm test -- src/components/admin/finance-contract.test.ts src/pages/finance-pages-layout.test.ts`: **11/11 testes aprovados**.
- `node --test test/finance-period-contract.test.js` em `server`: **15/15 testes aprovados**.
- Nenhum arquivo de código foi editado nesta revisão. Nenhum arquivo do escopo PWA foi tocado.
