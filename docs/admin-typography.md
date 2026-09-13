# Tipografia do painel Admin

A interface administrativa usa Inter (`--font-sans`), sem alterar a identidade tipográfica da homepage. A escala está centralizada em `src/styles/admin-typography.css`, importada pelo layout e pelo login.

| Papel | Tamanho / entrelinha | Peso |
| --- | --- | --- |
| Título da página (`h1`) | 24 / 30 px | 600 |
| Título de seção, card ou diálogo (`h2`–`h6`, CardTitle) | 16 / 24 px | 600 |
| Texto de interface e descrição de card | 14 / 21 px | 400 |
| Rótulos, ações, abas e opções | 14 / 21 px | 500 |
| Auxiliares, metadados e navegação inferior | 12 / 18 px | conforme papel |
| Campos | 14 / 21 px; 16 / 24 px em telas pequenas | 400 |

## Inventário auditado

- Layout, navegação, login e instalação PWA.
- Dashboard, solicitações, agenda, consultas e detalhe do atendimento.
- Pacientes, prescrição e documentos; seleção de pacientes e demais diálogos.
- Financeiro, finanças pessoais e analytics.
- Estoque, configurações e equipe.
- Comentários, tratamentos e stories. O blog auditado inicialmente foi removido por solicitação posterior.
- Componentes clínicos: títulos, formulários, histórico, fotos, legendas e controles.

As inconsistências encontradas incluíam títulos serifados misturados com sans-serif, pesos 700–900 para ações e auxiliares de 8–11 px, além de títulos de cards maiores no mobile que no desktop. As regras cobrem também portais de diálogos, alertas e menus enquanto o painel está montado. Não dependem de substrings de classes nem de `!important`.

## Limites intencionais

- A marca na sidebar conserva sua fonte própria.
- As regras são somente para tela: não modificam impressão ou PDF.
- Blocos `print-only`, conteúdo rico (`prose` / `contenteditable`) e texto vetorial SVG não recebem a normalização.
- Números anatômicos conservam a escala compacta; indicadores mantêm sua escala de destaque.
- Campos mobile mantêm 16 px para evitar zoom automático durante a digitação.
- A homepage não é alcançada; portais deixam de corresponder aos seletores após sair do painel.

Validação direcionada: testes `AdminLayout.test.tsx` (2 aprovados); TypeScript da aplicação aprovado. A validação visual depende da revisão integrada no navegador: testes DOM não medem fontes renderizadas.
