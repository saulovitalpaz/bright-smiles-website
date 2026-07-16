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

