# Painel admin: responsividade, navegação e impressão

## Status

Design aprovado pelo usuário em 2026-08-27; implementação pendente de revisão desta especificação.

## Contexto

As páginas autenticadas do painel apresentam três problemas de uso: a barra que abre o menu mobile desaparece durante a rolagem, o item pai de grupos com submenu navega imediatamente para uma rota padrão e os documentos impressos podem reservar uma primeira página vazia. O painel também precisa manter uma leitura confortável em larguras pequenas sem alterar rotas, permissões ou contratos de API.

## Objetivos

- Manter o acesso ao menu mobile disponível durante toda a rolagem.
- Permitir expandir grupos e escolher qualquer submenu sem navegação automática para a primeira opção.
- Preservar a navegação direta dos itens sem submenu e o comportamento de sidebar fixa no desktop.
- Imprimir odontograma e prescrição como documentos visualmente separados.
- Adicionar um fluxo para imprimir somente o odontograma carregado a partir do último registro do paciente.
- Remover a página inicial vazia do fluxo de impressão de documentos.
- Corrigir problemas visuais diretamente relacionados a largura, toque, foco, espaçamento e ações em telas pequenas.

## Fora de escopo

- Mudanças no backend, banco, autenticação, permissões ou APIs.
- Alteração do conteúdo clínico ou dos dados persistidos.
- Criação de uma nova rota pública ou de um novo formato de papel.
- Refatoração visual ampla de páginas não afetadas pelos problemas encontrados.

## Desenho funcional

### Shell administrativo

O `AdminLayout` continuará usando sidebar fixa no desktop e drawer no mobile. A barra mobile será `sticky` no topo da área de rolagem, respeitará safe area e manterá o espaço de layout correspondente para que o conteúdo não fique encoberto. O drawer manterá backdrop, botão de fechamento, bloqueio de rolagem do `body` enquanto aberto e fechamento após mudança de rota.

Itens com `subItems` deixarão de ser links para um `href` padrão. Serão controles expansíveis com `aria-expanded` e `aria-controls`; seus links filhos permanecerão responsáveis pela navegação. O grupo correspondente à rota atual ficará aberto. No rail desktop recolhido, selecionar um grupo expandirá o rail e abrirá o grupo para que o usuário escolha o submenu, sem redirecionamento implícito. Itens sem submenu continuarão sendo links diretos.

### Impressão da prescrição

O botão atual de impressão continuará emitindo a prescrição. Quando o odontograma estiver selecionado para inclusão, o documento terá:

1. odontograma na primeira página;
2. quebra de página controlada;
3. cabeçalho, dados do paciente, texto da prescrição e assinatura na página seguinte ou nas seguintes.

O odontograma não será misturado ao texto da prescrição. A quebra só será aplicada quando houver um odontograma válido e selecionado.

O card do odontograma receberá o botão `Imprimir odontograma`. Ele usará os mesmos dados do fluxo atual: ao selecionar um paciente, o sistema continua procurando o último registro com odontograma; alterações feitas no mapa atual também serão usadas. Esse botão imprimirá apenas cabeçalho/contexto mínimo do paciente e o odontograma, sem conteúdo da prescrição. Se não houver odontograma, exibirá feedback claro e não abrirá a impressão.

Para evitar condições de corrida, a impressão será disparada depois que o alvo de impressão tiver sido renderizado. O alvo será explícito (`prescrição`, `odontograma` ou documento geral) e será limpo após `afterprint`.

### Impressão de documentos

O fluxo de `AdminDocuments` seguirá a mesma ideia de alvo imprimível explícito. O conteúdo de edição e o shell administrativo permanecerão fora da impressão. O documento visível para impressão será um fluxo em bloco, sem `min-height`/`height` de tela, e somente ele poderá ocupar a área de impressão. Isso impede que o shell oculto ou um wrapper flexível reserve a primeira página.

### Ajustes visuais responsivos

- Aplicar limites `min-width: 0`/`max-width: 100%` aos contêineres de página e cards que ainda podem ampliar o viewport.
- Manter gutters adaptativos e controles com área mínima de toque de 44px.
- Permitir que títulos, nomes e metadados longos quebrem dentro dos cards.
- Expor ações hoje dependentes apenas de `hover` também no toque, especialmente exclusões de histórico/modelos.
- Preservar foco visível, estados de expansão e feedback de interação.
- Evitar alterar o layout denso de calendário/odontograma fora de suas regiões de rolagem contidas.

## Componentes e arquivos previstos

- `src/components/admin/AdminLayout.tsx`: barra sticky, estado de grupos expansíveis e navegação do rail recolhido.
- `src/pages/AdminPrescription.tsx`: alvo de impressão, botão de odontograma isolado e quebra entre seções.
- `src/pages/AdminDocuments.tsx`: alvo de impressão sincronizado com o DOM.
- `src/index.css`: regras de shell mobile e fluxo de impressão sem página reservada.
- `src/components/admin/navigation-contract.test.tsx`: contratos para submenu, acessibilidade e impressão.
- Novo teste unitário somente se for necessário extrair uma função pura de seleção/estado de impressão.

## Segurança e dados

Nenhum dado clínico será gravado em novos locais. Os dados sensíveis continuarão apenas no estado já existente e nos fluxos autenticados. Nenhuma URL, credencial, assinatura, token ou dado de paciente será adicionado a logs, testes ou documentação. O HTML impresso continuará vindo do conteúdo já sanitizado pelo fluxo existente; a mudança não introduzirá novas fontes de HTML.

## Critérios de aceite

- Em 360px e 390px, a barra mobile permanece acessível durante a rolagem e o drawer não gera overflow horizontal.
- Em 768px e desktop, o conteúdo permanece dentro do viewport, a sidebar fixa continua funcionando e o rail recolhido não navega automaticamente para um submenu.
- Clicar em `Conteúdo`, `Atendimentos` ou `Configurações` expande/recolhe o grupo; clicar nos itens filhos navega para a rota escolhida.
- O estado expandido é anunciado por `aria-expanded` e o foco permanece visível.
- A prescrição com odontograma imprime o mapa na primeira página e o texto a partir da segunda.
- `Imprimir odontograma` imprime somente o mapa carregado/atualizado, sem prescrição.
- Documento geral e prescrição não apresentam primeira página vazia.
- Nenhum conteúdo fica encoberto por barra fixa, e ações essenciais permanecem acessíveis por teclado e toque.
- `npm test`, `npm run lint`, `npm run build`, contratos PowerShell e `git diff --check` passam.

## Estratégia de validação

1. Criar testes falhando para o comportamento de submenu e para os alvos de impressão.
2. Implementar cada correção mínima e confirmar o ciclo red/green.
3. Executar a suíte completa, lint e build.
4. Inspecionar as rotas representativas em 360px, 390px, 768px e desktop, incluindo rolagem e drawer.
5. Gerar/inspecionar a saída de impressão da prescrição com e sem odontograma e de um documento longo.
6. Revisar `git status` e `git diff --check`, preservando os artefatos de trabalho existentes.
