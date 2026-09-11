# Agenda compacta e transições sutis

## Escopo autorizado

Revisar a agenda mobile, corrigir larguras excessivas e os controles Dia/Semana/Mês, retirar a grade detalhada de horários da semana e acrescentar transições discretas nos detalhes selecionados. Seguir SECURITY.md; preservar arquivos e alterações anteriores. Nenhum deploy, acesso a dados reais ou alteração de API/permissões.

## Implementação

- Semana: agendamentos em ordem cronológica agrupados por dia, com horário exato, paciente, procedimento, profissional e indicação de retorno. Sem linhas de meia em meia hora nem larguras mínimas de desktop. Dias vazios ficam compactos.
- Layout: uma coluna em telas estreitas; duas, três ou sete conforme a largura disponível do componente. Controles de período e de visualização permanecem separados do título, com alvos de toque de 44 px.
- Mês: calendário compacto com contagem por data e lista completa do dia selecionado, sem limite de quatro cartões. Selecionar uma data não abre o formulário de criação. A lista fica abaixo em telas estreitas e ao lado quando há espaço.
- Dia: mantém a grade detalhada opcional. Corrigida a inclusão de agendamentos de 23:30 a 23:59. Criação por botão nativo, inclusive com teclado.
- Reagendamento: mover entre dias preserva horas e minutos. Também é possível tocar no cartão e informar novo horário. Ambos os caminhos exigem confirmação antes do PUT. Cancelar não envia alterações. O profissional continua sendo salvo separadamente.
- Desempenho: entradas indexadas e ordenadas por dia com memoização. A semana não cria centenas de células vazias. Nenhuma dependência nova.
- Movimento: fade de entrada de 160 ms e saída de 100 ms nos detalhes e no fundo do modal; fade de 140 ms na lista do dia selecionado no mês. Somente opacidade, sem zoom, deslocamento ou espera programada. O conteúdo dos detalhes permanece disponível durante a saída. As novas animações são desabilitadas com `prefers-reduced-motion: reduce`.
- Acessibilidade: foco inicial no título dos detalhes, evitando focar o campo de data automaticamente; foco devolvido ao cartão ao fechar ou cancelar a confirmação; labels nos campos; rolagem contida no modal e botão de fechamento de 44 px.

A revisão com [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) orientou os ajustes de foco, alternativa ao arraste, conteúdo longo e movimento reduzido.

## Verificação

- Frontend: 34 arquivos e 182 testes aprovados. Inclui 12 testes da agenda/página, com cenários novos executados falhando antes das respectivas implementações.
- Backend: 135 testes aprovados. Dois contratos de fonte da agenda foram atualizados para a nova estrutura. O contrato da rota Pacientes foi adaptado ao carregamento sob demanda implantado na revisão mobile anterior, mantendo uma asserção explícita de `RoleProtectedRoute`.
- Build Vite aprovado. CSS gerado conferido para o grid responsivo, largura do modal e duração dos fades.
- ESLint dos arquivos TypeScript alterados nesta etapa: aprovado.
- `scripts/verify-admin-responsive.ps1`: aprovado; verifica código-fonte, não layout real.
- `git diff --check` nos arquivos de código/testes alterados: aprovado.
- Verificação heurística de padrões de credenciais nas linhas adicionadas e no novo teste da agenda: zero ocorrências. Não equivale a uma auditoria completa de segredos.

## Limitações

A conexão da prévia visual voltou a expirar. Ainda é necessário conferir em navegador/aparelho nas larguras 360, 390, 768 e 1280 CSS px, incluindo nomes longos, mês com muitos agendamentos, foco, teclado virtual e movimento reduzido. Os testes com DOM simulado não medem transbordamento nem suavidade visual.

O TypeScript global ainda reporta nove erros anteriores em odontogramModel, PrescriptionGenerator.test, AdminAttendanceDetail, AdminBlog, AdminComments e AdminUsers; não reporta erros nos arquivos finais da agenda. O erro anterior de comparação de modos em CalendarView foi eliminado. Build mantém avisos de chunks grandes e Browserslist antiga; testes de PDF registram indisponibilidade de recursos remotos, mas passam.

Nenhum deploy foi realizado.
