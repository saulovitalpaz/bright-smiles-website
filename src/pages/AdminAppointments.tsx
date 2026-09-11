import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, User, History, Plus, Trash2, Stethoscope } from "lucide-react";
import { toast } from "sonner";

import AdminLayout from "@/components/admin/AdminLayout";
import { fetchClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
        <AdminLayout title="Atendimentos & Consultas">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                <div className="min-w-0 flex-1">
                    <Card className="border-slate-100 shadow-sm min-w-0">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Stethoscope size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-600 font-medium">Atendimentos</p>
                                    <p className="text-2xl font-bold text-slate-900">{appointments.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
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
                        <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900">Histórico de Pacientes</h2>
                        <p className="text-sm text-slate-500">Consulte ou acompanhe registros evolutivos.</p>
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
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </div>
                        <div className="min-w-0">
                            <label htmlFor="appointments-date-filter" className="sr-only">Filtrar por data</label>
                            <Input
                                id="appointments-date-filter"
                                aria-label="Filtrar por data"
                                type="date"
                                className="h-12 bg-slate-50 border-slate-100 focus:ring-primary/20 rounded-xl font-medium"
                                value={dateFilter}
                                onChange={(event) => setDateFilter(event.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredAppointments.length > 0 ? (
                        filteredAppointments.map((record) => (
                            <div
                                key={record.id}
                                className="py-3 first:pt-0 last:pb-0 hover:bg-slate-50/50 transition-colors rounded-xl group"
                            >
                                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-2">
                                    <Link
                                        className="flex min-w-0 items-start gap-3 w-full flex-1"
                                        to={`/admin/consultas/${record.id}?patientId=${record.patientId ?? ""}`}
                                    >
                                        <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <User size={16} aria-hidden="true" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-slate-900 text-sm leading-tight break-words">
                                                    {record.patientName || record.patient?.name}
                                                </h3>
                                                {currentUser.role === "manager" && (
                                                    <Badge variant="outline" className="text-[8px] font-black uppercase h-4 bg-blue-50 text-blue-600 border-blue-100">
                                                        Controle
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                <span className="text-xs font-semibold text-slate-700 break-words">{record.procedure}</span>
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
                                    </Link>

                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
        </AdminLayout>
    );
};

export default AdminAppointments;
