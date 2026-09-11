import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Odontogram from "./Odontogram";

function getToothButton(toothNumber: number): HTMLElement {
  return screen.getAllByRole("button", {
    name: new RegExp(`dente ${toothNumber}`, "i"),
  })[0];
}

describe("Odontogram face-first workflow", () => {
  it("shows saved V2 details and removes only the selected occurrence", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Odontogram
        data={{
          version: 2,
          dentition: "permanent",
          teeth: {
            "16": {
              notes: "",
              conditions: [
                {
                  id: "c1",
                  category: "achado",
                  type: "carie",
                  stage: "planejado",
                  targets: [{ kind: "surface", face: "center", region: "incisalOcclusal" }],
                  notes: "reavaliar",
                },
                {
                  id: "c2",
                  category: "restauracao",
                  type: "resina_composta",
                  stage: "concluido",
                  targets: [{ kind: "surface", face: "top", region: "middle" }],
                },
              ],
            },
          },
        }}
        onChange={onChange}
      />,
    );

    await user.click(getToothButton(16));

    expect(screen.getByText("reavaliar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /remover carie/i }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      teeth: expect.objectContaining({
        "16": expect.objectContaining({
          conditions: [expect.objectContaining({ id: "c2" })],
        }),
      }),
    }));
  });

  it("renders an oclusal image under each tooth", () => {
    const { container } = render(<Odontogram data={{}} onChange={() => undefined} />);

    expect(container.querySelectorAll(".occlusal-tooth--arch")).toHaveLength(32);
  });

  it("renders only primary teeth for a deciduous V3 odontogram", () => {
    render(
      <Odontogram
        data={{
          version: 3,
          dentition: "deciduous",
          teeth: { "55": { notes: "", conditions: [] }, "16": { notes: "", conditions: [] } },
        }}
        onChange={() => undefined}
        readOnly
      />,
    );

    expect(screen.getAllByText("55").length).toBeGreaterThan(0);
    expect(screen.queryByText("16")).not.toBeInTheDocument();
  });

  it("renders the union of primary and permanent teeth for mixed dentition", () => {
    render(
      <Odontogram
        data={{
          version: 3,
          dentition: "mixed",
          teeth: {
            "55": { notes: "decíduo", conditions: [] },
            "16": { notes: "permanente", conditions: [] },
          },
        }}
        onChange={() => undefined}
        readOnly
      />,
    );

    expect(screen.getAllByText("55").length).toBeGreaterThan(0);
    expect(screen.getAllByText("16").length).toBeGreaterThan(0);
  });

  it("derives the initial dentition from birthDate without persisting an age tag", () => {
    render(
      <Odontogram
        birthDate="2021-08-27"
        data={{}}
        onChange={() => undefined}
        readOnly
      />,
    );

    expect(screen.getByText("55")).toBeInTheDocument();
    expect(screen.queryByText("16")).not.toBeInTheDocument();
  });

  it("does not show legacy face-first controls for V2 data", async () => {
    const user = userEvent.setup();

    render(
      <Odontogram
        data={{ version: 2, dentition: "permanent", teeth: {} }}
        onChange={() => undefined}
      />,
    );
    await user.click(getToothButton(16));

    expect(screen.queryByText(/Face selecionada:/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "A tratar" })).not.toBeInTheDocument();
  });

  it("guides V2 editing through precise clinical-form regions while preserving legacy face guidance", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Odontogram data={{ version: 2, dentition: "permanent", teeth: {} }} onChange={() => undefined} />,
    );

    await user.click(getToothButton(16));
    expect(screen.getByText(/selecione as regiões precisas no formulário clínico/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    rerender(<Odontogram data={{}} onChange={() => undefined} />);
    await user.click(getToothButton(16));
    expect(screen.getByText("Selecione uma ou mais faces para registrar a condição clínica.")).toBeInTheDocument();
  });

  it("opens a tooth without writing clinical data", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Odontogram data={{}} onChange={onChange} />);
    await user.click(getToothButton(16));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dente 16" })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reveals face conditions only after selecting a face", async () => {
    const user = userEvent.setup();

    render(<Odontogram data={{}} onChange={() => undefined} />);
    await user.click(getToothButton(16));

    expect(screen.queryByRole("button", { name: "A tratar" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Selecionar face Oclusal / Incisal" }));

    expect(screen.getByRole("button", { name: "A tratar" })).toBeInTheDocument();
    expect(screen.getByText("FACES SELECIONADAS")).toBeInTheDocument();
    expect(screen.getByText("Oclusal / Incisal")).toBeInTheDocument();
  });

  it("applies a condition only after selecting a face", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Odontogram data={{}} onChange={onChange} />);
    await user.click(getToothButton(16));
    await user.click(screen.getByRole("button", { name: "Selecionar face Oclusal / Incisal" }));

    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "A tratar" }));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Aplicar alterações" }));

    expect(onChange).toHaveBeenCalledWith({
      "16": {
        status: "Saudável",
        notes: "",
        faces: { center: { status: "Tratar" } },
      },
    });
  });

  it("keeps whole-tooth conditions in a separate disclosure", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Odontogram data={{}} onChange={onChange} />);
    await user.click(getToothButton(16));

    expect(screen.queryByRole("button", { name: "Implante" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /dente inteiro/i }));
    await user.click(screen.getByRole("button", { name: "Implante" }));
    await user.click(screen.getByRole("button", { name: "Aplicar alterações" }));

    expect(onChange).toHaveBeenLastCalledWith({
      "16": { status: "Implante", notes: "" },
    });
  });

  it("opens an existing V2 occurrence in the editor without losing its targets", async () => {
    const user = userEvent.setup();
    render(
      <Odontogram
        data={{
          version: 2,
          dentition: "permanent",
          teeth: {
            "16": {
              notes: "",
              conditions: [{
                id: "editable",
                category: "achado",
                type: "carie",
                stage: "planejado",
                targets: [
                  { kind: "surface", face: "center", region: "incisalOcclusal" },
                  { kind: "surface", face: "top", region: "entire" },
                ],
              }],
            },
          },
        }}
        onChange={() => undefined}
      />,
    );

    await user.click(getToothButton(16));
    await user.click(screen.getByRole("button", { name: /editar carie/i }));

    expect(screen.getByLabelText("Categoria")).toHaveValue("achado");
    expect(screen.getByLabelText("Procedimento")).toHaveValue("carie");
    expect(screen.getByRole("button", { name: /oclusal \/ incisal.*incisal ou oclusal/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /vestibular.*face inteira/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("applies one face condition to multiple selected faces without mutating before apply", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Odontogram data={{}} onChange={onChange} />);
    await user.click(getToothButton(16));
    await user.click(screen.getByRole("button", { name: "Selecionar face Distal" }));
    await user.click(screen.getByRole("button", { name: "Selecionar face Vestibular" }));

    expect(screen.getByText("FACES SELECIONADAS")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remover face distal/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remover face vestibular/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "A tratar" }));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Aplicar alterações" }));

    expect(onChange).toHaveBeenCalledWith({
      "16": {
        status: "Saudável",
        notes: "",
        faces: {
          left: { status: "Tratar" },
          top: { status: "Tratar" },
        },
      },
    });
  });

  it("edits one face and clears it without changing other faces or notes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Odontogram
        data={{
          "21": {
            status: "Saudável",
            notes: "preservar",
            faces: { left: { status: "Tratado" }, right: { status: "Tratar" } },
          },
        }}
        onChange={onChange}
      />,
    );

    await user.click(getToothButton(21));
    await user.click(screen.getByRole("button", { name: "Selecionar face Distal" }));
    await user.click(screen.getByRole("button", { name: "Tratada" }));
    await user.click(screen.getByRole("button", { name: "Limpar condição das faces selecionadas" }));
    await user.click(screen.getByRole("button", { name: "Aplicar alterações" }));

    expect(onChange).toHaveBeenCalledWith({
      "21": {
        status: "Saudável",
        notes: "preservar",
        faces: { left: { status: "Tratado" } },
      },
    });
  });

  it("keeps multiple face conditions after save and reopening the tooth", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<Odontogram data={{}} onChange={onChange} />);

    await user.click(getToothButton(16));
    await user.click(screen.getByRole("button", { name: "Selecionar face Distal" }));
    await user.click(screen.getByRole("button", { name: "Selecionar face Vestibular" }));
    await user.click(screen.getByRole("button", { name: "A tratar" }));
    await user.click(screen.getByRole("button", { name: "Aplicar alterações" }));

    const saved = onChange.mock.calls[0][0];
    rerender(<Odontogram data={saved} onChange={onChange} />);
    await user.click(getToothButton(16));

    expect(screen.getByRole("button", { name: "Distal: Tratar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vestibular: Tratar" })).toBeInTheDocument();
  });

  it("does not expose editing controls in read-only mode", () => {
    render(
      <Odontogram
        data={{
          "16": {
            status: "Saudável",
            notes: "acompanhar",
            faces: { center: { status: "Tratado" } },
          },
        }}
        onChange={() => undefined}
        readOnly
      />,
    );

    expect(screen.queryByRole("button", { name: /dente 16/i })).not.toBeInTheDocument();
    expect(screen.getByText("Resumo Clínico")).toBeInTheDocument();
    expect(screen.getByText("Oclusal / Incisal: Tratado")).toBeInTheDocument();
  });

  it("uses the tooth surface colors as the overview status indicator", () => {
    const { container } = render(
      <Odontogram
        data={{
          "16": {
            status: "Saudável",
            notes: "",
            faces: { center: { status: "Tratar" } },
          },
        }}
        onChange={() => undefined}
      />,
    );

    expect(container.querySelector(".bg-blue-400")).not.toBeInTheDocument();
    expect(screen.getByText("A tratar")).toBeInTheDocument();
    expect(screen.getByText("Tratada")).toBeInTheDocument();
    expect(container.querySelector('[data-face-key="center"]')).toHaveAttribute(
      "data-face-status",
      "Tratar",
    );
  });

  it("groups the legend from shared definitions and explains every renderable symbol", () => {
    const { container } = render(<Odontogram data={{}} onChange={() => undefined} />);
    const legend = container.querySelector(".odontogram-legend");

    expect(legend).not.toBeNull();
    expect(within(legend as HTMLElement).getByRole("heading", { name: "Faces" })).toBeInTheDocument();
    expect(within(legend as HTMLElement).getByRole("heading", { name: "Dente inteiro" })).toBeInTheDocument();
    expect(within(legend as HTMLElement).getByText(/^Saudável$/)).toBeInTheDocument();
    expect(within(legend as HTMLElement).getByText(/^A tratar$/)).toBeInTheDocument();
    expect(within(legend as HTMLElement).getByText(/^Tratada$/)).toBeInTheDocument();
    expect(within(legend as HTMLElement).getByText(/^Ausente$/)).toBeInTheDocument();
    expect(within(legend as HTMLElement).getByText(/^Implante$/)).toBeInTheDocument();
    expect(within(legend as HTMLElement).getByText(/^Ponte$/)).toBeInTheDocument();
    expect(within(legend as HTMLElement).getByText(/^Planejado \/ a tratar$/)).toBeInTheDocument();
    expect(within(legend as HTMLElement).getByText(/^Em andamento$/)).toBeInTheDocument();
    expect(within(legend as HTMLElement).getByTestId("legend-swatch-tooth-missing")).toHaveAttribute("data-symbol", "cross");
    expect(within(legend as HTMLElement).getByTestId("legend-swatch-tooth-implant")).toHaveAttribute("data-symbol", "implant");
    expect(within(legend as HTMLElement).getByTestId("legend-swatch-tooth-bridge")).toHaveAttribute("data-symbol", "bridge");
    expect(within(legend as HTMLElement).getByText(/face inteira/i)).toBeInTheDocument();
    expect(within(legend as HTMLElement).getByText(/cervical/i)).toBeInTheDocument();
    expect(within(legend as HTMLElement).getByText(/média/i)).toBeInTheDocument();
    expect(within(legend as HTMLElement).getByText(/incisal\/oclusal/i)).toBeInTheDocument();
    expect(within(legend as HTMLElement).getByText(/mais de uma região/i)).toBeInTheDocument();
  });

  it("closes an open editor when permissions become read-only", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<Odontogram data={{}} onChange={onChange} />);

    await user.click(getToothButton(16));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    rerender(<Odontogram data={{}} onChange={onChange} readOnly />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("exposes a stable printable presentation without editing controls", () => {
    const { container } = render(
      <Odontogram
        data={{ "16": { status: "Implante", notes: "controle" } }}
        onChange={() => undefined}
        readOnly
        printable
      />,
    );

    expect(container.querySelector(".odontogram-card")).toHaveAttribute(
      "data-printable",
      "true",
    );
    expect(screen.queryByRole("button", { name: /dente 16/i })).not.toBeInTheDocument();
  });

  it("prints V2 occurrence details for surface and whole-tooth targets without removal controls", () => {
    render(
      <Odontogram
        data={{
          version: 2,
          dentition: "permanent",
          teeth: {
            "16": {
              notes: "",
              conditions: [
                {
                  id: "surface-caries",
                  category: "achado",
                  type: "carie",
                  stage: "planejado",
                  targets: [{ kind: "surface", face: "center", region: "incisalOcclusal" }],
                  notes: "avaliar profundidade",
                },
                {
                  id: "implant-plan",
                  category: "protese",
                  type: "implante",
                  stage: "concluido",
                  targets: [{ kind: "tooth" }],
                  notes: "coroa instalada",
                },
              ],
            },
          },
        }}
        onChange={() => undefined}
        printable
        readOnly
      />,
    );

    expect(screen.getByText("carie")).toBeInTheDocument();
    expect(screen.getByText("Planejado")).toBeInTheDocument();
    expect(screen.getByText("Oclusal / Incisal")).toBeInTheDocument();
    expect(screen.getByText("avaliar profundidade")).toBeInTheDocument();
    expect(screen.getByText("implante")).toBeInTheDocument();
    expect(screen.getAllByText("Concluído").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Dente inteiro").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("coroa instalada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remover/i })).not.toBeInTheDocument();
  });
});
