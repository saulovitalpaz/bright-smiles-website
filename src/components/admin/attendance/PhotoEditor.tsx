import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Save, X, Undo, Eraser, PenTool, ZoomIn, ZoomOut, MousePointer2 } from 'lucide-react';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import { toast } from 'sonner';

interface PhotoEditorProps {
    imageUrl: string;
    onSave: (blob: Blob) => Promise<void>;
    onClose: () => void;
}

const PhotoEditor: React.FC<PhotoEditorProps> = ({ imageUrl, onSave, onClose }) => {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const [color, setColor] = useState('#ef4444'); // Default red
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [isSaving, setIsSaving] = useState(false);
    const [canvasHeight, setCanvasHeight] = useState(500);

    // Dynamic height based on standard screen ratios
    useEffect(() => {
        const updateHeight = () => {
            const viewportHeight = window.innerHeight;
            setCanvasHeight(viewportHeight * 0.65); // 65% of screen height
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    const handleUndo = () => {
        if (canvasRef.current) {
            canvasRef.current.undo();
        }
    };

    const handleClear = () => {
        if (canvasRef.current) {
            if (confirm("Apagar todas as anotações?")) {
                canvasRef.current.clearCanvas();
            }
        }
    };

    const handleSave = async () => {
        if (!canvasRef.current) return;
        setIsSaving(true);
        try {
            // Get combined image (background + drawings) as base64
            const base64Str = await canvasRef.current.exportImage("png");
            
            // Convert Base64 to Blob
            const res = await fetch(base64Str);
            const blob = await res.blob();
            
            await onSave(blob);
            toast.success("Edição salva com sucesso!");
            onClose();
        } catch (error) {
            console.error("Save custom image error:", error);
            toast.error("Erro ao salvar a edição. Tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
            <Card className="w-full max-w-6xl max-h-[95vh] flex flex-col bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
                
                <CardHeader className="bg-slate-950 border-b border-slate-800 flex flex-row items-center justify-between py-3 px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <PenTool size={16} />
                        </div>
                        <div>
                            <CardTitle className="text-white text-base">Editor Clínico</CardTitle>
                            <p className="text-[10px] text-slate-400">Desenhe sobre a radiografia ou foto. Uma cópia será gerada ao salvar.</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white rounded-full hover:bg-slate-800" onClick={onClose}>
                        <X size={20} />
                    </Button>
                </CardHeader>

                <CardContent className="p-0 flex-1 relative flex flex-col md:flex-row overflow-hidden bg-black/50">
                    
                    {/* Toolbar (Left on desktop, Top on Mobile) */}
                    <div className="md:w-16 bg-slate-950 border-r md:border-b-0 border-b border-slate-800 flex md:flex-col items-center p-3 gap-4 shrink-0 z-10 overflow-x-auto custom-scrollbar">
                        <div className="text-[9px] uppercase tracking-widest font-bold text-slate-600 md:rotate-[-90deg] md:w-max md:mt-8 md:mb-12">Ferramentas</div>
                        
                        <div className="flex md:flex-col gap-2">
                            {/* Colors */}
                            <div className="flex md:flex-col gap-2 p-1.5 bg-slate-900 rounded-lg border border-slate-800">
                                {['#ef4444', '#3b82f6', '#10b981', '#ffffff', '#000000'].map(c => (
                                    <button 
                                        key={c}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'scale-110 border-white ring-2 ring-primary/50' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => { setColor(c); canvasRef.current?.eraseMode(false); }}
                                    />
                                ))}
                            </div>
                            
                            <div className="w-px h-full md:w-full md:h-px bg-slate-800 my-1 shrink-0" />
                            
                            {/* Width */}
                            <div className="flex md:flex-col gap-2 p-1.5 bg-slate-900 rounded-lg border border-slate-800 items-center justify-center min-h-[100px]">
                                {[2, 4, 8].map(w => (
                                    <button 
                                        key={w}
                                        className={`w-6 flex items-center justify-center transition-all ${strokeWidth === w ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
                                        onClick={() => setStrokeWidth(w)}
                                    >
                                        <div className="bg-current rounded-full" style={{ width: w+2, height: w+2 }} />
                                    </button>
                                ))}
                            </div>
                            
                             <div className="w-px h-full md:w-full md:h-px bg-slate-800 my-1 shrink-0" />

                            <div className="flex md:flex-col gap-2 p-1.5 bg-slate-900 rounded-lg border border-slate-800">
                                <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-orange-400 hover:bg-orange-400/10" onClick={() => canvasRef.current?.eraseMode(true)} title="Borracha">
                                    <Eraser size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10" onClick={handleUndo} title="Desfazer">
                                    <Undo size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div className="flex-1 overflow-auto flex items-center justify-center relative p-4" style={{ minHeight: canvasHeight }}>
                       <div className="w-full max-w-4xl max-h-full border border-slate-700 shadow-2xl rounded-sm overflow-hidden flex" style={{ aspectRatio: '16/9' }}>
                           <ReactSketchCanvas
                                ref={canvasRef}
                                strokeWidth={strokeWidth}
                                strokeColor={color}
                                backgroundImage={imageUrl}
                                preserveBackgroundImageAspectRatio={"xMidYMid contain"} // Crucial for responsive images
                                exportWithBackgroundImage={true}
                                className="w-full h-full"
                                style={{
                                    border: 'none',
                                    borderRadius: '0px'
                                }}
                            />
                       </div>
                    </div>
                </CardContent>

                <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0 flex justify-between items-center">
                    <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs uppercase tracking-widest font-bold" onClick={handleClear}>
                        Apagar Tudo
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">Cancelar</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-white min-w-[140px] shadow-lg shadow-primary/20">
                            {isSaving ? "Salvando..." : <><Save size={16} className="mr-2" /> Salvar Edição</>}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PhotoEditor;
