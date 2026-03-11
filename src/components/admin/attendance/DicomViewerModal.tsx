import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Move, Activity, RotateCcw } from 'lucide-react';

interface DicomViewerModalProps {
    dicomUrl: string;
    onClose: () => void;
}

// Ensure TypeScript knows dwv exists on window
declare global {
    interface Window {
        dwv: any;
    }
}

const DicomViewerModal: React.FC<DicomViewerModalProps> = ({ dicomUrl, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const viewerRef = useRef<any>(null);

    useEffect(() => {
        let isMounted = true;
        let script: HTMLScriptElement | null = null;

        const initViewer = () => {
            if (!isMounted || !window.dwv) return;

            try {
                // Initialize DWV App
                const app = new window.dwv.App();
                viewerRef.current = app;

                app.init({
                    "containerDivId": "dwv",
                    "fitToWindow": true,
                    "tools": ["Scroll", "ZoomAndPan", "WindowLevel", "Draw"],
                    "isMobile": false
                });

                const handleLoadLoad = () => {
                     if (isMounted) setIsLoading(false);
                     app.setTool('WindowLevel');
                };

                const handleLoadError = (event: any) => {
                     console.error("DICOM Load Error:", event);
                     if (isMounted) {
                        setError("Erro ao carregar arquivo DICOM. O link pode ser inválido ou protegido por CORS.");
                        setIsLoading(false);
                     }
                };

                app.addEventListener('load', handleLoadLoad);
                app.addEventListener('error', handleLoadError);

                // Load the given URL
                app.loadURLs([dicomUrl]);
            } catch (err) {
                 console.error("Failed to init DWV", err);
                 if(isMounted) {
                    setError("Falha ao inicializar o motor 3D.");
                    setIsLoading(false);
                 }
            }
        };

        // Load Script Dynamically to bypass Vite Rollup build errors
        if (!window.dwv) {
            script = document.createElement('script');
            script.src = "https://unpkg.com/dwv@0.31.0/dist/dwv.min.js";
            script.async = true;
            script.onload = initViewer;
            script.onerror = () => {
                if (isMounted) {
                    setError("Falha de rede: Não foi possível baixar o motor DICOM via CDN.");
                    setIsLoading(false);
                }
            }
            document.body.appendChild(script);
        } else {
            initViewer();
        }

        return () => {
             isMounted = false;
             if (viewerRef.current) {
                 // Try graceful shutdown
                 try {
                     viewerRef.current.resetView();
                 } catch (e) {}
             }
             if (script && document.body.contains(script)) {
                 document.body.removeChild(script);
             }
        };
    }, [dicomUrl]);

    const setTool = (toolName: string) => {
        if(viewerRef.current) {
            viewerRef.current.setTool(toolName);
        }
    }

    const resetView = () => {
        if(viewerRef.current) {
            viewerRef.current.resetDisplay();
        }
    }

    return (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
            <Card className="w-full h-full md:w-[95vw] md:h-[95vh] flex flex-col bg-slate-900 border-slate-800 shadow-2xl rounded-none md:rounded-xl overflow-hidden">
                <CardHeader className="bg-slate-950 border-b border-slate-800 flex flex-row items-center justify-between py-3 px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <Activity size={16} />
                        </div>
                        <div>
                            <CardTitle className="text-white text-base">Visualizador DICOM Avançado</CardTitle>
                            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Leitura Direta
                            </p>
                        </div>
                    </div>
                    
                    {/* Toolbar */}
                    {!isLoading && !error && (
                        <div className="flex bg-slate-900 rounded-md border border-slate-800 p-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => setTool('WindowLevel')} title="Contraste / Brilho">
                                <Activity size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => setTool('ZoomAndPan')} title="Zoom / Mover">
                                <Move size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={resetView} title="Resetar View">
                                <RotateCcw size={14} />
                            </Button>
                        </div>
                    )}

                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full" onClick={onClose}>
                        <X size={20} />
                    </Button>
                </CardHeader>
                
                <CardContent className="p-0 flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                    {isLoading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-slate-400 bg-black/80">
                            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                            <p className="font-bold tracking-widest uppercase text-xs">Carregando Modelo 3D / DICOM...</p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-red-400 bg-black/80 p-8 text-center gap-4">
                            <X size={48} className="text-red-500/50" />
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">Falha na Leitura</h3>
                                <p className="text-sm max-w-md">{error}</p>
                            </div>
                            <Button variant="outline" className="mt-4 border-slate-700 hover:bg-slate-800" onClick={onClose}>Infelizmente, Fechar</Button>
                        </div>
                    )}

                    <div id="dwv" className="w-full h-full">
                        <div className="layerContainer w-full h-full">
                            <canvas className="imageLayer absolute inset-0 w-full h-full object-contain pointer-events-none"></canvas>
                            <canvas className="drawLayer absolute inset-0 w-full h-full object-contain"></canvas>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DicomViewerModal;
