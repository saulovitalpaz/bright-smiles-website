# Planos de tratamento odontológico

## Objetivo

Adicionar ao painel um fluxo de orçamento odontológico que parte das condições já registradas no odontograma, permite completar itens manualmente, registra autorização total ou parcial e só cria receitas no caixa quando pagamentos são recebidos. A ficha do paciente passa a resumir consultas, planos, tratamentos e saldos.

## Contexto existente

- O odontograma clínico em `src/components/admin/attendance/Odontogram.tsx` registra condições em camadas e salva `dentalNotes` pelo autosave clínico do atendimento.
- O editor `ClinicalConditionEditor` registra categoria, tipo, faces/regiões, estágio e observações. Isso continua sendo dado clínico; selecionar uma condição não deve alterar o caixa.
- `Appointment.price` e `paymentStatus` continuam suportando cobranças avulsas da consulta. `syncAppointmentFinance` mantém o comportamento legado dessas cobranças.
- Pacientes, consultas e financeiro já têm rotas privadas e controle de acesso por função. O banco usa PostgreSQL e Prisma.
- `FinanceTransaction.amount` é `Float` e já participa de contratos existentes. Esta mudança não converte nem reescreve transações históricas.

## Escopo

1. Catálogo privado de procedimentos odontológicos, com categoria, preço, unidade de cobrança e tipos de condição clínica relacionados.
2. Inclusão de procedimentos sugeridos ao marcar uma condição no odontograma, sem alterar a aparência ou a semântica clínica atual.
3. Edição dos itens propostos dentro do atendimento, por dente/região ou como texto manual, com fase clínica e preço.
4. Salvamento do plano como orçamento com validade de 30 dias, totais por fase e documento para impressão.
5. Autorização de todos ou de parte dos itens, com preço final por item limitado ao valor orçado.
6. Criação de tratamentos somente para os itens autorizados e acompanhamento de situação clínica.
7. Registro de pagamentos parciais e totais. Cada pagamento cria, na mesma transação do banco, uma transação de receita vinculada; orçamento, autorização e saldo pendente não geram receita.
8. Resumo privado do paciente com próximos horários, atendimentos, orçamentos, tratamentos, pagamentos e saldo autorizado a receber.

## Fora de escopo

- Alterar, migrar ou excluir cobranças e recebimentos antigos.
- Trocar o formato legado de dinheiro de `FinanceTransaction` nesta entrega.
- Integração com gateways, emissão fiscal, cobrança automatizada ou parcelamento recorrente.
- Atualizar automaticamente uma condição do odontograma quando o estado clínico de um item mudar. Condição e execução permanecem registros separados, com vínculos para consulta.

## Decisões de produto

### Catálogo e odontograma

O catálogo terá edição restrita a administradores e leitura para dentistas. Cada procedimento define nome, categoria, unidade (`procedimento`, `dente` ou `face`), valor decimal, tipos clínicos sugeridos e situação ativa/inativa. Procedimentos inativos deixam de aparecer para novos planos, mas permanecem nos orçamentos existentes.

Ao criar ou editar uma condição, o formulário poderá adicionar um ou mais procedimentos sugeridos. A condição só é salva no odontograma pela ação clínica atual. A escolha de procedimento adiciona um item ao rascunho de plano do atendimento; não muda a condição nem gera cobrança. O plano também aceitará itens digitados manualmente.

### Orçamento e autorização

Salvar o plano cria um orçamento aguardando autorização e congela nome, categoria, unidade, quantidade, dente, faces/regiões e valor unitário usados naquele momento. O catálogo poderá mudar sem alterar documentos existentes. O orçamento expira 30 dias após sua criação.

Na revisão de autorização, cada item é selecionável e mostra seu total orçado. O valor autorizado pode ser reduzido até zero, mas não pode exceder o valor orçado. O estado geral é aguardando autorização, parcialmente autorizado ou autorizado conforme os itens selecionados. Itens ainda não autorizados continuam propostos e não viram tratamentos nem saldo a receber.

Depois da primeira autorização, os itens e valores aprovados não podem ser editados no mesmo orçamento. Mudanças posteriores exigem outro orçamento, preservando o histórico aprovado. A tela pode oferecer o agendamento da primeira consulta apenas quando o usuário escolher data e horário válidos.

### Pagamentos e caixa

Pagamentos são registros positivos, parciais ou totais, associados ao orçamento. O servidor calcula o saldo a partir dos valores autorizados menos pagamentos já recebidos; rejeita valores acima do saldo e associa uma chave idempotente única ao pagamento. Criar o pagamento e a receita do caixa ocorre em uma transação Prisma.

Pagamentos do plano entram em `FinanceTransaction` como receitas recebidas, sem `appointmentId`, com vínculo único ao pagamento do plano e descrição financeira genérica. As rotas financeiras gerais não podem editar ou apagar uma transação vinculada a um pagamento do plano. O caixa continua incluindo as cobranças avulsas antigas.

### Execução clínica e histórico

Cada item autorizado começa como `autorizado` e pode avançar para `em andamento` ou `concluído` por uma ação autenticada de administrador/dentista. Um plano pode ter consulta de origem e atendimentos relacionados. O histórico do paciente mostra itens e saldos derivados dos registros autorizados e recebidos, sem duplicar dados de consulta ou pagamentos.

## Modelo de dados

- `ClinicalProcedure`: catálogo com nome, categoria, unidade, valor decimal, tipos clínicos sugeridos, ativo e timestamps.
- `TreatmentPlan`: paciente, atendimento de origem opcional, autor, validade, observações, condições de pagamento, estado e timestamps.
- `TreatmentPlanItem`: plano, procedimento do catálogo opcional, snapshots de nome/categoria/unidade/preço, quantidade, total orçado, valor autorizado opcional, dente, faces/regiões, tipo clínico, fase, notas e estado clínico.
- `TreatmentPlanPayment`: plano, valor decimal, método, data de recebimento, chave idempotente e timestamps.
- `FinanceTransaction`: campo opcional único para referenciar `TreatmentPlanPayment`; registros financeiros existentes permanecem sem esse vínculo.

Valores monetários do novo domínio usam `Decimal(12,2)`. Totais são derivados no servidor a partir dos itens; pagamentos nunca aceitam o total calculado pelo navegador como fonte de verdade.

## Rotas e acesso

Todas as novas rotas exigem `authenticateToken`. Catálogo: administradores podem criar/editar/inativar; administradores e dentistas podem listar. Planos, autorizações, pagamentos e histórico: somente administradores e dentistas. As rotas existentes de caixa continuam com suas funções atuais.

Erros de validação não expõem stack traces nem conteúdo clínico. Identificadores de paciente e plano são validados e todas as consultas escopam os relacionamentos ao registro solicitado. Nenhum dado clínico é gravado em logs, URLs, `localStorage` ou respostas de configuração pública.

## Interface

- Adicionar `Minha tabela` sob Configurações para administrar o catálogo.
- Manter o odontograma escuro e sua geometria; inserir apenas opções de procedimento sugerido no formulário da condição.
- Adicionar card de plano na consulta com lista editável por fase, busca manual, totais e estado de salvamento.
- Adicionar área de Planos de tratamento para revisar orçamentos, autorizar itens, acompanhar execução e receber pagamentos.
- Oferecer versão imprimível do orçamento com dados da clínica/profissional, paciente, odontograma, itens, fases, validade, observações, condição de pagamento e total.
- Adicionar ação `Ver ficha` na lista de pacientes e uma página de resumo com consultas, planos, tratamentos e saldo.
- Na tela financeira, identificar pagamentos de planos sem permitir exclusão/edição pelas ações genéricas atuais.

## Compatibilidade e segurança

- Migração aditiva. Nenhum dado existente é reescrito ou apagado.
- Não alterar o autosave clínico; condições continuam persistidas em `dentalNotes` pelo endpoint de consulta existente.
- Não adicionar rota pública. Catálogo, orçamento, pagamento e ficha do paciente usam autenticação e autorização por função no servidor.
- Validar strings e tamanhos, unidade, quantidade, preço decimal, tipos de condição, faces, status e vínculos no servidor.
- Preservar o recibo e a transação financeira quando houver pagamento; bloquear exclusões em cascata de planos com autorização ou pagamento.
- Não adicionar dados reais de pacientes ou segredos ao código, documentação ou logs.

## Critérios de aceite

1. Selecionar condição continua sendo uma ação clínica; escolher um procedimento sugerido somente acrescenta item proposto ao plano.
2. O profissional consegue adicionar, editar e remover itens por dente/faces e itens manuais antes de salvar.
3. Salvar gera orçamento com validade e valores congelados, sem criar receita ou pendência no caixa.
4. Autorizar todos ou alguns itens cria tratamentos apenas para os selecionados e mantém saldo calculado somente sobre os valores autorizados.
5. Cada pagamento parcial ou total gera uma única receita recebida, com valor e paciente corretos; repetição da requisição não duplica pagamento ou receita.
6. Transações de pagamento de plano não podem ser editadas ou excluídas pelas ações financeiras genéricas.
7. A ficha do paciente reúne próximos horários, consultas, planos, execução clínica, recebido e saldo restante.
8. Os dados antigos de consultas, odontograma e financeiro permanecem preservados e com o comportamento atual.
