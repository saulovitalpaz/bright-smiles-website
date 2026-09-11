# Revisão mobile do painel

Objetivo: aumentar a informação útil por tela sem reduzir legibilidade ou alvos de toque, mantendo a identidade visual existente.

Direção autorizada pelo pedido: combinar indicadores compactos e listas operacionais. Priorizar agenda e ações; posicionar histórico e feedback como conteúdo secundário. Preservar permissões, dados e fluxos de impressão.

## Entregas

- [x] Dashboard: resumo compacto, agenda primeiro, informações agrupadas, ações visíveis, erro recuperável e prevenção de envios repetidos.
- [x] Layout compartilhado: um cabeçalho mobile, navegação rápida por perfil, áreas seguras e foco acessível no menu.
- [x] Financeiro e analytics: indicadores densos com valores legíveis, sem ilustrações decorativas grandes.
- [x] Pacientes: ações em linha, informações agrupadas e acesso direto ao formulário ao editar.
- [x] Desempenho: carregamento das páginas administrativas sob demanda, preservando as proteções de rota.
- [x] Verificação automatizada: testes de comportamento de dashboard/menu, suíte existente, build, lint dos arquivos alterados e revisão do diff.

## Restrições

Seguir SECURITY.md. Nenhuma mudança em API, autenticação, armazenamento sensível ou permissões. Não usar dados reais nos testes. Preservar alterações pré-existentes. Não publicar nesta tarefa.

## Revisão visual

A conexão com o navegador falhou em duas tentativas. Validar em 360, 390, 768 e 1280 CSS px quando o navegador estiver disponível; incluir menu, nomes longos, formulários e rolagem. Não alegar validação visual com base apenas em testes automatizados.

## Resultado da implementação

O dashboard apresenta solicitações/consultas em uma faixa compacta e coloca a agenda antes do histórico e dos comentários. A agenda elimina a duplicação de marcação entre desktop e mobile e mantém as ações visíveis. Datas e profissional do histórico também aparecem no celular.

O cabeçalho mobile passa a ser único, com menu, título, instalação compacta e avatar. A navegação inferior usa quatro destinos para o perfil administrativo e três para gestores; mantém as permissões das rotas. Reservas de espaço evitam sobreposição da barra inferior. Ela se oculta ao focar campos de edição. O menu fecha por Escape, restaura o foco e torna o conteúdo de fundo inerte enquanto está aberto.

Receitas e despesas ficam lado a lado no celular; o saldo ocupa a largura seguinte. Categorias de despesas são expansíveis. Analytics e caixa pessoal usam duas colunas de indicadores. Pacientes passam a uma lista com ações em linha; novo/editar levam diretamente ao formulário. Consultas têm cabeçalho, filtros e registros mais compactos, com links semânticos e botões de exclusão identificados.

## Evidências

- Suíte frontend: 33 arquivos, 174 testes aprovados. Após os ajustes finais, 15 testes dos fluxos afetados foram executados novamente e aprovados.
- Contratos backend/dashboard: 3 testes aprovados.
- `scripts/verify-admin-responsive.ps1`: aprovado; trata-se de análise do código, não de inspeção visual.
- Build final: aprovado, sem o aviso de sintaxe CSS identificado e corrigido durante a revisão.
- Lint dos arquivos alterados: aprovado, sem erros ou avisos.
- `git diff --check -- src`: aprovado.
- Verificação heurística das linhas adicionadas no diff rastreado: nenhum padrão de credencial detectado. Não equivale a uma auditoria completa de segredos.
- JavaScript principal minificado: 2.646,13 kB antes e 657,80 kB depois (aproximadamente 75% menor). Com gzip: 846,07 kB para 207,97 kB. Os módulos administrativos e PDF agora são carregados separadamente. Não foi medida a velocidade real no aparelho.

## Limitações e próximos refinamentos

A checagem global de TypeScript reporta 10 erros em arquivos não alterados nesta tarefa: CalendarView, odontogramModel, PrescriptionGenerator.test, AdminAttendanceDetail, AdminBlog, AdminComments e AdminUsers. O build Vite não faz essa checagem de tipos e passou. Permanecem avisos de tamanho de chunks e de base Browserslist antiga; testes de PDF também registram falhas ao buscar recursos remotos, embora as asserções passem.

Ainda é necessária validação visual no navegador/aparelho, incluindo teclado virtual, zoom, orientação horizontal, menu, instalação e barra inferior. Nenhum deploy foi realizado.

Depois dessa validação, os próximos refinamentos sugeridos são expor os formulários financeiros sob demanda e preservar filtros na URL. São mudanças de interação mais amplas e não foram incluídas nesta entrega.
