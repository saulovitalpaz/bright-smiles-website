import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Users,
    MapPin,
    Target,
    Globe,
    Navigation,
    Layers,
    Smartphone
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
                        <p className="text-2xl font-bold mt-1">--</p>
                        <p className="text-[10px] text-emerald-400 mt-2 font-bold uppercase tracking-wider">Aguardando dados</p>
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
                        <p className="text-2xl font-bold text-slate-900 mt-1">--</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Sem dados demográficos</p>
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
                        <p className="text-2xl font-bold text-slate-900 mt-1">--</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Aguardando leads</p>
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
                        <p className="text-2xl font-bold text-slate-900 mt-1">--</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Sem acessos registrados</p>
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
                        <div className="flex items-center justify-center h-40 bg-slate-50 rounded-xl">
                            <p className="text-slate-400 text-sm italic">Dados insuficientes para gerar gráfico.</p>
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
                        <div className="flex items-center justify-center h-40 bg-slate-50 rounded-xl">
                            <p className="text-slate-400 text-sm italic">Nenhuma localização registrada.</p>
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
                    <div className="flex items-center justify-center h-20 bg-slate-50 rounded-xl">
                        <p className="text-slate-400 text-sm italic">Nenhum lead encontrado.</p>
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    );
};

export default AdminAnalytics;
