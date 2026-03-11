import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";

interface PhotoGalleryProps {
    photos: string[];
    onChange: (photos: string[]) => void;
    readOnly?: boolean;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, onChange, readOnly = false }) => {
    const [uploading, setUploading] = useState(false);

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
            e.target.value = ''; // Reset input
        }
    };

    const handleRemove = (index: number) => {
        const newPhotos = [...photos];
        newPhotos.splice(index, 1);
        onChange(newPhotos);
    };

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <ImageIcon className="text-primary" size={20} />
                    Galeria de Evolução
                </CardTitle>
                <CardDescription>
                    Adicione fotos do antes/depois, exames ou evolução clínica do paciente.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {photos.map((url, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                            <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            {!readOnly && (
                                <button
                                    onClick={(e) => { e.preventDefault(); handleRemove(idx); }}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <X size={14} />
                                </button>
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
                {photos.length === 0 && !uploading && (
                    <div className="text-center py-8 text-slate-400">
                        Nenhuma foto adicionada ainda.
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PhotoGallery;
