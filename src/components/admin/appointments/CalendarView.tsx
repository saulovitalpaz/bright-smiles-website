import { useState } from "react";
import { addDays, addMonths, subDays, subMonths, format, isSameDay, isSameMonth, isToday, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
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

const eventSlotMinutes = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    return Math.floor((date.getHours() * 60 + date.getMinutes()) / 30) * 30;
};

const getVisibleSlotMinutes = (entries: CalendarEntry[], days: Date[]) => {
    const weeklyEntryMinutes = entries
        .filter((entry) => days.some((day) => isSameDay(new Date(entry.scheduledAt), day)))
        .map((entry) => eventSlotMinutes(entry.scheduledAt));
    const firstMinute = Math.max(0, Math.floor(Math.min(8 * 60, ...weeklyEntryMinutes) / 30) * 30);
    const lastMinute = Math.min(23 * 60, Math.ceil(Math.max(20 * 60, ...weeklyEntryMinutes) / 30) * 30);

    return Array.from({ length: (lastMinute - firstMinute) / 30 + 1 }, (_, index) => firstMinute + index * 30);
};

export const CalendarView = ({
    entries,
    anchorDate,
    onAnchorDateChange,
    onEventOpen,
    onEventDrop,
    onEventCreate
}: CalendarViewProps) => {
    const [viewMode, setViewMode] = useState<ViewMode>("week");

    const days = viewMode === "day" 
        ? [anchorDate] 
        : viewMode === "week"
        ? getWeekDays(anchorDate)
        : []; 

    const slotMinutes = viewMode !== "month" ? getVisibleSlotMinutes(entries, days) : [];

    const handleDrop = (event: React.DragEvent<HTMLDivElement>, day: Date, minutes: number) => {
        event.preventDefault();
        const id = Number(event.dataTransfer.getData("text/calendar-entry-id"));
        const kind = event.dataTransfer.getData("text/calendar-entry-kind");
        const entry = entries.find((candidate) => candidate.id === id && candidate.kind === kind);

        if (entry) onEventDrop(entry, getDropDateTime(day, minutes));
    };

    const renderEvent = (entry: CalendarEntry) => {
        const color = professionalColor(entry.professional);
        return (
            <button
                key={`${entry.kind}-${entry.id}`}
                type="button"
                draggable
                className={`mb-1 w-full rounded-md border border-slate-200 bg-white p-2 text-left shadow-sm hover:border-slate-300 ${viewMode === 'month' ? 'truncate p-1' : ''}`}
                onClick={(e) => { e.stopPropagation(); onEventOpen(entry); }}
                onDragStart={(event) => {
                    event.dataTransfer.setData("text/calendar-entry-id", String(entry.id));
                    event.dataTransfer.setData("text/calendar-entry-kind", entry.kind);
                }}
            >
                <p className="truncate text-[10px] font-semibold text-slate-900">{entry.patientName}</p>
                {viewMode !== 'month' && (
                    <p className="truncate text-[10px] text-slate-500">{entry.procedure || entry.treatment || entry.appointmentType || "Agendamento"}</p>
                )}
                {viewMode !== 'month' && (
                    <span className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[9px] font-medium ${professionalClasses[color]}`}>
                        {entry.professional || "Sem prof."}
                    </span>
                )}
            </button>
        );
    };

    const handlePrevious = () => {
        if (viewMode === "day") onAnchorDateChange(subDays(anchorDate, 1));
        else if (viewMode === "week") onAnchorDateChange(subDays(anchorDate, 7));
        else onAnchorDateChange(subMonths(anchorDate, 1));
    };

    const handleNext = () => {
        if (viewMode === "day") onAnchorDateChange(addDays(anchorDate, 1));
        else if (viewMode === "week") onAnchorDateChange(addDays(anchorDate, 7));
        else onAnchorDateChange(addMonths(anchorDate, 1));
    };

    const getMonthDays = () => {
        const start = startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 0 }); // 0 is Sunday
        const end = endOfWeek(endOfMonth(anchorDate), { weekStartsOn: 0 });
        return eachDayOfInterval({ start, end });
    };

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 capitalize">
                            {format(anchorDate, viewMode === "month" ? "MMMM yyyy" : viewMode === "day" ? "EEEE, dd 'de' MMMM" : "MMMM yyyy", { locale: ptBR })}
                        </h2>
                        {viewMode === "week" && (
                            <p className="text-sm text-slate-500">
                                {format(days[0], "dd 'de' MMM", { locale: ptBR })} – {format(days[6], "dd 'de' MMM", { locale: ptBR })}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-md border border-slate-200 p-0.5 mr-2 bg-slate-50">
                        <button
                            type="button"
                            onClick={() => setViewMode("day")}
                            className={`px-3 py-1.5 text-xs font-medium rounded ${viewMode === "day" ? "bg-white shadow-sm text-primary" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            Dia
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("week")}
                            className={`px-3 py-1.5 text-xs font-medium rounded ${viewMode === "week" ? "bg-white shadow-sm text-primary" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            Semana
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("month")}
                            className={`px-3 py-1.5 text-xs font-medium rounded ${viewMode === "month" ? "bg-white shadow-sm text-primary" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            Mês
                        </button>
                    </div>

                    <div className="flex items-center gap-1">
                        <button type="button" onClick={handlePrevious} className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50" aria-label="Anterior">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => onAnchorDateChange(new Date())} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                            Hoje
                        </button>
                        <button type="button" onClick={handleNext} className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50" aria-label="Próximo">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="admin-scroll-region rounded-lg border border-slate-200 bg-white">
                {viewMode === "month" ? (
                    <div className="min-w-full md:min-w-[700px]">
                        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                                <div key={d} className="px-2 py-2 text-center text-xs font-medium uppercase text-slate-500">
                                    {d}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 auto-rows-fr">
                            {getMonthDays().map((day, idx) => {
                                const dayEntries = entries.filter(e => isSameDay(new Date(e.scheduledAt), day));
                                const isCurrentMonth = isSameMonth(day, anchorDate);
                                return (
                                    <div 
                                        key={idx} 
                                        className={`min-h-[100px] border-b border-r border-slate-200 p-1 cursor-pointer transition-colors hover:bg-slate-50 ${isCurrentMonth ? 'bg-white' : 'bg-slate-50/50'}`}
                                        onClick={() => onEventCreate && onEventCreate(new Date(day.setHours(9, 0, 0, 0)))}
                                    >
                                        <div className={`text-right text-xs p-1 mb-1 font-semibold ${isToday(day) ? 'text-primary bg-primary/10 rounded w-fit ml-auto px-2' : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}`}>
                                            {format(day, 'd')}
                                        </div>
                                        <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                                            {dayEntries.slice(0, 4).map(renderEvent)}
                                            {dayEntries.length > 4 && (
                                                <div className="text-[10px] text-slate-500 text-center font-medium bg-slate-100 rounded py-0.5">
                                                    + {dayEntries.length - 4} mais
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="min-w-full">
                        <div className={`grid border-b border-slate-200 bg-slate-50 ${viewMode === 'day' ? 'grid-cols-[72px_1fr]' : 'grid-cols-[45px_repeat(7,minmax(0,1fr))] md:grid-cols-[72px_repeat(7,minmax(120px,1fr))]'}`}>
                            <div />
                            {days.map((day) => (
                                <div key={day.toISOString()} className="border-l border-slate-200 px-1 md:px-3 py-2 text-center overflow-hidden">
                                    <p className="text-[10px] md:text-xs font-medium uppercase text-slate-500 truncate">{format(day, "EEE", { locale: ptBR })}</p>
                                    <p className={`text-[11px] md:text-sm font-semibold ${isToday(day) ? 'text-primary' : 'text-slate-900'} truncate`}>{format(day, "dd/MM")}</p>
                                </div>
                            ))}
                        </div>

                        {slotMinutes.map((minutes) => {
                            const isFractional = minutes % 60 !== 0;
                            const hasEntriesInRow = days.some((day) => 
                                entries.some((entry) => isSameDay(new Date(entry.scheduledAt), day) && eventSlotMinutes(entry.scheduledAt) === minutes)
                            );

                            // On week view, hide fractional hours that have no appointments to save vertical space
                            if (viewMode === 'week' && isFractional && !hasEntriesInRow) {
                                return (
                                    <div key={minutes} className={`hidden md:grid ${viewMode === 'day' ? 'grid-cols-[72px_1fr]' : 'grid-cols-[45px_repeat(7,minmax(0,1fr))] md:grid-cols-[72px_repeat(7,minmax(120px,1fr))]'}`}>
                                        <div className="border-b border-slate-200 px-1 md:px-3 py-3 text-[10px] md:text-xs text-slate-500 text-center md:text-left">
                                            {format(new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60), "HH:mm")}
                                        </div>
                                        {days.map((day) => (
                                            <div key={day.toISOString()} className="min-h-14 border-b border-l border-slate-200 p-1 transition-colors hover:bg-slate-50 cursor-pointer" />
                                        ))}
                                    </div>
                                );
                            }

                            return (
                                <div key={minutes} className={`grid ${viewMode === 'day' ? 'grid-cols-[72px_1fr]' : 'grid-cols-[45px_repeat(7,minmax(0,1fr))] md:grid-cols-[72px_repeat(7,minmax(120px,1fr))]'}`}>
                                    <div className="border-b border-slate-200 px-1 md:px-3 py-3 text-[10px] md:text-xs text-slate-500 text-center md:text-left">
                                        {format(new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60), "HH:mm")}
                                    </div>
                                    {days.map((day) => {
                                        const slotEntries = entries.filter((entry) => isSameDay(new Date(entry.scheduledAt), day) && eventSlotMinutes(entry.scheduledAt) === minutes);

                                    return (
                                        <div
                                            key={day.toISOString()}
                                            data-drop-minutes={minutes}
                                            className="min-h-14 border-b border-l border-slate-200 p-1 transition-colors hover:bg-slate-50 cursor-pointer"
                                            onClick={() => {
                                                if (onEventCreate) {
                                                    const newDate = new Date(day);
                                                    newDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
                                                    onEventCreate(newDate);
                                                }
                                            }}
                                            onDragOver={(event) => event.preventDefault()}
                                            onDrop={(event) => handleDrop(event, day, minutes)}
                                        >
                                            {slotEntries.map(renderEvent)}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};
