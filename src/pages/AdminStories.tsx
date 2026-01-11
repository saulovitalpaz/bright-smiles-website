import React, { useState, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Trash2, Eye, Plus, Play, Image as ImageIcon, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// API URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface AdminStory {
    id: number;
    title: string;
    type: "image" | "video";
    status: "active" | "expired";
    date: string;
    views: number;
    url: string;
}

const AdminStories = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const { data: stories, isLoading } = useQuery({
        queryKey: ['stories'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/stories`);
            // Map keys if needed or rely on raw response if types match
            // We'll format the date for display
            return res.data.map((s: any) => ({
                ...s,
                date: new Date(s.createdAt).toLocaleDateString('pt-BR')
            })) as AdminStory[];
        }
    });

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            // 1. Upload File
            const uploadRes = await axios.post(`${API_URL}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const fileUrl = uploadRes.data.url;

            // 2. Create Story Record
            const type = file.type.startsWith('video') ? 'video' : 'image';
            await axios.post(`${API_URL}/stories`, {
                title: file.name,
                type,
                url: fileUrl,
                status: 'active'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            toast.success("Story enviado com sucesso!");
        },
        onError: (err) => {
            toast.error("Erro ao enviar story: " + (err as Error).message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => axios.delete(`${API_URL}/stories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            toast.success("Story removido com sucesso!");
        },
        onError: (err) => toast.error("Erro ao remover story.")
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Simple validation
            if (file.size > 10 * 1024 * 1024) { // 10MB limit check
                toast.error("Arquivo muito grande (Max 10MB)");
                return;
            }
            uploadMutation.mutate(file);
        }
    };

    return (
        <AdminLayout title="Gerenciar Stories">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Section */}
                <div className="lg:col-span-1">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl font-serif">Novo Story</CardTitle>
                            <CardDescription>
                                Faça upload de fotos ou vídeos da sua galeria para exibir no "Live" da página inicial.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,video/mp4"
                                onChange={handleFileSelect}
                            />

                            {uploadMutation.isPending ? (
                                <div className="border-2 border-dashed border-primary/20 bg-primary/5 rounded-2xl p-12 flex flex-col items-center justify-center animate-pulse">
                                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                    <p className="font-bold text-primary">Enviando...</p>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                                >
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10">
                                        <Upload className="text-slate-400 group-hover:text-primary" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">Clique para selecionar</p>
                                    <p className="text-xs text-slate-400 mt-1">PNG, JPG ou MP4 (Máximo 15s)</p>
                                </div>
                            )}

                            <Button
                                className="w-full gap-2 h-12"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadMutation.isPending}
                            >
                                <Plus size={18} />
                                {uploadMutation.isPending ? "Enviando..." : "Adicionar da Galeria"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* active stories */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                            <h3 className="font-serif font-bold text-xl">Stories Ativos</h3>
                            <div className="flex items-center gap-2">
                                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
                                    Live
                                </span>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => queryClient.invalidateQueries({ queryKey: ['stories'] })}>
                                    <RefreshCcw size={14} />
                                </Button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                                        <th className="px-6 py-4">Mídia</th>
                                        <th className="px-6 py-4">Título/Ref</th>
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Visualizações</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {isLoading && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Carregando...</td></tr>}
                                    {stories?.length === 0 && !isLoading && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhum story ativo.</td></tr>}

                                    {stories?.map((story) => (
                                        <tr key={story.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                                    {story.type === 'video' ? (
                                                        <video src={story.url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={story.url} alt="Story" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {story.type === "video" ? <Play size={14} className="text-blue-500" /> : <ImageIcon size={14} className="text-purple-500" />}
                                                    <p className="font-bold text-slate-900 truncate max-w-[150px]" title={story.title}>{story.title}</p>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${story.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                                                    }`}>
                                                    {story.status === "active" ? "Ativo" : "Expirado"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {story.date}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600 font-medium">
                                                    <Eye size={14} />
                                                    {story.views}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                    onClick={() => deleteMutation.mutate(story.id)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminStories;

