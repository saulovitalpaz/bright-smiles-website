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
        appointments: 0,
        topPosts: []
    });

    useEffect(() => {
        const loadStats = async () => {
            try {
                // Fetch basic counts
                const [dashStats, postsRes] = await Promise.all([
                    axios.get(`${API_URL}/dashboard/stats`),
                    axios.get(`${API_URL}/posts`) // To calculate views
                ]);

                const posts = postsRes.data;
                const totalPostViews = posts.reduce((acc: number, p: any) => acc + (p.views || 0), 0);
                const topPosts = posts.sort((a: any, b: any) => (b.views || 0) - (a.views || 0)).slice(0, 5);

                setStats({
                    visits: totalPostViews, // Using post views as proxy
                    posts: dashStats.data.posts,
                    comments: dashStats.data.testimonials,
                    appointments: dashStats.data.leads || dashStats.data.appointments,
                    topPosts
                });

            } catch (e) {
                console.error(e);
            }
        };
        loadStats();
    }, []);

    const cards = [
        { label: "Solicitações (Leads)", value: stats.appointments, icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Comentários", value: stats.comments, icon: MessageSquare, color: "text-green-600", bg: "bg-green-100" },
        { label: "Minutos de Leitura", value: "N/A", icon: Users, color: "text-orange-600", bg: "bg-orange-100" },
        { label: "Visualizações Blog", value: stats.visits, icon: Eye, color: "text-indigo-600", bg: "bg-indigo-100" },
    ];

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-serif flex items-center gap-2">
                            <TrendingUp size={20} className="text-primary" /> Posts Mais Lidos
                        </CardTitle>
                        <CardDescription>Artigos com maior engajamento.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.topPosts.length > 0 ? (
                                stats.topPosts.map((post: any, i) => (
                                    <div key={post.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                        <span className="font-bold text-slate-300 text-lg w-6">#{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 truncate">{post.title}</p>
                                            <p className="text-xs text-slate-500">{new Date(post.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-600 font-medium text-sm">
                                            <Eye size={14} />
                                            {post.views || 0}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 italic text-sm text-center py-8">Nenhum post visualizado ainda.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-serif flex items-center gap-2">
                            <Target size={20} className="text-orange-500" /> Origem
                        </CardTitle>
                        <CardDescription>De onde vêm seus visitantes (Simulado).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium flex items-center gap-2"><Globe size={16} /> Google Orgânico</span>
                                <div className="h-2 flex-1 mx-4 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[65%]"></div>
                                </div>
                                <span className="text-sm font-bold">65%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium flex items-center gap-2"><Users size={16} /> Instagram</span>
                                <div className="h-2 flex-1 mx-4 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 w-[25%]"></div>
                                </div>
                                <span className="text-sm font-bold">25%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium flex items-center gap-2"><MessageSquare size={16} /> WhatsApp</span>
                                <div className="h-2 flex-1 mx-4 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[10%]"></div>
                                </div>
                                <span className="text-sm font-bold">10%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default AdminAnalytics;
