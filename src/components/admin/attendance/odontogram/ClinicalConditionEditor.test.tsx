import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ClinicalConditionEditor } from "./ClinicalConditionEditor";

describe("ClinicalConditionEditor", () => {
  it("creates a completed resin condition for the selected precise region", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ClinicalConditionEditor toothNumber={16} onCancel={() => undefined} onSave={onSave} />);

    await user.selectOptions(screen.getByLabelText("Categoria"), "restauracao");
    await user.selectOptions(screen.getByLabelText("Procedimento"), "resina_composta");
    await user.click(screen.getByRole("button", { name: /oclusal.*incisal ou oclusal/i }));
    await user.selectOptions(screen.getByLabelText("Situação"), "concluido");
    await user.click(screen.getByRole("button", { name: "Salvar ocorrência" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      category: "restauracao",
      type: "resina_composta",
      stage: "concluido",
      targets: [{ kind: "surface", face: "center", region: "incisalOcclusal" }],
    }));
  });

  it("uses readable dark select controls and visibly marks a selected region", async () => {
    const user = userEvent.setup();
    render(<ClinicalConditionEditor toothNumber={16} onCancel={() => undefined} onSave={() => undefined} />);

    expect(screen.getByLabelText("Categoria")).toHaveClass("bg-slate-950", "text-slate-100");
    await user.selectOptions(screen.getByLabelText("Categoria"), "restauracao");
    await user.selectOptions(screen.getByLabelText("Procedimento"), "resina_composta");
    const target = screen.getByRole("button", { name: /oclusal.*incisal ou oclusal/i });
    await user.click(target);

    expect(target).toHaveAttribute("aria-pressed", "true");
    expect(target).toHaveClass("bg-blue-500/20", "border-blue-400");
  });
});
