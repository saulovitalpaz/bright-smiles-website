import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { fetchClient } from "@/lib/api";
import AdminDashboard from "./AdminDashboard";

vi.mock("@/components/admin/AdminLayout", () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/lib/api", () => ({ fetchClient: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
const reply = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response;
const stats = {
    recentStock: [{ id: "stock-1", name: "Produto de teste", quantity: 2.5, stockUnit: "ml", stockValue: 125 }],
    users: 1, posts: 0, leads: 1, appointments: 4, pendingLeadCount: 2, testimonials: 0,
    recentLeads: [], recentTestimonials: [], recentAppointments: [],
    upcomingSchedule: [{ kind: "appointment", id: 8, patientName: "Paciente fictício", procedure: "Avaliação", scheduledAt: "2026-09-10T14:00:00Z", createdAt: "2026-09-01T14:00:00Z", patientId: 3, leadId: null }],
};
const mount = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(<MemoryRouter><QueryClientProvider client={client}><AdminDashboard /></QueryClientProvider></MemoryRouter>);
    return client;
};
beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("admin_user", JSON.stringify({ name: "Usuário de teste", role: "admin" }));
    vi.mocked(fetchClient).mockResolvedValue(reply(stats));
});

it("shows stock first, moves pending requests before feedback and links history to consultations", async () => {
    mount();
    await screen.findByText("Produto de teste");
    expect(screen.getByText(/2,5 ml/)).toBeInTheDocument();
    expect(screen.queryByText(/Consultas registradas/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver consultas" })).toHaveAttribute("href", "/admin/consultas");
    expect(screen.getByText("Solicitações pendentes").compareDocumentPosition(screen.getByText("Último comentário")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it("offers recovery instead of presenting zeros when dashboard loading fails", async () => {
    vi.mocked(fetchClient).mockResolvedValueOnce(reply({}, false)).mockResolvedValue(reply(stats));
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(/painel/i);
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Paciente fictício")).toBeInTheDocument();
});

it("keeps clinical shortcuts and actions unavailable to managers", async () => {
    localStorage.setItem("admin_user", JSON.stringify({ name: "Gestor de teste", role: "manager" }));
    mount();
    await screen.findAllByText("Paciente fictício");
    expect(screen.queryByTitle("Ver Calendário")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Agenda" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Abrir consulta/ })).not.toBeInTheDocument();
});

it("prevents repeated attendance submissions while the update is pending", async () => {
    let finish: (response: Response) => void = () => {};
    vi.mocked(fetchClient).mockImplementation(async (_path, options) => options?.method === "PUT"
        ? new Promise<Response>(resolve => { finish = resolve; }) : reply(stats));
    mount();
    await screen.findAllByText("Paciente fictício");
    const action = screen.getByRole("button", { name: /atendido/i });
    await userEvent.click(action);
    expect(action).toBeDisabled();
    await userEvent.click(action);
    expect(vi.mocked(fetchClient).mock.calls.filter(([, options]) => options?.method === "PUT")).toHaveLength(1);
    finish(reply({}));
    await waitFor(() => expect(action).not.toBeDisabled());
});
