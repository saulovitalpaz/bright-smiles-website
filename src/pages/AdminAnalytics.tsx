import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Users,
    MessageSquare,
    TrendingUp,
    Globe,
    Target,
    MapPin,
    Calendar,
    ArrowUpRight,
    Eye,
    Smartphone
} from "lucide-react";
import { API_URL } from "@/lib/api";
import axios from "axios";

const AdminAnalytics = () => {
    const [stats, setStats] = useState({
        visits: 0,
        posts: 0,
        comments: 0,
        leads: 0,
        topPosts: [],
        sources: [] as { name: string, count: number, percentage: number }[],
        locations: [] as { name: string, count: number, percentage: number }[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [dashStats, postsRes, leadsRes] = await Promise.all([
                    axios.get(`${API_URL}/dashboard/stats`),
                    axios.get(`${API_URL}/posts`),
                    axios.get(`${API_URL}/leads`)
                ]);

                const posts = postsRes.data;
                const leads = leadsRes.data;
                const totalPostViews = posts.reduce((acc: number, p: any) => acc + (p.views || 0), 0);
                const topPosts = posts.sort((a: any, b: any) => (b.views || 0) - (a.views || 0)).slice(0, 5);

                // Calculate Sources from Leads
                const sourceCounts: any = {};
                leads.forEach((l: any) => {
                    const s = l.source || "Desconhecido";
                    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
                });
                const sources = Object.entries(sourceCounts).map(([name, count]: [string, any]) => ({
                    name,
                    count,
                    percentage: Math.round((count / leads.length) * 100)
                })).sort((a, b) => b.count - a.count);

                // Calculate Locations from Leads
                const locCounts: any = {};
                leads.forEach((l: any) => {
                    const loc = l.location || "Presencial/Direto";
                    locCounts[loc] = (locCounts[loc] || 0) + 1;
                });
                const locations = Object.entries(locCounts).map(([name, count]: [string, any]) => ({
                    name,
                    count,
                    percentage: Math.round((count / leads.length) * 100)
                })).sort((a, b) => b.count - a.count);

                setStats({
                    visits: totalPostViews,
                    posts: dashStats.data.posts,
                    comments: dashStats.data.testimonials,
                    leads: leads.length,
                    topPosts,
                    sources,
                    locations
                });

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    const cards = [
        { label: "Solicitações (Leads)", value: stats.leads, icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Comentários", value: stats.comments, icon: MessageSquare, color: "text-green-600", bg: "bg-green-100" },
        { label: "Posts Publicados", value: stats.posts, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-100" },
        { label: "Visualizações Blog", value: stats.visits, icon: Eye, color: "text-indigo-600", bg: "bg-indigo-100" },
    ];

    if (loading) return (
        <AdminLayout title="Análise de Dados">
            <div className="p-12 text-center text-slate-500 italic">Carregando métricas...</div>
        </AdminLayout>
    );

    return (
        <AdminLayout title="Análise de Dados">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {cards.map((stat) => (
                    <Card key={stat.label} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`${stat.bg} p-3 rounded-xl ${stat.color}`}>
                                    <stat.icon size={24} />
                                </div>
                                <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                    <ArrowUpRight size={14} className="mr-1" />
                                    Ativo
                                </span>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* TOP POSTS */}
                <Card className="border-slate-200 shadow-sm lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-xl font-serif flex items-center gap-2">
                            <TrendingUp size={20} className="text-primary" /> Posts Mais Lidos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.topPosts.length > 0 ? (
                                stats.topPosts.map((post: any, i) => (
                                    <div key={post.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                        <span className="font-bold text-slate-300 text-lg w-6">#{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 truncate text-sm">{post.title}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-600 font-medium text-xs">
                                            <Eye size={12} />
                                            {post.views || 0}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 italic text-sm text-center py-8">Nenhum post visualizado.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* ORIGEM (LEADS) */}
                <Card className="border-slate-200 shadow-sm lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-xl font-serif flex items-center gap-2">
                            <Target size={20} className="text-orange-500" /> Origem dos Leads
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {stats.sources.length > 0 ? (
                                stats.sources.map((s, i) => (
                                    <div key={s.name} className="flex items-center justify-between group">
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium text-slate-700">{s.name}</span>
                                                <span className="text-sm font-bold text-slate-900">{s.percentage}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-1000"
                                                    style={{ width: `${s.percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 italic text-sm text-center py-8">Dados de origem insuficientes.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* LOCALIZAÇÃO (LEADS) */}
                <Card className="border-slate-200 shadow-sm lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-xl font-serif flex items-center gap-2">
                            <MapPin size={20} className="text-emerald-500" /> Região/Localização
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {stats.locations.length > 0 ? (
                                stats.locations.map((l, i) => (
                                    <div key={l.name} className="flex items-center justify-between group">
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium text-slate-700">{l.name}</span>
                                                <span className="text-sm font-bold text-slate-900">{l.percentage}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 transition-all duration-1000"
                                                    style={{ width: `${l.percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 italic text-sm text-center py-8">Aguardando dados geográficos.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default AdminAnalytics;
