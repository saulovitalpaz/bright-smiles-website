# Solicitações, Agenda, Retornos e Fluxo de Caixa — Especificação

## Objetivo

Corrigir a leitura de solicitações, permitir agendamento manual pelo calendário, transformar retornos clínicos em compromissos futuros e sincronizar pagamentos recebidos com o fluxo de caixa mensal. A mesma fonte de dados deve alimentar agenda, dashboard, histórico clínico e financeiro, sem duplicações.

## Diagnóstico confirmado

- `AdminLeads` usa Axios sem `withCredentials`, enquanto as rotas `/leads` exigem o cookie HttpOnly.
- O dashboard calcula o card de solicitações sobre somente cinco leads recentes, embora a API conte todos.
- O clique em horário vazio do calendário apenas abre `/admin/consultas/new`; não existe criação rápida de compromisso.
- `returnDate` é salvo no atendimento, mas não cria nem atualiza um item futuro na agenda.
- A integração financeira existe apenas no `POST /appointments`; alterações em `PUT /appointments/:id` não reconciliam o lançamento.
- `/finance/stats` não recebe o mês/ano selecionados, portanto os cards mostram totais gerais enquanto a tabela mostra o mês.
- A grade de calendário e os cards usam truncamento/medidas rígidas que quebram com nomes longos, zoom ou fonte ampliada.

## Decisões de arquitetura

### Fonte única para agenda

`Appointment` continuará sendo a entidade clínica e operacional. Um compromisso manual é criado como `status = scheduled`. Ao finalizar o atendimento, ele passa para `attended`; cancelamentos usam `cancelled`. A agenda consulta apenas registros com `scheduledAt` preenchido e status ativo.

Retornos serão novos `Appointment` vinculados ao atendimento de origem por uma autorrelação `parentAppointmentId`. O retorno recebe o mesmo paciente, profissional e tipo clínico, mas tem seu próprio `scheduledAt`. O vínculo permite atualizar ou cancelar o retorno sem criar duplicatas.

### Fonte única para financeiro

Cada atendimento que gera receita terá no máximo um `FinanceTransaction` vinculado por `appointmentId`. O lançamento terá estado `paymentStatus = received | pending | voided`. Somente `received` entra nos cards de caixa realizado; lançamentos `pending` continuam visíveis na lista e podem ser cobrados depois.

Salvar ou editar uma consulta reconciliará atendimento e lançamento na mesma transação Prisma:

- valor positivo + `paid`: criar/atualizar receita `received`;
- valor positivo + `pending`: criar/atualizar receita `pending`;
- `courtesy`, valor zero ou ausência de valor: anular o lançamento vinculado;
- alterar valor, paciente, descrição ou data: atualizar o lançamento existente;
- repetir o salvamento: nunca criar uma segunda receita.

Lançamentos antigos sem vínculo serão preservados. Uma migração poderá vincular somente correspondências inequívocas; os demais permanecem inalterados.

### Contratos e autenticação

Toda leitura ou mutação clínica/financeira usará `fetchClient`/`adminApi`, com credenciais de sessão. Nenhum token reutilizável será colocado no armazenamento do navegador. Rotas novas ou alteradas mantêm autorização mínima: agenda/consultas para `admin`/`dentist`, solicitações para `admin`/`manager` e financeiro para `admin`/`manager`.

Datas recebidas pela API serão validadas e normalizadas no servidor. Intervalos financeiros usarão o fuso `America/Sao_Paulo`, com limites inclusivos/exclusivos consistentes entre `/finance` e `/finance/stats`.

## Fluxos de usuário

### Solicitações

1. A homepage cria um lead público.
2. A tela de Solicitações carrega todos os leads não concluídos com sessão autenticada.
3. O operador agenda, altera ou remove o horário.
4. A tela atualiza a lista e invalida o dashboard; a contagem usa `pendingLeadCount` do backend, não uma amostra.

### Agendamento manual

1. O operador seleciona uma célula vazia.
2. Abre-se um modal com data/hora preenchidas, paciente, procedimento, tipo e profissional.
3. O servidor cria um `Appointment` agendado; não cria receita automaticamente se não houver valor recebido.
4. Calendário, lista e dashboard são recarregados.
5. O formulário clínico continua disponível para completar a consulta.

### Retorno

1. No atendimento, o operador informa data e hora do retorno.
2. Ao salvar, o servidor cria ou atualiza o filho vinculado por `parentAppointmentId`.
3. Remover a data cancela o compromisso de retorno associado.
4. O retorno aparece na agenda futura e no dashboard principal.

### Financeiro

1. A consulta salva preço e status de pagamento.
2. O servidor reconcilia o lançamento vinculado atomicamente.
3. A tela financeira consulta lista e cards com o mesmo mês/ano.
4. “Visão geral” é uma seleção explícita para totais históricos.

## Melhorias de UI/UX autorizadas

As melhorias seguem `ui-ux-pro-max` e não alteram o contrato de dados:

- calendário com `min-w-0`, `overflow-wrap: anywhere`, `writing-mode: horizontal-tb` e quebra horizontal controlada para eventos longos;
- nomes e procedimentos em até duas linhas com título/acessibilidade para o texto completo, sem texto vertical;
- células e botões com alvo mínimo de 44 px, alternativa de teclado ao drag-and-drop e estados de carregamento/erro próximos da ação;
- dashboard com `min-w-0`, `break-words`, números tabulares e layout que suporta zoom de 200% sem sobreposição;
- evitar `truncate` em informação clínica essencial; quando necessário, combinar clamp visual com tooltip/atributo `title`;
- contraste AA, foco visível, labels persistentes e respeito a `prefers-reduced-motion`.

## Tratamento de erros

- `401/403`: a sessão é revalidada e a UI oferece retorno ao login;
- `400`: a mensagem segura do servidor aparece no campo ou modal correspondente;
- falha ao criar/mover: o estado anterior permanece intacto;
- falha financeira: a consulta não é marcada como salva até a reconciliação terminar;
- conflitos de agenda serão informados sem sobrescrever silenciosamente outro registro;
- logs não conterão payload clínico, financeiro, credenciais ou dados desnecessários de pacientes.

## Segurança e migração

- Fazer backup e verificar restauração antes da migração Prisma.
- Adicionar migração reversível para `Appointment.parentAppointmentId`, `FinanceTransaction.appointmentId`/`paymentStatus` e índices necessários.
- Não remover campos legados nem URLs antigas antes de confirmar leitura dos dados existentes.
- Executar secret scan, testes backend/frontend, build, lint e `git diff --check` antes do deploy.

## Critérios de aceite

1. Um lead criado na homepage aparece na tela de Solicitações e no número correto do dashboard.
2. Selecionar horário vazio cria um compromisso e o mostra no calendário e em “Próxima Agenda”.
3. Salvar várias vezes o mesmo retorno cria exatamente um compromisso futuro.
4. `Recebido` cria/atualiza uma única receita e altera o caixa do mês correto.
5. `A receber` não entra no caixa realizado, mas permanece consultável.
6. Tabela e cards financeiros mostram os mesmos totais para mês/ano escolhidos.
7. Agenda e dashboard permanecem legíveis com textos longos e zoom de 200%.
8. Usuários anônimos não acessam dados de solicitações, agenda, pacientes ou financeiro.
