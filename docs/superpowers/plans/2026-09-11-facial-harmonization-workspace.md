# Facial Harmonization Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Deliver a responsive 2D SVG facial harmonization workspace with structured, backward-compatible application persistence.

**Architecture:** Keep `Appointment.facialNotes` as JSON and introduce a versioned document plus a normalizer/projection for the existing `FaceMap` history. Build the editable workspace from focused React components under `src/components/admin/attendance/facial/`; `AdminAttendanceDetail` remains the save-flow owner.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, shadcn/Radix primitives, Vitest, Testing Library, existing SVG viewBox `0 0 320 420`.

## Global Constraints

- Preserve legacy facial data and existing `FaceMap` history behavior.
- Persist structured clinical fields and normalized SVG coordinates, never the SVG or screen pixels.
- No new dependency, endpoint, database table, or 3D rendering.
- Portuguese user-facing text; accessible focus/labels and 44px touch targets.
- Only the inspector may scroll inside the workspace.

---

### Task 1: Facial document model and compatibility helpers

**Files:**
- Create: `src/components/admin/attendance/facial/facialModel.ts`
- Create: `src/components/admin/attendance/facial/facialModel.test.ts`

**Interfaces:**
- `FacialSide`, `FacialProcedureType`, `FacialRegion`, `FacialApplication`, `FacialNotesDocument`
- `FACIAL_REGIONS`, `PROCEDURE_OPTIONS`
- `normalizeFacialNotes(value: unknown): FacialNotesDocument`
- `toLegacyFaceMapData(value: unknown): Record<string, FaceRegionData>`
- `summarizeFacialNotes(value: unknown): { treatedRegions: number; applications: number; totalUnits: number; totalMl: number }`

- [ ] Write failing tests for stable bilateral IDs, legacy normalization, new application preservation, and summary totals.
- [ ] Run `npx vitest run src/components/admin/attendance/facial/facialModel.test.ts`; confirm failure because the module is absent.
- [ ] Implement the minimal typed model, region definitions, input sanitization, legacy projection, and numeric summaries.
- [ ] Run the focused test and confirm green.
- [ ] Commit `feat: add facial harmonization document model`.

### Task 2: SVG map, toolbar, markers, and search

**Files:**
- Create: `src/components/admin/attendance/facial/FacialSvgMap.tsx`
- Create: `src/components/admin/attendance/facial/ApplicationMarker.tsx`
- Create: `src/components/admin/attendance/facial/FacialMapToolbar.tsx`
- Create: `src/components/admin/attendance/facial/RegionSearch.tsx`
- Create: `src/components/admin/attendance/facial/FacialSvgMap.test.tsx`
- Create: `src/components/admin/attendance/facial/facial-workspace.css`

**Interfaces:**
- `FacialSvgMap({ selectedRegionId, treatedRegionIds, applications, markingMode, onRegionSelect, onApplicationSelect, onMapMark })`
- `FacialMapToolbar({ markingMode, onMarkingModeChange, search, onSearchChange })`
- `RegionSearch({ value, onChange, onSelect })`

- [ ] Write failing tests for separate region IDs, keyboard selection, treated indicator, no accidental application on ordinary click, and normalized mark callback.
- [ ] Run the focused test and verify expected failures.
- [ ] Implement the SVG using the existing viewBox and face geometry, split bilateral hit areas, accessible region buttons, CTM-based coordinate conversion, marker rendering, search results, and responsive styling.
- [ ] Run the focused test and confirm green.
- [ ] Commit `feat: add interactive facial svg map`.

### Task 3: Procedure selector and contextual inspector

**Files:**
- Create: `src/components/admin/attendance/facial/ProcedureSelector.tsx`
- Create: `src/components/admin/attendance/facial/ApplicationEditor.tsx`
- Create: `src/components/admin/attendance/facial/ApplicationList.tsx`
- Create: `src/components/admin/attendance/facial/RegionInspector.tsx`
- Create: `src/components/admin/attendance/facial/FacialInspector.test.tsx`

**Interfaces:**
- `ProcedureSelector({ value, onChange })`
- `ApplicationEditor({ application, procedureType, onSave, onCancel })`
- `ApplicationList({ applications, onEdit, onDuplicate, onDelete })`
- `RegionInspector({ region, applications, procedureType, onProcedureChange, onRegister, onEdit, onDuplicate, onDelete })`

- [ ] Write failing tests for empty inspector copy, Portuguese region/laterality heading, required registration fields, and edit/duplicate/delete actions.
- [ ] Run focused tests and confirm red.
- [ ] Implement labeled controls for product, amount, unit, technique, plane, device, notes; keep procedure tokens distinct from neutral anatomical selection.
- [ ] Run focused tests and confirm green.
- [ ] Commit `feat: add facial region inspector`.

### Task 4: Workspace orchestration and session summary

**Files:**
- Create: `src/components/admin/attendance/facial/WorkspaceHeader.tsx`
- Create: `src/components/admin/attendance/facial/SessionSummaryBar.tsx`
- Create: `src/components/admin/attendance/facial/FacialHarmonizationWorkspace.tsx`
- Create: `src/components/admin/attendance/facial/FacialHarmonizationWorkspace.test.tsx`

**Interfaces:**
- `FacialHarmonizationWorkspace({ value, onChange, onSave, readOnly })`
- `SessionSummaryBar({ summary, onViewSummary, onSave })`

- [ ] Write failing integration tests covering select right nasolabial, enter `0,2 ml`, activate “Marcar aplicação”, click map, render marker, update summary, edit marker, and persistence callback.
- [ ] Run the focused test and confirm red.
- [ ] Implement state orchestration, immutable application CRUD, region search selection, workspace header, desktop grid/mobile bottom inspector, and summary actions wired to the existing save callback.
- [ ] Run focused tests and confirm green.
- [ ] Commit `feat: compose facial harmonization workspace`.

### Task 5: Integrate appointment persistence and historical projection

**Files:**
- Modify: `src/pages/AdminAttendanceDetail.tsx`
- Modify: `src/components/admin/attendance/EvolutionTimeline.tsx`
- Modify: `src/pages/AdminAttendanceDetail.test.tsx`
- Modify: `src/components/admin/attendance/EvolutionTimeline.test.ts`

- [ ] Write failing integration assertions for normalizing fetched legacy/new `facialNotes`, rendering the workspace, and projecting saved applications into the read-only history map.
- [ ] Run focused tests and confirm red.
- [ ] Replace edit-mode `FaceMap` with `FacialHarmonizationWorkspace`, normalize fetched/default data, and keep the existing POST/PUT save path unchanged.
- [ ] Pass `toLegacyFaceMapData` to historical `FaceMap` so old and new appointments remain visible.
- [ ] Run all facial, attendance, and timeline tests; then `npm run build`.
- [ ] Inspect `git diff --check`, verify no secrets or unrelated files changed, and commit `feat: integrate facial workspace into attendance`.

