# Produtos inativos no estoque e dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ocultar produtos inativos do dashboard, condensá-los em uma seção recolhida no cadastro e reduzir as ações da tabela a botões iconográficos acessíveis.

**Architecture:** O backend filtrará produtos ativos somente na consulta específica do dashboard, preservando os endpoints de estoque e o banco sem alterações destrutivas. O frontend dividirá a lista recebida em produtos ativos e inativos, renderizando os inativos sob demanda e mantendo edição, ajuste e histórico acessíveis por ícones.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, Express, Prisma, Tailwind, lucide-react.

## Global Constraints

- Nenhum produto, uso ou movimentação será removido ou alterado no banco.
- Produtos inativos não podem aparecer no dashboard operacional nem compor `stockTotalValue`.
- Ações iconográficas precisam de `aria-label`, foco visível, hover e área de interação mínima adequada.
- Executar somente testes direcionados de dashboard/estoque e `git diff --check`.
- Seguir `SECURITY.md` e preservar arquivos não relacionados do usuário.

### Task 1: Filtrar estoque inativo no dashboard

**Files:**
- Modify: `server/routes/dashboard.js:48-61`
- Test: `server/test/dashboard-stock-contract.test.js` (criar, se não existir)

**Interfaces:**
- Consumes: `prisma.stockProduct.findMany` dentro de `createDashboardStatsHandler`.
- Produces: `recentStock` contendo apenas produtos com `active === true` e `stockTotalValue` calculado sobre o mesmo conjunto.

- [ ] **Step 1: Write the failing test**

Criar um teste de contrato com um Prisma fake que capture o `where` da consulta de estoque e retorne um produto ativo e um inativo. Chamar o handler com usuário `admin` e verificar que o `where` exige `{ active: true }`, que `recentStock` contém somente o ativo e que o valor total não inclui o inativo.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/test/dashboard-stock-contract.test.js`
Expected: FAIL porque a consulta atual não envia filtro de `active` e inclui ambos os produtos.

- [ ] **Step 3: Write minimal implementation**

Adicionar `where: { active: true }` ao `stockProduct.findMany`, mantendo `select`, ordenação, permissões e serialização existentes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run server/test/dashboard-stock-contract.test.js`
Expected: PASS.

- [ ] **Step 5: Commit when repository permissions allow**

Run: `git add server/routes/dashboard.js server/test/dashboard-stock-contract.test.js; git commit -m "fix: hide inactive stock from dashboard"`

### Task 2: Agrupar produtos inativos e compactar ações

**Files:**
- Modify: `src/pages/AdminStock.tsx:1-92`
- Test: `src/pages/AdminStock.test.tsx`

**Interfaces:**
- Consumes: `StockProduct[]` retornado por `loadStockProducts`, callbacks existentes `openProduct`, `openHistory` e `submitAdjustment`.
- Produces: tabela de ativos, seção recolhida de inativos e três botões com ícones/`aria-label` por produto.

- [ ] **Step 1: Write the failing tests**

Adicionar produto inativo ao fixture e testar que:

```tsx
expect(screen.getByText("Produtos inativos")).toBeInTheDocument();
expect(screen.queryByRole("button", { name: "Editar Produto inativo" })).not.toBeInTheDocument();
fireEvent.click(screen.getByRole("button", { name: /Produtos inativos/ }));
expect(screen.getByText("Produto inativo")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Editar Produto inativo" })).toBeInTheDocument();
```

Também verificar que os controles ativos tenham `aria-label` de editar, ajustar e histórico e que não existam botões com os nomes textuais isolados `Editar`, `Ajustar` e `Histórico`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/pages/AdminStock.test.tsx`
Expected: FAIL porque os inativos ainda aparecem na tabela aberta e as ações atuais são textuais.

- [ ] **Step 3: Write minimal implementation**

Separar após o filtro de busca/classe:

```tsx
const activeProducts = visible.filter(product => product.active);
const inactiveProducts = visible.filter(product => !product.active);
```

Renderizar `activeProducts` na tabela atual e `inactiveProducts` dentro de `<details>` ou controle semântico equivalente inicialmente fechado, com resumo contendo nome/classe/status. Reutilizar as mesmas ações em cada linha, substituindo textos por `Edit`, `SlidersHorizontal` e `History`, cada uma com `aria-label`, `title`, `size="sm"`, classe de foco visível e dimensões mínimas. Manter as ações em uma coluna compacta e não alterar o payload de edição/ajuste.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/pages/AdminStock.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit when repository permissions allow**

Run: `git add src/pages/AdminStock.tsx src/pages/AdminStock.test.tsx; git commit -m "feat: condense inactive stock products"`

### Task 3: Ajustar contrato visual do dashboard e validação final focada

**Files:**
- Modify: `src/pages/AdminDashboard.test.tsx`
- Possibly modify: `src/pages/AdminDashboard.tsx` only if the targeted test exposes a stale UI assumption.

**Interfaces:**
- Consumes: resposta do endpoint com produtos ativos já filtrados.
- Produces: cobertura de regressão para não renderizar produtos inativos no dashboard.

- [ ] **Step 1: Write the failing test**

Alterar o fixture do dashboard para incluir um segundo produto com `active: false` e verificar que o dashboard não o apresenta. Manter a expectativa de valor do produto ativo.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/AdminDashboard.test.tsx`
Expected: FAIL se a UI renderizar indiscriminadamente qualquer item recebido.

- [ ] **Step 3: Write minimal implementation**

Manter o componente consumindo o contrato já filtrado pelo servidor; somente se o teste revelar uma renderização indevida no frontend, adicionar `active?: boolean` ao item e filtrar `stats.recentStock` por `product.active !== false`, sem alterar o cálculo exibido no servidor.

- [ ] **Step 4: Run focused verification**

Run: `npx vitest run src/pages/AdminDashboard.test.tsx src/pages/AdminStock.test.tsx server/test/dashboard-stock-contract.test.js`
Expected: PASS, sem executar a suíte completa.

- [ ] **Step 5: Run repository hygiene check**

Run: `git diff --check`
Expected: nenhuma saída e código de saída 0.
