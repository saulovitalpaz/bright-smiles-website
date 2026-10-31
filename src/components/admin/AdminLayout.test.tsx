import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import AdminLayout from "./AdminLayout";
import axios from "axios";

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ logout: vi.fn() }) }));
vi.mock("axios", () => ({ default: { get: vi.fn(async () => ({ data: {} })), create: () => ({}) } }));
vi.mock("@/components/admin/AdminPwaProvider", () => ({ AdminPwaInstallAction: () => null }));
beforeEach(() => { document.body.style.overflow = ""; localStorage.setItem("admin_user", JSON.stringify({ name: "Usuário de teste", role: "admin" })); });
afterEach(() => vi.unstubAllGlobals());
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

it("keeps the quick navigation unavailable until the sidebar finishes closing", async () => {
    mount();
    const user = userEvent.setup();
    const quickNav = screen.getByRole("navigation", { name: "Navegação rápida" });
    const trigger = within(quickNav).getByRole("button", { name: "Abrir menu completo" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Navegação administrativa" });
    expect(quickNav).toHaveAttribute("aria-hidden", "true");
    expect(quickNav).toHaveAttribute("inert");
    await user.keyboard("{Escape}");
    expect(dialog).toHaveAttribute("data-state", "closing");
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent(dialog, Object.assign(new Event("transitionend", { bubbles: true }), { propertyName: "opacity" }));
    expect(screen.getByRole("dialog")).toBe(dialog);
    fireEvent(dialog, Object.assign(new Event("transitionend", { bubbles: true }), { propertyName: "transform" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(quickNav).not.toHaveAttribute("inert");
    expect(quickNav).not.toHaveAttribute("aria-hidden");
    expect(trigger).toHaveFocus();
});

it("finishes closing without a transition event and restores the original body overflow", async () => {
    document.body.style.overflow = "auto";
    const view = mount();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "closing");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe("auto");
    view.unmount();
    document.body.style.overflow = "";
});

it("closes after choosing a sidebar route and releases the page", async () => {
    mount();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("link", { name: "Financeiro" }));
    expect(dialog).toHaveAttribute("data-state", "closing");
    fireEvent(dialog, Object.assign(new Event("transitionend", { bubbles: true }), { propertyName: "transform" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("main")).not.toHaveAttribute("inert");
});

it("restores body scrolling when unmounted with its menu open", async () => {
    const view = mount();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(document.body.style.overflow).toBe("hidden");
    view.unmount();
    expect(document.body.style.overflow).toBe("");
});
it("closes immediately when the user prefers reduced motion", async () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
        matches: query.includes("prefers-reduced-motion"), media: query,
        addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })));
    mount();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
});

it("releases mobile modal state when the viewport becomes desktop", async () => {
    let resize: (() => void) | undefined;
    const desktop = { matches: false, media: "(min-width: 1024px)",
        addEventListener: vi.fn((_event: string, callback: () => void) => { resize = callback; }),
        removeEventListener: vi.fn(),
    };
    vi.stubGlobal("matchMedia", vi.fn((query: string) => query.includes("min-width") ? desktop : {
        matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    }));
    mount();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    act(() => { desktop.matches = true; resize?.(); });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("main")).not.toHaveAttribute("inert");
    expect(document.body.style.overflow).toBe("");
});
it("closes through the backdrop while preserving its exit transition", async () => {
    const view = mount();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Abrir menu completo" }));
    const dialog = screen.getByRole("dialog");
    const backdrop = view.container.querySelector(".admin-navigation-backdrop");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(dialog).toHaveAttribute("data-state", "closing");
    fireEvent(dialog, Object.assign(new Event("transitionend", { bubbles: true }), { propertyName: "transform" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Abrir menu completo" })).toHaveFocus();
});

it("falls back once for a broken clinic logo and hides a broken default image", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { site_logo: "/images/custom-clinic.png", clinic_name: "Clínica de teste" } });
    mount();
    await userEvent.setup().click(screen.getByRole("button", { name: "Abrir menu completo" }));
    const logo = await screen.findByAltText("Logo de Clínica de teste");
    expect(logo).toHaveAttribute("src", "/images/custom-clinic.png");
    fireEvent.error(logo);
    expect(logo).toHaveAttribute("src", "/images/logo-oficial.png");
    expect(logo).not.toHaveAttribute("hidden");
    fireEvent.error(logo);
    expect(logo).toHaveAttribute("hidden");
    expect(logo).toHaveAttribute("src", "/images/logo-oficial.png");
    expect(screen.getByRole("heading", { name: "Clínica de teste" })).toBeInTheDocument();
});

it("cancels a pending close when a queued activation reopens the menu", async () => {
    mount();
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "Abrir menu completo" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("data-state", "closing");
    // Simulate an activation already queued before the trigger became inert.
    fireEvent.click(trigger);
    expect(dialog).toHaveAttribute("data-state", "open");
    fireEvent(dialog, Object.assign(new Event("transitionend", { bubbles: true }), { propertyName: "transform" }));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 400)); });
    expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open");
    expect(document.body.style.overflow).toBe("hidden");
});