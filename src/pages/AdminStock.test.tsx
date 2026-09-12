import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminStock from "./AdminStock";
import { adminApi } from "@/lib/api";
import { loadStockProducts } from "@/lib/stock";
vi.mock("@/components/admin/AdminLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/lib/api", () => ({ adminApi: { post: vi.fn(), put: vi.fn(), get: vi.fn() } }));
vi.mock("@/lib/stock", async original => ({ ...await original<typeof import("@/lib/stock")>(), loadStockProducts: vi.fn() }));
const product = { id: "p1", name: "Toxina teste", procedureType: "botulinum-toxin" as const, stockUnit: "ml" as const, quantity: 2, concentration: 50, price: 100, active: true, version: 3 };
beforeEach(() => { vi.resetAllMocks(); vi.mocked(loadStockProducts).mockResolvedValue([product]); });
describe("AdminStock", () => {
  it("creates a product with class, concentration, price and initial quantity", async () => {
    vi.mocked(adminApi.post).mockResolvedValue({ data: product });
    render(<AdminStock />); await screen.findByText("Toxina teste");
    fireEvent.click(screen.getByRole("button", { name: "Novo produto" }));
    for (const [label, value] of [["Nome do produto", "Produto novo"], ["Lote", "LOTE-TESTE"], ["Data de reconstituição", "2026-09-12"], ["Quantidade inicial (ml)", "2,5"], ["Concentração (UI/ml)", "50"], ["Preço por ml (R$)", "100"]]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar produto" }));
    await waitFor(() => expect(adminApi.post).toHaveBeenCalledWith("/stock/products", { product: { name: "Produto novo", batch: "LOTE-TESTE", reconstitutedAt: "2026-09-12", procedureType: "botulinum-toxin", stockUnit: "ml", concentration: 50, price: 100, active: true }, quantity: 2.5 }));
  });
  it("retains stock adjustment values when saving fails", async () => {
    vi.mocked(adminApi.post).mockRejectedValue(new Error());
    render(<AdminStock />); await screen.findByText("Toxina teste"); fireEvent.click(screen.getByRole("button", { name: "Ajustar" }));
    fireEvent.change(screen.getByLabelText(/Quantidade de entrada/), { target: { value: "-1" } });
    fireEvent.change(screen.getByLabelText("Motivo"), { target: { value: "Descarte" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar ajuste" })); await screen.findByRole("alert");
    expect(screen.getByLabelText(/Quantidade de entrada/)).toHaveValue("-1");
    expect(adminApi.post).toHaveBeenCalledWith("/stock/products/p1/adjustments", { quantity: -1, reason: "Descarte", version: 3 });
  });
  it("exposes load failure and recovery", async () => {
    vi.mocked(loadStockProducts).mockRejectedValueOnce(new Error()).mockResolvedValue([product]);
    render(<AdminStock />); await screen.findByRole("alert"); fireEvent.click(screen.getByRole("button", { name: "Atualizar" })); await screen.findByText("Toxina teste");
  });
});
