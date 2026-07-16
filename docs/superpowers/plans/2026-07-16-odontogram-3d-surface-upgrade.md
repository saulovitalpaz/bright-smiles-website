# Odontograma 3D com Regiões Clínicas Visíveis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the odontograma geral para exibir visual anatômico vetorial mais convincente, com raízes molares naturais e cores de tratamento/cárie aplicadas diretamente às superfícies afetadas do dente.

**Architecture:** Manter o modelo clínico atual (`ToothData`, `faces`, `FaceStatus`) e a interação existente. A geometria frontal local ganhará regiões vetoriais nomeadas por face e camadas de pintura; `AnatomicalTooth` renderizará essas regiões dentro do SVG, enquanto `Odontogram` deixará de usar o ponto azul como único indicador e passará a usar a própria pintura mais um estado selecionado discreto. A geometria continuará local e vetorial para preservar nitidez em tela e impressão, com atribuição documentada ao material MIT caso trechos públicos sejam incorporados.

**Tech Stack:** React, TypeScript, SVG inline, Tailwind/CSS, Vitest, Testing Library.

## Global Constraints

- Não alterar o contrato persistido de `ToothData`, `FaceKey`, `FaceStatus` ou `WholeToothStatus`.
- Toda marcação de face deve permanecer clicável pelo seletor existente e aparecer na vista geral.
- A impressão deve continuar usando SVG vetorial, sem depender de CDN ou imagem raster.
- O estado `Saudável` não deve pintar uma região; `Tratar` deve usar vermelho/coral hachurado; `Tratado` deve usar ciano/azul sólido translúcido.
- Raízes de molares devem ter três formas curvas e separadas, com transição cervical e sombra, sem aparência de linhas retas ou formas repetitivas.
- Não adicionar dependências externas para renderização do odontograma.

---

### Task 1: Definir o contrato visual das superfícies

**Files:**
- Modify: `src/components/admin/attendance/odontogram/odontogramGeometry.ts`
- Test: `src/components/admin/attendance/odontogram/odontogramGeometry.test.ts`

**Interfaces:**
- `FrontalGeometry` passa a produzir `surfaces: Record<FaceKey, string>` além de `crown`, `roots`, `cervical` e `highlight`.
- Cada família (`incisor`, `canine`, `premolar`, `molar`) terá paths frontais para `top`, `right`, `bottom`, `left` e `center`; os paths devem ficar dentro do contorno de `crown`.

- [ ] **Step 1: Write the failing test**

Adicionar testes que afirmem que todas as famílias têm as cinco faces frontais e que o molar possui três raízes distintas curvas:

```ts
it.each(["incisor", "canine", "premolar", "molar"] as const)(
  "defines five frontal surfaces for %s",
  (family) => {
    const geometry = ANATOMICAL_GEOMETRY[family].frontal;
    expect(Object.keys(geometry.surfaces).sort()).toEqual(
      ["bottom", "center", "left", "right", "top"],
    );
    expect(Object.values(geometry.surfaces).every((path) => path.length > 20)).toBe(true);
  },
);

it("uses separated curved roots for molars", () => {
  const roots = ANATOMICAL_GEOMETRY.molar.frontal.roots;
  expect(roots).toHaveLength(3);
  expect(roots.every((path) => /C|S/.test(path))).toBe(true);
  expect(new Set(roots).size).toBe(3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/admin/attendance/odontogram/odontogramGeometry.test.ts`
Expected: FAIL because `surfaces` is not yet present.

- [ ] **Step 3: Write minimal implementation**

Add `surfaces` to every frontal geometry. Use five inset regions: cervical/top vestibular, mesial/distal side strips, incisal/occlusal center, and bottom palatal/lingual. Replace the molar roots with three individual tapered Bézier paths whose apices diverge gently and whose cervical ends sit behind the crown; keep the root count at three so existing whole-tooth overlay behavior remains valid.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/admin/attendance/odontogram/odontogramGeometry.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/attendance/odontogram/odontogramGeometry.ts src/components/admin/attendance/odontogram/odontogramGeometry.test.ts
git commit -m "feat: add surface geometry for anatomical teeth"
```

### Task 2: Render face status directly on each tooth

**Files:**
- Modify: `src/components/admin/attendance/odontogram/AnatomicalTooth.tsx`
- Test: `src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- `AnatomicalTooth` continues to receive `data: ToothData`; no caller API changes.
- It renders `data-anatomy-layer="face-overlays"` containing one group per recorded face with `data-face-status` and `data-face-key`.

- [ ] **Step 1: Write the failing test**

Add a test rendering a molar with `faces: { center: { status: "Tratar" }, right: { status: "Tratado" } }` and assert both overlays are inside the SVG, use the correct face keys/statuses, and do not render for healthy faces.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx`
Expected: FAIL because there is no `face-overlays` layer.

- [ ] **Step 3: Write minimal implementation**

Add stable SVG pattern IDs for caries hatching and treatment texture. Render the five geometry paths only when their stored face status is not `Saudável`:

```tsx
<g data-anatomy-layer="face-overlays">
  {FACE_KEYS.map((face) => {
    const status = data.faces?.[face]?.status ?? "Saudável";
    if (status === "Saudável") return null;
    return (
      <path
        key={face}
        d={anatomy.surfaces[face]}
        data-face-key={face}
        data-face-status={status}
        fill={status === "Tratar" ? `url(#${treatPatternId})` : "#22d3ee"}
        opacity={status === "Tratar" ? 0.82 : 0.58}
        stroke={status === "Tratar" ? "#b42318" : "#0e7490"}
        strokeWidth="0.7"
      />
    );
  })}
</g>
```

Place this layer after the enamel highlight and before the whole-tooth overlay, and make the whole-tooth overlay use lower opacity when face overlays exist so a face diagnosis remains legible. Add CSS for `.anatomical-tooth [data-face-status]` transition and a restrained selected outline; remove no existing accessibility attributes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/attendance/odontogram/AnatomicalTooth.tsx src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx src/index.css
git commit -m "feat: paint affected tooth surfaces in overview"
```

### Task 3: Make the overview communicate status without the blue adendo

**Files:**
- Modify: `src/components/admin/attendance/Odontogram.tsx`
- Modify: `src/components/admin/attendance/Odontogram.test.tsx`
- Modify: `src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx`

**Interfaces:**
- Keep `isRecorded` and the clinical summary unchanged.
- `Odontogram` shows a compact status key that explains `Tratar` and `Tratado` colors and no longer uses the blue dot as the primary status representation.

- [ ] **Step 1: Write the failing test**

Update the overview test to render a tooth with an affected face and assert the SVG contains the face status, while the old generic blue dot selector is absent. Keep the existing test that confirms read-only mode and summary output.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/admin/attendance/Odontogram.test.tsx`
Expected: FAIL because the overview still renders the generic dot.

- [ ] **Step 3: Write minimal implementation**

Remove the absolute blue dot from `TeethRow`. Keep the tooth number and `aria-label`, and add a subtle `data-recorded` state/class on the tooth tile only for keyboard/focus styling. Expand the legend to show:

- coral hatch = área a tratar;
- cyan = área tratada;
- violet/amber = implante/ponte;
- red cross = dente ausente.

Ensure legend colors match `AnatomicalTooth` exactly and remain usable in printable/read-only mode.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/admin/attendance/Odontogram.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/attendance/Odontogram.tsx src/components/admin/attendance/Odontogram.test.tsx src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx
git commit -m "feat: clarify odontogram status legend"
```

### Task 4: Validate print and responsive presentation

**Files:**
- Modify: `src/index.css` only if print sizing or contrast needs correction
- Test: existing odontogram and prescription tests

**Interfaces:**
- No data or API changes.
- The same SVG layers must render in editor, read-only evolution history, prescription preview, and print output.

- [ ] **Step 1: Run focused tests**

Run: `npx vitest run src/components/admin/attendance/odontogram src/components/admin/attendance/Odontogram.test.tsx src/components/PrescriptionGenerator.test.ts`
Expected: all focused tests pass.

- [ ] **Step 2: Run print contract**

Run: `& .\\scripts\\verify-document-print.ps1`
Expected: `[OK] Document print source contracts passed.`

- [ ] **Step 3: Run full verification**

Run: `npm test -- --run`; `npm run lint`; `npm run build`
Expected: tests, lint, and build all exit with code 0.

- [ ] **Step 4: Review diff and commit**

```bash
git diff --check
git status --short
git add src
git commit -m "feat: upgrade odontogram visual and clinical overlays"
```

- [ ] **Step 5: Push only after verification**

```bash
git push origin main
```

Expected: `main -> main` with no force push.

