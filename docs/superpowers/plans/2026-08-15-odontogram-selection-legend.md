# Odontogram Selection and Legend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Make layered odontogram selections precise and additive, especially for occlusal/incisal areas, and replace duplicated legend copy with a clear explanation of statuses and regions.

**Architecture:** Preserve the existing `ConditionTarget` model and API payloads. Make `ToothSurfaceSelector` the single interaction surface: legacy mode keeps one selected face, while layered mode toggles normalized face/region targets and exposes explicit region controls. Keep legend copy in `Odontogram` as one deduplicated status list plus a region/multiselection guide.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, Tailwind classes.

## Global Constraints

- Do not change backend payloads or patient data contracts.
- Preserve read-only and legacy odontogram behavior.
- Layered targets remain `{ kind: "surface", face, region }` or `{ kind: "tooth" }`.
- Multiple targets for one clinical condition are allowed, but overlapping whole-face and subregion targets for the same face must be normalized.
- No clinical or patient data may be logged.

---

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

### Task 2: Deduplicated explanatory legend and clinical summaries

**Files:**
- Modify: `src/components/admin/attendance/Odontogram.tsx`
- Modify: `src/components/admin/attendance/odontogram/ClinicalConditionList.tsx`
- Modify: `src/components/admin/attendance/Odontogram.test.tsx`
- Modify: `src/components/admin/attendance/odontogram/ClinicalConditionList.test.tsx`

**Interfaces:**
- Keep persisted condition shape unchanged.
- Legend status labels appear once each and explain visual state; a separate region guide explains face inteira, cervical, média and incisal/oclusal plus multi-selection.
- Clinical target summaries use concise, non-duplicated labels and remain unique in remove-button accessible names.

- [ ] **Step 1: Add failing tests**

Assert each status label is rendered once, `Área a tratar` and `Área tratada` are not repeated under alternate names, the legend explains multiple regions, and condition summaries use the new concise target copy.

- [ ] **Step 2: Run focused tests and confirm RED**

`npx vitest run src/components/admin/attendance/Odontogram.test.tsx src/components/admin/attendance/odontogram/ClinicalConditionList.test.tsx`

- [ ] **Step 3: Implement the legend and summary copy**

Render deduplicated status entries and an explicit region/multiselection guide. Update `getConditionTargetLabel` only if needed to remove semantic duplication without changing stored values.

- [ ] **Step 4: Run focused tests and confirm GREEN**

The two files above must pass, including read-only summary and unique removal behavior.

- [ ] **Step 5: Commit**

`git add src/components/admin/attendance/Odontogram.tsx src/components/admin/attendance/odontogram/ClinicalConditionList.tsx src/components/admin/attendance/Odontogram.test.tsx src/components/admin/attendance/odontogram/ClinicalConditionList.test.tsx && git commit -m "fix: clarify odontogram legend and target summaries"`

### Task 3: Integrated verification and review

**Files:**
- No production files unless a review finding requires a targeted fix.

- [ ] Run all odontogram tests, backend contracts, `npm run lint`, `npm run build`, `git diff --check`, and the security scan.
- [ ] Confirm no browser location APIs or patient data logging were introduced.
- [ ] Request a read-only whole-change review and resolve Critical/Important findings before handoff.
