# Odontograma permanente em camadas - Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Substituir o odontograma de estado único por um prontuário odontológico permanente, preciso e em camadas, com validação segura na API.

**Architecture:** \`odontogramModel.ts\` passa a ser a fonte de verdade da versão 2, do catálogo, das regras de alvo e da conversão não destrutiva de registros legados. O editor cria e altera uma ocorrência por vez, e o SVG compõe as ocorrências no alvo correspondente. A API aceita somente a versão 2 validada ou o formato legado estritamente limitado.

**Tech Stack:** React 18, TypeScript 5, Vite, Vitest, Testing Library, Radix Dialog, SVG, Zod 4, Express, Node test runner e Prisma JSON.

## Global Constraints

- Entregar somente a dentição permanente FDI: 11-18, 21-28, 31-38 e 41-48.
- Manter as faces \`top\`, \`right\`, \`bottom\`, \`left\` e \`center\`, com labels clínicos por quadrante.
- Aceitar face inteira e as sub-regiões \`cervical\`, \`middle\` e \`incisalOcclusal\`; condições de dente inteiro usam alvo próprio.
- Persistir \`version: 2\` e \`dentition: "permanent"\` no campo JSON \`odontogram\` já existente.
- Adaptar \`status\`, \`faces\` e \`notes\` legados em leitura, sem descarte; a primeira alteração salva v2.
- Permitir ocorrências independentes sobre o mesmo alvo.
- Aceitar somente texto simples em notas, com no máximo 500 caracteres.
- Preservar leitura, histórico, impressão HTML, receita PDF e layout sem overflow horizontal.
- Alvos interativos têm no mínimo 44 px, navegação por teclado e indicação além de cor.
- Sem migração Prisma, WebGL ou dentição decídua.
- Antes da entrega: testes frontend e backend, lint, build, secret scan e \`git diff --check\`.

## Estrutura de arquivos

- \`src/components/admin/attendance/odontogram/odontogramModel.ts\`: formato v2, catálogo, regras, normalização e atualizadores puros.
- \`src/components/admin/attendance/odontogram/odontogramModel.test.ts\`: legado, sobreposição e regras clínicas.
- \`src/components/admin/attendance/odontogram/ClinicalConditionEditor.tsx\`: formulário de uma ocorrência.
- \`src/components/admin/attendance/odontogram/ClinicalConditionEditor.test.tsx\`: criação e validação no cliente.
- \`src/components/admin/attendance/odontogram/ToothSurfaceSelector.tsx\` e teste: seleção de faces e sub-regiões.
- \`src/components/admin/attendance/odontogram/AnatomicalTooth.tsx\` e teste: composição SVG das camadas.
- \`src/components/admin/attendance/Odontogram.tsx\` e teste: coordenação, resumo e remoção independente.
- \`src/index.css\`: hit areas, indicadores, redução de movimento e impressão.
- \`src/lib/prescription-document.ts\`, teste e \`src/components/PrescriptionGenerator.tsx\`: resumo da versão 2 em PDF.
- \`src/pages/AdminAttendanceDetail.tsx\`, \`src/components/admin/attendance/EvolutionTimeline.tsx\` e \`src/pages/AdminPrescription.tsx\`: tipos compatíveis.
- \`server/utils/validationSchemas.js\`, \`server/test/odontogram-validation.test.js\` e \`server/test/patient-workflow-contract.test.js\`: validação e contrato seguro.

---

### Task 1: Modelar condições clínicas v2 e conversão de legado

**Files:**

- Modify: \`src/components/admin/attendance/odontogram/odontogramModel.ts\`
- Modify: \`src/components/admin/attendance/odontogram/odontogramModel.test.ts\`

**Interfaces:**

- Produces: \`OdontogramData\`, \`OdontogramV2\`, \`ToothRecord\`, \`ClinicalCondition\`, \`ConditionTarget\`, \`ClinicalCategory\`, \`ClinicalConditionType\`, \`ClinicalStage\`, \`normalizeOdontogram\`, \`createCondition\`, \`upsertCondition\`, \`removeCondition\`, \`getAllowedTargets\`, \`getConditionDisplayName\`.
- Consumes: \`FaceKey\`, \`FACE_KEYS\`, \`getFaceLabels\` e os tipos de legado existentes.

- [ ] **Step 1: Escrever testes que falham para legado, sobreposição e alvo inválido**

~~~ts
it("normalizes legacy status, faces and notes without dropping data", () => {
  const result = normalizeOdontogram({
    "16": { status: "Implante", notes: "controle anual", faces: { center: { status: "Tratado" } } },
  });

  expect(result).toMatchObject({ version: 2, dentition: "permanent" });
  expect(result.teeth["16"].notes).toBe("controle anual");
  expect(result.teeth["16"].conditions).toEqual(expect.arrayContaining([
    expect.objectContaining({ type: "implante", targets: [{ kind: "tooth" }] }),
    expect.objectContaining({ type: "legado_tratado", targets: [{ kind: "surface", face: "center", region: "entire" }] }),
  ]));
});

it("keeps two conditions on the same exact target", () => {
  const target = [{ kind: "surface" as const, face: "center" as const, region: "incisalOcclusal" as const }];
  const caries = createCondition({ category: "achado", type: "carie", stage: "planejado", targets: target });
  const resin = createCondition({ category: "restauracao", type: "resina_composta", stage: "concluido", targets: target });

  const result = upsertCondition(upsertCondition(normalizeOdontogram({}), 16, caries), 16, resin);
  expect(result.teeth["16"].conditions).toEqual([caries, resin]);
});

it("rejects a partial target for a crown", () => {
  expect(() => createCondition({
    category: "protese", type: "coroa_total", stage: "planejado",
    targets: [{ kind: "surface", face: "center", region: "entire" }],
  })).toThrow("coroa_total exige o alvo dente inteiro");
});
~~~

- [ ] **Step 2: Executar o teste e confirmar a falha esperada**

Run: \`npx vitest run src/components/admin/attendance/odontogram/odontogramModel.test.ts\`

Expected: FAIL com imports ausentes para \`normalizeOdontogram\`, \`createCondition\` e \`upsertCondition\`.

- [ ] **Step 3: Implementar o modelo imutável e o catálogo completo**

~~~ts
export const CLINICAL_CATALOG = {
  achado: ["carie", "lesao_carie_inicial", "infiltracao", "fratura", "trinca", "desgaste", "abrasao", "erosao", "abfracao", "mancha", "hipoplasia", "sensibilidade", "mobilidade", "furca", "retracao_gengival", "dente_ausente"],
  restauracao: ["resina_composta", "amalgama", "ionomero_vidro", "restauracao_provisoria", "selante", "inlay", "onlay", "overlay", "faceta"],
  endodontia: ["tratamento_endodontico", "retratamento", "obturacao_radicular", "lesao_periapical", "pino_intrarradicular", "nucleo"],
  protese: ["coroa_total", "coroa_parcial", "coroa_provisoria", "coroa_sobre_implante", "implante", "ponte_fixa", "protese_removivel", "elemento_pontico"],
  periodontiaCirurgia: ["gengivectomia", "enxerto", "cirurgia_periodontal", "exodontia_indicada", "exodontia_executada"],
  ortodontia: ["bracket", "banda", "contencao", "aparelho"],
} as const;

export type ConditionTarget =
  | { kind: "tooth" }
  | { kind: "surface"; face: FaceKey; region: "entire" | "cervical" | "middle" | "incisalOcclusal" };
export type ClinicalStage = "aAvaliar" | "planejado" | "emAndamento" | "concluido" | "monitorado" | "suspenso" | "removido";
export interface ClinicalCondition { id: string; category: ClinicalCategory; type: ClinicalConditionType; targets: ConditionTarget[]; stage: ClinicalStage; notes?: string; }
export interface OdontogramV2 { version: 2; dentition: "permanent"; teeth: Record<string, ToothRecord>; }
~~~

Implementar \`normalizeOdontogram(input)\` com type guard de versão, \`createCondition(draft)\` que valida \`getAllowedTargets(type)\`, e atualizadores que retornam objetos novos. Converter \`Ausente\`, \`Implante\`, \`Ponte\`, \`Tratar\` e \`Tratado\` legados em condições exibíveis com ID estável. Definir \`CONDITION_DISPLAY_NAMES\` para todos os códigos do catálogo e não aceitar dente fora da lista FDI.

- [ ] **Step 4: Executar os testes focados e build**

Run: \`npx vitest run src/components/admin/attendance/odontogram/odontogramModel.test.ts; npm run build\`

Expected: PASS; não há erro TypeScript.

- [ ] **Step 5: Commitar o modelo**

~~~powershell
git add src/components/admin/attendance/odontogram/odontogramModel.ts src/components/admin/attendance/odontogram/odontogramModel.test.ts
git commit -m "feat: model layered odontogram conditions"
~~~

### Task 2: Selecionar regiões anatômicas precisas e compor camadas SVG

**Files:**

- Modify: \`src/components/admin/attendance/odontogram/ToothSurfaceSelector.tsx\`
- Modify: \`src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx\`
- Modify: \`src/components/admin/attendance/odontogram/AnatomicalTooth.tsx\`
- Modify: \`src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx\`
- Modify: \`src/index.css\`

**Interfaces:**

- Consumes: \`ConditionTarget\`, \`ClinicalCondition\`, \`getAllowedTargets\` e \`getFaceLabels\`.
- Produces: \`onChange(targets: ConditionTarget[])\`, controles por sub-região e camadas identificadas por \`data-condition-type\`, \`data-condition-stage\` e \`data-condition-count\`.

- [ ] **Step 1: Escrever testes para sub-região, teclado e sobreposição**

~~~tsx
it("selects a cervical face region by keyboard", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<ToothSurfaceSelector toothNumber={16} conditions={[]} selectedTargets={[]} onChange={onChange} />);

  await user.tab();
  await user.keyboard("{Enter}");

  expect(onChange).toHaveBeenCalledWith([
    { kind: "surface", face: "top", region: "cervical" },
  ]);
});

it("shows a count marker when two conditions share the same sub-region", () => {
  render(<AnatomicalTooth toothNumber={16} record={recordWithCariesAndResin} />);
  expect(screen.getByTestId("condition-count-center-incisalOcclusal")).toHaveTextContent("2");
});
~~~

- [ ] **Step 2: Executar os testes em vermelho**

Run: \`npx vitest run src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx\`

Expected: FAIL porque os componentes ainda recebem \`ToothData\` e não possuem sub-regiões.

- [ ] **Step 3: Implementar seleção múltipla com áreas de toque adequadas**

~~~ts
const SURFACE_REGIONS = ["cervical", "middle", "incisalOcclusal"] as const;

function toggleTarget(current: ConditionTarget[], next: ConditionTarget): ConditionTarget[] {
  const key = JSON.stringify(next);
  return current.some((target) => JSON.stringify(target) === key)
    ? current.filter((target) => JSON.stringify(target) !== key)
    : [...current, next];
}
~~~

Sobrepor três botões semânticos a cada face SVG, com label como \`Vestibular, região cervical\`, \`aria-pressed\`, foco visível e hit area mínima de 44 px. O botão de dente inteiro só aparece para tipos que exigem ou admitem esse alvo. Ao trocar o tipo, filtrar os alvos que \`getAllowedTargets\` não permite.

- [ ] **Step 4: Compor a forma dominante e o indicador de camadas**

~~~tsx
const conditionsForTarget = record.conditions.filter((condition) =>
  condition.targets.some((target) => targetMatches(target, face, region)),
);
const dominantCondition = conditionsForTarget.at(-1);
const conditionCount = conditionsForTarget.length;
~~~

Implementar \`getConditionVisual(condition)\` no modelo. Cárie e fratura usam hachura e contorno; resina, amálgama, ionômero e provisório usam preenchimentos distintos; inlay, onlay, overlay, faceta e coroas usam coberturas; tratamento endodôntico, pino e implante marcam raízes; ponte, bracket, contenção, selante e ausência têm símbolos próprios. Renderizar a camada dominante e, quando a contagem for maior que um, um marcador numérico; a lista completa permanecerá disponível no editor.

- [ ] **Step 5: Adicionar estilos sem overflow e com acessibilidade visual**

~~~css
.surface-selector__region-control { min-inline-size: 44px; min-block-size: 44px; touch-action: manipulation; }
.anatomical-tooth__condition-count { paint-order: stroke; stroke: #0f172a; stroke-width: 2px; }
@media (prefers-reduced-motion: reduce) { .anatomical-tooth, .surface-selector__control { transition: none; } }
~~~

Manter container queries da arcada. Para impressão, preservar preenchimento, padrão, contorno e texto de resumo em preto e branco.

- [ ] **Step 6: Executar testes e build**

Run: \`npx vitest run src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx; npm run build\`

Expected: PASS; cada família dentária continua reconhecível e a página não ganha rolagem horizontal.

- [ ] **Step 7: Commitar a camada SVG**

~~~powershell
git add src/components/admin/attendance/odontogram/ToothSurfaceSelector.tsx src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx src/components/admin/attendance/odontogram/AnatomicalTooth.tsx src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx src/index.css
git commit -m "feat: render precise odontogram condition layers"
~~~

### Task 3: Criar o editor de uma ocorrência clínica

**Files:**

- Create: \`src/components/admin/attendance/odontogram/ClinicalConditionEditor.tsx\`
- Create: \`src/components/admin/attendance/odontogram/ClinicalConditionEditor.test.tsx\`

**Interfaces:**

- Consumes: catálogo e tipos da Task 1 e o seletor da Task 2.
- Produces: \`onSave(condition: ClinicalCondition)\`; não atualiza dados do paciente diretamente.

- [ ] **Step 1: Escrever testes para criação válida e bloqueio de coroa parcial**

~~~tsx
it("emits one completed resin occurrence after all required choices", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(<ClinicalConditionEditor toothNumber={16} conditions={[]} onSave={onSave} onCancel={() => undefined} />);

  await user.selectOptions(screen.getByLabelText("Categoria"), "restauracao");
  await user.selectOptions(screen.getByLabelText("Procedimento"), "resina_composta");
  await user.click(screen.getByRole("button", { name: /oclusal.*inteira/i }));
  await user.selectOptions(screen.getByLabelText("Situação"), "concluido");
  await user.click(screen.getByRole("button", { name: "Salvar ocorrência" }));

  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ type: "resina_composta", stage: "concluido" }));
});

it("requires the tooth target for a total crown", async () => {
  const user = userEvent.setup();
  render(<ClinicalConditionEditor toothNumber={16} conditions={[]} onSave={() => undefined} onCancel={() => undefined} />);
  await user.selectOptions(screen.getByLabelText("Categoria"), "protese");
  await user.selectOptions(screen.getByLabelText("Procedimento"), "coroa_total");
  expect(screen.getByRole("button", { name: "Salvar ocorrência" })).toBeDisabled();
});
~~~

- [ ] **Step 2: Executar o teste em vermelho**

Run: \`npx vitest run src/components/admin/attendance/odontogram/ClinicalConditionEditor.test.tsx\`

Expected: FAIL porque o componente ainda não existe.

- [ ] **Step 3: Implementar formulário clínico limitado por catálogo**

~~~tsx
const canSave = draft.category !== null
  && draft.type !== null
  && draft.stage !== null
  && draft.targets.length > 0;

<form onSubmit={(event) => {
  event.preventDefault();
  if (canSave) onSave(createCondition(draft));
}}>
  {/* category, type, target selector, stage and plain-text note */}
</form>
~~~

Usar labels explícitos para \`Categoria\`, \`Procedimento\`, \`Situação\` e \`Observação da ocorrência\`. Ao trocar categoria, limpar tipo e alvos; ao trocar tipo, manter apenas alvos compatíveis. O campo de nota usa \`maxLength={500}\`. Em edição, manter o ID original ao salvar.

- [ ] **Step 4: Executar o teste do editor**

Run: \`npx vitest run src/components/admin/attendance/odontogram/ClinicalConditionEditor.test.tsx\`

Expected: PASS; salvar só está disponível para rascunho válido.

- [ ] **Step 5: Commitar o editor**

~~~powershell
git add src/components/admin/attendance/odontogram/ClinicalConditionEditor.tsx src/components/admin/attendance/odontogram/ClinicalConditionEditor.test.tsx
git commit -m "feat: add clinical condition editor"
~~~

### Task 4: Integrar o novo modelo no odontograma e nos consumidores

**Files:**

- Modify: \`src/components/admin/attendance/Odontogram.tsx\`
- Modify: \`src/components/admin/attendance/Odontogram.test.tsx\`
- Modify: \`src/pages/AdminAttendanceDetail.tsx\`
- Modify: \`src/components/admin/attendance/EvolutionTimeline.tsx\`
- Modify: \`src/pages/AdminPrescription.tsx\`

**Interfaces:**

- Consumes: todas as exports das Tasks 1 a 3.
- Produces: \`Odontogram\` recebe \`data: OdontogramData\` e chama \`onChange(next: OdontogramV2)\` somente após mutação explícita.

- [ ] **Step 1: Escrever testes para duas condições e remoção independente**

~~~tsx
it("keeps planned caries and completed resin on one selected sub-region", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Odontogram data={{}} onChange={onChange} />);

  await user.click(getToothButton(16));
  await createConditionWith(user, "achado", "carie", "planejado", "Oclusal / Incisal");
  await createConditionWith(user, "restauracao", "resina_composta", "concluido", "Oclusal / Incisal");

  expect(onChange.mock.calls.at(-1)[0].teeth["16"].conditions).toHaveLength(2);
});

it("removes only the selected occurrence", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Odontogram data={v2WithCariesAndResin} onChange={onChange} />);
  await user.click(getToothButton(16));
  await user.click(screen.getByRole("button", { name: /remover cárie/i }));

  expect(onChange).toHaveBeenCalledWith(v2WithOnlyResin);
});
~~~

- [ ] **Step 2: Executar o teste em vermelho**

Run: \`npx vitest run src/components/admin/attendance/Odontogram.test.tsx\`

Expected: FAIL porque o componente ainda usa \`updateToothFace\` e \`updateWholeTooth\`.

- [ ] **Step 3: Refatorar o coordenador e seus tipos de entrada**

~~~tsx
const normalized = useMemo(() => normalizeOdontogram(data), [data]);
const saveCondition = (condition: ClinicalCondition) => {
  if (selectedTooth !== null) onChange(upsertCondition(normalized, selectedTooth, condition));
};
const deleteCondition = (id: string) => {
  if (selectedTooth !== null) onChange(removeCondition(normalized, selectedTooth, id));
};
~~~

Abrir dente sem escrever; usar \`ClinicalConditionEditor\` para criar e editar; listar todas as ocorrências do dente ou da região selecionada com botões \`Editar\` e \`Remover\`; manter nota geral do dente separada das notas de ocorrência. No modo somente leitura, não renderizar controles de mutação e mostrar tipo, situação, alvo e observações. Atualizar os três consumidores para \`OdontogramData\`, com fallback \`{}\` apenas quando a API retornar nulo.

- [ ] **Step 4: Preservar histórico e impressão HTML**

~~~tsx
const recorded = Object.entries(normalized.teeth).filter(([, record]) =>
  record.notes.trim().length > 0 || record.conditions.length > 0,
);
~~~

Gerar resumo por dente usando \`getConditionDisplayName\`, labels clínicos de face e situação. No modo imprimível, preservar a grade de 16 colunas, o resumo textual e somente elementos SVG legíveis em escala de cinza.

- [ ] **Step 5: Executar testes e build**

Run: \`npx vitest run src/components/admin/attendance/Odontogram.test.tsx src/pages/AdminAttendanceDetail.test.tsx; npm run build\`

Expected: PASS; o clique inicial não persiste, sobreposições persistem e leitura não expõe edição.

- [ ] **Step 6: Commitar integração**

~~~powershell
git add src/components/admin/attendance/Odontogram.tsx src/components/admin/attendance/Odontogram.test.tsx src/pages/AdminAttendanceDetail.tsx src/components/admin/attendance/EvolutionTimeline.tsx src/pages/AdminPrescription.tsx
git commit -m "feat: edit layered odontogram records"
~~~

### Task 5: Atualizar resumo e desenho da receita PDF

**Files:**

- Modify: \`src/lib/prescription-document.ts\`
- Create: \`src/lib/prescription-document.test.ts\`
- Modify: \`src/components/PrescriptionGenerator.tsx\`
- Modify: \`src/components/PrescriptionGenerator.test.ts\`

**Interfaces:**

- Consumes: \`OdontogramData\`, \`normalizeOdontogram\` e \`getConditionDisplayName\`.
- Produces: \`getPdfOdontogramSummary(data: OdontogramData): string[]\`.

- [ ] **Step 1: Escrever testes de resumo v2 e legado**

~~~ts
it("lists overlapping conditions with clinical target and stage", () => {
  expect(getPdfOdontogramSummary(v2WithCariesAndResin)).toEqual([
    "16: Cárie planejado (Oclusal / Incisal - oclusal); Resina composta concluído (Oclusal / Incisal - oclusal)",
  ]);
});

it("keeps legacy treated faces in the PDF summary", () => {
  expect(getPdfOdontogramSummary(legacyTreatedFace)).toEqual([
    "16: Tratado legado (Oclusal / Incisal - face inteira)",
  ]);
});
~~~

- [ ] **Step 2: Executar o teste em vermelho**

Run: \`npx vitest run src/lib/prescription-document.test.ts\`

Expected: FAIL porque a função requer \`Record<string, ToothData>\`.

- [ ] **Step 3: Normalizar antes de montar o resumo e o desenho**

~~~ts
export function getPdfOdontogramSummary(data: OdontogramData): string[] {
  const odontogram = normalizeOdontogram(data);
  return Object.entries(odontogram.teeth)
    .sort(([left], [right]) => Number(left) - Number(right))
    .flatMap(([tooth, record]) => formatToothSummary(Number(tooth), record));
}
~~~

Trocar props de \`PrescriptionOdontogramPdf\` e \`PrescriptionDocument\` para \`OdontogramData\`. Derivar a camada dominante por dente para o desenho PDF; preservar ausência, implante e ponte como sinais anatômicos; usar o resumo textual para todas as ocorrências sobrepostas.

- [ ] **Step 4: Executar testes e build**

Run: \`npx vitest run src/lib/prescription-document.test.ts src/components/PrescriptionGenerator.test.ts; npm run build\`

Expected: PASS; receitas exibem dados legados e v2 sem truncar condições.

- [ ] **Step 5: Commitar receita**

~~~powershell
git add src/lib/prescription-document.ts src/lib/prescription-document.test.ts src/components/PrescriptionGenerator.tsx src/components/PrescriptionGenerator.test.ts
git commit -m "feat: summarize layered odontogram in prescriptions"
~~~

### Task 6: Validar odontogramas estruturados no backend

**Files:**

- Modify: \`server/utils/validationSchemas.js\`
- Create: \`server/test/odontogram-validation.test.js\`
- Modify: \`server/test/patient-workflow-contract.test.js\`

**Interfaces:**

- Produces: \`odontogramSchema\`, exportado e usado em \`patientSchema\`.
- Consumes: Zod 4, a lista FDI e os códigos definidos na Task 1.

- [ ] **Step 1: Escrever testes de schema para aceitar casos válidos e rejeitar risco**

~~~js
test("accepts a bounded v2 permanent odontogram with overlapping conditions", () => {
  assert.equal(odontogramSchema.safeParse(validLayeredOdontogram).success, true);
});

test("rejects unknown keys, temporary teeth, HTML notes and partial crowns", () => {
  for (const input of [unknownConditionKey, temporaryTooth, htmlNote, partialCrown]) {
    assert.equal(odontogramSchema.safeParse(input).success, false);
  }
});

test("accepts the constrained legacy format", () => {
  assert.equal(odontogramSchema.safeParse(legacyPatientOdontogram).success, true);
});
~~~

- [ ] **Step 2: Executar o teste em vermelho**

Run: \`node --test server/test/odontogram-validation.test.js\`

Expected: FAIL porque \`odontogramSchema\` não é exportado.

- [ ] **Step 3: Implementar schemas estritos e com limites**

~~~js
const safeNote = z.string().trim().max(500).refine((value) => !/[<>]/.test(value), "Notes must be plain text");
const surfaceTargetSchema = z.object({
  kind: z.literal("surface"),
  face: z.enum(["top", "right", "bottom", "left", "center"]),
  region: z.enum(["entire", "cervical", "middle", "incisalOcclusal"]),
}).strict();
const toothTargetSchema = z.object({ kind: z.literal("tooth") }).strict();
~~~

Criar schemas \`.strict()\` para ocorrência, registro de dente e versão 2; limitar 32 dentes, 30 condições por dente, 5 alvos por ocorrência e notas de 500 caracteres. Em \`superRefine\`, rejeitar chave dental fora da lista FDI e exigir somente alvo \`{ kind: "tooth" }\` para \`coroa_total\`, \`implante\`, \`ponte_fixa\`, \`protese_removivel\`, \`elemento_pontico\`, \`exodontia_indicada\` e \`exodontia_executada\`. Criar schema legado estrito para \`status\`, \`notes\` e \`faces\`; substituir \`odontogram: z.any()\` por \`odontogram: odontogramSchema.optional().nullable()\`.

- [ ] **Step 4: Atualizar o contrato e rodar testes do servidor**

~~~js
assert.match(schemaSource, /odontogramSchema\.optional\(\)\.nullable\(\)/);
assert.doesNotMatch(schemaSource, /odontogram:\s*z\.any\(\)/);
~~~

Run: \`node --test server/test/odontogram-validation.test.js server/test/patient-workflow-contract.test.js server/test/security-foundations.test.js\`

Expected: PASS; a rota permanece autenticada e o odontograma não aceita JSON irrestrito.

- [ ] **Step 5: Commitar validação**

~~~powershell
git add server/utils/validationSchemas.js server/test/odontogram-validation.test.js server/test/patient-workflow-contract.test.js
git commit -m "fix: validate layered odontogram payloads"
~~~

### Task 7: Verificação completa, responsividade e handoff

**Files:**

- Modify: \`docs/superpowers/specs/2026-07-30-layered-permanent-odontogram-design.md\` apenas após todas as verificações verdes.
- Modify: \`README.md\` somente se já existir seção documentando o formato de odontograma.

**Interfaces:**

- Consumes: módulos e testes das Tasks 1 a 6.
- Produces: evidência verificável da entrega e status atualizado da especificação.

- [ ] **Step 1: Rodar a suíte frontend**

Run: \`npm test\`

Expected: PASS; todos os testes Vitest finalizam com exit code 0.

- [ ] **Step 2: Rodar a suíte backend**

Run: \`node --test server/test/*.test.js\`

Expected: PASS; a saída não contém dados de pacientes, credenciais ou payloads clínicos completos.

- [ ] **Step 3: Rodar qualidade e varredura de segredos**

Run: \`npm run lint; npm run build; git diff --check; rg -n --hidden -g '!node_modules' -g '!*.lock' '(?:AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|postgres(?:ql)?://[^[:space:]]+)' .\`

Expected: lint e build passam, \`git diff --check\` não produz saída e a varredura não encontra segredo. Se encontrar arquivo preexistente fora desta alteração, não modificá-lo: registrar o caminho e pedir orientação.

- [ ] **Step 4: Verificar responsividade e impressão**

Run: \`powershell -ExecutionPolicy Bypass -File scripts/verify-admin-responsive.ps1\`

Expected: PASS. Inspeção manual no viewport de 360 px: abrir dente, criar duas camadas sobre a mesma sub-região, alternar para leitura e abrir prévia de impressão; não há overflow horizontal e foco, rótulos e padrões continuam visíveis.

- [ ] **Step 5: Atualizar status e commit final, se houver mudança documental**

~~~powershell
git add docs/superpowers/specs/2026-07-30-layered-permanent-odontogram-design.md README.md
git commit -m "docs: complete layered odontogram delivery"
~~~

Executar o commit apenas se a especificação ou README foram efetivamente atualizados. Não criar commit vazio nem incluir arquivos não relacionados.

