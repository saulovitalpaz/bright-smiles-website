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
    recentAppointments: any[];
}

const AdminDashboard = () => {
    const [stats, setStats] = useState<DashboardStats>({
        users: 0,
        posts: 0,
        appointments: 0,
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
        { label: "Atendimentos", value: stats.appointments.toString(), icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Comentários", value: "0", icon: MessageSquare, color: "text-green-600", bg: "bg-green-100" }, // No comments table yet
        { label: "Posts no Blog", value: stats.posts.toString(), icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
        { label: "Usuários", value: stats.users.toString(), icon: Users, color: "text-orange-600", bg: "bg-orange-100" },
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

    const handleReset = async () => {
        if (!confirm("Tem certeza? Isso apagará todos os agendamentos e posts (Users mantidos).")) return;
        try {
            const res = await fetch(`${API_URL}/admin/reset-database`, { method: "POST" });
            if (res.ok) {
                alert("Sistema resetado com sucesso!");
                window.location.reload();
            } else {
                alert("Erro ao resetar. Verifique se o backend foi reiniciado.");
            }
        } catch (e) {
            alert("Erro de conexão. O backend está rodando?");
        }
    };

    return (
        <AdminLayout title="Dashboard">
            <div className="mb-6 flex justify-end">
                <button onClick={handleReset} className="text-xs text-red-500 underline">Resetar Sistema (Dev)</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            {parseInt(stat.value) > 0 && (
                                <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    <ArrowUpRight size={14} className="mr-1" />
                                    Ativo
                                </span>
                            )}
                        </div>
                        <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-serif font-bold text-xl mb-6">Solicitações Recentes (Consultas)</h3>
                    <div className="space-y-4">
                        {stats.recentAppointments.length > 0 ? (
                            stats.recentAppointments.map((app: any) => (
                                <div key={app.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                                        {app.patientName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">{app.patientName}</p>
                                        <p className="text-xs text-slate-500">{app.procedure}</p>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {new Date(app.date).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm italic">Nenhum agendamento recente.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-serif font-bold text-xl mb-6">Últimos Comentários</h3>
                    <div className="space-y-4">
                        {/* Placeholder for future comments integration */}
                        {[].length > 0 ? (
                            [].map((item: any) => (
                                <div key={item} className="p-4">Item</div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm italic">Sem comentários registrados.</p>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
