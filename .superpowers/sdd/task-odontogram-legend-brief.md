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

