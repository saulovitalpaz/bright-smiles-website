import { useMemo, useState, type DragEvent } from "react";
import { addDays, addMonths, format, isSameMonth, isToday, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { type CalendarEntry, getDropDateTime, getWeekDays, professionalColor } from "@/lib/calendar";

interface CalendarViewProps {
    entries: CalendarEntry[];
    anchorDate: Date;
    onAnchorDateChange: (date: Date) => void;
    onEventOpen: (entry: CalendarEntry) => void;
    onEventDrop: (entry: CalendarEntry, scheduledAt: string) => void;
    onEventCreate?: (date: Date) => void;
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

type ViewMode = "day" | "week" | "month";

const dayKey = (date: Date) => format(date, "yyyy-MM-dd");
const dateLabel = (date: Date) => format(date, "dd/MM/yyyy");
const atNine = (day: Date) => {
    const date = new Date(day);
    date.setHours(9, 0, 0, 0);
    return date;
};
const eventSlotMinutes = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    return Math.floor((date.getHours() * 60 + date.getMinutes()) / 30) * 30;
};
const getVisibleSlotMinutes = (entries: CalendarEntry[], days: Date[]) => {
    const keys = new Set(days.map(dayKey));
    const range = entries.reduce((current, entry) => {
        const date = new Date(entry.scheduledAt);
        if (Number.isNaN(date.getTime()) || !keys.has(dayKey(date))) return current;
        const minute = eventSlotMinutes(entry.scheduledAt);
        return [Math.min(current[0], minute), Math.max(current[1], minute)];
    }, [8 * 60, 20 * 60]);
    return Array.from({ length: (range[1] - range[0]) / 30 + 1 }, (_, index) => range[0] + index * 30);
};

export const CalendarView = ({
    entries, anchorDate, onAnchorDateChange, onEventOpen, onEventDrop, onEventCreate,
}: CalendarViewProps) => {
    const [viewMode, setViewMode] = useState<ViewMode>("week");
    const days = viewMode === "week" ? getWeekDays(anchorDate) : [anchorDate];
    const entriesByDay = useMemo(() => {
        const grouped = new Map<string, CalendarEntry[]>();
        for (const entry of entries) {
            const date = new Date(entry.scheduledAt);
            if (Number.isNaN(date.getTime())) continue;
            const key = dayKey(date);
            const group = grouped.get(key) ?? [];
            group.push(entry);
            grouped.set(key, group);
        }
        grouped.forEach(group => group.sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt)));
        return grouped;
    }, [entries]);
    const dayEntries = (day: Date) => entriesByDay.get(dayKey(day)) ?? [];
    const slotMinutes = viewMode === "day" ? getVisibleSlotMinutes(entries, days) : [];
    const monthDays = viewMode === "month" ? eachDayOfInterval({
        start: startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(anchorDate), { weekStartsOn: 1 }),
    }) : [];

    const handleDrop = (event: DragEvent<HTMLElement>, day: Date, targetMinutes?: number) => {
        event.preventDefault();
        const rawId = event.dataTransfer.getData("text/calendar-entry-id");
        const kind = event.dataTransfer.getData("text/calendar-entry-kind");
        if (!rawId || !kind) return;
        const entry = entries.find(candidate => candidate.id === Number(rawId) && candidate.kind === kind);
        if (!entry) return;
        const originalDate = new Date(entry.scheduledAt);
        const minutes = targetMinutes ?? originalDate.getHours() * 60 + originalDate.getMinutes();
        onEventDrop(entry, getDropDateTime(day, minutes));
    };
    const navigatePeriod = (direction: number) => {
        onAnchorDateChange(viewMode === "month"
            ? addMonths(anchorDate, direction)
            : addDays(anchorDate, direction * (viewMode === "week" ? 7 : 1)));
    };
    const renderEvent = (entry: CalendarEntry) => {
        const time = format(new Date(entry.scheduledAt), "HH:mm");
        const procedure = entry.procedure || entry.treatment || entry.appointmentType || "Agendamento";
        const label = time + ". " + entry.patientName + ". " + procedure + ". " + (entry.professional || "Sem profissional") + ".";
        return (
            <button key={entry.kind + "-" + entry.id} type="button" draggable
                aria-label={"Abrir agendamento: " + label}
                className="calendar-event grid min-h-11 w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-left transition-colors hover:border-amber-400 hover:bg-amber-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
                onClick={() => onEventOpen(entry)}
                onDragStart={event => {
                    event.dataTransfer.setData("text/calendar-entry-id", String(entry.id));
                    event.dataTransfer.setData("text/calendar-entry-kind", entry.kind);
                    event.dataTransfer.effectAllowed = "move";
                }}>
                <time dateTime={entry.scheduledAt} className="pt-0.5 text-xs font-bold tabular-nums text-slate-800">{time}</time>
                <span className="min-w-0">
                    <span className="calendar-event__title block text-sm font-semibold leading-snug text-slate-900">{entry.patientName}</span>
                    <span className="calendar-event__detail mt-0.5 block text-xs leading-snug text-slate-600">{procedure}</span>
                    <span className={"calendar-event__professional mt-1 inline-flex max-w-full rounded px-1.5 py-0.5 text-[11px] leading-snug " + professionalClasses[professionalColor(entry.professional)]}>{entry.professional || "Sem profissional"}</span>
                    {entry.isReturn && <span className="ml-1 text-[11px] font-medium text-emerald-800">Retorno</span>}
                </span>
            </button>
        );
    };
    const renderDayAgenda = (day: Date, reveal = false) => {
        const appointments = dayEntries(day);
        return (
            <section key={dayKey(day)} aria-label={"Agendamentos de " + dateLabel(day)}
                className={"min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60" + (reveal ? " calendar-day-reveal" : "")}
                onDragOver={event => event.preventDefault()} onDrop={event => handleDrop(event, day)}>
                <div className={"flex min-h-12 items-center justify-between gap-2 border-b border-slate-200 px-3 " + (isToday(day) ? "bg-amber-50" : "bg-slate-50")}>
                    <h3 className="min-w-0 text-xs font-semibold text-slate-700">
                        <span className="capitalize">{format(day, "EEE", { locale: ptBR })}</span>{" "}
                        <span className="tabular-nums text-slate-900">{format(day, "dd/MM")}</span>
                        {isToday(day) && <span className="ml-1 text-amber-900">Hoje</span>}
                        <span className="ml-2 font-normal text-slate-500">({appointments.length})</span>
                    </h3>
                    {onEventCreate && <button type="button" aria-label={"Novo atendimento em " + dateLabel(day)} onClick={() => onEventCreate(atNine(day))} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-slate-700 hover:bg-amber-100"><Plus size={17} aria-hidden="true" /></button>}
                </div>
                {appointments.length ? <div className="space-y-2 p-2">{appointments.map(renderEvent)}</div> : <p className="px-3 py-3 text-xs text-slate-500">Sem agendamentos</p>}
            </section>
        );
    };

    return (
        <section className="calendar-view min-w-0 space-y-3">
            <div className="calendar-toolbar min-w-0 space-y-3">
                <div className="flex min-w-0 items-center justify-between gap-2">
                    <div className="min-w-0" aria-live="polite" aria-atomic="true">
                        <h2 className="break-words text-base font-semibold capitalize leading-snug text-slate-900 sm:text-lg">{format(anchorDate, viewMode === "day" ? "EEEE, dd 'de' MMMM" : "MMMM yyyy", { locale: ptBR })}</h2>
                        {viewMode === "week" && <p className="mt-0.5 text-xs text-slate-600">{format(days[0], "dd MMM", { locale: ptBR })} – {format(days[6], "dd MMM", { locale: ptBR })}</p>}
                    </div>
                    <button type="button" onClick={() => onAnchorDateChange(new Date())} className="min-h-11 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Hoje</button>
                </div>
                <div className="flex min-w-0 gap-2">
                    <div role="group" aria-label="Visualização da agenda" className="grid min-w-0 flex-1 grid-cols-3 rounded-lg border border-slate-200 bg-slate-100 p-1">
                        {([{ value: "day", label: "Dia" }, { value: "week", label: "Semana" }, { value: "month", label: "Mês" }] as const).map(mode => (
                            <button key={mode.value} type="button" aria-pressed={viewMode === mode.value} onClick={() => setViewMode(mode.value)}
                                className={"min-h-11 min-w-0 rounded-md px-1 text-xs font-semibold transition-colors " + (viewMode === mode.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:bg-white/70")}>{mode.label}</button>
                        ))}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        <button type="button" onClick={() => navigatePeriod(-1)} aria-label="Anterior" className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"><ChevronLeft size={18} aria-hidden="true" /></button>
                        <button type="button" onClick={() => navigatePeriod(1)} aria-label="Próximo" className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"><ChevronRight size={18} aria-hidden="true" /></button>
                    </div>
                </div>
            </div>

            {viewMode === "week" && <section aria-label="Agendamentos da semana" className="calendar-week-agenda">{days.map(day => renderDayAgenda(day))}</section>}

            {viewMode === "month" && (
                <div className="calendar-month-layout">
                    <div className="min-w-0">
                        <p className="mb-2 text-xs text-slate-600">Selecione uma data. O marcador indica a quantidade de agendamentos.</p>
                        <div className="grid grid-cols-7 gap-1">
                            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(day => <span key={day} className="py-2 text-center text-[11px] font-medium text-slate-600">{day}</span>)}
                            {monthDays.map(day => {
                                const count = dayEntries(day).length;
                                const selected = dayKey(day) === dayKey(anchorDate);
                                return <button key={dayKey(day)} type="button" aria-label={dateLabel(day) + ", " + count + (count === 1 ? " agendamento" : " agendamentos")}
                                    aria-pressed={selected} aria-current={isToday(day) ? "date" : undefined}
                                    className={"flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border text-sm tabular-nums transition-colors " + (selected ? "border-amber-600 bg-amber-50 font-bold text-amber-950" : isSameMonth(day, anchorDate) ? "border-slate-200 bg-white text-slate-800 hover:bg-slate-50" : "border-transparent bg-slate-50 text-slate-500")}
                                    onClick={() => onAnchorDateChange(day)}
                                    onDragOver={event => event.preventDefault()} onDrop={event => handleDrop(event, day)}>
                                    <span className={isToday(day) ? "underline decoration-amber-600 decoration-2 underline-offset-4" : ""}>{format(day, "d")}</span>
                                    <span className={"flex h-4 min-w-4 items-center justify-center rounded px-1 text-[10px] font-semibold " + (count ? "bg-slate-800 text-white" : "text-transparent")} aria-hidden="true">{count || "·"}</span>
                                </button>;
                            })}
                        </div>
                    </div>
                    {renderDayAgenda(anchorDate, true)}
                </div>
            )}

            {viewMode === "day" && (
                <section aria-label={"Horários de " + dateLabel(anchorDate)} className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {slotMinutes.map(minutes => {
                        const slotEntries = dayEntries(anchorDate).filter(entry => eventSlotMinutes(entry.scheduledAt) === minutes);
                        const time = format(new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60), "HH:mm");
                        return <div key={minutes} data-drop-minutes={minutes} className="grid min-w-0 grid-cols-[3.25rem_minmax(0,1fr)] border-b border-slate-100 last:border-0" onDragOver={event => event.preventDefault()} onDrop={event => handleDrop(event, anchorDate, minutes)}>
                            <span className="p-2 pt-3 text-xs tabular-nums text-slate-500">{time}</span>
                            <div className="min-w-0 border-l border-slate-100 p-1.5">
                                {slotEntries.length > 0 && <div className="space-y-1">{slotEntries.map(renderEvent)}</div>}
                                {onEventCreate && <button type="button" aria-label={"Criar atendimento em " + dateLabel(anchorDate) + " às " + time} onClick={() => onEventCreate(new Date(getDropDateTime(anchorDate, minutes)))} className="flex min-h-11 w-full items-center justify-center rounded-md text-slate-400 hover:bg-amber-50 hover:text-slate-700"><Plus size={15} aria-hidden="true" /></button>}
                            </div>
                        </div>;
                    })}
                </section>
            )}
        </section>
    );
};
