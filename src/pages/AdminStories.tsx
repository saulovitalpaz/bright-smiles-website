import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Trash2, Eye, Plus, Play, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface AdminStory {
    id: number;
    title: string;
    type: "image" | "video";
    status: "Ativo" | "Expirado";
    date: string;
    views: number;
}

const AdminStories = () => {
    const [stories, setStories] = useState<AdminStory[]>([]);

    const handleUpload = () => {
        toast.info("Função de upload de arquivos (Galeria) ativada. Selecione o arquivo.");
    };

    const handleDelete = (id: number) => {
        setStories(stories.filter(s => s.id !== id));
        toast.success("Story removido com sucesso!");
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
                            <div
                                onClick={handleUpload}
                                className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                            >
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10">
                                    <Upload className="text-slate-400 group-hover:text-primary" />
                                </div>
                                <p className="text-sm font-bold text-slate-700">Clique para selecionar</p>
                                <p className="text-xs text-slate-400 mt-1">PNG, JPG ou MP4 (Máximo 15s)</p>
                            </div>

                            <Button className="w-full gap-2 h-12" onClick={handleUpload}>
                                <Plus size={18} />
                                Adicionar da Galeria
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* active stories */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                            <h3 className="font-serif font-bold text-xl">Stories Ativos (Últimas 24h)</h3>
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
                                Live
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                                        <th className="px-6 py-4">Tipo</th>
                                        <th className="px-6 py-4">Título/Ref</th>
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Visualizações</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {stories.map((story) => (
                                        <tr key={story.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                {story.type === "video" ? (
                                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <Play size={18} />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                                                        <ImageIcon size={18} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">{story.title}</p>
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${story.status === "Ativo" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                                                    }`}>
                                                    {story.status}
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
                                                    onClick={() => handleDelete(story.id)}
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
