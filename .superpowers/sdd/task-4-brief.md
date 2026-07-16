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

