import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RegionInspector from "./RegionInspector";
import type { FacialRegion } from "./facialModel";

const region: FacialRegion = {
  id: "nasolabial-right",
  name: "Sulco nasolabial",
  side: "right",
  svgId: "nasolabial-right",
  group: "terço inferior",
  paths: [],
};

describe("RegionInspector", () => {
  it("asks the clinician to select a region when none is active", () => {
    render(<RegionInspector region={null} applications={[]} procedureType="filler" onProcedureChange={vi.fn()} onRegister={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Selecione uma região no mapa")).toBeInTheDocument();
  });

  it("shows region laterality and registers the contextual form", () => {
    const onRegister = vi.fn();
    render(<RegionInspector region={region} applications={[]} procedureType="filler" onProcedureChange={vi.fn()} onRegister={onRegister} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /sulco nasolabial.*direito/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Produto"), { target: { value: "Ácido hialurônico" } });
    fireEvent.change(screen.getByLabelText("Quantidade"), { target: { value: "0,2" } });
    fireEvent.change(screen.getByLabelText("Unidade"), { target: { value: "ml" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar aplicação" }));

    expect(onRegister).toHaveBeenCalledWith(expect.objectContaining({ productName: "Ácido hialurônico", amount: 0.2, unit: "ml", regionId: "nasolabial-right" }));
  });

  it("exposes edit, duplicate and delete actions for applications", () => {
    const onEdit = vi.fn();
    const onDuplicate = vi.fn();
    const onDelete = vi.fn();
    const application = { id: "a1", regionId: region.id, procedureType: "filler" as const, amount: 0.2, unit: "ml" as const, productName: "AH" };
    render(<RegionInspector region={region} applications={[application]} procedureType="filler" onProcedureChange={vi.fn()} onRegister={vi.fn()} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: /editar aplicação/i }));
    fireEvent.click(screen.getByRole("button", { name: /duplicar aplicação/i }));
    fireEvent.click(screen.getByRole("button", { name: /excluir aplicação/i }));

    expect(onEdit).toHaveBeenCalledWith(application);
    expect(onDuplicate).toHaveBeenCalledWith(application);
    expect(onDelete).toHaveBeenCalledWith(application.id);
  });

  it("shows the total dose for the selected region", () => {
    const application = { id: "a1", regionId: region.id, procedureType: "filler" as const, amount: 0.2, unit: "ml" as const, productName: "AH" };
    render(<RegionInspector region={region} applications={[application]} procedureType="filler" onProcedureChange={vi.fn()} onRegister={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText(/total da região.*0,20 ml/i)).toBeInTheDocument();
  });

  it("keeps the inspector read-only for users without edit permission", () => {
    render(<RegionInspector region={region} applications={[]} procedureType="filler" readOnly onProcedureChange={vi.fn()} onRegister={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Registrar aplicação" })).not.toBeInTheDocument();
    expect(screen.getByText("Nenhuma aplicação registrada nesta região.")).toBeInTheDocument();
  });
});
