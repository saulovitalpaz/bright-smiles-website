import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
    { id: 'frontal', name: 'Frontal (Testa)' },
    { id: 'glabela', name: 'Glabela' },
    { id: 'periorbital', name: 'Periorbital (Pés de galinha)' },
    { id: 'malar', name: 'Malar / Zigomático' },
    { id: 'nasolabial', name: 'Sulco Nasolabial (Bigode chinês)' },
    { id: 'labios', name: 'Lábios' },
    { id: 'mento', name: 'Mento (Queixo)' },
    { id: 'mandibula', name: 'Contorno de Mandíbula' },
    { id: 'pescoço', name: 'Pescoço' }
];

const FaceMap: React.FC<FaceMapProps> = ({ data = {}, onChange, readOnly = false }) => {

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

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-serif">Mapeamento Facial (Harmonização)</CardTitle>
                <CardDescription>
                    Registre os produtos, doses e observações aplicadas por região da face.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {REGIONS.map(region => {
                        const rData = getRegionData(region.id);
                        const isFilled = hasData(region.id);

                        // Only show filled regions if readOnly to save space
                        if (readOnly && !isFilled) return null;

                        return (
                            <div key={region.id} className={`p-4 rounded-xl border transition-all ${isFilled ? 'border-primary/30 bg-primary/5' : 'border-slate-200 bg-white'}`}>
                                <h4 className="font-bold text-sm text-slate-800 mb-3">{region.name}</h4>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase text-slate-500 font-bold">Produto</Label>
                                            <Input
                                                className="h-8 text-xs bg-white"
                                                placeholder="Ex: Botox"
                                                value={rData.product}
                                                onChange={(e) => updateRegion(region.id, 'product', e.target.value)}
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase text-slate-500 font-bold">Dose / Volume</Label>
                                            <Input
                                                className="h-8 text-xs bg-white"
                                                placeholder="Ex: 10 U ou 1 ml"
                                                value={rData.dose}
                                                onChange={(e) => updateRegion(region.id, 'dose', e.target.value)}
                                                disabled={readOnly}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-slate-500 font-bold">Notas Específicas</Label>
                                        <Textarea
                                            className="min-h-[60px] text-xs bg-white resize-none"
                                            placeholder="Detalhes da aplicação..."
                                            value={rData.notes}
                                            onChange={(e) => updateRegion(region.id, 'notes', e.target.value)}
                                            disabled={readOnly}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {readOnly && Object.keys(data).filter(k => hasData(k)).length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                        Nenhum mapeamento facial registrado.
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default FaceMap;
