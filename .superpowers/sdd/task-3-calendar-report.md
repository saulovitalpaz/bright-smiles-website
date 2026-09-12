Task 3 report - separar lista de consultas do calendário

Status: done

Resumo:
- extraída uma nova página `AdminCalendar` com a agenda, criação manual, edição de profissional e confirmação de drag/drop;
- `AdminAppointments` ficou restrita à lista de consultas, com busca por paciente/CPF e filtro por data local do agendamento;
- preservado o redirecionamento por `leadId` para nova consulta e os textos/mensagens existentes do fluxo de agenda.

Testes executados:
- `npx vitest run src/pages/AdminAppointments.test.tsx src/pages/AdminCalendar.test.tsx`
- `npx eslint src/pages/AdminAppointments.tsx src/pages/AdminAppointments.test.tsx src/pages/AdminCalendar.tsx src/pages/AdminCalendar.test.tsx`

Observações:
- o Vitest precisou ser executado fora do sandbox porque o ambiente bloqueado não conseguia resolver `vitest.config.ts`; a suíte focalizada passou integralmente fora do sandbox.
