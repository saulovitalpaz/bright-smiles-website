import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FacialHarmonizationWorkspace from "./FacialHarmonizationWorkspace";
import type { FacialNotesDocument } from "./facialModel";

describe("FacialHarmonizationWorkspace", () => {
  it("selects a region, marks an application and updates the persistent summary", () => {
    const onChange = vi.fn();
    const value: FacialNotesDocument = { version: 2, applications: [] };
    render(<FacialHarmonizationWorkspace value={value} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /sulco nasolabial.*direito/i }));
    expect(screen.getByRole("heading", { name: /sulco nasolabial.*direito/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Produto"), { target: { value: "Ácido hialurônico" } });
    fireEvent.change(screen.getByLabelText("Quantidade"), { target: { value: "0,2" } });
    fireEvent.change(screen.getByLabelText("Unidade"), { target: { value: "ml" } });
    fireEvent.click(screen.getByRole("button", { name: "Marcar aplicação" }));
    const svg = screen.getByRole("img", { name: /mapa facial/i });
    Object.defineProperty(svg, "getBoundingClientRect", { configurable: true, value: () => ({ left: 0, top: 0, width: 640, height: 840 }) });
    fireEvent.click(svg, { clientX: 320, clientY: 420 });

    expect(screen.getByRole("button", { name: /editar aplicação.*0,2 ml/i })).toBeInTheDocument();
    expect(screen.getByText(/1 região.*1 aplicação.*0,20 ml/i)).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ version: 2, applications: [expect.objectContaining({ regionId: "nasolabial-right", productName: "Ácido hialurônico", amount: 0.2, unit: "ml", coordinates: { x: 0.5, y: 0.5 } })] }));
  });

  it("edits, duplicates and deletes a marker application", () => {
    const onChange = vi.fn();
    const value: FacialNotesDocument = { version: 2, applications: [{ id: "a1", regionId: "chin", procedureType: "filler", coordinates: { x: 0.5, y: 0.7 }, amount: 1, unit: "ml", productName: "Produto" }] };
    render(<FacialHarmonizationWorkspace value={value} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /editar aplicação.*1 ml/i }));
    fireEvent.change(screen.getByLabelText("Quantidade"), { target: { value: "1,2" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ applications: [expect.objectContaining({ id: "a1", amount: 1.2 })] }));

    fireEvent.click(screen.getByRole("button", { name: /duplicar aplicação/i }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ applications: expect.arrayContaining([expect.objectContaining({ id: "a1" }), expect.objectContaining({ regionId: "chin" })]) }));

    fireEvent.click(screen.getAllByRole("button", { name: /excluir aplicação/i })[0]);
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ applications: expect.not.arrayContaining([expect.objectContaining({ id: "a1" })]) }));
  });
});
