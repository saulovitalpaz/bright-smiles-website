import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Image as ImageIcon, X, Loader2, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";
import PhotoEditor from "./PhotoEditor";
import DicomViewerModal from "./DicomViewerModal";

interface PhotoGalleryProps {
    photos: string[];
    externalLinks?: string[]; // New prop
    onChange: (photos: string[]) => void;
    onLinksChange?: (links: string[]) => void; // New prop
    readOnly?: boolean;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ 
    photos, 
    externalLinks = [], 
    onChange, 
    onLinksChange, 
    readOnly = false 
}) => {
    const [uploading, setUploading] = useState(false);
    const [isLinkPromptOpen, setIsLinkPromptOpen] = useState(false);
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
    const [viewingDicomUrl, setViewingDicomUrl] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Formato não suportado. Use JPG, PNG ou WEBP.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/upload`, {
                method: "POST",
                headers: {
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: formData,
                credentials: 'omit' // Usually upload with bearer token
            });

            if (res.ok) {
                const data = await res.json();
                onChange([...photos, data.url]);
                toast.success("Foto adicionada com sucesso!");
            } else {
                toast.error("Erro ao fazer upload da foto.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Erro de conexão ao enviar foto.");
        } finally {
            setUploading(false);
            if(e.target) e.target.value = ''; // Reset input
        }
    };

    const handleSaveEditedPhoto = async (blob: Blob) => {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", blob, `edited_photo_${Date.now()}.png`);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/upload`, {
                method: "POST",
                headers: {
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                onChange([...photos, data.url]);
            } else {
                throw new Error("Falha no servidor");
            }
        } catch (error) {
            console.error("Upload edited error:", error);
            throw error; // Let the editor catch and toast
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = (index: number) => {
        const newPhotos = [...photos];
        newPhotos.splice(index, 1);
        onChange(newPhotos);
    };

    const handleAddLink = () => {
        if (!newLinkUrl) return;
        
        let formattedUrl = newLinkUrl;
        if (!/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = 'https://' + formattedUrl;
        }

        if (onLinksChange) {
            onLinksChange([...externalLinks, formattedUrl]);
            setNewLinkUrl('');
            setIsLinkPromptOpen(false);
            toast.success("Link externo adicionado!");
        }
    };

    const handleRemoveLink = (index: number) => {
        if (onLinksChange) {
            const newLinks = [...externalLinks];
            newLinks.splice(index, 1);
            onLinksChange(newLinks);
        }
    };

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-serif flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="text-primary" size={20} />
                        Anexos e Galeria
                    </div>
                </CardTitle>
                <CardDescription>
                    Adicione fotos do antes/depois, exames, ou links externos (Ex: WeTransfer/Laboratório/DICOM).
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {photos.map((url, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                            <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            {!readOnly && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                   <Button 
                                       size="sm" 
                                       variant="secondary" 
                                       className="h-8 shadow-lg"
                                       onClick={(e) => { e.preventDefault(); setEditingPhoto(url); }}
                                   >
                                       <Edit3 size={14} className="mr-1.5" /> Editar
                                   </Button>
                                    <button
                                        onClick={(e) => { e.preventDefault(); handleRemove(idx); }}
                                        className="h-8 w-8 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-lg flex items-center justify-center transition-colors"
                                        title="Excluir"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {!readOnly && (
                        <label className="relative aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-primary/5 cursor-pointer flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-primary transition-all">
                            {uploading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    <Plus size={24} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Adicionar</span>
                                </>
                            )}
                            <input
                                type="file"
                                className="hidden"
                                accept="image/jpeg, image/png, image/webp"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </label>
                    )}
                </div>
                
                {externalLinks.length > 0 && (
                    <div className="mt-8 space-y-3">
                        <h4 className="text-sm font-bold text-slate-700 border-b pb-2">Links Externos e Exames 3D (DICOM)</h4>
                        {externalLinks.map((link, idx) => {
                            const isDicom = link.toLowerCase().endsWith('.dcm');
                            return (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg group">
                                    {isDicom ? (
                                        <button 
                                            onClick={(e) => { e.preventDefault(); setViewingDicomUrl(link); }}
                                            className="text-blue-600 hover:text-blue-700 text-sm truncate max-w-full font-bold flex items-center gap-2 text-left"
                                        >
                                            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 text-xs font-black shadow-inner">
                                                3D
                                            </span>
                                            {link}
                                        </button>
                                    ) : (
                                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-full font-medium flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs font-black">
                                                🔗
                                            </span>
                                            {link}
                                        </a>
                                    )}
                                    
                                    {!readOnly && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleRemoveLink(idx)}
                                        >
                                            <X size={14} className="mr-2" /> Remover
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                
                {photos.length === 0 && externalLinks.length === 0 && !uploading && (
                    <div className="text-center py-8 text-slate-400">
                        Nenhum anexo adicionado ainda.
                    </div>
                )}
                
                {/* Overlay Editor Modal */}
                {editingPhoto && !readOnly && (
                    <PhotoEditor 
                        imageUrl={editingPhoto}
                        onClose={() => setEditingPhoto(null)}
                        onSave={handleSaveEditedPhoto}
                    />
                )}

                {/* DICOM Viewer Modal */}
                {viewingDicomUrl && (
                    <DicomViewerModal 
                        dicomUrl={viewingDicomUrl}
                        onClose={() => setViewingDicomUrl(null)}
                    />
                )}

                {!readOnly && (
                    <div className="mt-6 border-t border-slate-100 pt-6">
                        {isLinkPromptOpen ? (
                            <div className="flex items-end gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2 flex-1">
                                    <Label className="text-xs font-bold text-slate-600">Adicionar Link Seguro</Label>
                                    <Input 
                                        placeholder="Ex: https://wetransfer.com/..." 
                                        value={newLinkUrl}
                                        onChange={(e) => setNewLinkUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                                        className="h-10 bg-slate-50"
                                        autoFocus
                                    />
                                </div>
                                <Button onClick={handleAddLink} className="h-10 shrink-0">Salvar Link</Button>
                                <Button variant="ghost" onClick={() => {setIsLinkPromptOpen(false); setNewLinkUrl('');}} className="h-10 shrink-0 text-slate-500">Cancelar</Button>
                            </div>
                        ) : (
                            <Button 
                                variant="outline" 
                                className="w-full border-dashed border-2 py-6 text-slate-500 hover:text-primary hover:border-primary/50 hover:bg-primary/5"
                                onClick={() => setIsLinkPromptOpen(true)}
                            >
                                <Plus size={16} className="mr-2" />
                                Adicionar Link Externo (Laboratório / Scanner 3D / DICOM)
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PhotoGallery;
