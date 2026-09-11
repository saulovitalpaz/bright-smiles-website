import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import AdminLayout from "@/components/admin/AdminLayout";
import { CalendarView } from "@/components/admin/appointments/CalendarView";
import { fetchClient } from "@/lib/api";
import { buildCalendarEntries, CalendarEntry } from "@/lib/calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AppointmentRecord {
    id: number;
    patientName: string;
    date: string;
    scheduledAt?: string | null;
    createdAt?: string;
    procedure: string;
    notes: string;
    professional: string;
    appointmentType?: "odontologia" | "harmonizacao" | "ambos";
    status?: "scheduled" | "attended" | "cancelled";
    parentAppointmentId?: number | null;
    patientId?: number | null;
    patient?: {
        name: string;
        cpf: string;
    };
}

interface LeadRecord {
    id: number;
    name?: string | null;
    status?: string | null;
    scheduledAt?: string | null;
    treatment?: string | null;
    createdAt?: string | null;
    professional?: string | null;
}

interface StaffUser {
    id: number;
    name: string;
    role: string;
}

interface ManualAppointmentForm {
    patientName: string;
    procedure: string;
    appointmentType: "odontologia" | "harmonizacao" | "ambos";
    professional: string;
    scheduledAt: string;
    price: string;
    paymentStatus: "" | "paid" | "pending" | "courtesy";
}

const toDateTimeLocalValue = (date: Date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 16);
};

const AdminCalendar = () => {
    const queryClient = useQueryClient();
    const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
    const [leads, setLeads] = useState<LeadRecord[]>([]);
    const [staff, setStaff] = useState<StaffUser[]>([]);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [pendingDrop, setPendingDrop] = useState<{ entry: CalendarEntry; scheduledAt: string } | null>(null);
    const [pendingDetails, setPendingDetails] = useState<CalendarEntry | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [professionalDraft, setProfessionalDraft] = useState("");
    const [scheduleDraft, setScheduleDraft] = useState("");
    const [scheduleError, setScheduleError] = useState("");
    const detailsTitleRef = useRef<HTMLHeadingElement>(null);
    const calendarTriggerRef = useRef<HTMLElement | null>(null);
    const [isSavingCalendarChange, setIsSavingCalendarChange] = useState(false);
    const [manualAppointmentDate, setManualAppointmentDate] = useState<Date | null>(null);
    const [manualAppointment, setManualAppointment] = useState<ManualAppointmentForm>({
        patientName: "",
        procedure: "",
        appointmentType: "odontologia",
        professional: "",
        scheduledAt: "",
        price: "",
        paymentStatus: "",
    });
    const [manualAppointmentError, setManualAppointmentError] = useState("");
    const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);

    const userStr = localStorage.getItem("admin_user");
    const currentUser = userStr ? JSON.parse(userStr) : { name: "Profissional" };
    const calendarEntries = useMemo(() => buildCalendarEntries(appointments, leads), [appointments, leads]);

    useEffect(() => {
        void fetchAppointments();
        void fetchCalendarData();
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await fetchClient("/appointments");
            if (!res.ok) {
                toast.error("Erro ao carregar atendimentos.");
                return;
            }

            const data = await res.json();
            setAppointments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch appointments:", error);
            toast.error("Erro ao carregar atendimentos.");
        }
    };

    const fetchCalendarData = async () => {
        try {
            const [leadsResponse, usersResponse] = await Promise.all([
                fetchClient("/leads"),
                fetchClient("/staff"),
            ]);
            const [leadsBody, usersBody] = await Promise.all([
                leadsResponse.json().catch(() => ({})),
                usersResponse.json().catch(() => ({})),
            ]);

            if (!leadsResponse.ok || !usersResponse.ok) {
                throw new Error(
                    (typeof leadsBody === "object" && leadsBody && "error" in leadsBody ? String(leadsBody.error) : "") ||
                    (typeof usersBody === "object" && usersBody && "error" in usersBody ? String(usersBody.error) : "") ||
                    "Erro ao carregar agenda."
                );
            }

            const calendarLeads = Array.isArray(leadsBody) ? leadsBody as LeadRecord[] : [];
            const calendarStaff = Array.isArray(usersBody) ? usersBody as StaffUser[] : [];
            setLeads(calendarLeads);
            setStaff(calendarStaff.filter((user) => user.role !== "manager"));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao carregar agenda.");
        }
    };

    const updateCalendarEntry = async (
        entry: CalendarEntry,
        payload: { scheduledAt?: string | null; professional?: string | null }
    ) => {
        const endpoint = entry.kind === "lead" ? `/leads/${entry.leadId}` : `/appointments/${entry.id}`;
        const response = await fetchClient(endpoint, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                typeof body === "object" && body && "error" in body
                    ? String(body.error)
                    : "Não foi possível atualizar a agenda."
            );
        }

        return body;
    };

    const refreshCalendarRecords = async () => {
        await Promise.all([fetchAppointments(), fetchCalendarData()]);
    };

    const openManualAppointment = (date: Date) => {
        const defaultProfessional = staff.some((user) => user.name === currentUser.name)
            ? currentUser.name
            : staff[0]?.name || "";

        setManualAppointmentDate(date);
        setManualAppointment({
            patientName: "",
            procedure: "",
            appointmentType: "odontologia",
            professional: defaultProfessional,
            scheduledAt: toDateTimeLocalValue(date),
            price: "",
            paymentStatus: "",
        });
        setManualAppointmentError("");
    };

    const updateManualAppointment = <K extends keyof ManualAppointmentForm>(
        field: K,
        value: ManualAppointmentForm[K]
    ) => {
        setManualAppointment((current) => ({ ...current, [field]: value }));
    };

    const createManualAppointment = async () => {
        const patientName = manualAppointment.patientName.trim();
        const procedure = manualAppointment.procedure.trim();
        const professional = manualAppointment.professional.trim();
        const scheduledDate = new Date(manualAppointment.scheduledAt);

        if (!patientName || !procedure || !professional || Number.isNaN(scheduledDate.getTime())) {
            setManualAppointmentError("Preencha paciente, procedimento, profissional, data e horário.");
            return;
        }

        const payload: Record<string, string | number> = {
            patientName,
            procedure,
            appointmentType: manualAppointment.appointmentType,
            professional,
            date: scheduledDate.toISOString(),
            scheduledAt: scheduledDate.toISOString(),
        };

        if (manualAppointment.price.trim()) payload.price = Number(manualAppointment.price);
        if (manualAppointment.paymentStatus) payload.paymentStatus = manualAppointment.paymentStatus;

        setIsCreatingAppointment(true);
        setManualAppointmentError("");
        try {
            const response = await fetchClient("/appointments", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            const body = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    response.status >= 500
                        ? "Não foi possível criar o atendimento."
                        : typeof body === "object" && body && "error" in body
                            ? String(body.error)
                            : "Não foi possível criar o atendimento."
                );
            }

            await Promise.all([
                refreshCalendarRecords(),
                queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
                queryClient.invalidateQueries({ queryKey: ["leads"] }),
            ]);
            setManualAppointmentDate(null);
            toast.success("Atendimento agendado com sucesso.");
        } catch (error) {
            setManualAppointmentError(error instanceof Error ? error.message : "Não foi possível criar o atendimento.");
        } finally {
            setIsCreatingAppointment(false);
        }
    };

    const confirmDrop = async () => {
        if (!pendingDrop || isSavingCalendarChange) return;

        setIsSavingCalendarChange(true);
        try {
            await updateCalendarEntry(pendingDrop.entry, { scheduledAt: pendingDrop.scheduledAt });
            await refreshCalendarRecords();
            setPendingDrop(null);
            toast.success("Horário atualizado com sucesso.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a agenda.");
        } finally {
            setIsSavingCalendarChange(false);
        }
    };

    const reviewSchedule = () => {
        if (!pendingDetails || isSavingCalendarChange) return;
        const scheduledDate = new Date(scheduleDraft);
        if (Number.isNaN(scheduledDate.getTime())) {
            setScheduleError("Informe uma data e um horário válidos.");
            return;
        }
        setPendingDrop({ entry: pendingDetails, scheduledAt: scheduledDate.toISOString() });
        setDetailsOpen(false);
    };

    const saveProfessional = async () => {
        if (!pendingDetails || isSavingCalendarChange) return;

        const professional = professionalDraft.trim();
        if (pendingDetails.kind === "appointment" && !professional) {
            toast.error("Selecione um profissional para o atendimento.");
            return;
        }

        setIsSavingCalendarChange(true);
        try {
            await updateCalendarEntry(pendingDetails, { professional: professional || null });
            await refreshCalendarRecords();
            setDetailsOpen(false);
            toast.success("Profissional atualizado com sucesso.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a agenda.");
        } finally {
            setIsSavingCalendarChange(false);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <AdminLayout title="Calendário">
            <div className="admin-card min-w-0 w-full p-3 sm:p-4">
                <CalendarView
                    entries={calendarEntries}
                    anchorDate={calendarDate}
                    onAnchorDateChange={setCalendarDate}
                    onEventOpen={(entry) => {
                        calendarTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                        setPendingDetails(entry);
                        setDetailsOpen(true);
                        setProfessionalDraft(entry.professional || "");
                        setScheduleDraft(toDateTimeLocalValue(new Date(entry.scheduledAt)));
                        setScheduleError("");
                    }}
                    onEventDrop={(entry, scheduledAt) => {
                        calendarTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                        setPendingDrop({ entry, scheduledAt });
                    }}
                    onEventCreate={openManualAppointment}
                />
            </div>

            <Dialog
                open={Boolean(manualAppointmentDate)}
                onOpenChange={(open) => {
                    if (!open && !isCreatingAppointment) {
                        setManualAppointmentDate(null);
                        setManualAppointmentError("");
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Novo atendimento</DialogTitle>
                        <DialogDescription>
                            Cadastre um atendimento diretamente no horário selecionado da agenda.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="manual-patient-name">Paciente</Label>
                            <Input
                                id="manual-patient-name"
                                value={manualAppointment.patientName}
                                onChange={(event) => updateManualAppointment("patientName", event.target.value)}
                                autoComplete="name"
                                disabled={isCreatingAppointment}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manual-procedure">Procedimento</Label>
                            <Input
                                id="manual-procedure"
                                value={manualAppointment.procedure}
                                onChange={(event) => updateManualAppointment("procedure", event.target.value)}
                                disabled={isCreatingAppointment}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manual-appointment-type">Tipo de atendimento</Label>
                            <Select
                                value={manualAppointment.appointmentType}
                                onValueChange={(value: ManualAppointmentForm["appointmentType"]) => updateManualAppointment("appointmentType", value)}
                                disabled={isCreatingAppointment}
                            >
                                <SelectTrigger id="manual-appointment-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="odontologia">Odontologia</SelectItem>
                                    <SelectItem value="harmonizacao">Harmonização facial</SelectItem>
                                    <SelectItem value="ambos">Ambos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manual-professional">Profissional</Label>
                            <Select
                                value={manualAppointment.professional}
                                onValueChange={(value) => updateManualAppointment("professional", value)}
                                disabled={isCreatingAppointment}
                            >
                                <SelectTrigger id="manual-professional">
                                    <SelectValue placeholder="Selecione o profissional" />
                                </SelectTrigger>
                                <SelectContent>
                                    {staff.map((user) => (
                                        <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manual-scheduled-at">Data e horário</Label>
                            <Input
                                id="manual-scheduled-at"
                                type="datetime-local"
                                value={manualAppointment.scheduledAt}
                                onChange={(event) => updateManualAppointment("scheduledAt", event.target.value)}
                                disabled={isCreatingAppointment}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manual-price">Valor (opcional)</Label>
                            <Input
                                id="manual-price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={manualAppointment.price}
                                onChange={(event) => updateManualAppointment("price", event.target.value)}
                                disabled={isCreatingAppointment}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manual-payment-status">Status do pagamento (opcional)</Label>
                            <Select
                                value={manualAppointment.paymentStatus || "unspecified"}
                                onValueChange={(value) => updateManualAppointment("paymentStatus", value === "unspecified" ? "" : value as ManualAppointmentForm["paymentStatus"])}
                                disabled={isCreatingAppointment}
                            >
                                <SelectTrigger id="manual-payment-status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unspecified">Não informado</SelectItem>
                                    <SelectItem value="paid">Recebido</SelectItem>
                                    <SelectItem value="pending">A receber</SelectItem>
                                    <SelectItem value="courtesy">Cortesia / retorno</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {manualAppointmentError && (
                        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                            {manualAppointmentError}
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setManualAppointmentDate(null)}
                            disabled={isCreatingAppointment}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={() => void createManualAppointment()}
                            disabled={isCreatingAppointment}
                        >
                            {isCreatingAppointment ? "Salvando..." : "Criar atendimento"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={Boolean(pendingDrop)}
                onOpenChange={(open) => {
                    if (!open && !isSavingCalendarChange) setPendingDrop(null);
                }}
            >
                <AlertDialogContent onCloseAutoFocus={event => { event.preventDefault(); calendarTriggerRef.current?.focus(); }}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar novo horário</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingDrop && (
                                <>
                                    Você deseja mover {pendingDrop.entry.patientName} de {formatDate(pendingDrop.entry.scheduledAt)} para {formatDate(pendingDrop.scheduledAt)}?
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSavingCalendarChange}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isSavingCalendarChange}
                            onClick={(event) => {
                                event.preventDefault();
                                void confirmDrop();
                            }}
                        >
                            Confirmar novo horário
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog
                open={detailsOpen}
                onOpenChange={(open) => {
                    if (!open && !isSavingCalendarChange) setDetailsOpen(false);
                }}
            >
                <DialogContent className="calendar-detail-dialog max-h-[90dvh] w-[calc(100%-1.5rem)] overflow-y-auto overscroll-contain rounded-xl" overlayClassName="calendar-detail-overlay"
                    onOpenAutoFocus={event => { event.preventDefault(); detailsTitleRef.current?.focus(); }}
                    onCloseAutoFocus={event => {
                        event.preventDefault();
                        if (!pendingDrop) calendarTriggerRef.current?.focus();
                    }}>
                    <DialogHeader className="pr-8 text-left">
                        <DialogTitle ref={detailsTitleRef} tabIndex={-1}>Detalhes do agendamento</DialogTitle>
                        <DialogDescription>
                            Consulte os detalhes, reagende ou altere o profissional responsável.
                        </DialogDescription>
                    </DialogHeader>
                    {pendingDetails && (
                        <div className="min-w-0 space-y-4 break-words text-sm text-slate-700">
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-500">Paciente</p>
                                <p className="font-semibold text-slate-900">{pendingDetails.patientName}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-500">Tratamento/procedimento</p>
                                <p>{pendingDetails.treatment || pendingDetails.procedure || pendingDetails.appointmentType || "Agendamento"}</p>
                            </div>
                            {pendingDetails.isReturn && (
                                <div>
                                    <p className="text-xs font-medium uppercase text-slate-500">Vínculo</p>
                                    <p className="font-medium text-emerald-700">Retorno vinculado a uma consulta anterior</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-500">Data e horário</p>
                                <p>{formatDate(pendingDetails.scheduledAt)}</p>
                            </div>
                            <div className="min-w-0 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <Label htmlFor="calendar-new-schedule">Novo horário</Label>
                                <Input id="calendar-new-schedule" name="scheduledAt" type="datetime-local" autoComplete="off" className="min-h-11 min-w-0 max-w-full"
                                    value={scheduleDraft} disabled={isSavingCalendarChange}
                                    aria-invalid={Boolean(scheduleError)} aria-describedby={scheduleError ? "calendar-schedule-error" : "calendar-schedule-help"}
                                    onChange={event => { setScheduleDraft(event.target.value); setScheduleError(""); }} />
                                <p id="calendar-schedule-help" className="text-xs text-slate-600">Você revisará a mudança antes de confirmar. O profissional será mantido.</p>
                                {scheduleError && <p id="calendar-schedule-error" role="alert" className="text-xs text-red-700">{scheduleError}</p>}
                                <Button type="button" variant="outline" className="min-h-11 w-full" onClick={reviewSchedule}
                                    disabled={isSavingCalendarChange || scheduleDraft === toDateTimeLocalValue(new Date(pendingDetails.scheduledAt))}>
                                    Revisar novo horário
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="calendar-professional">Profissional</Label>
                                <Select
                                    value={professionalDraft || (pendingDetails.kind === "lead" ? "unassigned" : "")}
                                    onValueChange={(value) => setProfessionalDraft(value === "unassigned" ? "" : value)}
                                    disabled={isSavingCalendarChange}
                                >
                                    <SelectTrigger id="calendar-professional" className="min-h-11">
                                        <SelectValue placeholder="Selecione o profissional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pendingDetails.kind === "lead" && (
                                            <SelectItem value="unassigned">Sem profissional</SelectItem>
                                        )}
                                        {staff.map((user) => (
                                            <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-xs text-slate-500">A alteração do profissional é salva separadamente do horário.</p>
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" className="min-h-11" onClick={() => setDetailsOpen(false)} disabled={isSavingCalendarChange}>
                            Cancelar
                        </Button>
                        <Button type="button" className="min-h-11" onClick={() => void saveProfessional()} disabled={isSavingCalendarChange}>
                            Salvar profissional
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
};

export default AdminCalendar;
