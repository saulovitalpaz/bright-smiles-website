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

