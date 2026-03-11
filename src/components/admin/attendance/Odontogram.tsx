import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Edit2 } from "lucide-react";

export interface ToothFaceData {
    status: string;
}

export interface ToothData {
    status: string;
    notes: string;
    faces?: Record<string, ToothFaceData>;
}

interface OdontogramProps {
    data: Record<string, ToothData>;
    onChange: (data: Record<string, ToothData>) => void;
    readOnly?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
    'Saudável': 'bg-gradient-to-b from-white to-slate-200 text-slate-700 border-slate-300 shadow-[inset_0_-4px_6px_rgba(0,0,0,0.1),inset_0_4px_4px_rgba(255,255,255,0.9),0_4px_5px_rgba(0,0,0,0.05)]',
    'Tratar': 'bg-gradient-to-b from-red-100 to-red-300 text-red-900 border-red-400 shadow-[inset_0_-4px_6px_rgba(150,0,0,0.3),inset_0_4px_4px_rgba(255,255,255,0.8),0_4px_5px_rgba(0,0,0,0.1)]',
    'Tratado': 'bg-gradient-to-b from-blue-100 to-blue-300 text-blue-900 border-blue-400 shadow-[inset_0_-4px_6px_rgba(0,0,150,0.3),inset_0_4px_4px_rgba(255,255,255,0.8),0_4px_5px_rgba(0,0,0,0.1)]',
    'Ausente': 'bg-gradient-to-b from-slate-200 to-slate-300 text-slate-500 border-slate-400 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.5)] opacity-60',
    'Implante': 'bg-gradient-to-b from-purple-100 to-purple-300 text-purple-900 border-purple-400 shadow-[inset_0_-4px_6px_rgba(100,0,150,0.3),inset_0_4px_4px_rgba(255,255,255,0.8),0_4px_5px_rgba(0,0,0,0.1)]',
    'Ponte': 'bg-gradient-to-b from-orange-100 to-orange-300 text-orange-900 border-orange-400 shadow-[inset_0_-4px_6px_rgba(150,50,0,0.3),inset_0_4px_4px_rgba(255,255,255,0.8),0_4px_5px_rgba(0,0,0,0.1)]',
};

const FACE_FILL_COLORS: Record<string, string> = {
    'Saudável': 'fill-white',
    'Tratar': 'fill-red-500',
    'Tratado': 'fill-blue-500',
    'Ausente': 'fill-slate-300',
    'Implante': 'fill-purple-500',
    'Ponte': 'fill-orange-500',
};

const TEETH_UPPER = [
    18, 17, 16, 15, 14, 13, 12, 11, // Quadrant 1
    21, 22, 23, 24, 25, 26, 27, 28  // Quadrant 2
];
const TEETH_LOWER = [
    48, 47, 46, 45, 44, 43, 42, 41, // Quadrant 4
    31, 32, 33, 34, 35, 36, 37, 38  // Quadrant 3
];

const getFaceLabels = (toothNumber: number) => {
    const isUpper = toothNumber >= 11 && toothNumber <= 28;
    const isRight = (toothNumber >= 11 && toothNumber <= 18) || (toothNumber >= 41 && toothNumber <= 48);

    return {
        top: isUpper ? 'Vestibular' : 'Lingual',
        bottom: isUpper ? 'Palatina' : 'Vestibular',
        left: isRight ? 'Distal' : 'Mesial',
        right: isRight ? 'Mesial' : 'Distal',
        center: 'Oclusal / Incisal'
    };
};

const ToothSVG = ({ data, onClick, isLarge = false }: { data: ToothData, onClick?: (face: string) => void, isLarge?: boolean }) => {
    const generalStatus = data.status || 'Saudável';
    const hasFaces = data.faces && Object.keys(data.faces).length > 0;
    
    // If entire tooth is missing/implant, we might want to color the whole thing
    const overrideAll = generalStatus === 'Ausente' || generalStatus === 'Implante' || generalStatus === 'Ponte';
    
    const getFaceColor = (faceKey: string) => {
        if (overrideAll) return FACE_FILL_COLORS[generalStatus] || 'fill-white';
        if (hasFaces && data.faces![faceKey]) {
            return FACE_FILL_COLORS[data.faces![faceKey].status] || 'fill-white';
        }
        return generalStatus !== 'Saudável' ? (FACE_FILL_COLORS[generalStatus] || 'fill-white') : 'fill-white';
    };

    const handleFaceClick = (e: React.MouseEvent, face: string) => {
        e.stopPropagation();
        if (onClick) onClick(face);
    };

    const strokeClass = "stroke-slate-300 transition-colors duration-200 hover:brightness-95 cursor-pointer";
    const strokeWidth = isLarge ? "2" : "4";

    return (
        <svg viewBox="0 0 100 100" className={`${isLarge ? 'w-48 h-48 drop-shadow-xl' : 'w-7 h-7 md:w-8 md:h-8 drop-shadow-sm'}`}>
            {/* Top */}
            <polygon points="0,0 100,0 75,25 25,25" className={`${getFaceColor('top')} ${strokeClass}`} strokeWidth={strokeWidth} onClick={(e) => handleFaceClick(e, 'top')} />
            {/* Bottom */}
            <polygon points="25,75 75,75 100,100 0,100" className={`${getFaceColor('bottom')} ${strokeClass}`} strokeWidth={strokeWidth} onClick={(e) => handleFaceClick(e, 'bottom')} />
            {/* Left */}
            <polygon points="0,0 25,25 25,75 0,100" className={`${getFaceColor('left')} ${strokeClass}`} strokeWidth={strokeWidth} onClick={(e) => handleFaceClick(e, 'left')} />
            {/* Right */}
            <polygon points="100,0 75,25 75,75 100,100" className={`${getFaceColor('right')} ${strokeClass}`} strokeWidth={strokeWidth} onClick={(e) => handleFaceClick(e, 'right')} />
            {/* Center */}
            <polygon points="25,25 75,25 75,75 25,75" className={`${getFaceColor('center')} ${strokeClass}`} strokeWidth={strokeWidth} onClick={(e) => handleFaceClick(e, 'center')} />
        </svg>
    );
};

const TeethRow = ({
    teeth, data, onToothClick, readOnly
}: {
    teeth: number[], data: Record<string, ToothData>, onToothClick: (tooth: number) => void, readOnly: boolean
}) => {
    return (
        <div className="flex justify-center gap-1 md:gap-2 flex-wrap md:flex-nowrap">
            {teeth.map(tooth => {
                const toothData = data[tooth.toString()] || { status: 'Saudável', notes: '' };
                const hasNotes = toothData.notes && toothData.notes.trim().length > 0;

                return (
                    <div key={tooth} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400">{tooth}</span>
                        <button
                            className={`relative border border-slate-200 bg-white rounded flex items-center justify-center transition-all ${!readOnly && 'hover:-translate-y-0.5 hover:shadow-md'}`}
                            onClick={() => !readOnly && onToothClick(tooth)}
                            disabled={readOnly}
                        >
                            <ToothSVG data={toothData} />
                            
                            {hasNotes && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border border-white" />
                            )}
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

const Odontogram: React.FC<OdontogramProps> = ({ data = {}, onChange, readOnly = false }) => {
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
    const [activeFace, setActiveFace] = useState<string | null>(null);

    const handleToothClick = (tooth: number) => {
        setSelectedTooth(tooth);
        setActiveFace(null);
    };

    const updateGeneralStatus = (status: string) => {
        if (!selectedTooth || readOnly) return;
        const currentData = data[selectedTooth.toString()] || { status: 'Saudável', notes: '' };
        
        onChange({
            ...data,
            [selectedTooth.toString()]: { ...currentData, status }
        });
    };

    const updateFaceStatus = (face: string, status: string) => {
        if (!selectedTooth || readOnly) return;
        const currentData = data[selectedTooth.toString()] || { status: 'Saudável', notes: '' };
        const currentFaces = currentData.faces || {};
        
        onChange({
            ...data,
            [selectedTooth.toString()]: { 
                ...currentData, 
                faces: {
                    ...currentFaces,
                    [face]: { status }
                }
            }
        });
    };

    const updateNotes = (notes: string) => {
        if (!selectedTooth || readOnly) return;
        const currentData = data[selectedTooth.toString()] || { status: 'Saudável', notes: '' };
        onChange({
            ...data,
            [selectedTooth.toString()]: { ...currentData, notes }
        });
    };

    const recordedTeeth = Object.keys(data).filter(k => 
        data[k].status !== 'Saudável' || 
        (data[k].notes && data[k].notes !== '') || 
        (data[k].faces && Object.keys(data[k].faces!).length > 0)
    );

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
                        <TeethRow teeth={TEETH_UPPER} data={data} onToothClick={handleToothClick} readOnly={readOnly} />
                    </div>

                    <div className="w-full h-px bg-slate-200" />

                    <div className="min-w-[500px]">
                        <TeethRow teeth={TEETH_LOWER} data={data} onToothClick={handleToothClick} readOnly={readOnly} />
                        <div className="text-center mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Arcada Inferior</div>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-4 items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase">Legenda:</span>
                    {Object.entries(FACE_FILL_COLORS).map(([status, fillClass]) => (
                        <div key={status} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                            <svg viewBox="0 0 10 10" className={`w-3 h-3 rounded-sm border border-slate-300 shadow-sm ${fillClass}`}>
                                <rect width="10" height="10" />
                            </svg>
                            {status}
                        </div>
                    ))}
                </div>

                {readOnly && recordedTeeth.length > 0 && (
                    <div className="mt-6 space-y-3">
                        <Label className="text-xs uppercase text-slate-500 font-bold">Resumo das Notas</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {recordedTeeth.map(t => {
                                const labels = getFaceLabels(parseInt(t));
                                const td = data[t];
                                const FaceBadges = () => {
                                    if (!td.faces) return null;
                                    return (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {Object.entries(td.faces).map(([faceKey, faceData]) => {
                                                if (faceData.status === 'Saudável') return null;
                                                return (
                                                    <Badge key={faceKey} variant="secondary" className="text-[10px]">
                                                        {labels[faceKey as keyof typeof labels]}: {faceData.status}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    )
                                }
                                return (
                                    <div key={t} className="text-sm p-3 bg-slate-50 border rounded-lg flex flex-col">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className="font-bold text-slate-900 mr-2">Dente {t}</span>
                                                <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[td.status]}`}>{td.status}</Badge>
                                            </div>
                                        </div>
                                        <FaceBadges />
                                        {td.notes && <span className="text-slate-600 block mt-2 italic">"{td.notes}"</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Modal for Mobile Popup Detail */}
            <Dialog open={selectedTooth !== null} onOpenChange={(open) => !open && setSelectedTooth(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Mapeamento Detalhado - Dente {selectedTooth}</DialogTitle>
                    </DialogHeader>
                    {selectedTooth && (
                        <div className="py-4 flex flex-col items-center">
                            
                            {/* Interactive Exploded SVG */}
                            <div className="relative mb-6">
                                <ToothSVG 
                                    data={data[selectedTooth.toString()] || { status: 'Saudável', notes: '' }} 
                                    isLarge 
                                    onClick={(face) => setActiveFace(face)} 
                                />
                                {/* Labels mapping dynamically */}
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 whitespace-nowrap bg-white/80 px-1 rounded">{getFaceLabels(selectedTooth).top}</div>
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 whitespace-nowrap bg-white/80 px-1 rounded">{getFaceLabels(selectedTooth).bottom}</div>
                                <div className="absolute top-1/2 -left-8 -translate-y-1/2 text-[10px] font-bold text-slate-500 bg-white/80 px-1 rounded -rotate-90">{getFaceLabels(selectedTooth).left}</div>
                                <div className="absolute top-1/2 -right-8 -translate-y-1/2 text-[10px] font-bold text-slate-500 bg-white/80 px-1 rounded rotate-90">{getFaceLabels(selectedTooth).right}</div>
                                <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-800 pointer-events-none drop-shadow-md bg-white/50 px-1 rounded">{getFaceLabels(selectedTooth).center}</div>
                            </div>

                            {/* Options to fill */}
                            <div className="w-full space-y-4 text-left">
                                {activeFace ? (
                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg animate-in fade-in">
                                        <Label className="text-xs uppercase text-blue-600 font-bold mb-2 block flex justify-between">
                                            <span>Selecionando para: {getFaceLabels(selectedTooth)[activeFace as keyof ReturnType<typeof getFaceLabels>]}</span>
                                            <button onClick={() => setActiveFace(null)} className="underline">Voltar pro Dente Inteiro</button>
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.keys(STATUS_COLORS).map(status => (
                                                <Badge
                                                    key={status}
                                                    variant="outline"
                                                    className={`cursor-pointer ${(data[selectedTooth.toString()]?.faces?.[activeFace]?.status === status) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}
                                                    onClick={() => updateFaceStatus(activeFace, status)}
                                                >
                                                    {status}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg animate-in fade-in">
                                        <Label className="text-xs uppercase text-slate-500 font-bold mb-2 block flex justify-between">
                                            <span>Condição Geral Dente todo</span>
                                            <span className="text-[10px] font-normal lowercase">(ou clique numa face acima para pintar isolado)</span>
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.keys(STATUS_COLORS).map(status => (
                                                <Badge
                                                    key={status}
                                                    variant="outline"
                                                    className={`cursor-pointer ${(data[selectedTooth.toString()]?.status === status) ? 'bg-slate-800 text-white' : 'bg-white'}`}
                                                    onClick={() => updateGeneralStatus(status)}
                                                >
                                                    {status}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 mt-4 inline-block w-full">
                                    <Label className="text-xs uppercase text-slate-500 font-bold">Observação aprofundada</Label>
                                    <Input
                                        value={data[selectedTooth.toString()]?.notes || ''}
                                        onChange={(e) => updateNotes(e.target.value)}
                                        placeholder="Ex: Refazer restauração antiga..."
                                        className="h-10 text-sm w-full"
                                    />
                                </div>
                            </div>

                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default Odontogram;
