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
    isReturn: boolean;
}

interface CalendarAppointmentInput {
    id: number;
    patientName?: string | null;
    patient?: { name?: string | null } | null;
    procedure?: string | null;
    appointmentType?: string | null;
    date?: string | null;
    scheduledAt?: string | null;
    status?: "scheduled" | "attended" | "cancelled" | null;
    createdAt?: string | null;
    patientId?: number | null;
    professional?: string | null;
    parentAppointmentId?: number | null;
}

interface CalendarLeadInput {
    id: number;
    name?: string | null;
    status?: string | null;
    scheduledAt?: string | null;
    treatment?: string | null;
    createdAt?: string | null;
    professional?: string | null;
}

type ScheduledCalendarLead = CalendarLeadInput & { scheduledAt: string };

const getAppointmentScheduledAt = (item: CalendarAppointmentInput) => {
    const candidates = [item.scheduledAt, item.date];
    return candidates.find((value): value is string =>
        typeof value === "string" && !Number.isNaN(new Date(value).getTime())
    ) || null;
};

const hasScheduledLead = (item: CalendarLeadInput): item is ScheduledCalendarLead =>
    typeof item.scheduledAt === "string" && !Number.isNaN(new Date(item.scheduledAt).getTime());

export const buildCalendarEntries = (
    appointments: CalendarAppointmentInput[] = [],
    leads: CalendarLeadInput[] = []
): CalendarEntry[] => [
    ...appointments.flatMap((item) => {
        const scheduledAt = getAppointmentScheduledAt(item);
        if (!scheduledAt || item.status === "attended" || item.status === "cancelled") return [];

        return [{
            kind: "appointment" as const,
            id: item.id,
            patientName: item.patientName || item.patient?.name || "Paciente sem nome",
            treatment: null,
            procedure: item.procedure || null,
            appointmentType: item.appointmentType || "odontologia",
            scheduledAt,
            createdAt: item.createdAt || null,
            patientId: item.patientId ?? null,
            leadId: null,
            professional: item.professional || null,
            isReturn: Boolean(item.parentAppointmentId)
        }];
    }),
    ...leads.filter((item) => item.status !== "completed" && hasScheduledLead(item)).map((item) => ({
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
        professional: item.professional || null,
        isReturn: false
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
