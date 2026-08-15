import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowUpRight,
    Calendar,
    Eye,
    Globe,
    MapPin,
    Route,
    Smartphone,
    Target,
    TrendingUp,
    Users,
} from "lucide-react";

import { API_URL, fetchClient } from "@/lib/api";

interface AnalyticsPost {
    id: number;
    title: string;
    views?: number;
}

interface AnalyticsData {
    totalVisits: number;
    uniqueVisitors: number;
    conversionRate: string;
    leadsCount: number;
    sources: Record<string, number>;
    locations: Record<string, number>;
    regions: Record<string, number>;
    topPaths: Record<string, number>;
    devices: Record<string, number>;
}

interface RankedMetric {
    name: string;
    count: number;
    percentage: number;
}

const emptyAnalytics: AnalyticsData = {
    totalVisits: 0,
    uniqueVisitors: 0,
    conversionRate: "0.00",
    leadsCount: 0,
    sources: {},
    locations: {},
    regions: {},
    topPaths: {},
    devices: {},
};

const rankMetrics = (
    metrics: Record<string, number>,
    total: number,
    limit = 6,
): RankedMetric[] => (
    Object.entries(metrics)
        .map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
);

const toTopPosts = (posts: AnalyticsPost[]): AnalyticsPost[] => (
    [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)
);

const AdminAnalytics = () => {
    const [analytics, setAnalytics] = useState<AnalyticsData>(emptyAnalytics);
    const [topPosts, setTopPosts] = useState<AnalyticsPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [postsError, setPostsError] = useState<string | null>(null);

    const loadStats = async () => {
        setLoading(true);
        setStatsError(null);
        setPostsError(null);

        const [analyticsResult, postsResult] = await Promise.allSettled([
            fetchClient("/analytics/stats"),
            fetch(`${API_URL}/posts`),
        ]);

        if (analyticsResult.status === "fulfilled" && analyticsResult.value.ok) {
            const analyticsData = await analyticsResult.value.json() as AnalyticsData;
            setAnalytics({
                ...emptyAnalytics,
                ...analyticsData,
            });
        } else {
            setStatsError("Não foi possível carregar as métricas.");
        }

        if (postsResult.status === "fulfilled" && postsResult.value.ok) {
            const posts = await postsResult.value.json() as AnalyticsPost[];
            setTopPosts(toTopPosts(posts));
        } else {
            setTopPosts([]);
            setPostsError("Não foi possível carregar os posts agora.");
        }

        setLoading(false);
    };

    useEffect(() => {
        void loadStats();
    }, []);

    const totalVisits = analytics.totalVisits || 1;
    const sources = rankMetrics(analytics.sources, totalVisits);
    const locations = rankMetrics(analytics.locations, totalVisits);
    const regions = rankMetrics(analytics.regions, totalVisits);
    const topPaths = rankMetrics(analytics.topPaths, totalVisits);
    const devices = rankMetrics(analytics.devices, totalVisits);

    const cards = [
        { label: "Visitas Totais", value: analytics.totalVisits, icon: Eye, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Vistantes Únicos", value: analytics.uniqueVisitors, icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
        { label: "Solicitações (Leads)", value: analytics.leadsCount, icon: Calendar, color: "text-orange-600", bg: "bg-orange-100" },
        { label: "Taxa de Conversão", value: `${analytics.conversionRate}%`, icon: Target, color: "text-emerald-600", bg: "bg-emerald-100" },
    ];

    const renderRankedList = (
        items: RankedMetric[],
        emptyMessage: string,
        barClassName: string,
    ) => (
        <div className="space-y-6">
            {items.length > 0 ? (
                items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between group">
                        <div className="flex-1">
                            <div className="mb-1 flex justify-between gap-3">
                                <span className="break-all text-sm font-medium text-slate-700">{item.name}</span>
                                <span className="text-sm font-bold text-slate-900">{item.percentage}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className={`h-full transition-all duration-1000 ${barClassName}`}
                                    style={{ width: `${item.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p className="py-8 text-center text-sm italic text-slate-500">{emptyMessage}</p>
            )}
        </div>
    );

    if (loading) {
        return (
            <AdminLayout title="Análise de Dados">
                <div className="p-12 text-center text-slate-500 italic">Carregando métricas...</div>
            </AdminLayout>
        );
    }

    if (statsError) {
        return (
            <AdminLayout title="Análise de Dados">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
                    <p role="alert" className="text-sm font-medium text-red-700">
                        {statsError}
                    </p>
                    <button
                        type="button"
                        onClick={() => { void loadStats(); }}
                        className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                    >
                        Tentar novamente
                    </button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Análise de Dados">
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((stat) => (
                    <Card key={stat.label} className="border-slate-100 shadow-sm transition-shadow hover:shadow-md">
                        <CardContent className="p-6">
                            <div className="mb-4 flex items-start justify-between">
                                <div className={`${stat.bg} p-3 rounded-xl ${stat.color}`}>
                                    <stat.icon size={24} />
                                </div>
                                <span className="flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">
                                    <ArrowUpRight size={14} className="mr-1" />
                                    Real
                                </span>
                            </div>
                            <h3 className="text-sm font-medium text-slate-500">{stat.label}</h3>
                            <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-serif text-slate-900">
                            <TrendingUp size={20} className="text-primary" /> Posts Mais Lidos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topPosts.length > 0 ? (
                                topPosts.map((post, index) => (
                                    <div key={post.id} className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-slate-50">
                                        <span className="w-6 text-lg font-bold text-slate-300">#{index + 1}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-900">{post.title}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
                                            <Eye size={12} />
                                            {post.views || 0}
                                        </div>
                                    </div>
                                ))
                            ) : postsError ? (
                                <p className="py-8 text-center text-sm italic text-slate-500">{postsError}</p>
                            ) : (
                                <p className="py-8 text-center text-sm italic text-slate-500">Nenhum post visualizado.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-serif text-slate-900">
                            <Globe size={20} className="text-blue-500" /> Origem do Tráfego
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderRankedList(sources, "Dados de tráfego insuficientes.", "bg-blue-500")}
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-serif text-slate-900">
                            <Globe size={20} className="text-emerald-500" /> Cidades Principais
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderRankedList(locations, "Aguardando dados geográficos.", "bg-emerald-500")}
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-serif text-slate-900">
                            <Route size={20} className="text-violet-500" /> Páginas Mais Visitadas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderRankedList(topPaths, "Ainda não há páginas ranqueadas.", "bg-violet-500")}
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-serif text-slate-900">
                            <Smartphone size={20} className="text-sky-500" /> Dispositivos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderRankedList(devices, "Dispositivos ainda sem volume suficiente.", "bg-sky-500")}
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-serif text-slate-900">
                            <MapPin size={20} className="text-orange-500" /> Regiões Aproximadas
                        </CardTitle>
                        <CardDescription>Estimativa agregada via IP sem permissão de GPS</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderRankedList(regions, "Capturando aproximações regionais...", "bg-orange-500")}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default AdminAnalytics;
