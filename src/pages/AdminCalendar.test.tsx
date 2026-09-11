import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchClient } from "@/lib/api";
import { buildCalendarEntries, type CalendarEntry } from "@/lib/calendar";
import AdminCalendar from "./AdminCalendar";

const { invalidateQueriesMock } = vi.hoisted(() => ({
    invalidateQueriesMock: vi.fn(),
}));

vi.mock("@/components/admin/AdminLayout", () => ({
    default: ({ children, title }: { children: ReactNode; title: string }) => (
        <main aria-label={title}>{children}</main>
    ),
}));

vi.mock("@/components/admin/appointments/CalendarView", () => ({
    CalendarView: ({ onEventCreate, onEventOpen }: { onEventCreate?: (date: Date) => void; onEventOpen: (entry: CalendarEntry) => void }) => (
        <>
        <button type="button" onClick={() => onEventCreate?.(new Date(2026, 7, 14, 9, 0))}>
            Criar horário de teste
        </button>
        <button type="button" onClick={() => onEventOpen({
            kind: "appointment", id: 42, patientName: "Paciente fictício",
            procedure: "Avaliação", treatment: null, appointmentType: "odontologia",
            professional: "Dra. Sofia", scheduledAt: new Date(2026, 8, 10, 14, 15).toISOString(),
            patientId: null, leadId: null, isReturn: false,
        })}>Abrir agendamento de teste</button>
        </>
    ),
}));

vi.mock("@/lib/api", () => ({ fetchClient: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({
    useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

vi.mock("sonner", () => ({
    toast: { error: vi.fn(), success: vi.fn() },
}));

const fetchClientMock = vi.mocked(fetchClient);

const response = (body: unknown, ok = true, status = ok ? 200 : 500) => ({
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
}) as unknown as Response;

const initialResponse = (path: string) => {
    if (path === "/appointments") return response([]);
    if (path === "/staff") return response([{ id: 7, name: "Dra. Sofia", role: "dentist" }]);
    return response([]);
};

async function openCompletedManualForm() {
    const user = userEvent.setup();
    await waitFor(() => expect(fetchClientMock).toHaveBeenCalledWith("/staff"));
    await user.click(screen.getByRole("button", { name: "Criar horário de teste" }));
    await user.type(screen.getByLabelText("Paciente"), "Marina Alves");
    await user.type(screen.getByLabelText("Procedimento"), "Avaliação");
    return user;
}

describe("AdminCalendar manual calendar creation", () => {
    beforeEach(() => {
        localStorage.setItem("admin_user", JSON.stringify({ name: "Dra. Sofia", role: "admin" }));
        vi.clearAllMocks();
        invalidateQueriesMock.mockResolvedValue(undefined);
        fetchClientMock.mockImplementation(async (path) => initialResponse(String(path)));
    });

    it("keeps the modal and controlled values after an unexpected POST failure", async () => {
        fetchClientMock.mockImplementation(async (path, options) => {
            if (path === "/appointments" && options?.method === "POST") {
                return response({ error: "Prisma P2002 database detail" }, false, 500);
            }
            return initialResponse(String(path));
        });
        render(<AdminCalendar />);
        const user = await openCompletedManualForm();

        await user.click(screen.getByRole("button", { name: "Criar atendimento" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível criar o atendimento.");
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByLabelText("Paciente")).toHaveValue("Marina Alves");
        expect(screen.getByLabelText("Procedimento")).toHaveValue("Avaliação");
        expect(screen.queryByText(/Prisma P2002/)).not.toBeInTheDocument();
    });

    it("closes after success and refreshes appointment, lead, and dashboard state", async () => {
        fetchClientMock.mockImplementation(async (path) => initialResponse(String(path)));
        render(<AdminCalendar />);
        const user = await openCompletedManualForm();

        await user.click(screen.getByRole("button", { name: "Criar atendimento" }));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(fetchClientMock.mock.calls.filter(([path]) => path === "/appointments")).toHaveLength(3);
        expect(fetchClientMock.mock.calls.filter(([path]) => path === "/leads")).toHaveLength(2);
        expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["dashboard-stats"] });
        expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["leads"] });
    });

    it("reschedules without dragging only after explicit confirmation", async () => {
        render(<AdminCalendar />);
        const user = userEvent.setup();
        await waitFor(() => expect(fetchClientMock).toHaveBeenCalledWith("/staff"));
        await user.click(screen.getByRole("button", { name: "Abrir agendamento de teste" }));
        expect(screen.getByLabelText("Novo horário")).toHaveValue("2026-09-10T14:15");
        fireEvent.change(screen.getByLabelText("Novo horário"), { target: { value: "2026-09-11T15:45" } });
        await user.click(screen.getByRole("button", { name: "Revisar novo horário" }));
        expect(screen.getByRole("alertdialog")).toHaveTextContent("Confirmar novo horário");
        expect(fetchClientMock.mock.calls.some(([, options]) => options?.method === "PUT")).toBe(false);
        await user.click(screen.getByRole("button", { name: "Confirmar novo horário" }));
        await waitFor(() => expect(fetchClientMock).toHaveBeenCalledWith("/appointments/42", {
            method: "PUT", body: JSON.stringify({ scheduledAt: new Date(2026, 8, 11, 15, 45).toISOString() }),
        }));
        await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });

    it("does not send a schedule update when confirmation is cancelled", async () => {
        render(<AdminCalendar />);
        const user = userEvent.setup();
        await waitFor(() => expect(fetchClientMock).toHaveBeenCalledWith("/staff"));
        await user.click(screen.getByRole("button", { name: "Abrir agendamento de teste" }));
        fireEvent.change(screen.getByLabelText("Novo horário"), { target: { value: "2026-09-11T15:45" } });
        await user.click(screen.getByRole("button", { name: "Revisar novo horário" }));
        await user.click(screen.getByRole("button", { name: "Cancelar" }));
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
        await waitFor(() => expect(screen.getByRole("button", { name: "Abrir agendamento de teste" })).toHaveFocus());
        expect(fetchClientMock.mock.calls.some(([, options]) => options?.method === "PUT")).toBe(false);
    });

    it("focuses the details heading instead of opening the mobile keyboard and restores the card on close", async () => {
        render(<AdminCalendar />);
        const user = userEvent.setup();
        await waitFor(() => expect(fetchClientMock).toHaveBeenCalledWith("/staff"));
        const card = screen.getByRole("button", { name: "Abrir agendamento de teste" });
        await user.click(card);
        expect(screen.getByRole("heading", { name: "Detalhes do agendamento" })).toHaveFocus();
        await user.click(screen.getByRole("button", { name: "Cancelar" }));
        await waitFor(() => expect(card).toHaveFocus());
    });
});

describe("AdminCalendar return calendar state", () => {
    it("carries the linked-source marker into the calendar detail entry", () => {
        const entries = buildCalendarEntries([{
            id: 42,
            patientName: "Marina Alves",
            procedure: "Retorno: Avaliação",
            scheduledAt: "2026-08-20T16:00:00.000Z",
            parentAppointmentId: 41,
        }]);

        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({ isReturn: true });
    });

    it("keeps legacy appointments that only have the original date field", () => {
        const entries = buildCalendarEntries([{
            id: 43,
            patientName: "Paciente legado",
            procedure: "Avaliação histórica",
            date: "2026-08-21T10:30:00.000Z",
        }]);

        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({
            id: 43,
            patientName: "Paciente legado",
            scheduledAt: "2026-08-21T10:30:00.000Z",
        });
    });
});
