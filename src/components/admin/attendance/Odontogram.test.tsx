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
});
