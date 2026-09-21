import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Calendar,
    Eye,
    Globe,
    MapPin,
    Route,
    Smartphone,
    Target,
    Users,
} from "lucide-react";

import { fetchClient } from "@/lib/api";

interface AnalyticsData {
    totalVisits: number;
    uniqueVisitors: number;
    conversionRate: string;
    leadsCount: number;
    sources: Record<string, number>;
    locations: Record<string, number>;
    regions: Record<string, number>;
    nearbyRegions?: NearbyRegion[];
    topPaths: Record<string, number>;
    devices: Record<string, number>;
}

interface NearbyRegion {
    city: string;
    state?: string | null;
    latitude: number;
    longitude: number;
    distanceKm: number;
    count: number;
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
    nearbyRegions: [],
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

const AdminAnalytics = () => {
    const [analytics, setAnalytics] = useState<AnalyticsData>(emptyAnalytics);
    const [loading, setLoading] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    const loadStats = async () => {
        setLoading(true);
        setStatsError(null);
        try {
            const response = await fetchClient("/analytics/stats");
            if (!response.ok) throw new Error("Analytics unavailable");
            const analyticsData = await response.json() as AnalyticsData;
            setAnalytics({
                ...emptyAnalytics,
                ...analyticsData,
            });
        } catch {
            setStatsError("Não foi possível carregar as métricas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadStats();
    }, []);

    const totalVisits = analytics.totalVisits || 1;
    const sources = rankMetrics(analytics.sources, totalVisits);
    const locations = rankMetrics(analytics.locations, totalVisits);
    const topPaths = rankMetrics(analytics.topPaths, totalVisits);
    const devices = rankMetrics(analytics.devices, totalVisits);
    const nearbyTotal = analytics.nearbyRegions?.reduce((sum, region) => sum + region.count, 0) || 0;
    const nearbyRegions = analytics.nearbyRegions?.length
        ? analytics.nearbyRegions.map((region) => ({
            ...region,
            name: `${region.city}${region.state ? `, ${region.state}` : ""}`,
            percentage: Math.round((region.count / nearbyTotal) * 100),
        }))
        : [];

    const cards = [
        { label: "Visitas Totais", value: analytics.totalVisits, icon: Eye, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Visitantes Únicos", value: analytics.uniqueVisitors, icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
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

    const renderNearbyRegions = () => (
        <div className="space-y-6">
            {nearbyRegions.length > 0 ? nearbyRegions.map((item) => (
                <div key={`${item.name}-${item.latitude}-${item.longitude}`} className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="mb-1 flex justify-between gap-3">
                            <span className="break-words text-sm font-medium text-slate-700">{item.name}<span className="ml-2 text-xs font-normal text-slate-500">aprox. {item.distanceKm} km</span><span className="block text-xs font-normal text-slate-500">Localização estimada: {item.latitude}, {item.longitude}</span></span>
                            <span className="text-sm font-bold text-slate-900">{item.percentage}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${item.percentage}%` }} /></div>
                    </div>
                </div>
            )) : <p className="py-8 text-center text-sm italic text-slate-500">Capturando aproximações regionais...</p>}
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
            <div className="mb-4 grid items-start grid-cols-2 gap-3 lg:grid-cols-4 md:mb-6">
                {cards.map((stat) => (
                    <Card key={stat.label} className="border-slate-100 shadow-sm transition-shadow hover:shadow-md">
                        <CardContent className="p-3 sm:p-4">
                            <div className="mb-2 flex items-start justify-between">
                                <div className={`${stat.bg} p-1.5 rounded-lg ${stat.color}`}>
                                    <stat.icon size={16} aria-hidden="true" />
                                </div>
                            </div>
                            <h3 className="text-xs font-medium text-slate-600">{stat.label}</h3>
                            <p className="admin-metric-value mt-1 text-slate-900">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mb-6 grid items-start grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
                            <Globe size={20} className="text-blue-500" /> Origem do Tráfego
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderRankedList(sources, "Dados de tráfego insuficientes.", "bg-blue-500")}
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
                            <Globe size={20} className="text-emerald-500" /> Cidades Principais
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderRankedList(locations, "Aguardando dados geográficos.", "bg-emerald-500")}
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
                            <Route size={20} className="text-violet-500" /> Páginas Mais Visitadas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderRankedList(topPaths, "Ainda não há páginas ranqueadas.", "bg-violet-500")}
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
                            <Smartphone size={20} className="text-sky-500" /> Dispositivos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderRankedList(devices, "Dispositivos ainda sem volume suficiente.", "bg-sky-500")}
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
                            <MapPin size={20} className="text-orange-500" /> Regiões Aproximadas
                        </CardTitle>
                        <CardDescription>Estimativas por IP, da mais próxima à mais distante, em até 15 km da clínica</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderNearbyRegions()}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default AdminAnalytics;
