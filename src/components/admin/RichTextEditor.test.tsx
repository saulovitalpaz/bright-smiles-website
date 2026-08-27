import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RichTextEditor from "./RichTextEditor";

describe("RichTextEditor", () => {
  it("exposes common document typography and formatting controls", () => {
    const execCommand = vi.fn();
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommand });
    render(<RichTextEditor content="" onChange={() => undefined} />);

    expect(screen.getByRole("combobox", { name: "Fonte" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Tamanho da fonte" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sublinhado" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lista numerada" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inserir link" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remover formatação" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sublinhado" }));
    expect(execCommand).toHaveBeenCalledWith("underline", false, undefined);
  });
});
