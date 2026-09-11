import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import AdminLayout from "./AdminLayout";

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ logout: vi.fn() }) }));
vi.mock("axios", () => ({ default: { get: async () => ({ data: {} }), create: () => ({}) } }));
vi.mock("@/components/admin/AdminPwaProvider", () => ({ AdminPwaInstallAction: () => null }));
beforeEach(() => localStorage.setItem("admin_user", JSON.stringify({ name: "Usuário de teste", role: "admin" })));
const mount = () => render(<MemoryRouter initialEntries={["/admin/dashboard"]}><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AdminLayout title="Dashboard"><button>Conteúdo de teste</button></AdminLayout></QueryClientProvider></MemoryRouter>);

it("closes the mobile navigation with Escape and returns focus to the trigger", async () => {
    mount();
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "Abrir menu" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Navegação administrativa" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
});

it("provides quick navigation appropriate to the manager role", async () => {
    localStorage.setItem("admin_user", JSON.stringify({ name: "Gestor de teste", role: "manager" }));
    mount();
    const nav = await screen.findByRole("navigation", { name: "Navegação rápida" });
    expect(nav).toHaveTextContent("Financeiro");
    expect(nav).not.toHaveTextContent("Agenda");
    expect(nav).not.toHaveTextContent("Pacientes");
});
