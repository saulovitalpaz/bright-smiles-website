import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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

afterEach(() => { vi.unstubAllGlobals(); delete (navigator as Navigator & { standalone?: boolean }).standalone; });

function mount(entries = [entry(1, 14, 15)], onEventDrop = vi.fn(), initialDate = new Date(2026, 8, 10)) {
    const onEventOpen = vi.fn();
    const onEventCreate = vi.fn();
    function Calendar() {
        const [date, setDate] = useState(initialDate);
        return <CalendarView entries={entries} anchorDate={date} onAnchorDateChange={setDate} onEventOpen={onEventOpen} onEventDrop={onEventDrop} onEventCreate={onEventCreate} />;
    }
    const result = render(<Calendar />);
    return { ...result, onEventOpen, onEventCreate, onEventDrop };
}

describe("compact calendar", () => {
    it("shows three browser day columns across the year boundary with the selected day centered", async () => {
        const previous = { ...entry(1, 9), scheduledAt: new Date(2026, 11, 31, 9).toISOString() };
        const following = { ...entry(2, 11), scheduledAt: new Date(2027, 0, 2, 11).toISOString() };
        mount([previous, following], vi.fn(), new Date(2027, 0, 1));
        await userEvent.click(screen.getByRole("button", { name: "Dia" }));
        const days = screen.getAllByRole("region", { name: /^Horários de/ });
        expect(days.map(day => day.getAttribute("aria-label"))).toEqual(["Horários de 31/12/2026", "Horários de 01/01/2027", "Horários de 02/01/2027"]);
        expect(days[1]).toHaveAttribute("data-selected", "true");
        expect(within(days[0]).getByRole("button", { name: /Abrir agendamento/ })).toHaveTextContent(previous.patientName);
        expect(within(days[2]).getByRole("button", { name: /Abrir agendamento/ })).toHaveTextContent(following.patientName);
        await userEvent.click(screen.getByRole("button", { name: "Próximo" }));
        expect(screen.getAllByRole("region", { name: /^Horários de/ })[1]).toHaveAttribute("aria-label", "Horários de 02/01/2027");
        await userEvent.click(screen.getByRole("button", { name: "Anterior" }));
        expect(screen.getAllByRole("region", { name: /^Horários de/ })[1]).toHaveAttribute("aria-label", "Horários de 01/01/2027");
    });

    it.each(["display-mode", "ios"])("keeps one detailed day in installed PWA detected by %s", async detection => {
        if (detection === "ios") Object.defineProperty(navigator, "standalone", { configurable: true, value: true });
        else vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
        mount();
        await userEvent.click(screen.getByRole("button", { name: "Dia" }));
        expect(screen.getAllByRole("region", { name: /^Horários de/ })).toHaveLength(1);
        await userEvent.click(screen.getByRole("button", { name: "Semana" }));
        expect(screen.getByRole("region", { name: "Agendamentos da semana" })).toBeInTheDocument();
        expect(screen.getAllByRole("region", { name: /^Agendamentos de/ })).toHaveLength(7);
    });

    it("labels today in the center and keeps neighboring create and drop targets on their own dates", async () => {
        const today = new Date();
        const { onEventCreate, onEventDrop } = mount([entry(1, 9)], vi.fn(), today);
        await userEvent.click(screen.getByRole("button", { name: "Dia" }));
        const days = screen.getAllByRole("region", { name: /^Horários de/ });
        expect(within(days[1]).getByText("Hoje")).toBeInTheDocument();
        const previous = new Date(today);
        previous.setDate(previous.getDate() - 1);
        previous.setHours(8, 0, 0, 0);
        await userEvent.click(within(days[0]).getAllByRole("button", { name: /Criar atendimento/ })[0]);
        expect(onEventCreate).toHaveBeenCalledWith(previous);
        const next = new Date(today);
        next.setDate(next.getDate() + 1);
        next.setHours(8, 0, 0, 0);
        fireEvent.drop(days[2].querySelector('[data-drop-minutes="480"]')!, { dataTransfer: { getData: (key: string) => key === "text/calendar-entry-id" ? "1" : "appointment" } });
        expect(onEventDrop).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), next.toISOString());
        expect(screen.getByRole("region", { name: "Agenda diária: dia anterior, selecionado e seguinte" })).toHaveClass("overflow-x-auto", "max-w-full");
    });

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
