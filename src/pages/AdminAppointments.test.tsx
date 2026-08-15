import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchClient } from "@/lib/api";
import AdminAppointments from "./AdminAppointments";

const { invalidateQueriesMock, navigateMock } = vi.hoisted(() => ({
    invalidateQueriesMock: vi.fn(),
    navigateMock: vi.fn(),
}));

vi.mock("@/components/admin/AdminLayout", () => ({
    default: ({ children, title }: { children: ReactNode; title: string }) => (
        <main aria-label={title}>{children}</main>
    ),
}));

vi.mock("@/lib/api", () => ({ fetchClient: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({
    useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

vi.mock("react-router-dom", () => ({
    useNavigate: () => navigateMock,
    useSearchParams: () => [new URLSearchParams()],
}));

vi.mock("sonner", () => ({
    toast: { error: vi.fn(), success: vi.fn() },
}));

const fetchClientMock = vi.mocked(fetchClient);

const response = (body: unknown, ok = true) => ({
    ok,
    json: vi.fn().mockResolvedValue(body),
}) as unknown as Response;

describe("AdminAppointments", () => {
    beforeEach(() => {
        localStorage.setItem("admin_user", JSON.stringify({ name: "Dra. Sofia", role: "admin" }));
        vi.clearAllMocks();
        fetchClientMock.mockResolvedValue(response([
            {
                id: 1,
                patientId: 11,
                patientName: "Marina Alves",
                cpf: "12345678900",
                date: "2026-08-20T10:00:00.000Z",
                scheduledAt: "2026-08-20T10:00:00.000Z",
                procedure: "Consulta de avaliação",
                notes: "",
                professional: "Dra. Sofia",
            },
            {
                id: 2,
                patientId: 12,
                patientName: "Carlos Lima",
                cpf: "98765432100",
                date: "2026-08-21T14:00:00.000Z",
                scheduledAt: "2026-08-21T14:00:00.000Z",
                procedure: "Consulta de retorno",
                notes: "",
                professional: "Dr. Pedro",
            },
        ]));
    });

    it("shows only the appointment list and filters by patient or local date", async () => {
        render(<AdminAppointments />);
        const user = userEvent.setup();

        expect(await screen.findByText("Marina Alves")).toBeInTheDocument();
        expect(screen.getByText("Carlos Lima")).toBeInTheDocument();

        await user.type(screen.getByLabelText("Pesquisar paciente ou CPF"), "Marina");
        expect(screen.getByText("Marina Alves")).toBeInTheDocument();
        expect(screen.queryByText("Carlos Lima")).not.toBeInTheDocument();

        await user.clear(screen.getByLabelText("Pesquisar paciente ou CPF"));
        await user.type(screen.getByLabelText("Filtrar por data"), "2026-08-20");

        expect(screen.getByText("Consulta de avaliação")).toBeInTheDocument();
        expect(screen.queryByText("Consulta de retorno")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Criar horário de teste" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Calendário" })).not.toBeInTheDocument();
    });

    it("navigates to the appointment detail from the list", async () => {
        render(<AdminAppointments />);

        const [firstAction] = await screen.findAllByRole("button", { name: "Ver Evolução" });
        await userEvent.setup().click(firstAction);

        expect(navigateMock).toHaveBeenCalledWith("/admin/consultas/1?patientId=11");
    });

    it("shows an empty state when no records match both filters", async () => {
        render(<AdminAppointments />);
        const user = userEvent.setup();

        await screen.findByText("Marina Alves");
        await user.type(screen.getByLabelText("Pesquisar paciente ou CPF"), "Paciente inexistente");
        await user.type(screen.getByLabelText("Filtrar por data"), "2026-08-22");

        await waitFor(() => {
            expect(screen.getByText("Nenhum atendimento encontrado")).toBeInTheDocument();
        });
    });
});
