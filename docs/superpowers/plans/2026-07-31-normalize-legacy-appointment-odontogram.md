# Normalize Legacy Appointment Odontogram Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert legacy appointment odontograms to V2 on load so the attendance modal always exposes clinical V2 editing.

**Architecture:** The attendance response normalizer is the boundary between API JSON and UI state. It will call the existing pure `normalizeOdontogram` helper for `dentalNotes`; no server or database migration is added. The existing `Odontogram` V2 branch then renders the clinical editor and preserves legacy marks as generated clinical conditions.

**Tech Stack:** React, TypeScript, Vitest, existing odontogram model helpers.

## Global Constraints

- Preserve legacy visual markings as equivalent V2 conditions.
- Do not write patient data during load or add database migrations.
- Keep server-side validation and authorization unchanged.
- Add a regression test before changing production code.

---

### Task 1: Normalize the appointment odontogram at the UI boundary

**Files:**

- Modify: `src/pages/AdminAttendanceDetail.tsx`
- Modify: `src/pages/AdminAttendanceDetail.test.tsx`

**Interfaces:**

- Consumes: `normalizeOdontogram(data)` from `src/components/admin/attendance/odontogram/odontogramModel.ts`.
- Produces: `normalizeAppointmentResponse(fetched)` with V2 `dentalNotes` for both legacy and V2 API responses.

- [x] **Step 1: Write the failing test**

```ts
it("normalizes legacy dental notes to V2 clinical data", () => {
  const result = normalizeAppointmentResponse({
    dentalNotes: { "24": { status: "Saudável", notes: "", faces: { top: { status: "Tratado" } } } },
  });

  expect(result.dentalNotes).toMatchObject({ version: 2, dentition: "permanent" });
  expect(result.dentalNotes.teeth["24"].conditions[0]).toMatchObject({ type: "legado_tratado" });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/pages/AdminAttendanceDetail.test.tsx`

Expected: FAIL because `dentalNotes` remains the legacy object without `version: 2`.

- [x] **Step 3: Write the minimal implementation**

```ts
import { normalizeOdontogram, type OdontogramData } from "@/components/admin/attendance/odontogram/odontogramModel";

dentalNotes: normalizeOdontogram(
  fetched.dentalNotes && typeof fetched.dentalNotes === "object"
    ? fetched.dentalNotes as OdontogramData
    : {},
),
```

- [x] **Step 4: Run the regression test to verify it passes**

Run: `npm test -- --run src/pages/AdminAttendanceDetail.test.tsx`

Expected: PASS.

- [x] **Step 5: Run focused odontogram tests and the production build**

Run: `npm test -- --run src/pages/AdminAttendanceDetail.test.tsx src/components/admin/attendance/Odontogram.test.tsx && npm run build`

Expected: all tests pass and Vite completes the production build.

- [ ] **Step 6: Commit and publish**

Run: `git add src/pages/AdminAttendanceDetail.tsx src/pages/AdminAttendanceDetail.test.tsx docs/superpowers/specs/2026-07-31-normalize-legacy-appointment-odontogram-design.md docs/superpowers/plans/2026-07-31-normalize-legacy-appointment-odontogram.md; git commit -m "fix: open legacy appointment odontograms in V2"; git push origin main`
