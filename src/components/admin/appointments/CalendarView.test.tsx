import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CalendarEntry } from "@/lib/calendar";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CalendarView } from "./CalendarView";

const entry = (id: number, hour: number, minute = 0): CalendarEntry => ({
    kind: "appointment", id, patientName: "Paciente fictício " + id,
    procedure: "Avaliação", treatment: null, appointmentType: "odontologia",
    professional: "Profissional de teste", scheduledAt: new Date(2026, 8, 10, hour, minute).toISOString(),
    patientId: id, leadId: null, isReturn: false,
});

function mount(entries = [entry(1, 14, 15)], onEventDrop = vi.fn()) {
    const onEventOpen = vi.fn();
    const onEventCreate = vi.fn();
    function Calendar() {
        const [date, setDate] = useState(new Date(2026, 8, 10));
        return <CalendarView entries={entries} anchorDate={date} onAnchorDateChange={setDate} onEventOpen={onEventOpen} onEventDrop={onEventDrop} onEventCreate={onEventCreate} />;
    }
    const result = render(<Calendar />);
    return { ...result, onEventOpen, onEventCreate, onEventDrop };
}

describe("compact calendar", () => {
    it("shows weekly appointments chronologically without empty hourly slots", async () => {
        const { container, onEventOpen } = mount([entry(2, 18), entry(1, 9, 15)]);
        const week = screen.getByRole("region", { name: "Agendamentos da semana" });
        const events = within(week).getAllByRole("button", { name: /Abrir agendamento/ });
        expect(events[0]).toHaveTextContent("09:15");
        expect(events[0]).toHaveTextContent("Paciente fictício 1");
        expect(events[1]).toHaveTextContent("18:00");
        expect(container.querySelectorAll("[data-drop-minutes]")).toHaveLength(0);
        await userEvent.click(events[0]);
        expect(onEventOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    });

    it("selects a month date and exposes every appointment instead of a truncated preview", async () => {
        const { onEventCreate } = mount(Array.from({ length: 6 }, (_, index) => entry(index + 1, 9 + index)));
        await userEvent.click(screen.getByRole("button", { name: "Mês" }));
        const date = screen.getByRole("button", { name: "10/09/2026, 6 agendamentos" });
        await userEvent.click(date);
        expect(date).toHaveAttribute("aria-pressed", "true");
        expect(within(screen.getByRole("region", { name: "Agendamentos de 10/09/2026" })).getAllByRole("button", { name: /Abrir agendamento/ })).toHaveLength(6);
        expect(onEventCreate).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole("button", { name: "Novo atendimento em 10/09/2026" }));
        expect(onEventCreate).toHaveBeenCalledWith(new Date(2026, 8, 10, 9));
    });

    it("preserves the appointment's precise time when moving between week days", () => {
        const onDrop = vi.fn();
        mount([entry(1, 14, 15)], onDrop);
        const day = screen.getByRole("region", { name: "Agendamentos de 11/09/2026" });
        fireEvent.drop(day, { dataTransfer: { getData: (key: string) => key === "text/calendar-entry-id" ? "1" : "appointment" } });
        expect(onDrop).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), new Date(2026, 8, 11, 14, 15).toISOString());
    });

    it("keeps late appointments and keyboard creation in the detailed day view", async () => {
        const { onEventCreate } = mount([entry(1, 23, 45)]);
        await userEvent.click(screen.getByRole("button", { name: "Dia" }));
        expect(screen.getByRole("button", { name: /Abrir agendamento/ })).toHaveTextContent("23:45");
        const create = screen.getByRole("button", { name: "Criar atendimento em 10/09/2026 às 23:30" });
        create.focus();
        await userEvent.keyboard("{Enter}");
        expect(onEventCreate).toHaveBeenCalledWith(new Date(2026, 8, 10, 23, 30));
    });

    it("reveals only the selected month agenda with a short reduced-motion-safe fade", async () => {
        mount();
        await userEvent.click(screen.getByRole("button", { name: "Mês" }));
        const originalDay = screen.getByRole("region", { name: "Agendamentos de 10/09/2026" });
        expect(originalDay).toHaveClass("calendar-day-reveal");
        await userEvent.click(screen.getByRole("button", { name: "11/09/2026, 0 agendamentos" }));
        expect(originalDay).not.toBeInTheDocument();
        expect(screen.getByRole("region", { name: "Agendamentos de 11/09/2026" })).toHaveClass("calendar-day-reveal");
        const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
        expect(css).toMatch(/\.calendar-day-reveal\s*\{\s*animation: calendar-reveal 140ms ease-out/);
        expect(css).toMatch(/\.calendar-detail-dialog\[data-state="open"\]\s*\{\s*animation: calendar-reveal 160ms ease-out/);
        expect(css).toMatch(/\.calendar-detail-dialog\[data-state="closed"\]\s*\{\s*animation: calendar-dismiss 100ms ease-in/);
        expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.calendar-day-reveal,\s*\.calendar-detail-dialog\[data-state\]\s*\{\s*animation: none/);
    });
});
