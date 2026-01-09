import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Phone, Mail, CheckCircle, Clock } from "lucide-react";

const AdminLeads = () => {
    const leads = [
        { id: 1, name: "João Silva", type: "Agendamento", status: "Pendente", date: "09/01/2026", contact: "31 98888-7777" },
        { id: 2, name: "Maria Oliveira", type: "Contato", status: "Concluído", date: "08/01/2026", contact: "31 97777-6666" },
        { id: 3, name: "Carlos Souza", type: "Agendamento", status: "Pendente", date: "08/01/2026", contact: "31 96666-5555" },
    ];

    return (
        <AdminLayout title="Solicitações e Agendamentos">
            <div className="space-y-6">
                {leads.map((lead) => (
                    <div key={lead.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${lead.type === 'Agendamento' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                {lead.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{lead.name}</h3>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                        <Clock size={14} />
                                        {lead.date}
                                    </span>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${lead.type === 'Agendamento' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                        {lead.type}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex flex-col text-sm">
                                <span className="text-slate-400 text-xs">Contato</span>
                                <span className="font-medium text-slate-700">{lead.contact}</span>
                            </div>

                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="gap-2 h-9 border-slate-200">
                                    <Phone size={16} />
                                </Button>
                                <Button size="sm" variant="outline" className="gap-2 h-9 border-slate-200">
                                    <Mail size={16} />
                                </Button>
                                <Button size="sm" className={`gap-2 h-9 ${lead.status === 'Concluído' ? 'bg-green-500 hover:bg-green-600' : ''}`}>
                                    <CheckCircle size={16} />
                                    {lead.status === 'Concluído' ? 'Finalizado' : 'Marcar como Lido'}
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
