import { addDays, endOfWeek, startOfWeek } from "date-fns";

export type CalendarEntryKind = "appointment" | "lead";

export interface CalendarEntry {
    kind: CalendarEntryKind;
    id: number;
    patientName: string;
    treatment: string | null;
    procedure: string | null;
    appointmentType: string | null;
    scheduledAt: string;
    createdAt?: string | null;
    patientId: number | null;
    leadId: number | null;
    professional: string | null;
}

export const buildCalendarEntries = (appointments: any[] = [], leads: any[] = []): CalendarEntry[] => [
    ...appointments.filter((item) => item?.scheduledAt && !Number.isNaN(new Date(item.scheduledAt).getTime())).map((item) => ({
        kind: "appointment" as const,
        id: item.id,
        patientName: item.patientName || item.patient?.name || "Paciente sem nome",
        treatment: null,
        procedure: item.procedure || null,
        appointmentType: item.appointmentType || "odontologia",
        scheduledAt: item.scheduledAt,
        createdAt: item.createdAt || null,
        patientId: item.patientId ?? null,
        leadId: null,
        professional: item.professional || null
    })),
    ...leads.filter((item) => item?.scheduledAt && item.status !== "completed" && !Number.isNaN(new Date(item.scheduledAt).getTime())).map((item) => ({
        kind: "lead" as const,
        id: item.id,
        patientName: item.name || "Solicitação sem nome",
        treatment: item.treatment || null,
        procedure: null,
        appointmentType: null,
        scheduledAt: item.scheduledAt,
        createdAt: item.createdAt || null,
        patientId: null,
        leadId: item.id,
        professional: item.professional || null
    }))
].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

export const getWeekDays = (anchorDate: Date) => {
    const monday = startOfWeek(anchorDate, { weekStartsOn: 1 });
    const sunday = endOfWeek(anchorDate, { weekStartsOn: 1 });
    const days: Date[] = [];
    for (let day = monday; day <= sunday; day = addDays(day, 1)) days.push(day);
    return days;
};

export const getDropDateTime = (day: Date, minutes: number) => {
    const value = new Date(day);
    value.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return value.toISOString();
};

const PROFESSIONAL_COLORS = ["blue", "emerald", "violet", "amber", "rose", "cyan"] as const;

export const professionalColor = (professional: string | null | undefined) => {
    if (!professional) return "slate";
    return PROFESSIONAL_COLORS[[...professional].reduce((sum, char) => sum + char.charCodeAt(0), 0) % PROFESSIONAL_COLORS.length];
};
