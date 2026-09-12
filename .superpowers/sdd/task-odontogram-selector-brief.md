### Task 1: Precise additive anatomical selection

**Files:**
- Modify: `src/components/admin/attendance/odontogram/ToothSurfaceSelector.tsx`
- Modify: `src/components/admin/attendance/odontogram/ClinicalConditionEditor.tsx`
- Modify: `src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx`
- Modify: `src/components/admin/attendance/odontogram/ClinicalConditionEditor.test.tsx`

**Interfaces:**
- Keep `ToothSurfaceSelectorProps` and `ConditionTarget` unchanged.
- In layered mode, clicking an anatomical face toggles its default target; selecting a specific region toggles `{ kind: "surface", face, region }`.
- Selecting a subregion removes the same-face `entire` target; selecting `entire` removes same-face subregions.

- [ ] **Step 1: Add failing tests**

Cover: center control exposes an unambiguous `incisal ou oclusal` label; selecting center plus vestibular keeps both targets; selecting a subregion replaces an overlapping entire target; editor saves multiple targets including `incisalOcclusal`.

- [ ] **Step 2: Run focused tests and confirm RED**

`npx vitest run src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx src/components/admin/attendance/odontogram/ClinicalConditionEditor.test.tsx`

- [ ] **Step 3: Implement minimal selector behavior**

Use one semantic face-control set, expose region buttons with explicit accessible names, normalize overlapping targets, and preserve legacy `onSelectFace` behavior when no layered target callbacks are supplied.

- [ ] **Step 4: Run focused tests and confirm GREEN**

The two files above must pass, including existing keyboard/read-only and anatomical-path tests.

- [ ] **Step 5: Commit**

`git add src/components/admin/attendance/odontogram/ToothSurfaceSelector.tsx src/components/admin/attendance/odontogram/ClinicalConditionEditor.tsx src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx src/components/admin/attendance/odontogram/ClinicalConditionEditor.test.tsx && git commit -m "fix: support precise multi-region odontogram selection"`

