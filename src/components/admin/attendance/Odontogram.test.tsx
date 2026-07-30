import { render, screen } from "@testing-library/react";
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
    expect(screen.getByText("Selecione uma face para registrar sua condição clínica.")).toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: /oclusal.*saudável/i }));

    expect(screen.getByRole("button", { name: "A tratar" })).toBeInTheDocument();
    expect(screen.getByText("Face selecionada: Oclusal / Incisal")).toBeInTheDocument();
  });

  it("applies a condition only after selecting a face", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Odontogram data={{}} onChange={onChange} />);
    await user.click(getToothButton(16));
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

  it("keeps whole-tooth conditions in a separate disclosure", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Odontogram data={{}} onChange={onChange} />);
    await user.click(getToothButton(16));

    expect(screen.queryByRole("button", { name: "Implante" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /dente inteiro/i }));
    await user.click(screen.getByRole("button", { name: "Implante" }));

    expect(onChange).toHaveBeenLastCalledWith({
      "16": { status: "Implante", notes: "" },
    });
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
    expect(screen.getByText("Área a tratar")).toBeInTheDocument();
    expect(screen.getByText("Área tratada")).toBeInTheDocument();
    expect(container.querySelector('[data-face-key="center"]')).toHaveAttribute(
      "data-face-status",
      "Tratar",
    );
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
    expect(screen.getByText("Oclusal / Incisal - oclusal/incisal")).toBeInTheDocument();
    expect(screen.getByText("avaliar profundidade")).toBeInTheDocument();
    expect(screen.getByText("implante")).toBeInTheDocument();
    expect(screen.getByText("Concluído")).toBeInTheDocument();
    expect(screen.getByText("Dente inteiro")).toBeInTheDocument();
    expect(screen.getByText("coroa instalada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remover/i })).not.toBeInTheDocument();
  });
});
