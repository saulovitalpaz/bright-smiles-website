# Atendimento: edição inline do mapa facial

## Objetivo

Reduzir a rolagem e a perda de contexto durante o registro de atendimentos, com foco na seleção e caracterização das regiões de harmonização facial em dispositivos móveis.

## Experiência proposta

- O mapa facial permanece visível junto à lista de regiões.
- Cada região informa três estados: vazia, preenchida e selecionada.
- Ao selecionar uma região no SVG ou na lista, o editor de Produto, Dose/Volume e Observações aparece inline, sem modal.
- Em telas largas, o editor ocupa uma coluna ao lado do mapa; em telas estreitas, aparece logo abaixo do mapa/lista.
- A região selecionada recebe contorno e halo de alto contraste; regiões preenchidas mantêm cor de confirmação distinta.
- O botão de salvar e o status do atendimento permanecem no fluxo existente, sem alterar endpoints ou formato de dados.

## Acessibilidade e responsividade

- Regiões SVG continuam operáveis por teclado e com `aria-pressed`.
- Campos permanecem associados a labels visíveis e com área de toque mínima de 44px.
- O editor usa `aria-live` apenas para o nome da região ativa, sem anunciar cada tecla digitada.
- O layout não cria rolagem horizontal e desativa transições quando `prefers-reduced-motion` está ativo.

## Implementação e verificação

- Reutilizar o estado `selectedRegionId` existente no `FaceMap`.
- Substituir `Dialog` por um painel contextual controlado pelo mesmo estado.
- Preservar `RegionSummary` no modo somente leitura.
- Adicionar testes para abertura inline, atualização de campos, estados visuais e ausência de modal.
- Executar suíte Vitest, TypeScript, ESLint e build de produção.
