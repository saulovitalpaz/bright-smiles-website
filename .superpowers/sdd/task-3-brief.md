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

