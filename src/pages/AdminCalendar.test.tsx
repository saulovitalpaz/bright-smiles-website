import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchClient } from "@/lib/api";
import { buildCalendarEntries } from "@/lib/calendar";
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
    CalendarView: ({ onEventCreate }: { onEventCreate?: (date: Date) => void }) => (
        <button type="button" onClick={() => onEventCreate?.(new Date(2026, 7, 14, 9, 0))}>
            Criar horário de teste
        </button>
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
});
