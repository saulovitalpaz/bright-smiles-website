import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import StockProductPicker from "./StockProductPicker";
import { loadStockProducts } from "@/lib/stock";
vi.mock("@/lib/stock", () => ({ loadStockProducts: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
describe("StockProductPicker", () => {
  it("searches the application class and selects the database product", async () => {
    const product = { id: "p1", name: "Produto teste", procedureType: "filler", quantity: 2, stockUnit: "ml", concentration: null, price: 100, active: true };
    vi.mocked(loadStockProducts).mockResolvedValue([product] as never);
    const onSelect = vi.fn(); render(<StockProductPicker procedureType="filler" onSelect={onSelect} />);
    await screen.findByRole("button", { name: /Produto teste/ });
    expect(loadStockProducts).toHaveBeenCalledWith("filler", expect.any(AbortSignal));
    fireEvent.change(screen.getByLabelText("Pesquisar produto do estoque"), { target: { value: "ausente" } });
    expect(screen.getByText(/Nenhum produto/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Pesquisar produto do estoque"), { target: { value: "teste" } });
    fireEvent.click(screen.getByRole("button", { name: /Produto teste/ })); expect(onSelect).toHaveBeenCalledWith(product);
  });
  it("shows load errors and allows retry", async () => {
    vi.mocked(loadStockProducts).mockRejectedValueOnce(new Error()).mockResolvedValue([]);
    render(<StockProductPicker procedureType="filler" onSelect={vi.fn()} />);
    await screen.findByRole("alert"); fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(screen.getByText(/Nenhum produto/)).toBeInTheDocument());
  });
});
