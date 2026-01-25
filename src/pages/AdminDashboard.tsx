import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
    Users,
    MessageSquare,
    Calendar,
    TrendingUp,
    ArrowUpRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchClient } from "@/lib/api";

interface DashboardStats {
    users: number;
    posts: number;
    appointments: number;
    leads: number;
    testimonials: number;
    recentAppointments: any[];
    recentLeads: any[];
    recentTestimonials: any[];
}

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        users: 0,
        posts: 0,
        appointments: 0,
        leads: 0,
        testimonials: 0,
        recentLeads: [],
        recentAppointments: [],
        recentTestimonials: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetchClient(`/dashboard/stats`);
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

    const pendingLeads = stats?.recentLeads?.filter((l: any) => l.status === 'new' || l.status === 'contacted') || [];
    const pendingCount = pendingLeads.length;

    if (loading) {
        return (
            <AdminLayout title="Dashboard">
                <div className="flex items-center justify-center h-64">
                    <p className="p-4 text-slate-500 animate-pulse font-medium">Carregando painel...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                {/* SMALL PENDING LEADS CARD */}
                <div
                    onClick={() => navigate('/admin/solicitacoes')}
                    className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md hover:border-blue-100 transition-all group overflow-hidden relative"
                >
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Solicitações</h3>
                            <p className="text-2xl font-black text-slate-900 mt-0.5">{pendingCount}</p>
                        </div>
                    </div>
                    <ArrowUpRight size={18} className="text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all z-10" />
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50/30 rounded-full blur-2xl group-hover:bg-blue-100/50 transition-colors" />
                </div>

                {/* LATEST TESTIMONIAL PREVIEW */}
                <div className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center md:col-span-2 relative overflow-hidden group">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between relative z-10 w-full gap-4 sm:gap-0">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                <MessageSquare size={14} className="text-emerald-500" /> Último Comentário
                            </h3>
                            {stats.recentTestimonials?.length > 0 ? (
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-100">
                                        {stats.recentTestimonials[0].name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-slate-900 font-bold text-sm leading-tight text-ellipsis overflow-hidden truncate">{stats.recentTestimonials[0].name}</p>
                                        <p className="text-slate-500 text-xs italic mt-1 line-clamp-2 md:line-clamp-1">"{stats.recentTestimonials[0].comment || stats.recentTestimonials[0].content}"</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-xs italic">Nenhum feedback recente.</p>
                            )}
                        </div>
                        <div className="self-start sm:self-auto">
                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap">Feedback Ativo</span>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                {/* AGENDAMENTOS CONFIRMADOS */}
                <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                        <div>
                            <h3 className="font-serif font-black text-lg md:text-2xl text-slate-900">Agendamentos</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 md:mt-2">Confirmados</p>
                        </div>
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-inner">
                            <TrendingUp size={20} className="md:w-6 md:h-6" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {stats?.recentLeads?.filter((l: any) => l.status === 'scheduled').length > 0 ? (
                            stats.recentLeads.filter((l: any) => l.status === 'scheduled').map((lead: any) => (
                                <div key={lead.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 md:p-5 rounded-3xl border border-slate-50 hover:bg-slate-50 transition-all group hover:border-blue-100/50">
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                            {lead.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0 sm:hidden">
                                            <p className="font-bold text-slate-900 truncate">{lead.name}</p>
                                            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{lead.treatment || "Procedimento Geral"}</p>
                                        </div>
                                    </div>

                                    <div className="hidden sm:block flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">{lead.name}</p>
                                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{lead.treatment || "Procedimento Geral"}</p>
                                    </div>

                                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                                        <button
                                            onClick={() => navigate(`/admin/consultas?leadId=${lead.id}`)}
                                            className="w-full sm:w-auto opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all sm:translate-x-4 group-hover:translate-x-0 bg-primary text-white text-[10px] font-black px-4 py-2.5 rounded-xl hover:bg-primary/90 shadow-xl shadow-primary/20"
                                        >
                                            Atender
                                        </button>
                                        <div className="hidden sm:flex flex-col items-end whitespace-nowrap">
                                            <span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-md font-bold uppercase">
                                                {lead.source || "Site"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/30 rounded-[2rem] border-2 border-dashed border-slate-100">
                                <Calendar size={32} className="text-slate-200 mb-3" />
                                <p className="text-slate-400 text-sm font-semibold">Agenda livre.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ÚLTIMOS ATENDIMENTOS */}
                <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                        <div>
                            <h3 className="font-serif font-black text-lg md:text-2xl text-slate-900">Histórico</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 md:mt-2">Registros recentes</p>
                        </div>
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner">
                            <Users size={20} className="md:w-6 md:h-6" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {(stats?.recentAppointments?.length || 0) > 0 ? (
                            stats.recentAppointments.map((app: any) => (
                                <div key={app.id} className="flex items-center gap-4 p-4 md:p-5 rounded-3xl border border-slate-50 hover:bg-emerald-50/30 transition-all hover:border-emerald-100/50">
                                    <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-sm">
                                        <Users size={20} className="md:w-6 md:h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 truncate">{app.patientName}</p>
                                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{app.procedure}</p>
                                    </div>
                                    <div className="text-right whitespace-nowrap hidden sm:block">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-black uppercase mb-1">
                                                {app.professional?.split(' ')[0] || "Dra"}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold">
                                                {new Date(app.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-400 text-sm italic text-center py-12">Nenhum registro recente.</p>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
