# Odontogram Interaction and Legend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline execution approved for this session). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir a seleção de faces, estados clínicos, condição do dente inteiro, legenda e persistência do odontograma sem alterar a arte dos SVGs existentes.

**Architecture:** Manter `odontogramModel.ts` como fonte única dos IDs, rótulos, escopo e tokens visuais. O renderer (`AnatomicalTooth`), a nova legenda e os editores consumirão essas definições. A edição legado será feita em um draft local com `selectedSurfaces: FaceKey[]`, confirmação explícita e commit único via `onChange`; o formato legado/V2/V3 e `dentalNotes` permanecerão retrocompatíveis.

**Tech Stack:** React 18 + TypeScript + Vite, Vitest/Testing Library, Radix UI existente, Tailwind/CSS tokens existentes.

## Global Constraints

- Não alterar path data, geometria, proporções, viewBox ou ilustrações em `odontogramGeometry.ts`, `AnatomicalTooth.tsx` e `OcclusalTooth.tsx`.
- Preservar IDs de face atuais (`top`, `right`, `bottom`, `left`, `center`) e o formato legado/V2/V3 aceito pelo backend.
- Não criar taxonomia clínica paralela; reutilizar `CLINICAL_CATALOG`, `FaceStatus`, `WholeToothStatus` e `CLINICAL_STAGE_VISUALS`.
- Não apagar faces ou observações não selecionadas; qualquer confirmação deve refletir regras já existentes.
- Não persistir SVG; continuar usando `Appointment.dentalNotes` e `normalizeOdontogram`.
- Controles interativos devem ter foco visível, `aria-label`, `aria-pressed` quando toggle e alvo mínimo confortável (~44px quando o layout permitir).
- Toda produção nova deve seguir TDD: teste falhando, implementação mínima, teste passando e refatoração com a suíte verde.

## Arquivos e responsabilidades

- Modify `src/components/admin/attendance/odontogram/odontogramModel.ts`: adicionar definições compartilhadas de status/escopo/símbolo e helpers de rótulo/legenda sem mudar enums ou payloads existentes.
- Create `src/components/admin/attendance/odontogram/OdontogramStateSwatch.tsx`: renderizar a amostra visual usando os mesmos tokens/padrões usados pela legenda e pelo renderer, sem duplicar paths anatômicos.
- Create `src/components/admin/attendance/odontogram/OdontogramLegend.tsx`: gerar duas seções (Faces; Dente inteiro/reabilitação) a partir das definições compartilhadas.
- Modify `src/components/admin/attendance/odontogram/ToothSurfaceSelector.tsx`: expor seleção textual e SVG com uma única lista de faces, manter suporte a `ConditionTarget` V2/V3 e adicionar ARIA/feedback sem tocar na geometria.
- Modify `src/components/admin/attendance/odontogram/AnatomicalTooth.tsx`: conectar eventos/atributos/classes de seleção aos elementos existentes; manter todos os paths intactos.
- Modify `src/components/admin/attendance/Odontogram.tsx`: usar legenda extraída, draft legado multi-face, chips, condições por escopo, ações Cancelar/Aplicar e carregamento sem reset.
- Modify `src/components/admin/attendance/odontogram/ClinicalConditionEditor.tsx`: consumir rótulos centralizados e expor seleção/edição/remoção contextual de ocorrência sem alterar o contrato persistido.
- Modify `src/components/admin/attendance/odontogram/ClinicalConditionList.tsx`: adicionar ação de editar e usar os mesmos rótulos da configuração.
- Test `src/components/admin/attendance/odontogram/odontogramModel.test.ts`: definições únicas, escopos e cobertura dos símbolos renderizáveis.
- Test `src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx`: toggle múltiplo e sincronização SVG/botões.
- Test `src/components/admin/attendance/Odontogram.test.tsx`: seleção simples/múltipla, edição parcial, limpeza, condição global, ações explícitas e legenda.

Não há alteração prevista em Prisma, migrations, schemas de API ou endpoints: a representação estruturada já é validada e persistida em JSON.

### Task 1: Centralizar estados, escopos e visuais

**Files:**
- Modify: `src/components/admin/attendance/odontogram/odontogramModel.ts`
- Test: `src/components/admin/attendance/odontogram/odontogramModel.test.ts`

**Interfaces:**
- Produces `ODONTOGRAM_STATE_DEFINITIONS`, `OdontogramStateDefinition`, `getOdontogramStateDefinition`, `getOdontogramLegendGroups` e rótulos compatíveis com IDs atuais.
- `CLINICAL_STAGE_VISUALS` passa a ser a fonte do visual de estágios; `getConditionVisual` continua com a assinatura existente.

- [ ] **Step 1: Write the failing tests**
  - Testar que cada status legado (`Saudável`, `Tratar`, `Tratado`, `Ausente`, `Implante`, `Ponte`) tenha `scope` correto e definição visual.
  - Testar que todos os estágios retornados por `getConditionVisual` apareçam no grupo de legenda correspondente e que o visual de `Ausente` declare o símbolo X.
- [ ] **Step 2: Run tests to verify failure**
  - Run `npx vitest run src/components/admin/attendance/odontogram/odontogramModel.test.ts`.
  - Expected: falha por ausência da configuração/helpers novos.
- [ ] **Step 3: Implement minimal model configuration**
  - Derivar definições dos enums/catalog existentes, mantendo aliases de texto (`Tratar`/`A tratar`, `Tratado`/`Tratada`) apenas na camada de apresentação.
  - Expor símbolos e padrões sem substituir `STATUS_OVERLAYS` ou os IDs persistidos.
- [ ] **Step 4: Run tests to verify pass**
  - Repetir o comando e confirmar PASS.
- [ ] **Step 5: Refactor after green**
  - Remover mapas de labels duplicados somente quando cobertos pela configuração central.

### Task 2: Extrair legenda e amostras visuais

**Files:**
- Create: `src/components/admin/attendance/odontogram/OdontogramStateSwatch.tsx`
- Create: `src/components/admin/attendance/odontogram/OdontogramLegend.tsx`
- Modify: `src/components/admin/attendance/Odontogram.tsx`
- Test: `src/components/admin/attendance/Odontogram.test.tsx`

**Interfaces:**
- `OdontogramLegend` recebe opcionalmente `compact?: boolean` e não recebe lista hardcoded.
- `OdontogramStateSwatch` recebe uma definição compartilhada e renderiza padrão/símbolo acessível.

- [ ] **Step 1: Write the failing tests**
  - Substituir a expectativa de legenda única por seções `Faces` e `Dente inteiro`.
  - Verificar presença do X vermelho de Ausente, amostras de Implante/Ponte e cada visual de estágio renderizável.
- [ ] **Step 2: Run tests to verify failure**
  - Run `npx vitest run src/components/admin/attendance/Odontogram.test.tsx -t "legenda"`.
  - Expected: falha porque a legenda atual é hardcoded e não agrupada.
- [ ] **Step 3: Implement components**
  - Gerar grupos por `scope`; reutilizar classes/patterns sem alterar o SVG odontológico.
  - Remover arrays/mapas de legenda duplicados de `Odontogram.tsx`.
- [ ] **Step 4: Run tests to verify pass**
  - Repetir o teste direcionado e confirmar PASS.
- [ ] **Step 5: Refactor after green**
  - Garantir que textos e `aria-label`s usem os helpers do modelo.

### Task 3: Unificar seleção de faces no SVG e no seletor textual

**Files:**
- Modify: `src/components/admin/attendance/odontogram/ToothSurfaceSelector.tsx`
- Modify: `src/components/admin/attendance/odontogram/AnatomicalTooth.tsx`
- Test: `src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx`

**Interfaces:**
- Adicionar modo controlado `selectedSurfaces?: FaceKey[]` + `onSelectedSurfacesChange?: (faces: FaceKey[]) => void`, preservando `selectedTargets`/`onTargetsChange` V2/V3.
- SVG e botões chamam o mesmo toggle e emitem `aria-pressed`/`aria-label`.

- [ ] **Step 1: Write the failing tests**
  - Selecionar Distal e Vestibular por botões mantém as duas.
  - Clicar na face correspondente do SVG atualiza o mesmo estado dos botões.
  - Desselecionar por teclado remove apenas a face clicada.
- [ ] **Step 2: Run tests to verify failure**
  - Run `npx vitest run src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx -t "múltipl|SVG"`.
  - Expected: falha no contrato controlado/SVG click.
- [ ] **Step 3: Implement minimal synchronization**
  - Manter `ANATOMICAL_GEOMETRY` e todos os paths; adicionar apenas handlers, `tabIndex`, classes e atributos.
  - Derivar labels com `getFaceLabels` e preservar a normalização de alvos V2/V3.
- [ ] **Step 4: Run tests to verify pass**
  - Repetir suíte do seletor e confirmar PASS.
- [ ] **Step 5: Refactor after green**
  - Extrair o toggle comum para uma função estável e evitar estados duplicados.

### Task 4: Tornar o editor legado transacional e multi-face

**Files:**
- Modify: `src/components/admin/attendance/Odontogram.tsx`
- Modify: `src/components/admin/attendance/odontogram/ToothSurfaceSelector.tsx`
- Test: `src/components/admin/attendance/Odontogram.test.tsx`

**Interfaces:**
- O dialog legado terá draft local de faces/status/global/notes inicializado ao abrir, sem mutar `data` até Aplicar.
- `onChange` receberá uma cópia imutável apenas em `Aplicar alterações`; Cancelar descarta o draft.

- [ ] **Step 1: Write the failing tests**
  - Dente 21: selecionar Distal + Vestibular, marcar `Tratar`, aplicar e verificar ambas.
  - Editar somente Distal preserva Mesial e demais faces.
  - Chips exibem `FACES SELECIONADAS`, permitem remover um item, e estado vazio exibe `Nenhuma face selecionada`.
  - Aplicar fica desabilitado sem mudança válida; Cancelar não chama `onChange`.
- [ ] **Step 2: Run tests to verify failure**
  - Run `npx vitest run src/components/admin/attendance/Odontogram.test.tsx -t "face|Aplicar|Cancelar"`.
  - Expected: falhas por `selectedFace` singular e mutação imediata.
- [ ] **Step 3: Implement draft flow**
  - Substituir somente o estado local legado por `selectedSurfaces: FaceKey[]`; preservar o formato serializado `faces` existente.
  - Aplicar a condição apenas às faces selecionadas, limpar explicitamente com ação contextual e manter `notes` intacto.
  - Adicionar confirmação acessível antes de aplicar condição global quando já houver marcações por superfície, sem apagar automaticamente.
- [ ] **Step 4: Run tests to verify pass**
  - Repetir testes direcionados e depois a suíte completa de `Odontogram.test.tsx`.
- [ ] **Step 5: Refactor after green**
  - Remover duplicação de handlers e corrigir o `useEffect` que atualmente redefine `wholeToothOpen` duas vezes.

### Task 5: Melhorar editor/lista V2/V3 sem quebrar payload

**Files:**
- Modify: `src/components/admin/attendance/odontogram/ClinicalConditionEditor.tsx`
- Modify: `src/components/admin/attendance/odontogram/ClinicalConditionList.tsx`
- Modify: `src/components/admin/attendance/Odontogram.tsx`
- Test: `src/components/admin/attendance/Odontogram.test.tsx`

**Interfaces:**
- Editor continua emitindo `ClinicalCondition` válido por `createCondition`.
- Lista adiciona `onEdit?: (condition: ClinicalCondition) => void`, mantendo remoção existente.

- [ ] **Step 1: Write the failing tests**
  - Abrir condição existente mostra alvos múltiplos e permite editar apenas um alvo sem remover os demais.
  - Remover uma ocorrência não remove notas do dente.
  - Estados de escopo `tooth` aparecem apenas em `CONDIÇÃO DO DENTE INTEIRO`; superfícies permanecem na seção de faces.
- [ ] **Step 2: Run tests to verify failure**
  - Run `npx vitest run src/components/admin/attendance/Odontogram.test.tsx -t "condição|ocorrência|escopo"`.
  - Expected: falha por ausência de edição/labels/separação.
- [ ] **Step 3: Implement minimal editor/list changes**
  - Usar labels centralizados para categoria/tipo/estágio; manter IDs persistidos.
  - Adicionar edição por cópia e limpar faces selecionadas sem afetar `notes`.
  - Manter confirmação somente onde o domínio atual indicar incompatibilidade.
- [ ] **Step 4: Run tests to verify pass**
  - Rodar testes direcionados e suíte odontograma.
- [ ] **Step 5: Refactor after green**
  - Compartilhar formatadores de alvos/labels entre editor, lista e legenda.

### Task 6: Persistência, acessibilidade, responsividade e regressão

**Files:**
- Modify only if needed: `src/components/admin/attendance/odontogram/AnatomicalTooth.tsx`, `src/components/admin/attendance/Odontogram.tsx`
- Test: `src/components/admin/attendance/Odontogram.test.tsx`, `src/components/admin/attendance/odontogram/odontogramModel.test.ts`

- [ ] **Step 1: Write failing integration tests**
  - Salvar, fechar e reabrir mantém condições simples/múltiplas, estado global, limpeza e observações.
  - Renderer e legenda cobrem todo estado visual renderizável.
  - Teclado e leitores de tela encontram labels e foco; layout conserva estrutura em viewport menor.
- [ ] **Step 2: Run tests to verify failure**
  - Run `npx vitest run src/components/admin/attendance/Odontogram.test.tsx src/components/admin/attendance/odontogram/odontogramModel.test.ts`.
- [ ] **Step 3: Implement only required integration fixes**
  - Confirmar que `normalizeOdontogram` é usado na entrada e que `onChange` mantém JSON estruturado.
  - Adicionar `aria-live` apenas ao resumo/feedback necessário e classes responsivas sem mudar o desenho.
- [ ] **Step 4: Run complete verification**
  - Run `npx vitest run`.
  - Run `npm run build`.
  - Run `npm run lint`.
  - Confirmar diff não contém alterações de geometria/path/viewBox e executar busca de segredos conforme `SECURITY.md`.
- [ ] **Step 5: Refactor and document**
  - Atualizar comentários somente onde a compatibilidade legado/V2/V3 exigir explicação.

## Verification checklist

- [ ] Nenhum path/viewBox/geometry odontológico alterado.
- [ ] `selectedSurfaces` é a única fonte da seleção de faces no editor legado.
- [ ] Seleção múltipla, edição parcial e limpeza preservam dados não selecionados e observações.
- [ ] Condições globais são separadas e não apagam superfícies silenciosamente.
- [ ] Legenda é derivada da mesma configuração que fornece visuais ao renderer e explica X/implante/ponte.
- [ ] Persistência/reabertura funciona para legado e V2/V3.
- [ ] Testes, build, lint e verificação de segurança passam.
