import React, { useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Phone, Mail, CheckCircle, Clock, Trash2, UserPlus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchClient } from "@/lib/api";
import { toast } from "sonner";

const getResponseError = async (res: Response, fallback: string) => {
    try {
        const body: unknown = await res.json();
        if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
            return body.error;
        }
    } catch {
        // Keep the existing Portuguese fallback when the API has no JSON error body.
    }

    return fallback;
};

const formatDateTime = (value?: string | null) => {
    if (!value) return "Não agendado";

    return new Date(value).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const toDateTimeLocalValue = (value?: string | null) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const localValue = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localValue.toISOString().slice(0, 16);
};

interface LeadRecord {
    id: number;
    name: string;
    phone: string;
    email?: string | null;
    ageGroup?: string | null;
    source?: string | null;
    treatment?: string | null;
    message?: string | null;
    status: string;
    createdAt: string;
    scheduledAt?: string | null;
    cpf?: string | null;
}

const AdminLeads = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [scheduledInputs, setScheduledInputs] = useState<Record<number, string>>({});
    const [leadErrors, setLeadErrors] = useState<Record<number, string>>({});

    const { data: leads, isLoading } = useQuery({
        queryKey: ['leads'],
        queryFn: async () => {
            const res = await fetchClient('/leads');
            if (!res.ok) throw new Error(await getResponseError(res, "Erro ao carregar solicitações."));
            return await res.json() as LeadRecord[];
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({
            id,
            status,
            scheduledAt
        }: {
            id: number;
            status: string;
            scheduledAt: string | null;
        }) => {
            const res = await fetchClient(`/leads/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status, scheduledAt })
            });
            if (!res.ok) throw new Error(await getResponseError(res, "Erro ao atualizar status."));
            return await res.json();
        },
        onSuccess: (_data, variables) => {
            setLeadErrors((current) => {
                const next = { ...current };
                delete next[variables.id];
                return next;
            });
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            toast.success("Status atualizado!");
        },
        onError: (error, variables) => {
            const message = error instanceof Error ? error.message : "Erro ao atualizar status.";
            setLeadErrors((current) => ({ ...current, [variables.id]: message }));
            toast.error(message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetchClient(`/leads/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await getResponseError(res, "Erro ao remover."));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            toast.success("Solicitação removida.");
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao remover.")
    });

    const handleWhatsApp = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    };

    const effectiveScheduledInputs = useMemo(
        () => Object.fromEntries((leads || []).map((lead) => [lead.id, scheduledInputs[lead.id] ?? toDateTimeLocalValue(lead.scheduledAt)])),
        [leads, scheduledInputs]
    );

    const handleScheduleChange = (leadId: number, value: string) => {
        setScheduledInputs((current) => ({ ...current, [leadId]: value }));
        setLeadErrors((current) => {
            const next = { ...current };
            delete next[leadId];
            return next;
        });
    };

    const handleSaveSchedule = (lead: LeadRecord) => {
        const scheduledValue = effectiveScheduledInputs[lead.id];

        if (!scheduledValue) {
            updateStatusMutation.mutate({ id: lead.id, status: 'new', scheduledAt: null });
            return;
        }

        updateStatusMutation.mutate({
            id: lead.id,
            status: 'scheduled',
            scheduledAt: new Date(scheduledValue).toISOString()
        });
    };

    const handleClearSchedule = (leadId: number) => {
        setScheduledInputs((current) => ({ ...current, [leadId]: "" }));
        setLeadErrors((current) => {
            const next = { ...current };
            delete next[leadId];
            return next;
        });
        updateStatusMutation.mutate({ id: leadId, status: 'new', scheduledAt: null });
    };

    return (
        <AdminLayout title="Solicitações e Agendamentos">
            <div className="space-y-6">
                {isLoading && <p>Carregando...</p>}
                {leads?.length === 0 && <p className="text-slate-500">Nenhuma solicitação encontrada.</p>}

                {leads?.map((lead) => {
                    const isSavingSchedule = updateStatusMutation.isPending && updateStatusMutation.variables?.id === lead.id;

                    return (
                    <div key={lead.id} className="admin-card flex min-w-0 flex-col items-start justify-between gap-4 p-4 sm:p-6 md:flex-row md:items-center">
                        <div className="flex w-full min-w-0 items-start gap-3 sm:gap-4 md:flex-1">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                                {lead.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                                <h3 className="break-words font-bold text-slate-900">{lead.name}</h3>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                        <Clock size={14} />
                                        Criado em {formatDateTime(lead.createdAt)}
                                    </span>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${lead.status === 'scheduled' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {lead.status === 'new' ? 'Novo' : lead.status === 'contacted' ? 'Contatado' : 'Agendado'}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-emerald-700 font-medium">
                                    Agendado para {formatDateTime(lead.scheduledAt)}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="flex max-w-full min-w-0 items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">
                                        <Mail className="shrink-0" size={12} />
                                        <span className="min-w-0 break-words [overflow-wrap:anywhere]">{lead.email || "Sem e-mail"}</span>
                                    </span>
                                    {lead.ageGroup && (
                                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-bold uppercase">
                                            {lead.ageGroup}
                                        </span>
                                    )}
                                    <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-bold uppercase">
                                        Origem: {lead.source || "Site"}
                                    </span>
                                </div>
                                <div className="mt-2 min-w-0 text-sm text-slate-600 [overflow-wrap:anywhere]">
                                    <p className="break-words"><strong>Tratamento:</strong> {lead.treatment || "Geral"}</p>
                                    <p className="break-words"><strong>Mensagem:</strong> {lead.message}</p>
                                </div>
                            </div>
                        </div>

                            <div className="flex w-full min-w-0 flex-wrap items-start gap-3 md:w-auto md:max-w-[520px] md:items-center md:justify-end">
                            <div className="flex min-w-0 flex-col text-sm md:text-right">
                                <span className="text-slate-400 text-xs">Telefone</span>
                                <span className="break-words font-medium text-slate-700 [overflow-wrap:anywhere]">{lead.phone}</span>
                            </div>

                            <div className="flex w-full min-w-0 flex-col gap-2 md:w-auto md:min-w-[240px]">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Agendar consulta
                                </label>
                                <input
                                    type="datetime-local"
                                    value={effectiveScheduledInputs[lead.id] ?? ""}
                                    onChange={(event) => handleScheduleChange(lead.id, event.target.value)}
                                    className="h-9 w-full min-w-0 rounded-md border border-slate-200 px-3 text-sm text-slate-700"
                                />
                                {leadErrors[lead.id] && (
                                    <p className="text-xs text-red-500">{leadErrors[lead.id]}</p>
                                )}
                            </div>

                            <div className="flex w-full min-w-0 flex-wrap gap-2 md:justify-end">
                                <Button size="sm" variant="outline" className="gap-2 h-9 border-slate-200" onClick={() => handleWhatsApp(lead.phone)}>
                                    <Phone size={16} /> WhatsApp
                                </Button>

                                <Button
                                    size="sm"
                                    className={`gap-2 h-9 ${lead.status === 'scheduled' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                                    onClick={() => handleSaveSchedule(lead)}
                                    disabled={isSavingSchedule}
                                >
                                    <CheckCircle size={16} />
                                    {isSavingSchedule ? 'Salvando...' : (lead.status === 'scheduled' ? 'Salvar Agendamento' : 'Marcar Agendado')}
                                </Button>

                                {lead.scheduledAt && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2 h-9 border-slate-200"
                                        onClick={() => handleClearSchedule(lead.id)}
                                        disabled={isSavingSchedule}
                                    >
                                        Remover horário
                                    </Button>
                                )}

                                <Button
                                    size="sm"
                                    variant="default"
                                    className="gap-2 h-9 bg-primary"
                                    onClick={() => navigate(`/admin/consultas?leadId=${lead.id}`)}
                                >
                                    <UserPlus size={16} />
                                    Iniciar Atendimento
                                </Button>

                                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-500" onClick={() => deleteMutation.mutate(lead.id)}>
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>
                )})}
            </div>
        </AdminLayout>
    );
};

export default AdminLeads;
