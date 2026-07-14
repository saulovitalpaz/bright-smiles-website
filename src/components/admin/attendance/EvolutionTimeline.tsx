import React, { useEffect, useRef, useState } from 'react';
import { fetchClient } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Camera, Stethoscope, ChevronRight, ChevronDown, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Odontogram, { ToothData } from "./Odontogram";
import FaceMap, { FaceRegionData } from "./FaceMap";
import { Button } from "@/components/ui/button";
import { assetDeliveryUrl, isClinicalAssetReference, loadProtectedAsset, mediaUrl } from "@/lib/media";

interface EvolutionTimelineProps {
    patientId: number | null;
    currentAppointmentId?: number | string;
}

interface HistoricalAppointment {
    id: number;
    date: string;
    procedure: string;
    notes: string;
    photos: string[];
    dentalNotes: Record<string, ToothData>;
    facialNotes: Record<string, FaceRegionData>;
    appointmentType: AppointmentType;
}

type AppointmentType = "odontologia" | "harmonizacao" | "ambos";

const categoryLabel = {
    odontologia: "Odontologia",
    harmonizacao: "Harmonização Facial",
    ambos: "Odontologia + Harmonização"
} as const;

const EvolutionTimeline: React.FC<EvolutionTimelineProps> = ({ patientId, currentAppointmentId }) => {
    const [history, setHistory] = useState<HistoricalAppointment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [resolvedPhotos, setResolvedPhotos] = useState<Record<string, string>>({});
    const [photoErrors, setPhotoErrors] = useState<Record<string, string>>({});
    const objectUrlsRef = useRef<string[]>([]);

    useEffect(() => {
        if (patientId) {
            fetchHistory();
        }
    }, [patientId]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const res = await fetchClient(`/appointments?patientId=${patientId}`);
            if (res.ok) {
                const data = await res.json();
                const normalized = data.map((app: any) => ({
                    ...app,
                    appointmentType: ["odontologia", "harmonizacao", "ambos"].includes(app.appointmentType)
                        ? app.appointmentType
                        : "odontologia",
                    photos: Array.isArray(app.photos) ? app.photos : [],
                    dentalNotes: app.dentalNotes && typeof app.dentalNotes === "object" ? app.dentalNotes : {},
                    facialNotes: app.facialNotes && typeof app.facialNotes === "object" ? app.facialNotes : {}
                }));
                const filtered = normalized
                    .filter((app: any) => app.id.toString() !== currentAppointmentId?.toString())
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setHistory(filtered);
            }
        } catch (error) {
            console.error("Error fetching patient history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const expandedAppointment = history.find((app) => app.id === expandedId);
        let cancelled = false;

        const cleanupObjectUrls = () => {
            objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
            objectUrlsRef.current = [];
        };

        if (!expandedAppointment || expandedAppointment.photos.length === 0) {
            cleanupObjectUrls();
            setResolvedPhotos({});
            setPhotoErrors({});
            return;
        }

        const createdObjectUrls: string[] = [];

        const resolveExpandedPhotos = async () => {
            cleanupObjectUrls();
            const nextResolved: Record<string, string> = {};
            const nextErrors: Record<string, string> = {};

            await Promise.all(expandedAppointment.photos.map(async (photo) => {
                if (isClinicalAssetReference(photo)) {
                    try {
                        const protectedUrl = assetDeliveryUrl(photo);
                        if (!protectedUrl) {
                            nextErrors[photo] = 'Foto clínica indisponível.';
                            return;
                        }
                        const objectUrl = await loadProtectedAsset(protectedUrl);
                        createdObjectUrls.push(objectUrl);
                        nextResolved[photo] = objectUrl;
                    } catch (error) {
                        console.error("Evolution photo load error:", error);
                        nextErrors[photo] = error instanceof Error ? error.message : 'Foto clínica indisponível.';
                    }
                    return;
                }

                nextResolved[photo] = mediaUrl(assetDeliveryUrl(photo) || photo) || photo;
            }));

            if (cancelled) {
                createdObjectUrls.forEach((url) => URL.revokeObjectURL(url));
                return;
            }

            objectUrlsRef.current = createdObjectUrls;
            setResolvedPhotos(nextResolved);
            setPhotoErrors(nextErrors);
        };

        resolveExpandedPhotos();

        return () => {
            cancelled = true;
            cleanupObjectUrls();
        };
    }, [expandedId, history]);

    if (isLoading) return <div className="p-8 text-center text-slate-400">Carregando histórico do paciente...</div>;
    if (!patientId) return <div className="p-8 text-center text-slate-400">Selecione um paciente para ver a evolução.</div>;
    if (history.length === 0) return (
        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Calendar className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-slate-500 font-medium">Este é o primeiro atendimento registrado deste paciente.</p>
            <p className="text-xs text-slate-400 mt-1">Dados de atendimentos futuros aparecerão aqui para comparação.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-serif font-bold text-slate-800">Linha do Tempo de Evolução</h3>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {history.length} {history.length === 1 ? 'atendimento anterior' : 'atendimentos anteriores'}
                </Badge>
            </div>

            <div className="relative border-l-2 border-slate-100 ml-4 pl-8 space-y-8">
                {history.map((app) => (
                    <div key={app.id} className="relative">
                        {/* Dot */}
                        <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-white border-4 border-primary flex items-center justify-center shadow-sm z-10" />
                        
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                    {format(new Date(app.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                </span>
                                <Badge variant="secondary">{categoryLabel[app.appointmentType]}</Badge>
                                {app.procedure && <span className="text-sm text-slate-500">{app.procedure}</span>}
                            </div>

                            <Card className={`border-slate-200 shadow-sm transition-all hover:border-primary/20 ${expandedId === app.id ? 'ring-1 ring-primary/10' : ''}`}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-2 flex-1">
                                            {app.notes && (
                                                <p className="text-sm text-slate-600 line-clamp-2 italic">"{app.notes}"</p>
                                            )}
                                            
                                            <div className="flex gap-4">
                                                {app.photos.length > 0 && (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase">
                                                        <Camera size={14} /> {app.photos.length} Fotos
                                                    </div>
                                                )}
                                                {(app.appointmentType === 'odontologia' || app.appointmentType === 'ambos') && (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase">
                                                        <Stethoscope size={14} /> Odonto
                                                    </div>
                                                )}
                                                {(app.appointmentType === 'harmonizacao' || app.appointmentType === 'ambos') && (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase">
                                                        <User size={14} /> Harmonização
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-primary font-bold gap-1"
                                            onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                                        >
                                            {expandedId === app.id ? (
                                                <>Ocultar <ChevronDown size={16} /></>
                                            ) : (
                                                <>Comparar Detalhes <ChevronRight size={16} /></>
                                            )}
                                        </Button>
                                    </div>

                                    {/* Expanded Content for Comparison */}
                                    {expandedId === app.id && (
                                        <div className="mt-6 pt-6 border-t border-slate-100 space-y-8 animate-in slide-in-from-top-4 duration-300">
                                            
                                            {/* Photos Comparison mini row */}
                                            {app.photos.length > 0 && (
                                                <div className="space-y-2">
                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registros Fotográficos</h5>
                                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                        {app.photos.map((photo, i) => {
                                                            const resolvedPhoto = resolvedPhotos[photo];
                                                            const photoError = photoErrors[photo];
                                                            return photoError ? (
                                                                <div
                                                                    key={i}
                                                                    className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-red-200 bg-red-50 p-2 text-center text-[10px] font-medium text-red-500"
                                                                >
                                                                    Falha ao carregar
                                                                </div>
                                                            ) : (
                                                                <img 
                                                                    key={i} 
                                                                    src={resolvedPhoto || mediaUrl(assetDeliveryUrl(photo) || photo) || photo}
                                                                    alt="Evolução" 
                                                                    className="w-24 h-24 object-cover rounded-lg border border-slate-200 shadow-sm flex-shrink-0"
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Odontogram Review */}
                                                {(app.appointmentType === 'odontologia' || app.appointmentType === 'ambos') && (
                                                    <div className="space-y-3">
                                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Dentário em {format(new Date(app.date), "dd/MM")}</h5>
                                                        <div className="scale-75 origin-top-left -mb-16">
                                                            <Odontogram 
                                                                data={app.dentalNotes} 
                                                                onChange={() => {}} 
                                                                readOnly={true} 
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Face Map Review */}
                                                {(app.appointmentType === 'harmonizacao' || app.appointmentType === 'ambos') && (
                                                    <div className="space-y-3">
                                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapeamento Facial em {format(new Date(app.date), "dd/MM")}</h5>
                                                        <div className="scale-[0.6] origin-top-left -mb-40">
                                                            <FaceMap 
                                                                data={app.facialNotes} 
                                                                onChange={() => {}} 
                                                                readOnly={true} 
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EvolutionTimeline;
