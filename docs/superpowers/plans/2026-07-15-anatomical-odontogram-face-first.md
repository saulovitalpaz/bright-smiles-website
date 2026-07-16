# Anatomical Face-First Odontogram Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Replace the hand-drawn odontogram with recognizable anatomical tooth vectors and a mobile-first face-first clinical editing flow while preserving existing JSON data.

**Architecture:** Keep Odontogram.tsx as the public coordinator and move geometry, immutable model updates, anatomical rendering, and surface selection into focused modules under src/components/admin/attendance/odontogram. Vendor only the required MIT-licensed SVG geometry from ZoliQua/React-Odontogram-Modul, adapt it to the existing five-position model, and add behavior-first Vitest coverage.

**Tech Stack:** React 18, TypeScript 5, Vite 5, Tailwind CSS 3, Radix Dialog, Vitest, Testing Library, local SVG geometry.

## Global Constraints

- Preserve Record<string, ToothData> and face keys top, bottom, left, right, center.
- No WebGL, Three.js, or runtime dependency on the external project.
- Use the approved MIT source only for required geometry and retain its copyright notice.
- No horizontal page scrolling.
- Mobile tooth and face hit areas are at least 44 by 44 CSS pixels.
- Interaction order is tooth, face, condition.
- Face conditions: Saudável, Tratar, Tratado.
- Whole-tooth conditions: Saudável, Ausente, Implante, Ponte.
- Editing a face preserves all other faces, notes, and whole-tooth status.
- Preserve edit, read-only, history, prescription, and print consumers.
- Respect reduced motion and keyboard interaction.
- Never stage docs/superpowers/plans/2026-07-14-calendar-and-task-6-8.md.

## File Map

- Modify package.json and package-lock.json for frontend tests.
- Create vitest.config.ts and src/test/setup.ts.
- Create odontogram/odontogramModel.ts and its test.
- Create odontogram/odontogramGeometry.ts.
- Create odontogram/AnatomicalTooth.tsx and its test.
- Create odontogram/ToothSurfaceSelector.tsx and its test.
- Create src/assets/odontogram/THIRD_PARTY_NOTICES.md.
- Refactor Odontogram.tsx and create Odontogram.test.tsx.
- Modify src/index.css and scripts/verify-admin-responsive.ps1.

---

### Task 1: Commit the completed mobile containment baseline

**Files:**
- Modify: scripts/verify-admin-responsive.ps1
- Modify: src/components/admin/attendance/Odontogram.tsx
- Modify: src/index.css
- Modify: src/pages/AdminLeads.tsx
- Modify: src/pages/AdminStories.tsx
- Modify: src/pages/AdminTreatments.tsx
- Modify: src/pages/AdminUsers.tsx

**Interfaces:**
- Consumes: existing admin layout and data-admin-card contract.
- Produces: contained cards and the container-aware odontogram grid.

- [ ] **Step 1: Verify the existing baseline**

Run:

~~~powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-admin-responsive.ps1
npm run build
npx eslint src/components/admin/attendance/Odontogram.tsx src/pages/AdminLeads.tsx
git diff --check
~~~

Expected: contracts, build, and focused lint pass; no whitespace errors.

- [ ] **Step 2: Commit only the responsive baseline**

Run:

~~~powershell
git add scripts/verify-admin-responsive.ps1 src/components/admin/attendance/Odontogram.tsx src/index.css src/pages/AdminLeads.tsx src/pages/AdminStories.tsx src/pages/AdminTreatments.tsx src/pages/AdminUsers.tsx
git commit -m "fix: contain admin cards and odontogram on mobile"
~~~

Expected: the unrelated untracked plan is excluded.

---

### Task 2: Add test infrastructure and the immutable model

**Files:**
- Modify: package.json
- Modify: package-lock.json
- Create: vitest.config.ts
- Create: src/test/setup.ts
- Create: src/components/admin/attendance/odontogram/odontogramModel.ts
- Test: src/components/admin/attendance/odontogram/odontogramModel.test.ts

**Interfaces:**
- Produces: FaceKey, ToothFamily, ToothStatus, ToothData, getFaceLabels, getToothFamily, getTooth, updateToothFace, updateWholeTooth.

- [ ] **Step 1: Install and configure the test runner**

Run:

~~~powershell
npm install --save-dev vitest@^3.2.4 jsdom@^26.1.0 @testing-library/react@^16.3.0 @testing-library/user-event@^14.6.1 @testing-library/jest-dom@^6.6.3
~~~

Add scripts:

~~~json
"test": "vitest run",
"test:watch": "vitest"
~~~

Create vitest.config.ts:

~~~ts
import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
~~~

Create src/test/setup.ts:

~~~ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());
~~~

- [ ] **Step 2: Write the failing model tests**

~~~ts
import { describe, expect, it } from "vitest";
import {
  getFaceLabels,
  getToothFamily,
  updateToothFace,
  updateWholeTooth,
  type ToothData,
} from "./odontogramModel";

describe("odontogramModel", () => {
  it("maps FDI numbers to anatomical families", () => {
    expect(getToothFamily(11)).toBe("incisor");
    expect(getToothFamily(13)).toBe("canine");
    expect(getToothFamily(15)).toBe("premolar");
    expect(getToothFamily(18)).toBe("molar");
  });

  it("maps positional faces to clinical labels", () => {
    expect(getFaceLabels(11).right).toBe("Mesial");
    expect(getFaceLabels(31).bottom).toBe("Vestibular");
  });

  it("updates one face without erasing other clinical data", () => {
    const input: Record<string, ToothData> = {
      "16": {
        status: "Saudável",
        notes: "sensibilidade",
        faces: { left: { status: "Tratado" } },
      },
    };
    const result = updateToothFace(input, 16, "center", "Tratar");
    expect(result["16"].faces).toEqual({
      left: { status: "Tratado" },
      center: { status: "Tratar" },
    });
    expect(result["16"].notes).toBe("sensibilidade");
    expect(input["16"].faces?.center).toBeUndefined();
  });

  it("updates the whole tooth without erasing faces", () => {
    const input: Record<string, ToothData> = {
      "21": {
        status: "Saudável",
        notes: "controle",
        faces: { top: { status: "Tratar" } },
      },
    };
    expect(updateWholeTooth(input, 21, "Implante")["21"]).toEqual({
      status: "Implante",
      notes: "controle",
      faces: { top: { status: "Tratar" } },
    });
  });
});
~~~

- [ ] **Step 3: Run RED**

Run:

~~~powershell
npx vitest run src/components/admin/attendance/odontogram/odontogramModel.test.ts
~~~

Expected: FAIL because odontogramModel.ts does not exist.

- [ ] **Step 4: Implement the model**

~~~ts
export const FACE_KEYS = ["top", "right", "bottom", "left", "center"] as const;
export type FaceKey = (typeof FACE_KEYS)[number];
export type ToothFamily = "incisor" | "canine" | "premolar" | "molar";
export type ToothStatus = "Saudável" | "Tratar" | "Tratado" | "Ausente" | "Implante" | "Ponte";

export interface ToothFaceData { status: string; }
export interface ToothData {
  status: string;
  notes: string;
  faces?: Partial<Record<FaceKey, ToothFaceData>>;
}

export const EMPTY_TOOTH: ToothData = { status: "Saudável", notes: "" };

export function getToothFamily(toothNumber: number): ToothFamily {
  const position = toothNumber % 10;
  if (position >= 6) return "molar";
  if (position >= 4) return "premolar";
  if (position === 3) return "canine";
  return "incisor";
}

export function getFaceLabels(toothNumber: number): Record<FaceKey, string> {
  const upper = toothNumber >= 11 && toothNumber <= 28;
  const rightQuadrant =
    (toothNumber >= 11 && toothNumber <= 18) ||
    (toothNumber >= 41 && toothNumber <= 48);
  return {
    top: upper ? "Vestibular" : "Lingual",
    bottom: upper ? "Palatina" : "Vestibular",
    left: rightQuadrant ? "Distal" : "Mesial",
    right: rightQuadrant ? "Mesial" : "Distal",
    center: "Oclusal / Incisal",
  };
}

export function getTooth(data: Record<string, ToothData>, toothNumber: number): ToothData {
  return data[String(toothNumber)] ?? EMPTY_TOOTH;
}

export function updateToothFace(
  data: Record<string, ToothData>,
  toothNumber: number,
  face: FaceKey,
  status: ToothStatus,
): Record<string, ToothData> {
  const current = getTooth(data, toothNumber);
  return {
    ...data,
    [toothNumber]: {
      ...current,
      faces: { ...current.faces, [face]: { status } },
    },
  };
}

export function updateWholeTooth(
  data: Record<string, ToothData>,
  toothNumber: number,
  status: ToothStatus,
): Record<string, ToothData> {
  return {
    ...data,
    [toothNumber]: { ...getTooth(data, toothNumber), status },
  };
}
~~~

- [ ] **Step 5: Run GREEN and commit**

Run:

~~~powershell
npx vitest run src/components/admin/attendance/odontogram/odontogramModel.test.ts
git add package.json package-lock.json vitest.config.ts src/test/setup.ts src/components/admin/attendance/odontogram
git commit -m "test: add odontogram model coverage"
~~~

Expected: four passing tests and one focused commit.

---

### Task 3: Vendor licensed anatomy and render tooth families

**Files:**
- Create: src/assets/odontogram/THIRD_PARTY_NOTICES.md
- Create: src/components/admin/attendance/odontogram/odontogramGeometry.ts
- Create: src/components/admin/attendance/odontogram/AnatomicalTooth.tsx
- Test: src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx
- Modify: src/index.css

**Interfaces:**
- Consumes: ToothData, ToothFamily, getToothFamily.
- Produces: ANATOMICAL_GEOMETRY and AnatomicalTooth.

- [ ] **Step 1: Add exact MIT provenance**

Record:

- Project: React Odontogram Modul
- Source: https://github.com/ZoliQua/React-Odontogram-Modul
- Copyright: Copyright (c) 2026 Zoltán Dul
- License: MIT
- Templates: 11.svg, 13.svg, 14.svg, 14_occl.svg, 16.svg, 16_occl.svg

Copy the full 21-line MIT license from the approved source into THIRD_PARTY_NOTICES.md.

- [ ] **Step 2: Write the failing anatomy tests**

~~~tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnatomicalTooth } from "./AnatomicalTooth";

describe("AnatomicalTooth", () => {
  it.each([
    [11, "incisor"],
    [13, "canine"],
    [15, "premolar"],
    [18, "molar"],
  ] as const)("renders tooth %s with %s anatomy", (number, family) => {
    render(
      <AnatomicalTooth
        toothNumber={number}
        data={{ status: "Saudável", notes: "" }}
      />,
    );
    const tooth = screen.getByRole("img", {
      name: new RegExp("dente " + number, "i"),
    });
    expect(tooth).toHaveAttribute("data-tooth-family", family);
    expect(tooth.querySelectorAll("[data-anatomy-layer]").length).toBeGreaterThanOrEqual(3);
  });

  it("uses a visible marker for a missing tooth", () => {
    render(
      <AnatomicalTooth
        toothNumber={16}
        data={{ status: "Ausente", notes: "" }}
      />,
    );
    expect(screen.getByTestId("missing-tooth-mark")).toBeInTheDocument();
  });
});
~~~

- [ ] **Step 3: Run RED**

~~~powershell
npx vitest run src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx
~~~

Expected: FAIL because AnatomicalTooth does not exist.

- [ ] **Step 4: Normalize the public geometry**

Read the six approved source templates. Copy only crown, roots, cervical contour, enamel highlight, occlusal outline, and groove paths. Remove metadata, embedded CSS, scripts, dimensions, and unused layers.

odontogramGeometry.ts must expose:

~~~ts
export interface FrontalGeometry {
  viewBox: string;
  crown: string;
  roots: readonly string[];
  cervical: string;
  highlight: string;
}

export interface OcclusalGeometry {
  viewBox: string;
  outline: string;
  faces: Record<FaceKey, string>;
  grooves: readonly string[];
}

export interface ToothGeometry {
  frontal: FrontalGeometry;
  occlusal: OcclusalGeometry;
}

export const ANATOMICAL_GEOMETRY: Record<ToothFamily, ToothGeometry>;
~~~

All geometry is stored locally as literal SVG path data. No runtime fetch is permitted. Use 11.svg for incisors, 13.svg for canines, 14.svg plus 14_occl.svg for premolars, and 16.svg plus 16_occl.svg for molars.

- [ ] **Step 5: Implement AnatomicalTooth**

API:

~~~tsx
interface AnatomicalToothProps {
  toothNumber: number;
  data: ToothData;
  size?: "arch" | "editor";
  selected?: boolean;
}

export function AnatomicalTooth(props: AnatomicalToothProps): JSX.Element;
~~~

Render in order: root shadow, dentin roots, cervical transition, enamel crown, clipped enamel highlight, whole-tooth overlay, missing-tooth cross. Prefix gradient and mask IDs with the tooth number.

- [ ] **Step 6: Run GREEN and commit**

~~~powershell
npx vitest run src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx
npx eslint src/components/admin/attendance/odontogram/AnatomicalTooth.tsx src/components/admin/attendance/odontogram/odontogramGeometry.ts
git add src/assets/odontogram/THIRD_PARTY_NOTICES.md src/components/admin/attendance/odontogram src/index.css
git commit -m "feat: add licensed anatomical tooth vectors"
~~~

Expected: anatomy tests and focused lint pass.

---

### Task 4: Build direct face selection

**Files:**
- Create: src/components/admin/attendance/odontogram/ToothSurfaceSelector.tsx
- Test: src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx
- Modify: src/index.css

**Interfaces:**
- Consumes: FaceKey, ToothData, getFaceLabels, ANATOMICAL_GEOMETRY.
- Produces: ToothSurfaceSelector.

- [ ] **Step 1: Write failing selector tests**

~~~tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToothSurfaceSelector } from "./ToothSurfaceSelector";

describe("ToothSurfaceSelector", () => {
  it("selects a face without writing a condition", async () => {
    const user = userEvent.setup();
    const onSelectFace = vi.fn();
    render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
        selectedFace={null}
        onSelectFace={onSelectFace}
      />,
    );
    await user.click(screen.getByRole("button", { name: /oclusal.*saudável/i }));
    expect(onSelectFace).toHaveBeenCalledWith("center");
  });

  it("announces the selected face", () => {
    render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
        selectedFace="left"
        onSelectFace={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: /distal/i }))
      .toHaveAttribute("aria-pressed", "true");
  });

  it("does not select in read-only mode", async () => {
    const user = userEvent.setup();
    const onSelectFace = vi.fn();
    render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
        selectedFace={null}
        onSelectFace={onSelectFace}
        readOnly
      />,
    );
    await user.click(screen.getByRole("button", { name: /oclusal/i }));
    expect(onSelectFace).not.toHaveBeenCalled();
  });
});
~~~

- [ ] **Step 2: Run RED**

~~~powershell
npx vitest run src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx
~~~

Expected: FAIL because the selector does not exist.

- [ ] **Step 3: Implement semantic face controls**

API:

~~~tsx
interface ToothSurfaceSelectorProps {
  toothNumber: number;
  data: ToothData;
  selectedFace: FaceKey | null;
  onSelectFace: (face: FaceKey) => void;
  readOnly?: boolean;
}

export function ToothSurfaceSelector(
  props: ToothSurfaceSelectorProps,
): JSX.Element;
~~~

Render one anatomical base SVG and five aligned semantic buttons. Each button includes its face path, aria-pressed, clinical label, current status, visible focus, touch-action manipulation, and a 44 px minimum hit area. Grooves are pointer-events none. Selected gets a solid ring, Tratar gets hatch, Tratado gets a double inset stroke.

- [ ] **Step 4: Run GREEN and commit**

~~~powershell
npx vitest run src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx
npx eslint src/components/admin/attendance/odontogram/ToothSurfaceSelector.tsx
git add src/components/admin/attendance/odontogram/ToothSurfaceSelector.tsx src/components/admin/attendance/odontogram/ToothSurfaceSelector.test.tsx src/index.css
git commit -m "feat: select odontogram surfaces directly"
~~~

Expected: all selector tests pass.

---

### Task 5: Integrate the face-first editor

**Files:**
- Modify: src/components/admin/attendance/Odontogram.tsx
- Test: src/components/admin/attendance/Odontogram.test.tsx
- Modify: src/index.css
- Modify: scripts/verify-admin-responsive.ps1

**Interfaces:**
- Consumes: AnatomicalTooth, ToothSurfaceSelector, model update functions.
- Produces: unchanged default Odontogram component and re-exported ToothData type.

- [ ] **Step 1: Write failing workflow tests**

~~~tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Odontogram from "./Odontogram";

describe("Odontogram face-first workflow", () => {
  it("opens a tooth without writing data", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Odontogram data={{}} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /dente 16/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reveals face conditions only after face selection", async () => {
    const user = userEvent.setup();
    render(<Odontogram data={{}} onChange={() => undefined} />);
    await user.click(screen.getByRole("button", { name: /dente 16/i }));
    expect(screen.queryByRole("button", { name: "A tratar" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /oclusal.*saudável/i }));
    expect(screen.getByRole("button", { name: "A tratar" })).toBeInTheDocument();
  });

  it("applies a condition only after selecting a face", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Odontogram data={{}} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /dente 16/i }));
    await user.click(screen.getByRole("button", { name: /oclusal.*saudável/i }));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "A tratar" }));
    expect(onChange).toHaveBeenCalledWith({
      "16": {
        status: "Saudável",
        notes: "",
        faces: { center: { status: "Tratar" } },
      },
    });
  });
});
~~~

- [ ] **Step 2: Run RED**

~~~powershell
npx vitest run src/components/admin/attendance/Odontogram.test.tsx
~~~

Expected: face-first assertions fail against the legacy editor.

- [ ] **Step 3: Replace the hand-drawn renderer**

Remove SvgDefs, FRONTAL, OCCLUSAL, FrontalTooth, and OcclusalTooth from Odontogram.tsx. Render AnatomicalTooth in every arch tile and the editor. Re-export model types:

~~~ts
export type {
  ToothData,
  ToothFaceData,
} from "./odontogram/odontogramModel";
~~~

- [ ] **Step 4: Implement face-first disclosure**

Use selectedTooth and selectedFace. Opening a tooth resets selectedFace and never calls onChange.

~~~ts
const FACE_CONDITIONS = [
  { label: "Saudável", value: "Saudável" },
  { label: "A tratar", value: "Tratar" },
  { label: "Tratada", value: "Tratado" },
] as const;

const WHOLE_TOOTH_CONDITIONS = [
  "Saudável",
  "Ausente",
  "Implante",
  "Ponte",
] as const;
~~~

Show FACE_CONDITIONS only after a face is active. Apply with updateToothFace. Put whole-tooth conditions in a separate Dente inteiro disclosure and apply with updateWholeTooth.

- [ ] **Step 5: Preserve notes and read-only consumers**

Keep immutable note updates. In read-only mode, render surfaces non-interactively and preserve summary badges. Compile AdminAttendanceDetail, AdminPrescription, and EvolutionTimeline without API changes.

- [ ] **Step 6: Expand static regression contracts**

Add:

~~~powershell
Assert-Contains "src/components/admin/attendance/Odontogram.tsx" "AnatomicalTooth" "Odontogram must use anatomical rendering."
Assert-Contains "src/components/admin/attendance/Odontogram.tsx" "ToothSurfaceSelector" "Odontogram must expose direct face selection."
Assert-NotContains "src/components/admin/attendance/Odontogram.tsx" "const FRONTAL" "Legacy frontal geometry must be removed."
Assert-NotContains "src/components/admin/attendance/Odontogram.tsx" "const OCCLUSAL" "Legacy occlusal geometry must be removed."
Assert-Contains "src/assets/odontogram/THIRD_PARTY_NOTICES.md" "Copyright \(c\) 2026 Zoltán Dul" "MIT attribution must be preserved."
~~~

- [ ] **Step 7: Run GREEN and commit**

~~~powershell
npx vitest run src/components/admin/attendance/Odontogram.test.tsx src/components/admin/attendance/odontogram
powershell -ExecutionPolicy Bypass -File scripts/verify-admin-responsive.ps1
npx eslint src/components/admin/attendance/Odontogram.tsx src/components/admin/attendance/odontogram
git add src/components/admin/attendance/Odontogram.tsx src/components/admin/attendance/Odontogram.test.tsx src/components/admin/attendance/odontogram src/index.css scripts/verify-admin-responsive.ps1
git commit -m "feat: add anatomical face-first odontogram"
~~~

Expected: all new tests, source contracts, and focused lint pass.

---

### Task 6: Final verification, review, plan commit, and push

**Files:**
- Create: docs/superpowers/plans/2026-07-15-anatomical-odontogram-face-first.md
- Verify: all branch changes.

- [ ] **Step 1: Run complete verification**

~~~powershell
npm test
powershell -ExecutionPolicy Bypass -File scripts/verify-admin-responsive.ps1
npm run build
npx eslint src/components/admin/attendance/Odontogram.tsx src/components/admin/attendance/odontogram src/pages/AdminLeads.tsx
git diff --check
git status --short --branch
~~~

Expected: tests, contracts, build, and focused lint pass; only the known unrelated plan remains untracked.

- [ ] **Step 2: Request read-only code review**

Review all commits since e46f992 for MIT attribution, no runtime fetch, anatomical differentiation, face-first flow, data compatibility, touch targets, keyboard and read-only behavior, and test quality. Fix every Critical or Important finding, then repeat Step 1.

- [ ] **Step 3: Commit this implementation plan**

~~~powershell
git add docs/superpowers/plans/2026-07-15-anatomical-odontogram-face-first.md
git commit -m "docs: add anatomical odontogram implementation plan"
~~~

- [ ] **Step 4: Verify outgoing history**

~~~powershell
git status --short --branch
git log --oneline origin/main..main
git diff --stat origin/main..main
~~~

Expected: only approved responsive, specification, test, anatomy, interaction, integration, and plan commits are ahead. The unrelated untracked plan is excluded.

- [ ] **Step 5: Push all approved upgrades**

~~~powershell
git push origin main
~~~

Expected: push succeeds and main matches origin/main, with only the unrelated untracked plan remaining.
