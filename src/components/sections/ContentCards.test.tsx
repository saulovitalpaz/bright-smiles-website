import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import Services from "./Services";

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  return { ...actual, default: { ...actual.default, get: vi.fn() } };
});
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

function renderCards(component: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter>{component}</MemoryRouter></QueryClientProvider>);
}

describe("homepage content cards", () => {

  it("distinguishes failed treatment loading from an empty list", async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error("offline"));
    renderCards(<Services />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os tratamentos.");
    expect(screen.queryByText("Nenhum tratamento cadastrado ainda.")).not.toBeInTheDocument();
  });

  it("stops retrying the fallback treatment image if that image also fails", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [{ id: 1, slug: "teste", title: "Tratamento teste", image: "/missing.jpg", category: "Saúde", description: "Descrição" }] });
    renderCards(<Services />);
    const img = await screen.findByRole("img", { name: "Tratamento teste" });
    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "/placeholder.png");
    const setAttribute = vi.spyOn(img, "setAttribute");
    fireEvent.error(img);
    expect(setAttribute).not.toHaveBeenCalled();
  });
});
