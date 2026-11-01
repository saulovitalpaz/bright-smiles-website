# Planos de tratamento Implementation Plan

> **For agentic workers:** Execute inline task-by-task. Preserve unrelated user files and existing construction documentation.

**Goal:** Implementar orçamento odontológico com autorização parcial, execução clínica, pagamentos que alimentam o caixa somente quando recebidos e resumo histórico do paciente.

**Architecture:** Acrescentar modelos Prisma e rotas privadas para catálogo, planos e pagamentos, reutilizando a autenticação, autorização e o FinanceTransaction atual. Integrar o catálogo ao editor de condições e ao atendimento, e acrescentar telas privadas de tabela, planos e ficha do paciente sem alterar o autosave do odontograma nem transações antigas.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind/shadcn; Express, Zod, Prisma e PostgreSQL.

## Global Constraints

- Seguir `SECURITY.md`: dados clínicos/financeiros são sensíveis; novas rotas são privadas; validação e autorização acontecem no servidor.
- Preservar `Appointment.price`, `paymentStatus`, `syncAppointmentFinance` e todas as receitas existentes.
- Preços novos usam `Decimal(12,2)` e valores de pagamentos são derivados e validados no servidor.
- Não persistir dados clínicos em `localStorage`; reutilizar `fetchClient` com cookie HttpOnly.
- Não modificar nem apagar o PDF não rastreado `receita-assinada (2).pdf` ou documentação existente.
- Não adicionar nem executar testes automatizados nesta tarefa.

---

## Mapa de arquivos

- `server/prisma/schema.prisma`: novos modelos e relação de pagamento com caixa.
- `server/prisma/migrations/20261101090000_treatment_plans/migration.sql`: migração aditiva.
- `server/utils/validationSchemas.js`: schemas de catálogo, plano, autorização, estado clínico e pagamento.
- `server/routes/treatmentPlans.js`: endpoints privados de catálogo, orçamento, autorização, execução, pagamentos e resumo do paciente.
- `server/index.js`: registrar rotas e impedir edição/exclusão genérica de receitas vinculadas a pagamentos de plano.
- `src/components/admin/attendance/odontogram/ClinicalConditionEditor.tsx`: seletor opcional de procedimento associado à condição.
- `src/components/admin/attendance/Odontogram.tsx`: propagar seleção de procedimento ao atendimento sem mudar desenho e dados clínicos.
- `src/pages/AdminAttendanceDetail.tsx`: estado e editor do plano no atendimento; manter fluxo de cobrança avulsa existente.
- `src/pages/AdminProcedureTable.tsx`: administração do catálogo.
- `src/pages/AdminTreatmentPlans.tsx`: lista, orçamento imprimível, autorização, status clínico e recebimento.
- `src/pages/AdminPatientHistory.tsx`: visão consolidada por paciente.
- `src/pages/AdminPatients.tsx`: ação para abrir histórico.
- `src/pages/AdminFinance.tsx`: ocultar exclusão de receitas imutáveis de pagamento de plano.
- `src/App.tsx`: rotas lazy privadas.
- `src/components/admin/AdminLayout.tsx`: links de navegação para tabela, planos e pacientes.
- `docs/superpowers/specs/2026-11-01-treatment-plans-design.md`: decisões de produto e contratos.

## Task 1: Persistência e validação do domínio

1. Adicionar `ClinicalProcedure`, `TreatmentPlan`, `TreatmentPlanItem` e `TreatmentPlanPayment` com chaves estrangeiras restritivas para pagamentos/autorização, índices para `patientId`, `sourceAppointmentId`, estado e validade, `Decimal(12,2)` e campo idempotente único.
2. Adicionar `FinanceTransaction.treatmentPlanPaymentId Int? @unique` e relação opcional; manter `amount Float` e a relação `appointmentId` atuais.
3. Escrever migração SQL aditiva correspondente, sem alterar/apagar linhas existentes.
4. Validar unidades, categorias e preço do catálogo; para itens de catálogo, buscar o preço corrente no servidor. Para itens manuais, validar nome, quantidade e valor. Permitir somente valores autorizados entre zero e o total orçado.
5. Validar pagamento positivo, método, data e chave idempotente; limitar recebimento ao saldo ainda não recebido.

## Task 2: Rotas autenticadas e operação atômica

1. Criar `registerTreatmentPlanRoutes(app, { prisma, authenticateToken, authorizeRole })` e registrar em `server/index.js`.
2. Implementar `GET/POST/PUT /clinical-procedures` com admin para mutação e admin/dentist para leitura; inativar em vez de excluir procedimentos já referenciados.
3. Implementar `GET/POST /treatment-plans`, `GET/PUT /treatment-plans/:id`, `POST /treatment-plans/:id/authorization`, `PATCH /treatment-plan-items/:id/status` e `POST /treatment-plans/:id/payments` para admin/dentist.
4. Calcular total por fase, estado geral, total autorizado e saldo no servidor. Salvar snapshots de preço e descrição no item para não depender do catálogo em histórico/PDF.
5. Para pagamento, dentro de `prisma.$transaction`: validar plano e saldo, criar `TreatmentPlanPayment`, criar `FinanceTransaction` `type: income`, `paymentStatus: received`, paciente, data e descrição genérica, e linkar as chaves. Requisição idempotente retorna o pagamento já criado.
6. Implementar `GET /patients/:id/history` privado admin/dentist; retornar agendamentos, atendimentos, planos, pagamentos e saldos sem CPF, endereço ou prontuário desnecessário.
7. Em `PUT/DELETE /finance/:id`, responder `409` se a receita possuir `treatmentPlanPaymentId`; em `GET /finance`, sinalizar `source: treatment_plan` para a UI.

## Task 3: Catálogo e seleção no odontograma

1. Criar a página de tabela com busca, estado vazio, editar, ativar/inativar e campos de categoria, unidade, preço e tipos de condição relacionados.
2. Buscar catálogo com a API autenticada de leitura para dentista/admin.
3. Acrescentar ao `ClinicalConditionEditor` uma lista de procedimentos ativos associados ao tipo clínico selecionado. Seleções são temporárias até o profissional confirmar a condição; cancelamento não muda plano nem odontograma.
4. Propagar cada seleção por `Odontogram.onAddProcedure({ procedureId, toothNumber, conditionType, targets })` ao plano rascunho do atendimento. Não acrescentar preço ou dados de cobrança ao JSON `dentalNotes`.

## Task 4: Edição e salvamento do plano na consulta

1. Criar estado em memória de itens propostos na tela de atendimento e carregar os itens do plano de origem quando houver.
2. Renderizar card separado do odontograma, com fases, dente/regiões, procedimento, quantidade, total, observações e busca de item manual.
3. Permitir ajustar preço/quantidade e remover item antes de salvar; calcular totais em centavos no navegador para apresentação e recalcular no servidor.
4. Exigir consulta persistida e paciente associado antes de salvar; enviar snapshot clínico suficiente para ligar condição/dente/faces e criar orçamento com validade de 30 dias.
5. Salvar gera estado `awaiting_authorization`, não cria `FinanceTransaction` e não altera `Appointment.price` nem o fluxo legado.
6. Exibir feedback para erro de rede, paciente ausente, plano já autorizado e catálogo inativo; preservar o rascunho em memória durante a falha.

## Task 5: Orçamento, autorização, execução e pagamentos

1. Criar tela privada de planos com filtros por paciente, situação e saldo, abrindo orçamento por identificador.
2. Montar documento imprimível com dados da clínica/profissional, paciente, odontograma da consulta de origem, grupos de fase, validade, condições e totais; escapar conteúdo textual e não incluir dados não necessários.
3. Criar revisão de autorização com seleção por item, “Marcar todos”, valor final por item, desconto calculado e total autorizado. A API decide os estados finais.
4. Bloquear edição do orçamento após primeira autorização; permitir acompanhar execução clínica dos itens autorizados por `autorizado`, `em andamento` ou `concluído`.
5. Criar formulário de recebimento com valor, data e método; mostrar total autorizado, recebido e saldo. Após retorno, atualizar valores sem permitir duplicação por duplo clique/reenvio.
6. Atualizar resumo da lista sem consultar detalhes clínicos na tela financeira.

## Task 6: Ficha do paciente e navegação

1. Adicionar link `Planos de tratamento` ao grupo Atendimento e `Minha tabela` ao grupo Configurações, respeitando filtros de papel do menu.
2. Adicionar ação `Ver ficha` em cada paciente e rota privada `/admin/pacientes/:id`.
3. A página da ficha consome apenas `/patients/:id/history` e apresenta próximo horário, última consulta, orçamentos, tratamentos agrupados por estado, recebido e saldo em aberto, com links para os detalhes.
4. Garantir estados de carregamento, paciente não encontrado, lista vazia e erro sem exibir payloads sensíveis em toast ou console.

## Revisão manual da mudança

- Conferir o diff e as novas relações Prisma contra a migração SQL.
- Procurar novas rotas para confirmar `authenticateToken` e `authorizeRole` em todas elas.
- Conferir que criar orçamento e autorizar não escrevem em `FinanceTransaction`.
- Conferir que o pagamento cria um único registro recebido e uma única receita dentro da mesma transação.
- Conferir que as rotas de finanças não alteram nem excluem receita vinculada a pagamento do plano.
- Não rodar testes, lint ou build nesta tarefa.
