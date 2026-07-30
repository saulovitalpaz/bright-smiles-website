import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { fetchClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, User, History, Plus, Trash2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarView } from "@/components/admin/appointments/CalendarView";
import { buildCalendarEntries, CalendarEntry } from "@/lib/calendar";

interface AppointmentRecord {
    id: number;
    patientId?: number | null;
    patientName: string;
    cpf?: string;
    date: string;
    scheduledAt?: string | null;
    createdAt?: string;
    procedure: string;
    notes: string;
    professional: string;
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

const AdminAppointments = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
    const [searchParams] = useSearchParams();
    const initialViewMode = searchParams.get("view") === "calendar" ? "calendar" : "list";
    const [viewMode, setViewMode] = useState<"list" | "calendar">(initialViewMode);
    const [leads, setLeads] = useState<LeadRecord[]>([]);
    const [staff, setStaff] = useState<StaffUser[]>([]);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [pendingDrop, setPendingDrop] = useState<{ entry: CalendarEntry; scheduledAt: string } | null>(null);
    const [pendingDetails, setPendingDetails] = useState<CalendarEntry | null>(null);
    const [professionalDraft, setProfessionalDraft] = useState("");
    const [isSavingCalendarChange, setIsSavingCalendarChange] = useState(false);
    const navigate = useNavigate();
    const leadId = searchParams.get("leadId");

    const userStr = localStorage.getItem("admin_user");
    const currentUser = userStr ? JSON.parse(userStr) : { name: "Profissional" };

    useEffect(() => {
        fetchAppointments();
        fetchCalendarData();
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await fetchClient("/appointments");
            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
            } else {
                toast.error("Erro ao carregar atendimentos.");
            }
        } catch (error) {
            console.error("Failed to fetch appointments:", error);
            toast.error("Erro ao carregar atendimentos.");
        }
    };

    useEffect(() => {
        if (leadId) {
            navigate(`/admin/consultas/new?leadId=${leadId}`);
        }
    }, [leadId, navigate]);

    const handleDelete = async (id: number) => {
        try {
            const res = await fetchClient(`/appointments/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success("Atendimento excluído com sucesso.");
                fetchAppointments();
            } else {
                toast.error("Erro ao excluir atendimento.");
            }
        } catch (error) {
            console.error("Error deleting appointment:", error);
            toast.error("Erro de conexão ao excluir.");
        }
    };

    const filteredAppointments = appointments.filter(record => {
        const name = (record.patientName || record.patient?.name || "").toLowerCase();
        const cpf = (record.cpf || record.patient?.cpf || "");
        const term = searchTerm.toLowerCase();
        return name.includes(term) || cpf.includes(term);
    });

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    };

    const fetchCalendarData = async () => {
        try {
            const [leadsResponse, usersResponse] = await Promise.all([
                fetchClient("/leads"),
                fetchClient("/staff")
            ]);
            const [leadsBody, usersBody] = await Promise.all([
                leadsResponse.json().catch(() => ({})),
                usersResponse.json().catch(() => ({}))
            ]);

            if (!leadsResponse.ok || !usersResponse.ok) {
                throw new Error(leadsBody.error || usersBody.error || "Erro ao carregar agenda.");
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
        const endpoint = entry.kind === "lead" ? "/leads/" + entry.leadId : "/appointments/" + entry.id;
        const response = await fetchClient(endpoint, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Não foi possível atualizar a agenda.");
        return body;
    };

    const refreshCalendarRecords = async () => {
        await Promise.all([fetchAppointments(), fetchCalendarData()]);
    };

    const confirmDrop = async () => {
        if (!pendingDrop) return;

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

    const saveProfessional = async () => {
        if (!pendingDetails) return;

        const professional = professionalDraft.trim();
        if (pendingDetails.kind === "appointment" && !professional) {
            toast.error("Selecione um profissional para o atendimento.");
            return;
        }

        setIsSavingCalendarChange(true);
        try {
            await updateCalendarEntry(pendingDetails, { professional: professional || null });
            await refreshCalendarRecords();
            setPendingDetails(null);
            toast.success("Profissional atualizado com sucesso.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a agenda.");
        } finally {
            setIsSavingCalendarChange(false);
        }
    };

    const formatScheduledAt = (record: AppointmentRecord) => formatDate(record.scheduledAt || record.date);
    const formatClinicalDate = (record: AppointmentRecord) => formatDate(record.date);
    const formatCreatedAt = (record: AppointmentRecord) => record.createdAt ? formatDate(record.createdAt) : null;

    return (
        <AdminLayout title="Atendimentos & Consultas">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full md:w-auto">
                    <Card className="border-slate-100 shadow-sm min-w-0">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Stethoscope size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Atendimentos</p>
                                    <p className="text-2xl font-bold text-slate-900">{appointments.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {currentUser.role !== 'manager' && (
                    <Button onClick={() => navigate('/admin/consultas/new')} className="bg-primary hover:bg-primary/90 h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2 w-full md:w-auto">
                        <Plus size={20} /> Novo Atendimento
                    </Button>
                )}
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant={viewMode === "list" ? "default" : "outline"}
                    onClick={() => setViewMode("list")}
                >
                    Lista
                </Button>
                <Button
                    type="button"
                    variant={viewMode === "calendar" ? "default" : "outline"}
                    onClick={() => setViewMode("calendar")}
                >
                    Calendário
                </Button>
            </div>

            {viewMode === "list" && (
            <div className="admin-card p-6 w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900">Histórico de Pacientes</h2>
                        <p className="text-sm text-slate-500">Consulte ou acompanhe registros evolutivos.</p>
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder="Pesquisar paciente ou CPF..."
                            className="pl-10 h-12 bg-slate-50 border-slate-100 focus:ring-primary/20 rounded-xl font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredAppointments.length > 0 ? (
                        filteredAppointments.map((record) => (
                            <div key={record.id} className="py-4 md:py-6 first:pt-0 last:pb-0 hover:bg-slate-50/50 transition-colors rounded-xl px-2 md:px-4 -mx-2 md:-mx-4 group">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-4 w-full sm:w-auto flex-1 cursor-pointer" onClick={() => navigate(`/admin/consultas/${record.id}?patientId=${record.patientId ?? ""}`)}>
                                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                                            <User size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">
                                                    {record.patientName || record.patient?.name}
                                                </h3>
                                                {currentUser.role === 'manager' && (
                                                    <Badge variant="outline" className="text-[8px] font-black uppercase h-4 bg-blue-50 text-blue-600 border-blue-100">Controle</Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                                <span className="text-xs font-bold text-primary uppercase tracking-widest">{record.procedure}</span>
                                                <span className="text-xs text-slate-300">|</span>
                                                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                                                    {record.cpf || record.patient?.cpf}
                                                </span>
                                                <span className="text-xs text-slate-300 hidden sm:inline">|</span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium whitespace-nowrap">
                                                    <History size={12} />
                                                    Agendado para {formatScheduledAt(record)}
                                                </span>
                                                <span className="text-xs text-slate-300 hidden sm:inline">|</span>
                                                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                                    Data clínica {formatClinicalDate(record)}
                                                </span>
                                                {record.createdAt && (
                                                    <>
                                                        <span className="text-xs text-slate-300 hidden sm:inline">|</span>
                                                        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                                            Criado em {formatCreatedAt(record)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                        {currentUser.role !== 'manager' && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50 h-10 w-10 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Isso apagará permanentemente o registro de atendimento do paciente {record.patientName}. Esta ação não pode ser desfeita.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(record.id)} className="bg-red-600 hover:bg-red-700">
                                                            Sim, excluir registro
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                        <Button
                                            onClick={() => navigate(`/admin/consultas/${record.id}?patientId=${record.patientId ?? ""}`)}
                                            className="h-10 px-4 text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        >
                                            Ver Evolução
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Search size={40} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum atendimento encontrado</h3>
                            <p className="text-slate-500 font-medium">Não há registros com os filtros atuais ou o sistema está vazio.</p>
                        </div>
                    )}
                </div>
            </div>
            )}

            {viewMode === "calendar" && (
                <div className="admin-card p-6 w-full">
                    <CalendarView
                        entries={buildCalendarEntries(appointments, leads)}
                        anchorDate={calendarDate}
                        onAnchorDateChange={setCalendarDate}
                        onEventOpen={(entry) => {
                            setPendingDetails(entry);
                            setProfessionalDraft(entry.professional || "");
                        }}
                        onEventDrop={(entry, scheduledAt) => setPendingDrop({ entry, scheduledAt })}
                        onEventCreate={(date) => navigate(`/admin/consultas/new?date=${encodeURIComponent(date.toISOString())}`)}
                    />
                </div>
            )}

            <AlertDialog
                open={Boolean(pendingDrop)}
                onOpenChange={(open) => {
                    if (!open && !isSavingCalendarChange) setPendingDrop(null);
                }}
            >
                <AlertDialogContent>
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
                open={Boolean(pendingDetails)}
                onOpenChange={(open) => {
                    if (!open && !isSavingCalendarChange) setPendingDetails(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalhes do agendamento</DialogTitle>
                        <DialogDescription>
                            {pendingDetails && "Altere somente o profissional responsável por este agendamento."}
                        </DialogDescription>
                    </DialogHeader>
                    {pendingDetails && (
                        <div className="space-y-4 text-sm text-slate-700">
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-500">Paciente</p>
                                <p className="font-semibold text-slate-900">{pendingDetails.patientName}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-500">Tratamento/procedimento</p>
                                <p>{pendingDetails.treatment || pendingDetails.procedure || pendingDetails.appointmentType || "Agendamento"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-500">Data e horário</p>
                                <p>{formatDate(pendingDetails.scheduledAt)}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-medium uppercase text-slate-500">Profissional</p>
                                <Select value={professionalDraft || (pendingDetails.kind === "lead" ? "unassigned" : "")} onValueChange={(value) => setProfessionalDraft(value === "unassigned" ? "" : value)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o profissional" /></SelectTrigger>
                                    <SelectContent>
                                        {pendingDetails.kind === "lead" && (
                                            <SelectItem value="unassigned">Sem profissional</SelectItem>
                                        )}
                                        {staff.map((user) => <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-xs text-slate-500">Altere data e horário arrastando o cartão na agenda ou no formulário de consulta existente.</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setPendingDetails(null)} disabled={isSavingCalendarChange}>Cancelar</Button>
                        <Button type="button" onClick={() => void saveProfessional()} disabled={isSavingCalendarChange}>Salvar profissional</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
};

export default AdminAppointments;
