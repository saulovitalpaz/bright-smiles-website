import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ClinicalConditionEditor } from "./ClinicalConditionEditor";

async function selectStage(stage: string, user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: `Selecionar situação ${stage}` }));
}

describe("ClinicalConditionEditor", () => {
  it("creates a completed resin condition for multiple precise regions", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ClinicalConditionEditor toothNumber={16} onCancel={() => undefined} onSave={onSave} />);

    await user.selectOptions(screen.getByLabelText("Categoria"), "restauracao");
    await user.selectOptions(screen.getByLabelText("Procedimento"), "resina_composta");
    await user.click(screen.getByRole("button", { name: /oclusal \/ incisal.*incisal ou oclusal/i }));
    await user.click(screen.getByRole("button", { name: /vestibular.*face inteira/i }));
    await selectStage("Concluído", user);
    await user.click(screen.getByRole("button", { name: "Salvar ocorrência" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      category: "restauracao",
      type: "resina_composta",
      stage: "concluido",
      targets: [
        { kind: "surface", face: "center", region: "incisalOcclusal" },
        { kind: "surface", face: "top", region: "entire" },
      ],
    }));
  });

  it("saves from the precise region grid and resets every entered clinical detail", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ClinicalConditionEditor toothNumber={16} onCancel={() => undefined} onSave={onSave} />);

    await user.selectOptions(screen.getByLabelText("Categoria"), "achado");
    await user.selectOptions(screen.getByLabelText("Procedimento"), "carie");
    const target = screen.getByRole("button", { name: /oclusal \/ incisal.*incisal ou oclusal/i });
    await user.click(target);
    await selectStage("Planejado / a tratar", user);
    await user.type(screen.getByLabelText("Observação da ocorrência"), "acompanhar por seis meses");
    await user.click(screen.getByRole("button", { name: "Salvar ocorrência" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Categoria")).toHaveValue("");
    expect(screen.getByLabelText("Procedimento")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Selecionar situação Planejado / a tratar" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Observação da ocorrência")).toHaveValue("");

    await user.selectOptions(screen.getByLabelText("Categoria"), "achado");
    await user.selectOptions(screen.getByLabelText("Procedimento"), "carie");
    expect(
      screen.getByRole("button", { name: /oclusal \/ incisal.*incisal ou oclusal/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("uses readable dark select controls and visibly marks a selected region", async () => {
    const user = userEvent.setup();
    render(<ClinicalConditionEditor toothNumber={16} onCancel={() => undefined} onSave={() => undefined} />);

    expect(screen.getByLabelText("Categoria")).toHaveClass("bg-slate-950", "text-slate-100");
    await user.selectOptions(screen.getByLabelText("Categoria"), "restauracao");
    await user.selectOptions(screen.getByLabelText("Procedimento"), "resina_composta");
    const target = screen.getByRole("button", { name: /oclusal \/ incisal.*incisal ou oclusal/i });
    await user.click(target);

    expect(target).toHaveAttribute("aria-pressed", "true");
    expect(target).toHaveClass("surface-selector__control--selected");
  });

  it("offers every legend clinical stage as an accessible modal selection", async () => {
    const user = userEvent.setup();
    render(<ClinicalConditionEditor toothNumber={16} onCancel={() => undefined} onSave={() => undefined} />);

    const stage = screen.getByRole("button", { name: "Selecionar situação Em andamento" });
    expect(stage).toHaveAttribute("aria-pressed", "false");

    await user.click(stage);

    expect(screen.getByRole("button", { name: "Selecionar situação Em andamento" })).toHaveAttribute("aria-pressed", "true");
    expect(stage).toHaveAttribute("aria-pressed", "true");
  });

  it("blocks saving when the selected regions exceed the backend limit", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ClinicalConditionEditor toothNumber={16} onCancel={() => undefined} onSave={onSave} />);

    await user.selectOptions(screen.getByLabelText("Categoria"), "restauracao");
    await user.selectOptions(screen.getByLabelText("Procedimento"), "resina_composta");
    for (const name of [
      /vestibular.*cervical/i,
      /vestibular.*média/i,
      /mesial.*cervical/i,
      /mesial.*média/i,
      /distal.*cervical/i,
      /distal.*média/i,
    ]) {
      await user.click(screen.getByRole("button", { name }));
    }
    await selectStage("Planejado / a tratar", user);

    expect(screen.getByRole("alert")).toHaveTextContent("no máximo 5 regiões");
    expect(screen.getByRole("button", { name: "Salvar ocorrência" })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("loads and updates an existing occurrence without changing its id", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <ClinicalConditionEditor
        initialCondition={{
          id: "existing-1",
          category: "achado",
          type: "carie",
          stage: "planejado",
          targets: [{ kind: "surface", face: "left", region: "entire" }],
          notes: "manter acompanhamento",
        }}
        onCancel={() => undefined}
        onSave={onSave}
        toothNumber={21}
      />,
    );

    expect(screen.getByLabelText("Categoria")).toHaveValue("achado");
    expect(screen.getByLabelText("Procedimento")).toHaveValue("carie");
    expect(screen.getByRole("button", { name: "Selecionar situação Planejado / a tratar" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Observação da ocorrência")).toHaveValue("manter acompanhamento");

    await selectStage("Concluído", user);
    await user.click(screen.getByRole("button", { name: "Atualizar ocorrência" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: "existing-1", stage: "concluido" }));
  });

  it("allows editing a migrated legacy occurrence without losing its taxonomy or target", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <ClinicalConditionEditor
        initialCondition={{
          id: "legacy-1",
          category: "legado",
          type: "legado_tratar",
          stage: "concluido",
          targets: [{ kind: "surface", face: "top", region: "entire" }],
          notes: "migrado do odontograma anterior",
        }}
        onCancel={() => undefined}
        onSave={onSave}
        toothNumber={21}
      />,
    );

    expect(screen.getByLabelText("Categoria")).toHaveValue("legado");
    expect(screen.getByLabelText("Procedimento")).toHaveValue("legado_tratar");
    expect(screen.getByRole("button", { name: /^vestibular.*face inteira$/i })).toHaveAttribute("aria-pressed", "true");

    await selectStage("Monitorado", user);
    await user.click(screen.getByRole("button", { name: "Atualizar ocorrência" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      id: "legacy-1",
      category: "legado",
      type: "legado_tratar",
      stage: "monitorado",
      targets: [{ kind: "surface", face: "top", region: "entire" }],
    }));
  });
});
