# Odontogram Modal State Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every structured clinical stage shown in the odontogram legend directly selectable in the tooth modal.

**Architecture:** Keep the legacy face and whole-tooth controls unchanged for legacy records. Make the V2/V3 occurrence editor render a responsive stage palette from the existing shared state definitions, while retaining its native select for backwards-compatible form behavior and persistence.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, existing odontogram design system.

## Global Constraints

- Do not alter odontogram SVG path data, geometry, proportions, viewBox, or anatomy.
- Reuse `ODONTOGRAM_STATE_DEFINITIONS` through existing helpers; do not add a second clinical-state list.
- Preserve legacy and V2/V3 persisted odontogram data.
- Do not introduce patient data into tests or source control.

---

### Task 1: Expose legend stages as modal controls

**Files:**
- Modify: `src/components/admin/attendance/odontogram/ClinicalConditionEditor.tsx`
- Test: `src/components/admin/attendance/odontogram/ClinicalConditionEditor.test.tsx`

**Interfaces:**
- Consumes: `getClinicalStageOptions(): ReadonlyArray<{ value: ClinicalStage; label: string }>`.
- Produces: accessible buttons that update the existing `stage: ClinicalStage` form state.

- [ ] **Step 1: Write the failing test**

```tsx
expect(screen.getByRole("button", { name: "Selecionar situação Em andamento" })).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: "Selecionar situação Em andamento" }));
expect(screen.getByLabelText("Situação")).toHaveValue("emAndamento");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/admin/attendance/odontogram/ClinicalConditionEditor.test.tsx`

Expected: FAIL because the stage-palette button does not exist.

- [ ] **Step 3: Write minimal implementation**

```tsx
<fieldset aria-label="Situações clínicas">
  {CLINICAL_STAGE_OPTIONS.map((item) => (
    <button
      aria-label={`Selecionar situação ${item.label}`}
      aria-pressed={stage === item.value}
      onClick={() => setStage(item.value)}
      type="button"
    >
      {item.label}
    </button>
  ))}
</fieldset>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/admin/attendance/odontogram/ClinicalConditionEditor.test.tsx`

Expected: PASS.

### Task 2: Verify shared source and regression coverage

**Files:**
- Modify: `src/components/admin/attendance/Odontogram.tsx` only if label handling requires the existing shared option object.
- Test: `src/components/admin/attendance/Odontogram.test.tsx`

**Interfaces:**
- Consumes: the existing `ClinicalConditionEditor` in the V2/V3 tooth dialog.
- Produces: a modal where a legend stage is selectable and persists through the existing `onSave` pathway.

- [ ] **Step 1: Write a failing modal regression test**

```tsx
await user.click(screen.getByRole("button", { name: "Selecionar situação Monitorado" }));
expect(screen.getByLabelText("Situação")).toHaveValue("monitorado");
```

- [ ] **Step 2: Run focused tests and build**

Run: `npx vitest run src/components/admin/attendance/Odontogram.test.tsx src/components/admin/attendance/odontogram/ClinicalConditionEditor.test.tsx`

Run: `npm run build`

Expected: all tests and production build pass.
