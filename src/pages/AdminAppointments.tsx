import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, History, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import AdminLayout from "@/components/admin/AdminLayout";
import { fetchClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AttendanceSection, AttendanceWorkspace } from "@/components/admin/attendance/AttendanceWorkspace";
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
    status?: "scheduled" | "attended" | "cancelled";
    patient?: {
        name: string;
        cpf: string;
    };
}

const getLocalCalendarDay = (value?: string | null) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const AdminAppointments = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
    const [visibleCount, setVisibleCount] = useState(25);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const leadId = searchParams.get("leadId");

    const userStr = localStorage.getItem("admin_user");
    const currentUser = userStr ? JSON.parse(userStr) : { name: "Profissional" };

    useEffect(() => {
        void fetchAppointments();
    }, []);

    useEffect(() => {
        if (leadId) {
            navigate(`/admin/consultas/new?leadId=${leadId}`);
        }
    }, [leadId, navigate]);

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

    const handleDelete = async (id: number) => {
        try {
            const res = await fetchClient(`/appointments/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                toast.error("Erro ao excluir atendimento.");
                return;
            }

            toast.success("Atendimento excluído com sucesso.");
            await fetchAppointments();
        } catch (error) {
            console.error("Error deleting appointment:", error);
            toast.error("Erro de conexão ao excluir.");
        }
    };

    const filteredAppointments = useMemo(() => {
        const normalizedTerm = searchTerm.trim().toLowerCase();

        return appointments.filter((record) => {
            const patientName = (record.patientName || record.patient?.name || "").toLowerCase();
            const cpf = record.cpf || record.patient?.cpf || "";
            const matchesSearch = !normalizedTerm || patientName.includes(normalizedTerm) || cpf.includes(normalizedTerm);
            const matchesDate = !dateFilter || getLocalCalendarDay(record.scheduledAt || record.date) === dateFilter;
            return matchesSearch && matchesDate;
        });
    }, [appointments, dateFilter, searchTerm]);

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

    const formatScheduledAt = (record: AppointmentRecord) => formatDate(record.scheduledAt || record.date);
    const formatClinicalDate = (record: AppointmentRecord) => formatDate(record.date);
    const formatCreatedAt = (record: AppointmentRecord) => (record.createdAt ? formatDate(record.createdAt) : null);

    return (
        <AdminLayout title="Consultas">
            <AttendanceWorkspace active="consultas">
            <div className="attendance-actionbar justify-between">
                <p className="text-sm text-slate-600"><strong className="text-slate-900">{appointments.length}</strong> atendimentos registrados</p>
                {currentUser.role !== "manager" && (
                    <Button
                        onClick={() => navigate("/admin/consultas/new")}
                        className="bg-primary hover:bg-primary/90 min-h-11 px-4 rounded-xl font-semibold gap-2 w-auto"
                    >
                        <Plus size={20} /> Novo Atendimento
                    </Button>
                )}
            </div>

            <div className="admin-card p-3 sm:p-5 w-full">
                <div className="flex flex-col gap-3 mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">Histórico de consultas</h2>
                        <p role="status" className="text-xs text-slate-600">{filteredAppointments.length} resultados</p>
                    </div>
                    <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
                        <div className="relative min-w-0">
                            <label htmlFor="appointments-search" className="sr-only">Pesquisar paciente ou CPF</label>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                                id="appointments-search"
                                aria-label="Pesquisar paciente ou CPF"
                                placeholder="Pesquisar paciente ou CPF…"
                                className="pl-10 h-12 bg-slate-50 border-slate-100 focus:ring-primary/20 rounded-xl font-medium"
                                value={searchTerm}
                                onChange={(event) => { setSearchTerm(event.target.value); setVisibleCount(25); }}
                            />
                        </div>
                        <AttendanceSection title="Filtrar por data" summary={dateFilter ? dateFilter.split("-").reverse().join("/") : "Todas as datas"} defaultOpen>
                            <label htmlFor="appointments-date-filter" className="sr-only">Filtrar por data</label>
                            <Input
                                id="appointments-date-filter"
                                aria-label="Filtrar por data"
                                type="date"
                                className="h-12 bg-slate-50 border-slate-100 focus:ring-primary/20 rounded-xl font-medium"
                                value={dateFilter}
                                onChange={(event) => { setDateFilter(event.target.value); setVisibleCount(25); }}
                            />
                        </AttendanceSection>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredAppointments.length > 0 ? (
                        filteredAppointments.slice(0, visibleCount).map((record) => (
                            <div
                                key={record.id}
                                className="py-3 first:pt-0 last:pb-0 hover:bg-slate-50/50 transition-colors rounded-xl group"
                            >
                                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-2">
                                    <Link
                                        className="flex min-w-0 items-start gap-3 w-full flex-1"
                                        to={`/admin/consultas/${record.id}?patientId=${record.patientId ?? ""}`}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-slate-900 text-sm leading-tight break-words">
                                                    {record.patientName || record.patient?.name}
                                                </h3>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                <span className="text-xs font-semibold text-slate-700 break-words">{record.procedure}</span>
                                                <span className="text-xs text-slate-600 flex flex-wrap items-center gap-1 font-medium">
                                                    <History size={12} aria-hidden="true" />
                                                    Agendado para {formatScheduledAt(record)}
                                                </span>
                                                <span className="text-xs text-slate-600">{record.professional || "Sem profissional"}</span>
                                            </div>
                                        </div>
                                    </Link>

                                    <div className="flex min-w-0 flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                                        <details className="mr-auto min-w-0 text-xs text-slate-600">
                                            <summary className="flex min-h-11 cursor-pointer items-center rounded px-1 font-medium">Mais informações</summary>
                                            <div className="attendance-reveal space-y-1 pb-2"><p>CPF: {record.cpf || record.patient?.cpf || "Não informado"}</p><p>Data clínica {formatClinicalDate(record)}</p>{record.createdAt && <p>Criado em {formatCreatedAt(record)}</p>}</div>
                                        </details>
                                        {currentUser.role !== "manager" && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label={`Excluir atendimento de ${record.patientName || record.patient?.name}`}
                                                        className="text-slate-500 hover:text-red-600 hover:bg-red-50 h-11 w-11"
                                                    >
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
                                            className="h-11 px-4 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        >
                                            Ver Evolução
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum atendimento encontrado</h3>
                            <p className="text-slate-500 font-medium">Não há registros com os filtros atuais ou o sistema está vazio.</p>
                        </div>
                    )}
                </div>
                {filteredAppointments.length > visibleCount && <Button variant="outline" className="mt-3 min-h-11 w-full" onClick={() => setVisibleCount(count => count + 25)}>Mostrar mais consultas ({filteredAppointments.length - visibleCount})</Button>}
                {(searchTerm || dateFilter) && <Button variant="ghost" className="mt-2 min-h-11" onClick={() => { setSearchTerm(""); setDateFilter(""); setVisibleCount(25); }}>Limpar filtros</Button>}
            </div>
            </AttendanceWorkspace>
        </AdminLayout>
    );
};

export default AdminAppointments;
