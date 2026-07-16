# Task 4 — Seletor direto de faces do odontograma

Commit de produto: `6862c88 feat: select odontogram surfaces directly`

## TDD

- RED inicial: `ToothSurfaceSelector.test.tsx` falhou ao resolver `./ToothSurfaceSelector`, pois o componente não existia.
- GREEN inicial: 6 testes focados passaram após criar o componente.
- RED adicional: o teste de hachura falhou porque o padrão não era aplicado como estilo final da face.
- GREEN final: 7 testes focados passaram com a hachura aplicada por face.

## Acessibilidade e toque

- Cinco controles HTML `button`, um por face anatômica, com `aria-label` clínico mais status e `aria-pressed`.
- `readOnly` usa `disabled`, impedindo a chamada de `onSelectFace`.
- Foco visível com `:focus-visible` e `outline` de alto contraste.
- Cada botão tem caixa real de 44 × 44 px (`2.75rem`) e `touch-action: manipulation`.
- Sulcos anatômicos usam `pointer-events: none`.

## Estados e desenho

- A base SVG oclusal consome `ANATOMICAL_GEOMETRY`; cada botão também renderiza o path anatômico real da face.
- Saudável é neutro; Tratar usa hachura; Tratado usa traço externo e inset; a face selecionada recebe anel sólido.
- O seletor usa largura limitada por `min(10.5rem, 100%)` para não criar overflow horizontal.

## Arquivos

- `src/components/admin/attendance/odontogram/ToothSurfaceSelector.tsx`
- `src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx`
- `src/index.css`

## Verificações

- `npx vitest run src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx` — 7 testes aprovados.
- `npx eslint src/components/admin/attendance/odontogram/ToothSurfaceSelector.tsx src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx` — aprovado.

O relatório permanece não commitado. Nenhum plano em `docs/superpowers/plans/` foi incluído no commit.

---

## Correções pós-revisão do Task 4

### RED/GREEN

- RED: 6 novas regressões falharam contra o HEAD `6862c88`, cobrindo hachura, inset e anel dentro dos botões, path anatômico, teclado e o wrapper de fallback.
- GREEN: `ToothSurfaceSelector.test.tsx` passou com 12 testes após a implementação.

### Correções aplicadas

- Adicionado wrapper com `container-type: inline-size`.
- Abaixo de 132px, o seletor usa grid `auto-fit` com controles de no mínimo 44 × 44px e SVG-base em linha própria, sem posicionamento absoluto ou transformações.
- A partir de 132px, o container query restaura a cruz anatômica posicionada.
- Cada botão agora contém seu path anatômico e reproduz o estado completo: pattern de hachura para `Tratar`, inset para `Tratado` e anel para selecionado.
- `onClick` preserva a guarda explícita `if (!readOnly)`, além de `disabled`; rótulos ARIA, `aria-pressed` e sulcos com `pointer-events: none` foram mantidos.

### Verificações

- `npm test -- src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx` — 12 testes aprovados.
- `npx eslint src/components/admin/attendance/odontogram/ToothSurfaceSelector.tsx src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx` — aprovado.
- `npm run lint` — não aprovado por 142 problemas preexistentes fora do escopo, inclusive arquivos sob `.worktrees/`; nenhum problema reportado nos dois arquivos TypeScript desta tarefa.

Este adendo permanece fora do commit.
