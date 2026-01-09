import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Users,
    MapPin,
    Target,
    BarChart3,
    Smartphone,
    Globe,
    Navigation,
    Layers
} from "lucide-react";

const AdminAnalytics = () => {
    return (
        <AdminLayout title="Inteligência de Marketing">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-slate-900 text-white border-none shadow-xl">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-primary/20 p-3 rounded-xl text-primary">
                                <Target size={24} />
                            </div>
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium">ROI Estimado</h3>
                        <p className="text-2xl font-bold mt-1">4.2x</p>
                        <p className="text-[10px] text-emerald-400 mt-2 font-bold uppercase tracking-wider">Investimento: R$ 500,00</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                                <Users size={24} />
                            </div>
                        </div>
                        <h3 className="text-slate-500 text-sm font-medium">Público Principal</h3>
                        <p className="text-2xl font-bold text-slate-900 mt-1">Feminino</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">25-34 anos (65%)</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-orange-50 p-3 rounded-xl text-orange-600">
                                <MapPin size={24} />
                            </div>
                        </div>
                        <h3 className="text-slate-500 text-sm font-medium">Top Localização</h3>
                        <p className="text-2xl font-bold text-slate-900 mt-1">Centro / MG</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Raio de 5km (80%)</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
                                <Smartphone size={24} />
                            </div>
                        </div>
                        <h3 className="text-slate-500 text-sm font-medium">Dispositivo</h3>
                        <p className="text-2xl font-bold text-slate-900 mt-1">iOS (iPhone)</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">92% dos acessos</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-serif flex items-center gap-2">
                            <Globe size={20} className="text-primary" /> Origem do Tráfego
                        </CardTitle>
                        <CardDescription>Canais que mais geram agendamentos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {[
                                { name: "Instagram Ads", value: 65, color: "bg-gradient-to-r from-purple-500 to-pink-500" },
                                { name: "Google Search", value: 25, color: "bg-blue-500" },
                                { name: "Acesso Direto", value: 10, color: "bg-slate-400" }
                            ].map((channel) => (
                                <div key={channel.name}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium text-slate-700">{channel.name}</span>
                                        <span className="font-bold text-slate-900">{channel.value}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${channel.color}`} style={{ width: `${channel.value}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-serif flex items-center gap-2">
                            <Navigation size={20} className="text-orange-500" /> Mapa de Calor (Leads)
                        </CardTitle>
                        <CardDescription>Concentração geográfica de interessados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="aspect-video bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-42.0267,-17.8572,12/400x250?access_token=mock')] bg-cover opacity-60"></div>
                            <div className="relative z-10 text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-lg max-w-[200px]">
                                <Layers size={32} className="mx-auto text-primary mb-2 opacity-20" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Visualização de Mapa<br />(Requer API Key)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-serif">Últimos Leads Qualificados</CardTitle>
                    <CardDescription>Detalhamento técnico da origem do lead.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-left">
                                    <th className="pb-4 font-medium">Paciente</th>
                                    <th className="pb-4 font-medium">Origem (UTM)</th>
                                    <th className="pb-4 font-medium">Localização</th>
                                    <th className="pb-4 font-medium">Demografia</th>
                                    <th className="pb-4 font-medium text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[
                                    { name: "João Silva", utm: "google_search", loc: "Governador Valadares", age: "25-34", gender: "M", status: "Convertido" },
                                    { name: "Maria Oliveira", utm: "insta_bio", loc: "Teófilo Otoni", age: "35-44", gender: "F", status: "Em contato" },
                                    { name: "Letícia Santos", utm: "tiktok_ads", loc: "Governador Valadares", age: "18-24", gender: "F", status: "Agendado" },
                                ].map((lead, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 font-bold text-slate-900">{lead.name}</td>
                                        <td className="py-4">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase">{lead.utm}</span>
                                        </td>
                                        <td className="py-4 text-slate-500">{lead.loc}</td>
                                        <td className="py-4 text-slate-500">{lead.gender} · {lead.age}</td>
                                        <td className="py-4 text-right">
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold uppercase">{lead.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    );
};

export default AdminAnalytics;
