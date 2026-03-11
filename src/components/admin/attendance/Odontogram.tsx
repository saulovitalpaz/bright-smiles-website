import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Edit2 } from "lucide-react";

export interface ToothData {
    status: string;
    notes: string;
}

interface OdontogramProps {
    data: Record<string, ToothData>;
    onChange: (data: Record<string, ToothData>) => void;
    readOnly?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
    'Saudável': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Tratar': 'bg-red-100 text-red-700 border-red-200',
    'Tratado': 'bg-blue-100 text-blue-700 border-blue-200',
    'Ausente': 'bg-slate-200 text-slate-500 border-slate-300',
    'Implante': 'bg-purple-100 text-purple-700 border-purple-200',
    'Ponte': 'bg-orange-100 text-orange-700 border-orange-200',
};

const TEETH_UPPER = [
    18, 17, 16, 15, 14, 13, 12, 11, // Quadrant 1
    21, 22, 23, 24, 25, 26, 27, 28  // Quadrant 2
];
const TEETH_LOWER = [
    48, 47, 46, 45, 44, 43, 42, 41, // Quadrant 4
    31, 32, 33, 34, 35, 36, 37, 38  // Quadrant 3
];

const TeethRow = ({
    teeth, data, updateData, readOnly
}: {
    teeth: number[], data: Record<string, ToothData>, updateData: (id: string, s: string, n: string) => void, readOnly: boolean
}) => {
    return (
        <div className="flex justify-center gap-1 md:gap-2 flex-wrap md:flex-nowrap">
            {teeth.map(tooth => {
                const toothData = data[tooth.toString()] || { status: 'Saudável', notes: '' };
                const colorClass = STATUS_COLORS[toothData.status] || STATUS_COLORS['Saudável'];
                const hasNotes = toothData.notes.trim().length > 0;

                return (
                    <Popover key={tooth}>
                        <PopoverTrigger asChild>
                            <button
                                className={`relative w-8 h-10 md:w-10 md:h-12 border rounded-md flex items-center justify-center font-bold text-xs md:text-sm transition-all shadow-sm ${colorClass} ${!readOnly && 'hover:ring-2 ring-primary/50'}`}
                                disabled={readOnly}
                            >
                                {tooth}
                                {hasNotes && (
                                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full border-2 border-white" />
                                )}
                            </button>
                        </PopoverTrigger>
                        {!readOnly && (
                            <PopoverContent className="w-64 p-4 shadow-xl border-slate-200" side="top">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-bold text-sm mb-2 flex items-center gap-2">Dente {tooth}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.keys(STATUS_COLORS).map(status => (
                                                <Badge
                                                    key={status}
                                                    variant="outline"
                                                    className={`cursor-pointer ${toothData.status === status ? 'bg-slate-800 text-white' : ''}`}
                                                    onClick={() => updateData(tooth.toString(), status, toothData.notes)}
                                                >
                                                    {status}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-slate-500 font-bold">Observação</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={toothData.notes}
                                                onChange={(e) => updateData(tooth.toString(), toothData.status, e.target.value)}
                                                placeholder="Ex: Cárie MOD..."
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        )}
                    </Popover>
                );
            })}
        </div>
    );
};

const Odontogram: React.FC<OdontogramProps> = ({ data = {}, onChange, readOnly = false }) => {
    const updateTooth = (tooth: string, status: string, notes: string) => {
        if (readOnly) return;

        // If it's back to default and no notes, we can actually clean it from the object to save space, but let's just keep it for simplicity.
        onChange({
            ...data,
            [tooth]: { status, notes }
        });
    };

    const recordedTeeth = Object.keys(data).filter(k => data[k].status !== 'Saudável' || data[k].notes !== '');

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-serif">Odontograma</CardTitle>
                <CardDescription>
                    Mapeamento dentário interativo para registrar tratamentos e diagnósticos.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-6 md:space-y-8 overflow-x-auto pb-4">
                    <div className="min-w-[500px]">
                        <div className="text-center mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Arcada Superior</div>
                        <TeethRow teeth={TEETH_UPPER} data={data} updateData={updateTooth} readOnly={readOnly} />
                    </div>

                    <div className="w-full h-px bg-slate-200" />

                    <div className="min-w-[500px]">
                        <TeethRow teeth={TEETH_LOWER} data={data} updateData={updateTooth} readOnly={readOnly} />
                        <div className="text-center mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Arcada Inferior</div>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-4 items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase">Legenda:</span>
                    {Object.entries(STATUS_COLORS).map(([status, bgClass]) => (
                        <div key={status} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                            <span className={`w-3 h-3 rounded-full border shadow-sm ${bgClass}`} />
                            {status}
                        </div>
                    ))}
                </div>

                {readOnly && recordedTeeth.length > 0 && (
                    <div className="mt-6 space-y-3">
                        <Label className="text-xs uppercase text-slate-500 font-bold">Resumo das Notas</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {recordedTeeth.map(t => (
                                <div key={t} className="text-sm p-3 bg-slate-50 border rounded-lg flex items-start justify-between">
                                    <div>
                                        <span className="font-bold text-slate-900 mr-2">Dente {t}</span>
                                        <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[data[t].status]}`}>{data[t].status}</Badge>
                                    </div>
                                    {data[t].notes && <span className="text-slate-600 block mt-1 ml-4 italic">"{data[t].notes}"</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default Odontogram;
