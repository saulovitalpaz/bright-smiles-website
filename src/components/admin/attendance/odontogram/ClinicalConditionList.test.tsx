import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ClinicalConditionList } from "./ClinicalConditionList";

describe("ClinicalConditionList", () => {
  it("shows clinical details and removes the exact occurrence id", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(<ClinicalConditionList toothNumber={16} onRemove={onRemove} conditions={[{
      id: "c1",
      category: "achado",
      type: "carie",
      stage: "planejado",
      targets: [{ kind: "surface", face: "center", region: "incisalOcclusal" }],
      notes: "acompanhar evolução",
    }]} />);

    expect(screen.getByText("carie")).toBeInTheDocument();
    expect(screen.getByText("Planejado")).toBeInTheDocument();
    expect(screen.getByText("Oclusal / Incisal - oclusal/incisal")).toBeInTheDocument();
    expect(screen.getByText("acompanhar evolução")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remover carie/i }));

    expect(onRemove).toHaveBeenCalledWith("c1");
  });
});
