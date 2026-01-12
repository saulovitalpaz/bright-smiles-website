import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    MessageSquare,
    Calendar,
    TrendingUp,
    ArrowUpRight
} from "lucide-react";

import { API_URL } from "@/lib/api";

interface DashboardStats {
    users: number;
    posts: number;
    appointments: number;
    leads: number;
    testimonials: number;
    recentAppointments: any[];
}

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        leads: 0,
        testimonials: 0,
        recentLeads: [],
        recentAppointments: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_URL}/dashboard/stats`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        { label: "Solicitações (Leads)", value: stats.leads.toString(), icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Novos Comentários", value: stats.testimonials.toString(), icon: MessageSquare, color: "text-green-600", bg: "bg-green-100" },
    ];

    if (loading) {
        return (
            <AdminLayout title="Dashboard">
                <div className="flex items-center justify-center h-64">
                    <p className="text-slate-500">Carregando dados...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {statCards.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={32} />
                            </div>
                            <div>
                                <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                            </div>
                        </div>
                        <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            <ArrowUpRight size={14} className="mr-1" />
                            Ativo
                        </span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SOLICITAÇÕES RECENTES */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-serif font-bold text-xl mb-6">Solicitações Recentes (Início)</h3>
                    <div className="space-y-4">
                        {stats.recentLeads.length > 0 ? (
                            stats.recentLeads.map((lead: any) => (
                                <div key={lead.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                        {lead.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">{lead.name}</p>
                                        <p className="text-xs text-slate-500">{lead.message || "Solicitou agendamento"}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase mb-1 block">
                                            {lead.source || "Site"}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm italic">Nenhuma solicitação recente.</p>
                        )}
                    </div>
                </div>

                {/* ÚLTIMOS ATENDIMENTOS */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-serif font-bold text-xl mb-6">Últimos Atendimentos</h3>
                    <div className="space-y-4">
                        {stats.recentAppointments.length > 0 ? (
                            stats.recentAppointments.map((app: any) => (
                                <div key={app.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                        <Users size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">{app.patientName}</p>
                                        <p className="text-xs text-slate-500">{app.procedure}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase mb-1 block">
                                            {app.professional.split(' ')[0]}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(app.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm italic">Nenhum atendimento realizado ainda.</p>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
