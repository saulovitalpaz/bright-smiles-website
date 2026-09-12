import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeAll } from "vitest";
import FacialHarmonizationWorkspace from "./FacialHarmonizationWorkspace";
import { normalizeFacialNotes } from "./facialModel";
import { loadStockProducts } from "@/lib/stock";
vi.mock("@/lib/stock", async original => ({ ...await original<typeof import("@/lib/stock")>(), loadStockProducts: vi.fn() }));

beforeAll(() => { window.PointerEvent = MouseEvent as typeof PointerEvent; });
function setup(value: unknown = { version: 2, applications: [] }, readOnly = false) {
  const onChange = vi.fn();
  const result = render(<FacialHarmonizationWorkspace value={value} onChange={onChange} readOnly={readOnly} />);
  const map = screen.getByRole("group", { name: "Mapa facial de aplicações" });
  Object.defineProperty(map, "getBoundingClientRect", { value: () => ({ left: 0, top: 0, width: 750, height: 1000 }) });
  const mark = (x: number, y: number, endX = x, endY = y) => { fireEvent.pointerDown(map, { clientX: x, clientY: y, button: 0 }); fireEvent.pointerMove(map, { clientX: endX, clientY: endY }); fireEvent.pointerUp(map, { clientX: endX, clientY: endY }); };
  const confirm = (amount: string) => { fireEvent.change(screen.getByLabelText("Quantidade"), { target: { value: amount } }); fireEvent.click(screen.getByRole("button", { name: "Confirmar quantidade" })); };
  return { ...result, onChange, mark, confirm, map };
}
describe("FacialHarmonizationWorkspace direct annotation", () => {
  it("links the selected catalog product to the exact marker without a stock write", async () => {
    vi.mocked(loadStockProducts).mockResolvedValue([{ id: "p1", name: "Toxina catálogo", procedureType: "botulinum-toxin", stockUnit: "ml", quantity: 2, concentration: 50, price: 100, active: true, version: 1 }]);
    const { mark, confirm, onChange } = setup(); mark(375, 300);
    fireEvent.click(screen.getByRole("button", { name: "Selecionar produto do estoque" }));
    fireEvent.click(await screen.findByRole("button", { name: /Toxina catálogo/ })); confirm("10");
    expect(onChange.mock.lastCall![0].applications[0]).toMatchObject({ productId: "p1", productName: "Toxina catálogo", amount: 10, unit: "U", coordinates: { x: .5, y: .3 } });
  });
  it("creates needle points without external region selection and totals their amounts", () => {
    const { mark, confirm, onChange } = setup();
    mark(375, 300);
    expect(onChange).not.toHaveBeenCalled();
    confirm("2,5");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ applications: [expect.objectContaining({ coordinates: { x: .5, y: .3 }, amount: 2.5, unit: "U", device: "Agulha" })] }));
    expect(screen.getByRole("button", { name: /Toxina Botulínica 2,5 U/ })).toBeInTheDocument();
  });
  it("records cannula paths by drag and retains both endpoints after serialization", () => {
    const { mark, confirm, onChange } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Preenchimento 0 ml/ }));
    mark(225, 550, 300, 500); confirm("0,5");
    const saved = normalizeFacialNotes(JSON.parse(JSON.stringify(onChange.mock.lastCall![0])));
    expect(saved.applications[0]).toMatchObject({ coordinates: { x: .3, y: .55 }, endCoordinates: { x: .4, y: .5 }, device: "Cânula", amount: .5 });
  });
  it("allows direct needle delivery for filler and paths for threads", () => {
    const { mark, confirm, onChange } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Preenchimento 0 ml/ }));
    fireEvent.click(screen.getByRole("button", { name: /Agulha · ponto/ }));
    mark(375, 650); confirm("1");
    expect(onChange.mock.lastCall![0].applications[0]).toMatchObject({ device: "Agulha" });
    expect(onChange.mock.lastCall![0].applications[0].endCoordinates).toBeUndefined();
    fireEvent.click(screen.getByRole("button", { name: /Fio de PDO/ }));
    mark(225, 550); mark(200, 450); confirm("1");
    expect(onChange.mock.lastCall![0].applications[1]).toMatchObject({ device: "Fio", endCoordinates: { x: 200 / 750, y: .45 } });
  });
  it("rejects invalid quantities and cancels without persisting a draft", () => {
    const { mark, confirm, onChange } = setup(); mark(300, 300);
    for (const value of ["", "-1", "0", "Infinity", "abc"]) { confirm(value); expect(screen.getByRole("alert")).toBeInTheDocument(); }
    fireEvent.click(screen.getByRole("button", { name: "Fechar edição" }));
    expect(onChange).not.toHaveBeenCalled();
  });
  it("edits and deletes applications preserving historical data", () => {
    const legacyRegions = { frontal: { product: "Histórico", dose: "3 U", notes: "Registro anterior" } };
    const { confirm, onChange } = setup({ version: 2, legacyRegions, applications: [{ id: "old", regionId: "frontal", procedureType: "botulinum-toxin", coordinates: { x: .5, y: .3 }, amount: 2, unit: "U", productName: "Produto anterior" }] });
    fireEvent.click(screen.getByRole("button", { name: /Editar aplicação/ })); confirm("4");
    expect(onChange.mock.lastCall![0]).toMatchObject({ legacyRegions, applications: [{ id: "old", amount: 4, productName: "Produto anterior" }] });
    fireEvent.click(screen.getByRole("button", { name: /Editar aplicação/ }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir aplicação" }));
    expect(onChange.mock.lastCall![0]).toMatchObject({ legacyRegions, applications: [] });
  });
  it("never modifies read-only records", () => {
    const { mark, map, onChange } = setup({ version: 2, applications: [{ id: "old", regionId: "frontal", procedureType: "filler", coordinates: { x: .5, y: .3 }, amount: 1, unit: "ml" }] }, true);
    mark(300, 300); fireEvent.keyDown(map, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: /Consultar aplicação/ }));
    expect(screen.getByLabelText("Quantidade")).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "Confirmar quantidade" })).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
  it("supports keyboard placement and updates when a different record arrives", () => {
    const { map, confirm, onChange, rerender } = setup();
    fireEvent.keyDown(map, { key: "ArrowRight" }); fireEvent.keyDown(map, { key: "Enter" }); confirm("2");
    expect(onChange.mock.lastCall![0].applications[0].coordinates.x).toBe(.51);
    rerender(<FacialHarmonizationWorkspace value={{ version: 2, applications: [] }} onChange={onChange} />);
    expect(screen.queryByRole("button", { name: /Editar aplicação/ })).not.toBeInTheDocument();
  });
});
