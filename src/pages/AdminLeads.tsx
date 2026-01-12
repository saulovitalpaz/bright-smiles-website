import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Phone, Mail, CheckCircle, Clock, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "@/lib/api";
import { toast } from "sonner";

const AdminLeads = () => {
    const queryClient = useQueryClient();

    const { data: leads, isLoading } = useQuery({
        queryKey: ['leads'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/leads`);
            return res.data;
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number, status: string }) => {
            await axios.put(`${API_URL}/leads/${id}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            toast.success("Status atualizado!");
        },
        onError: () => toast.error("Erro ao atualizar status.")
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await axios.delete(`${API_URL}/leads/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            toast.success("Solicitação removida.");
        },
        onError: () => toast.error("Erro ao remover.")
    });

    const handleWhatsApp = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    };

    return (
        <AdminLayout title="Solicitações e Agendamentos">
            <div className="space-y-6">
                {isLoading && <p>Carregando...</p>}
                {leads?.length === 0 && <p className="text-slate-500">Nenhuma solicitação encontrada.</p>}

                {leads?.map((lead: any) => (
                    <div key={lead.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-blue-100 text-blue-600">
                                {lead.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{lead.name}</h3>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                        <Clock size={14} />
                                        {new Date(lead.createdAt).toLocaleDateString('pt-BR')} {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${lead.status === 'scheduled' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {lead.status === 'new' ? 'Novo' : lead.status === 'contacted' ? 'Contatado' : 'Agendado'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                        <Mail size={12} />
                                        {lead.email || "Sem e-mail"}
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
                                <div className="text-sm text-slate-600 mt-2">
                                    <p><strong>Tratamento:</strong> {lead.treatment || "Geral"}</p>
                                    <p><strong>Mensagem:</strong> {lead.message}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex flex-col text-sm text-right">
                                <span className="text-slate-400 text-xs">Telefone</span>
                                <span className="font-medium text-slate-700">{lead.phone}</span>
                            </div>

                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="gap-2 h-9 border-slate-200" onClick={() => handleWhatsApp(lead.phone)}>
                                    <Phone size={16} /> WhatsApp
                                </Button>

                                <Button
                                    size="sm"
                                    className={`gap-2 h-9 ${lead.status === 'scheduled' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                                    onClick={() => updateStatusMutation.mutate({ id: lead.id, status: 'scheduled' })}
                                >
                                    <CheckCircle size={16} />
                                    {lead.status === 'scheduled' ? 'Agendado' : 'Marcar Agendado'}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-500" onClick={() => deleteMutation.mutate(lead.id)}>
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </AdminLayout>
    );
};

export default AdminLeads;
