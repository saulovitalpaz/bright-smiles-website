import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

export interface FaceRegionData {
    dose: string;
    product: string;
    notes: string;
}

interface FaceMapProps {
    data: Record<string, FaceRegionData>;
    onChange: (data: Record<string, FaceRegionData>) => void;
    readOnly?: boolean;
}

const REGIONS = [
    { id: 'frontal', name: 'Frontal (Testa)', path: "M20,20 Q50,0 80,20 L80,40 Q50,30 20,40 Z" },
    { id: 'glabela', name: 'Glabela', path: "M40,42 L60,42 L55,55 L45,55 Z" },
    { id: 'periorbital', name: 'Periorbital', path: "M15,45 Q25,40 38,45 L35,55 Q25,60 15,55 Z M62,45 Q75,40 85,45 L85,55 Q75,60 65,55 Z" },
    { id: 'malar', name: 'Malar / Zigomático', path: "M10,60 Q25,55 40,65 L35,80 Q20,75 10,70 Z M60,65 Q75,55 90,60 L90,70 Q80,75 65,80 Z" },
    { id: 'nasolabial', name: 'Sulco Nasolabial', path: "M38,68 Q45,65 50,75 Q55,65 62,68 L60,85 Q50,90 40,85 Z" },
    { id: 'labios', name: 'Lábios', path: "M35,90 Q50,85 65,90 Q50,105 35,90 Z" },
    { id: 'mento', name: 'Mento (Queixo)', path: "M40,110 Q50,125 60,110 L55,120 L45,120 Z" },
    { id: 'mandibula', name: 'Contorno de Mandíbula', path: "M15,85 L10,105 Q50,135 90,105 L85,85 Q50,115 15,85 Z" },
    { id: 'pescoço', name: 'Pescoço', path: "M30,130 L70,130 L75,150 L25,150 Z" }
];

const FaceSVG = ({ data, onRegionClick, activeRegion }: { data: Record<string, FaceRegionData>, onRegionClick: (id: string) => void, activeRegion: string | null }) => {
    return (
        <svg viewBox="0 0 100 160" className="w-full max-w-[300px] h-auto drop-shadow-2xl mx-auto">
            {/* Outline of face */}
            <path 
                d="M20,20 Q50,-10 80,20 L90,100 Q70,140 50,140 Q30,140 10,100 Z" 
                fill="white" 
                stroke="#e2e8f0" 
                strokeWidth="2"
            />
            {REGIONS.map(region => {
                const hasData = data[region.id] && (data[region.id].dose !== '' || data[region.id].product !== '');
                const isActive = activeRegion === region.id;

                return (
                    <path
                        key={region.id}
                        d={region.path}
                        className={`cursor-pointer transition-all duration-300 hover:opacity-80 stroke-slate-200 stroke-[0.5] ${isActive ? 'fill-primary animate-pulse' : (hasData ? 'fill-primary/60' : 'fill-slate-50')}`}
                        onClick={() => onRegionClick(region.id)}
                    >
                        <title>{region.name}</title>
                    </path>
                );
            })}
        </svg>
    );
};

const FaceMap: React.FC<FaceMapProps> = ({ data = {}, onChange, readOnly = false }) => {
    const [selectedRegionId, setSelectedRegionId] = React.useState<string | null>(null);

    const updateRegion = (id: string, field: keyof FaceRegionData, value: string) => {
        if (readOnly) return;
        const current = data[id] || { dose: '', product: '', notes: '' };
        onChange({
            ...data,
            [id]: { ...current, [field]: value }
        });
    };

    const getRegionData = (id: string) => data[id] || { dose: '', product: '', notes: '' };
    const hasData = (id: string) => {
        const d = getRegionData(id);
        return d.dose !== '' || d.product !== '' || d.notes !== '';
    };

    const selectedRegion = REGIONS.find(r => r.id === selectedRegionId);
    const rData = selectedRegionId ? getRegionData(selectedRegionId) : null;

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User size={20} />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-serif">Mapeamento Facial Interativo</CardTitle>
                        <CardDescription>
                            Clique nas áreas do rosto para registrar aplicações e doses.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                    {/* Visual Map */}
                    <div className="flex-1 bg-slate-50/50 rounded-3xl p-8 border border-slate-100/50 w-full flex justify-center">
                        <FaceSVG data={data} onRegionClick={setSelectedRegionId} activeRegion={selectedRegionId} />
                    </div>

                    {/* Legend / Info */}
                    <div className="w-full lg:w-80 space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                            {REGIONS.map(region => (
                                <button
                                    key={region.id}
                                    onClick={() => setSelectedRegionId(region.id)}
                                    className={`text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-between ${selectedRegionId === region.id ? 'bg-primary text-white border-primary shadow-md' : (hasData(region.id) ? 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}`}
                                >
                                    {region.name}
                                    {hasData(region.id) && <Badge variant="secondary" className="bg-white/20 text-current text-[10px] px-1.5 h-4 ml-2">Preenchido</Badge>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {readOnly && Object.keys(data).filter(k => hasData(k)).length > 0 && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {REGIONS.filter(r => hasData(r.id)).map(region => {
                            const d = getRegionData(region.id);
                            return (
                                <div key={region.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                    <h4 className="font-bold text-sm text-slate-900">{region.name}</h4>
                                    <div className="text-xs space-y-1">
                                        {d.product && <p><span className="text-slate-500">Produto:</span> {d.product}</p>}
                                        {d.dose && <p><span className="text-slate-500">Dose:</span> {d.dose}</p>}
                                        {d.notes && <p className="italic text-slate-600 mt-2 border-t pt-2 border-slate-200">"{d.notes}"</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>

            {/* Region Detail Dialog */}
            <Dialog open={selectedRegionId !== null} onOpenChange={(open) => !open && setSelectedRegionId(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Mapeamento de Região: {selectedRegion?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedRegionId && rData && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase text-slate-500 font-bold">Produto</Label>
                                    <Input
                                        placeholder="Ex: Botox, Juvederm..."
                                        value={rData.product}
                                        onChange={(e) => updateRegion(selectedRegionId, 'product', e.target.value)}
                                        disabled={readOnly}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase text-slate-500 font-bold">Dose / Volume</Label>
                                    <Input
                                        placeholder="Ex: 50U, 1ml..."
                                        value={rData.dose}
                                        onChange={(e) => updateRegion(selectedRegionId, 'dose', e.target.value)}
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase text-slate-500 font-bold">Resumo Clínico da Aplicação</Label>
                                <Textarea
                                    placeholder="Detalhes técnicos, profundidade, técnica utilizada..."
                                    className="min-h-[100px]"
                                    value={rData.notes}
                                    onChange={(e) => updateRegion(selectedRegionId, 'notes', e.target.value)}
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default FaceMap;
