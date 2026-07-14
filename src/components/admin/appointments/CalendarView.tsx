import { addDays, format, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
    CalendarEntry,
    getDropDateTime,
    getWeekDays,
    professionalColor
} from "@/lib/calendar";

interface CalendarViewProps {
    entries: CalendarEntry[];
    anchorDate: Date;
    onAnchorDateChange: (date: Date) => void;
    onEventOpen: (entry: CalendarEntry) => void;
    onEventDrop: (entry: CalendarEntry, scheduledAt: string) => void;
}

const professionalClasses = {
    blue: "bg-blue-100 text-blue-800",
    emerald: "bg-emerald-100 text-emerald-800",
    violet: "bg-violet-100 text-violet-800",
    amber: "bg-amber-100 text-amber-800",
    rose: "bg-rose-100 text-rose-800",
    cyan: "bg-cyan-100 text-cyan-800",
    slate: "bg-slate-100 text-slate-700"
} as const;

const eventSlotMinutes = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    return Math.floor((date.getHours() * 60 + date.getMinutes()) / 30) * 30;
};

const getVisibleSlotMinutes = (entries: CalendarEntry[], days: Date[]) => {
    const weeklyEntryMinutes = entries
        .filter((entry) => days.some((day) => isSameDay(new Date(entry.scheduledAt), day)))
        .map((entry) => eventSlotMinutes(entry.scheduledAt));
    const firstMinute = Math.floor(Math.min(8 * 60, ...weeklyEntryMinutes) / 30) * 30;
    const lastMinute = Math.ceil(Math.max(20 * 60, ...weeklyEntryMinutes) / 30) * 30;

    return Array.from({ length: (lastMinute - firstMinute) / 30 + 1 }, (_, index) => firstMinute + index * 30);
};

export const CalendarView = ({
    entries,
    anchorDate,
    onAnchorDateChange,
    onEventOpen,
    onEventDrop
}: CalendarViewProps) => {
    const days = getWeekDays(anchorDate);
    const slotMinutes = getVisibleSlotMinutes(entries, days);

    const handleDrop = (event: React.DragEvent<HTMLDivElement>, day: Date, minutes: number) => {
        event.preventDefault();
        const id = Number(event.dataTransfer.getData("text/calendar-entry-id"));
        const kind = event.dataTransfer.getData("text/calendar-entry-kind");
        const entry = entries.find((candidate) => candidate.id === id && candidate.kind === kind);

        if (entry) onEventDrop(entry, getDropDateTime(day, minutes));
    };

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Agenda semanal</h2>
                    <p className="text-sm text-slate-500">
                        {format(days[0], "dd 'de' MMM")} – {format(days[6], "dd 'de' MMM")}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => onAnchorDateChange(addDays(anchorDate, -7))} className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50" aria-label="Semana anterior">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => onAnchorDateChange(new Date())} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Hoje
                    </button>
                    <button type="button" onClick={() => onAnchorDateChange(addDays(anchorDate, 7))} className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50" aria-label="Próxima semana">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
                <div className="min-w-[980px]">
                    <div className="grid grid-cols-[72px_repeat(7,minmax(128px,1fr))] border-b border-slate-200 bg-slate-50">
                        <div />
                        {days.map((day) => (
                            <div key={day.toISOString()} className="border-l border-slate-200 px-3 py-2 text-center">
                                <p className="text-xs font-medium uppercase text-slate-500">{format(day, "EEE")}</p>
                                <p className="text-sm font-semibold text-slate-900">{format(day, "dd/MM")}</p>
                            </div>
                        ))}
                    </div>

                    {slotMinutes.map((minutes) => (
                        <div key={minutes} className="grid grid-cols-[72px_repeat(7,minmax(128px,1fr))]">
                            <div className="border-b border-slate-200 px-3 py-3 text-xs text-slate-500">{format(new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60), "HH:mm")}</div>
                            {days.map((day) => {
                                const slotEntries = entries.filter((entry) => isSameDay(new Date(entry.scheduledAt), day) && eventSlotMinutes(entry.scheduledAt) === minutes);

                                return (
                                    <div
                                        key={day.toISOString()}
                                        data-drop-minutes={minutes}
                                        className="min-h-14 border-b border-l border-slate-200 p-1"
                                        onDragOver={(event) => event.preventDefault()}
                                        onDrop={(event) => handleDrop(event, day, minutes)}
                                    >
                                        {slotEntries.map((entry) => {
                                            const color = professionalColor(entry.professional);
                                            return (
                                                <button
                                                    key={`${entry.kind}-${entry.id}`}
                                                    type="button"
                                                    draggable
                                                    className="mb-1 w-full rounded-md border border-slate-200 bg-white p-2 text-left shadow-sm hover:border-slate-300"
                                                    onClick={() => onEventOpen(entry)}
                                                    onDragStart={(event) => {
                                                        event.dataTransfer.setData("text/calendar-entry-id", String(entry.id));
                                                        event.dataTransfer.setData("text/calendar-entry-kind", entry.kind);
                                                    }}
                                                >
                                                    <p className="truncate text-xs font-semibold text-slate-900">{entry.patientName}</p>
                                                    <p className="truncate text-xs text-slate-500">{entry.procedure || entry.treatment || entry.appointmentType || "Agendamento"}</p>
                                                    <span className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${professionalClasses[color]}`}>
                                                        {entry.professional || "Profissional não atribuído"}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
