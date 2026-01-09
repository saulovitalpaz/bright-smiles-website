import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/button";
import {
    Users,
    MessageSquare,
    Calendar,
    TrendingUp,
    ArrowUpRight
} from "lucide-react";

const AdminDashboard = () => {
    const stats = [
        { label: "Solicitações", value: "12", icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Comentários", value: "48", icon: MessageSquare, color: "text-green-600", bg: "bg-green-100" },
        { label: "Posts no Blog", value: "15", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
        { label: "Novos Leads", value: "+4", icon: Users, color: "text-orange-600", bg: "bg-orange-100" },
    ];

    return (
        <AdminLayout title="Dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <ArrowUpRight size={14} className="mr-1" />
                                12%
                            </span>
                        </div>
                        <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-serif font-bold text-xl mb-6">Solicitações Recentes</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="flex items-center gap-4 p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                                    U
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-900">João Silva</p>
                                    <p className="text-xs text-slate-500">Solicitou agendamento via WhatsApp</p>
                                </div>
                                <span className="text-xs text-slate-400">2h atrás</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-serif font-bold text-xl mb-6">Últimos Comentários</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="flex flex-col gap-2 p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-slate-900">Maria Oliveira</p>
                                    <div className="flex text-yellow-400">
                                        {"★".repeat(5)}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 italic">"Atendimento excelente, as doutoras são muito atenciosas!"</p>
                                <span className="text-xs text-slate-400">Hoje, 09:30</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
