import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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

// Dark mode premium colors
const STATUS_COLORS: Record<string, string> = {
    'Saudável': 'bg-white/10 text-slate-200 border-white/20',
    'Tratar': 'bg-red-500/20 text-red-300 border-red-500/30',
    'Tratado': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Ausente': 'bg-slate-800/50 text-slate-500 border-slate-700/50',
    'Implante': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'Ponte': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

const FACE_FILL_COLORS: Record<string, string> = {
    'Saudável': 'fill-white/90', // slightly off-white for realistic tooth color
    'Tratar': 'fill-red-500',
    'Tratado': 'fill-[#6bc4e8]', // light blue matching the reference image
    'Ausente': 'fill-slate-800/0', // invisible
    'Implante': 'fill-[#a87ffb]', // purple matching the reference
    'Ponte': 'fill-orange-400',
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

// Simplified but 3D-looking SVG paths for Frontal view (Crown + Root)
// These are illustrative to create the "reference image" feel.
const FRONTAL_PATHS = {
    MOLAR_UPPER: {
        root: "M30,45 C20,10 35,5 45,30 C55,5 70,5 60,40 C75,5 90,10 75,45 Z",
        crown: "M20,45 C25,75 75,75 80,45 C65,50 35,50 20,45 Z"
    },
    MOLAR_LOWER: {
        root: "M35,60 C25,95 40,100 50,70 C60,100 75,95 65,60 Z",
        crown: "M20,60 C35,55 65,55 80,60 C75,30 25,30 20,60 Z"
    },
    PREMOLAR_UPPER: {
        root: "M40,50 C35,15 50,5 50,45 C55,5 65,15 60,50 Z",
        crown: "M30,50 C40,75 60,75 70,50 C60,55 40,55 30,50 Z"
    },
    PREMOLAR_LOWER: {
        root: "M45,55 C40,90 60,90 55,55 Z",
        crown: "M30,55 C40,50 60,50 70,55 C60,30 40,30 30,55 Z"
    },
    CANINE_UPPER: {
        root: "M40,50 C45,5 55,5 60,50 Z",
        crown: "M35,50 C50,85 50,85 65,50 C55,55 45,55 35,50 Z"
    },
    CANINE_LOWER: {
        root: "M40,55 C45,100 55,100 60,55 Z",
        crown: "M35,55 C45,50 55,50 65,55 C50,20 50,20 35,55 Z"
    },
    INCISOR_UPPER: {
        root: "M35,55 C45,10 55,10 65,55 Z",
        crown: "M30,55 C40,85 60,85 70,55 C60,60 40,60 30,55 Z"
    },
    INCISOR_LOWER: {
        root: "M40,55 C45,95 55,95 60,55 Z",
        crown: "M35,55 C45,50 55,50 65,55 C60,25 40,25 35,55 Z"
    }
};

const IMPLANT_SCREW = "M40,20 L60,20 L60,25 L40,25 Z M38,30 L62,30 L62,35 L38,35 Z M40,40 L60,40 L60,45 L40,45 Z M42,50 L58,50 L58,55 L42,55 Z M45,60 L55,60 L55,65 L45,65 Z";

// Occlusal paths (5 faces)
const OCCLUSAL_PATHS = {
    MOLAR: {
        top: "M15,15 C30,5 70,5 85,15 L75,30 C65,25 35,25 25,30 Z",
        bottom: "M25,70 C35,75 65,75 75,70 L85,85 C70,95 30,95 15,85 Z",
        left: "M15,15 C5,30 5,70 15,85 L30,75 C25,65 25,35 30,25 Z",
        right: "M85,15 C95,30 95,70 85,85 L70,75 C75,65 75,35 70,25 Z",
        center: "M25,30 C35,25 65,25 75,30 C80,45 80,55 75,70 C65,75 35,75 25,70 C20,55 20,45 25,30 Z"
    },
    PREMOLAR: {
        top: "M20,15 C40,5 60,5 80,15 L70,35 C55,30 45,30 30,35 Z",
        bottom: "M30,65 C45,70 55,70 70,65 L80,85 C60,95 40,95 20,85 Z",
        left: "M20,15 C10,30 10,70 20,85 L35,70 C30,60 30,40 35,30 Z",
        right: "M80,15 C90,30 90,70 80,85 L65,70 C70,60 70,40 65,30 Z",
        center: "M30,35 C45,30 55,30 70,35 C75,45 75,55 70,65 C55,70 45,70 30,65 C25,55 25,45 30,35 Z"
    },
    CANINE: {
        top: "M25,20 C40,10 60,10 75,20 L65,40 C55,35 45,35 35,40 Z",
        bottom: "M35,60 C45,65 55,65 65,60 L75,80 C60,90 40,90 25,80 Z",
        left: "M25,20 C15,40 15,60 25,80 L40,65 C35,55 35,45 40,35 Z",
        right: "M75,20 C85,40 85,60 75,80 L60,65 C65,55 65,45 60,35 Z",
        center: "M35,40 C45,35 55,35 65,40 C70,50 70,50 65,60 C55,65 45,65 35,60 C30,50 30,50 35,40 Z"
    },
    INCISOR: {
        top: "M20,25 C40,15 60,15 80,25 L75,45 C55,40 45,40 25,45 Z",
        bottom: "M25,55 C45,60 55,60 75,55 L80,75 C60,85 40,85 20,75 Z",
        left: "M20,25 C15,40 15,60 20,75 L35,60 C30,50 30,50 35,40 Z",
        right: "M80,25 C85,40 85,60 80,75 L65,60 C70,50 70,50 65,40 Z",
        center: "M25,45 C45,40 55,40 75,45 C75,50 75,50 75,55 C55,60 45,60 25,55 C25,50 25,50 25,45 Z"
    }
};

const getToothType = (tooth: number) => {
    const t = tooth % 10;
    if (t >= 6 && t <= 8) return 'MOLAR';
    if (t >= 4 && t <= 5) return 'PREMOLAR';
    if (t === 3) return 'CANINE';
    return 'INCISOR';
};

const FrontalToothSVG = ({ toothNumber, data, onClick, isLarge = false }: { toothNumber: number, data: ToothData, onClick?: () => void, isLarge?: boolean }) => {
    const generalStatus = data.status || 'Saudável';
    const isUpper = toothNumber >= 11 && toothNumber <= 28;
    const type = getToothType(toothNumber);
    
    // Select path
    const pathKey = `${type}_${isUpper ? 'UPPER' : 'LOWER'}` as keyof typeof FRONTAL_PATHS;
    const paths = FRONTAL_PATHS[pathKey];

    const isMissing = generalStatus === 'Ausente';
    const isImplant = generalStatus === 'Implante';

    // To simulate the 'crown' being treated we can color the crown, but the user requested occlusal mapping.
    // In frontal view, we'll color the crown based on general status (or vestibular/palatal face if available).
    
    // A simplified extraction of color for the crown in frontal view:
    let crownColor = FACE_FILL_COLORS[generalStatus] || 'fill-white/90';
    if (!isMissing && !isImplant && data.faces) {
        // If vestibular/palatal is treated, show it on crown
        const frontalFace = isUpper ? 'top' : 'bottom';
        if (data.faces[frontalFace] && data.faces[frontalFace].status !== 'Saudável') {
            crownColor = FACE_FILL_COLORS[data.faces[frontalFace].status];
        } else if (generalStatus !== 'Saudável') {
             crownColor = FACE_FILL_COLORS[generalStatus];
        }
    }

    if (isMissing) return <svg viewBox="0 0 100 100" className={isLarge ? 'w-48 h-48 opacity-20' : 'w-10 h-16 opacity-20'} onClick={onClick}><path d={paths?.crown} className="fill-transparent stroke-slate-500 stroke-1" strokeDasharray="2,2" /><path d={paths?.root} className="fill-transparent stroke-slate-500 stroke-1" strokeDasharray="2,2" /></svg>;

    return (
        <svg viewBox="0 0 100 100" className={`${isLarge ? 'w-48 h-48' : 'w-10 h-16'} overflow-visible drop-shadow-lg transition-transform hover:scale-110 cursor-pointer`} onClick={onClick}>
            <defs>
                <radialGradient id="3d-root" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#e2e8f0" stopOpacity="1" />
                    <stop offset="80%" stopColor="#cbd5e1" stopOpacity="1" />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity="1" />
                </radialGradient>
                <linearGradient id="3d-crown" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,1)" />
                    <stop offset="100%" stopColor="rgba(200,210,220,0.9)" />
                </linearGradient>
                <filter id="crown-shadow">
                    <feDropShadow dx="0" dy="2" stdDeviation="1" floodOpacity="0.3" />
                </filter>
            </defs>

            {isImplant ? (
                <path d={IMPLANT_SCREW} className="fill-[#94a3b8] stroke-[#64748b] stroke-[0.5]" />
            ) : (
                <path d={paths?.root} fill="url(#3d-root)" className="stroke-slate-400 stroke-[0.5]" />
            )}
            
            <path 
                d={paths?.crown} 
                className={`${crownColor} stroke-slate-600 stroke-[0.5]`} 
                style={{ fill: crownColor === 'fill-white/90' ? 'url(#3d-crown)' : undefined }}
                filter="url(#crown-shadow)"
            />
        </svg>
    );
};

const OcclusalToothSVG = ({ toothNumber, data, onClick, isLarge = false }: { toothNumber: number, data: ToothData, onClick?: (face: string) => void, isLarge?: boolean }) => {
    const generalStatus = data.status || 'Saudável';
    const type = getToothType(toothNumber);
    const paths = OCCLUSAL_PATHS[type as keyof typeof OCCLUSAL_PATHS];

    const overrideAll = generalStatus === 'Ausente' || generalStatus === 'Implante' || generalStatus === 'Ponte';
    
    const getFaceColor = (faceKey: string) => {
        if (overrideAll) return FACE_FILL_COLORS[generalStatus] || 'fill-white/90';
        if (data.faces && data.faces[faceKey]) {
            return FACE_FILL_COLORS[data.faces[faceKey].status] || 'fill-white/90';
        }
        return generalStatus !== 'Saudável' ? (FACE_FILL_COLORS[generalStatus] || 'fill-white/90') : 'fill-white/90';
    };

    if (generalStatus === 'Ausente') {
         return <svg viewBox="0 0 100 100" className={`${isLarge ? 'w-48 h-48' : 'w-10 h-10'} opacity-10`} onClick={() => onClick && onClick('center')}><circle cx="50" cy="50" r="40" className="fill-transparent stroke-slate-500 stroke-1" strokeDasharray="4,4" /></svg>;
    }

    return (
        <svg viewBox="0 0 100 100" className={`${isLarge ? 'w-48 h-48' : 'w-10 h-10'} drop-shadow-md`}>
            <defs>
                 <linearGradient id="3d-face" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                    <stop offset="100%" stopColor="rgba(200,210,220,1)" />
                </linearGradient>
            </defs>
            {Object.entries(paths).map(([faceKey, path]) => {
                const color = getFaceColor(faceKey);
                return (
                    <path
                        key={faceKey}
                        d={path}
                        className={`${color} stroke-[#1e293b] stroke-[0.5] transition-all hover:brightness-110 cursor-pointer`}
                        style={{ fill: color === 'fill-white/90' ? 'url(#3d-face)' : undefined }}
                        onClick={(e) => { e.stopPropagation(); onClick && onClick(faceKey); }}
                    />
                );
            })}
        </svg>
    );
};


const Odontogram: React.FC<OdontogramProps> = ({ data = {}, onChange, readOnly = false }) => {
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
    const [activeFace, setActiveFace] = useState<string | null>(null);

    const handleToothClick = (tooth: number) => {
        if(readOnly) return;
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
        <Card className="border-slate-800 bg-[#0f172a] text-slate-200 shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-800/50 pb-4">
                <CardTitle className="text-xl font-serif text-white">Odontograma 3D Premium</CardTitle>
                <CardDescription className="text-slate-400">
                    Mapeamento dentário avançado com vistas Frontal e Oclusal.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-8 overflow-x-auto">
                <div className="min-w-[800px] flex flex-col gap-6 relative">
                    
                    {/* Upper Arch */}
                    <div className="relative">
                        <div className="text-center mb-4 text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Arcada Superior</div>
                        
                        {/* Frontal View */}
                        <div className="flex justify-center gap-1 mb-2 items-end">
                            {TEETH_UPPER.map(tooth => (
                                <div key={`front-up-${tooth}`} className="flex flex-col items-center group relative">
                                    <span className="text-[10px] text-slate-500 mb-1 group-hover:text-white transition-colors">{tooth}</span>
                                    <FrontalToothSVG 
                                        toothNumber={tooth} 
                                        data={data[tooth.toString()] || { status: 'Saudável', notes: '' }} 
                                        onClick={() => handleToothClick(tooth)} 
                                    />
                                    {data[tooth.toString()]?.notes && (
                                        <div className="absolute top-4 right-0 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8)]" />
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* Occlusal View */}
                        <div className="flex justify-center gap-1 mt-4">
                            {TEETH_UPPER.map(tooth => (
                                <div key={`occ-up-${tooth}`} className="flex flex-col items-center">
                                    <OcclusalToothSVG 
                                        toothNumber={tooth} 
                                        data={data[tooth.toString()] || { status: 'Saudável', notes: '' }} 
                                        onClick={() => handleToothClick(tooth)} 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-slate-800 my-4 shadow-[0_0_10px_rgba(0,0,0,0.5)]" />

                    {/* Lower Arch */}
                    <div className="relative">
                        {/* Occlusal View */}
                        <div className="flex justify-center gap-1 mb-4">
                            {TEETH_LOWER.map(tooth => (
                                <div key={`occ-low-${tooth}`} className="flex flex-col items-center">
                                    <OcclusalToothSVG 
                                        toothNumber={tooth} 
                                        data={data[tooth.toString()] || { status: 'Saudável', notes: '' }} 
                                        onClick={() => handleToothClick(tooth)} 
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Frontal View */}
                        <div className="flex justify-center gap-1 items-start">
                            {TEETH_LOWER.map(tooth => (
                                <div key={`front-low-${tooth}`} className="flex flex-col items-center group relative">
                                    {data[tooth.toString()]?.notes && (
                                        <div className="absolute bottom-4 right-0 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8)] z-10" />
                                    )}
                                    <FrontalToothSVG 
                                        toothNumber={tooth} 
                                        data={data[tooth.toString()] || { status: 'Saudável', notes: '' }} 
                                        onClick={() => handleToothClick(tooth)} 
                                    />
                                    <span className="text-[10px] text-slate-500 mt-1 group-hover:text-white transition-colors">{tooth}</span>
                                </div>
                            ))}
                        </div>
                        <div className="text-center mt-4 text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Arcada Inferior</div>
                    </div>
                    
                </div>

                {/* Legend */}
                <div className="mt-12 flex flex-wrap gap-4 items-center justify-center p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Legenda:</span>
                    {Object.entries(FACE_FILL_COLORS).map(([status, fillClass]) => {
                        // handle special gradient for healthy
                        const bgStyle = status === 'Saudável' ? { background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(200,210,220,1) 100%)' } : {};
                        const rawColor = fillClass.replace('fill-', 'bg-').replace('/90', '').replace('[', '').replace(']', '').replace('fill-white', 'bg-white');
                        
                        return (
                            <div key={status} className="flex items-center gap-2 text-xs font-medium text-slate-300">
                                <div 
                                    className={`w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${status !== 'Saudável' && rawColor.includes('#') ? '' : rawColor}`}
                                    style={status === 'Saudável' ? bgStyle : (rawColor.includes('#') ? { backgroundColor: rawColor.replace('bg-', '') } : {})}
                                />
                                {status}
                            </div>
                        );
                    })}
                </div>

                {/* Summary */}
                {readOnly && recordedTeeth.length > 0 && (
                    <div className="mt-8 space-y-4">
                        <Label className="text-xs uppercase text-slate-400 font-bold tracking-widest">Resumo Clínico</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recordedTeeth.map(t => {
                                const labels = getFaceLabels(parseInt(t));
                                const td = data[t];
                                const FaceBadges = () => {
                                    if (!td.faces) return null;
                                    return (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {Object.entries(td.faces).map(([faceKey, faceData]) => {
                                                if (faceData.status === 'Saudável') return null;
                                                return (
                                                    <Badge key={faceKey} variant="secondary" className="text-[10px] bg-[#1e293b] text-slate-300 border-[#334155] hover:bg-[#1e293b]">
                                                        {labels[faceKey as keyof typeof labels]}: {faceData.status}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    )
                                }
                                return (
                                    <div key={t} className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl flex flex-col hover:bg-slate-800/80 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center font-bold text-white shadow-inner">{t}</div>
                                                <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[td.status]}`}>{td.status}</Badge>
                                            </div>
                                        </div>
                                        <FaceBadges />
                                        {td.notes && <span className="text-slate-400 text-sm mt-3 pt-3 border-t border-slate-700/50 block italic">"{td.notes}"</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Interactive Modal */}
            <Dialog open={selectedTooth !== null} onOpenChange={(open) => !open && setSelectedTooth(null)}>
                <DialogContent className="sm:max-w-[500px] bg-[#0f172a] border-slate-800 text-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-white">Dente {selectedTooth}</DialogTitle>
                    </DialogHeader>
                    {selectedTooth && (
                        <div className="py-2 flex flex-col">
                            
                            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 mb-6">
                                <div className="flex items-center justify-center w-1/2 border-r border-slate-800">
                                    <FrontalToothSVG 
                                        toothNumber={selectedTooth}
                                        data={data[selectedTooth.toString()] || { status: 'Saudável', notes: '' }} 
                                        isLarge 
                                    />
                                </div>
                                <div className="flex items-center justify-center w-1/2 relative">
                                    <OcclusalToothSVG 
                                        toothNumber={selectedTooth}
                                        data={data[selectedTooth.toString()] || { status: 'Saudável', notes: '' }} 
                                        isLarge 
                                        onClick={(face) => setActiveFace(face)}
                                    />
                                    {/* Labels for Occlusal */}
                                    <div className="absolute -top-4 w-full text-center text-[9px] font-bold text-slate-500 uppercase">{getFaceLabels(selectedTooth).top}</div>
                                    <div className="absolute -bottom-4 w-full text-center text-[9px] font-bold text-slate-500 uppercase">{getFaceLabels(selectedTooth).bottom}</div>
                                    <div className="absolute top-1/2 -left-4 -translate-y-1/2 -rotate-90 text-[9px] font-bold text-slate-500 uppercase">{getFaceLabels(selectedTooth).left}</div>
                                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 rotate-90 text-[9px] font-bold text-slate-500 uppercase">{getFaceLabels(selectedTooth).right}</div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {activeFace ? (
                                    <div className="p-4 bg-blue-900/10 border border-blue-900/30 rounded-xl animate-in fade-in">
                                        <Label className="text-xs uppercase text-blue-400 font-bold mb-3 flex justify-between items-center">
                                            <span>Face: {getFaceLabels(selectedTooth)[activeFace as keyof ReturnType<typeof getFaceLabels>]}</span>
                                            <button onClick={() => setActiveFace(null)} className="text-[10px] text-slate-400 hover:text-white underline underline-offset-2">Voltar pro Dente Inteiro</button>
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.keys(STATUS_COLORS).map(status => (
                                                <Badge
                                                    key={status}
                                                    variant="outline"
                                                    className={`cursor-pointer transition-all hover:scale-105 px-3 py-1 bg-slate-900/50 border-slate-700 hover:bg-slate-800 text-slate-300 ${(data[selectedTooth.toString()]?.faces?.[activeFace]?.status === status) ? 'ring-2 ring-blue-500 text-white bg-blue-900/20' : ''}`}
                                                    onClick={() => updateFaceStatus(activeFace, status)}
                                                >
                                                    {status}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl animate-in fade-in">
                                        <Label className="text-xs uppercase text-slate-400 font-bold mb-3 flex justify-between items-center">
                                            <span>Condição Geral</span>
                                            <span className="text-[9px] text-slate-500 font-normal normal-case">(Clique nas faces ao lado para cor específica)</span>
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.keys(STATUS_COLORS).map(status => (
                                                <Badge
                                                    key={status}
                                                    variant="outline"
                                                    className={`cursor-pointer transition-all hover:scale-105 px-3 py-1 bg-slate-900/50 border-slate-700 hover:bg-slate-800 text-slate-300 ${(data[selectedTooth.toString()]?.status === status) ? 'ring-2 ring-slate-400 text-white bg-slate-800' : ''}`}
                                                    onClick={() => updateGeneralStatus(status)}
                                                >
                                                    {status}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-xs uppercase text-slate-400 font-bold">Observações Clínicas</Label>
                                    <Input
                                        value={data[selectedTooth.toString()]?.notes || ''}
                                        onChange={(e) => updateNotes(e.target.value)}
                                        placeholder="Descreva particularidades..."
                                        className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-slate-700"
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
