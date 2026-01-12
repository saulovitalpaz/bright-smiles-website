import React, { useState, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Eye, Upload, Loader2, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminBlog = () => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        category: "Dicas de Saúde",
        author: "Dra. Ana Karolina",
        image: ""
    });

    const categories = ["Dicas de Saúde", "Harmonização", "Institucional", "Tratamentos", "Novidades"];

    const { data: blogPosts, isLoading } = useQuery({
        queryKey: ['posts'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/posts`);
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const slug = data.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            const readTime = Math.max(1, Math.ceil(data.content.split(' ').length / 200)) + " min de leitura";

            await axios.post(`${API_URL}/posts`, {
                ...data,
                slug: slug + '-' + Date.now(), // Ensure uniqueness
                excerpt: data.content.substring(0, 150) + "...",
                date: new Date().toISOString(),
                readTime,
                images: [],
                references: {}
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success("Post publicado com sucesso!");
            setIsDialogOpen(false);
            setFormData({ title: "", content: "", category: "Dicas de Saúde", author: "Dra. Ana Karolina", image: "" });
        },
        onError: () => toast.error("Erro ao publicar post.")
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await axios.delete(`${API_URL}/posts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success("Post removido.");
        },
        onError: () => toast.error("Erro ao remover.")
    });

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploading(true);
            try {
                const fd = new FormData();
                fd.append('file', file);
                const res = await axios.post(`${API_URL}/upload`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setFormData(prev => ({ ...prev, image: res.data.url }));
                toast.success("Imagem carregada!");
            } catch (err) {
                toast.error("Erro no upload da imagem.");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            toast.error("Preencha título e conteúdo.");
            return;
        }
        createMutation.mutate(formData);
    };

    return (
        <AdminLayout title="Gerenciar Blog">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="font-serif font-bold text-xl">Artigos Publicados</h3>
                        <p className="text-xs text-slate-500 mt-1">Sua conta tem permissão para editar e excluir qualquer post.</p>
                    </div>
                    <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                        <Plus size={18} />
                        Novo Post
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    {isLoading && <p className="p-6">Carregando...</p>}
                    {blogPosts?.length === 0 && <p className="p-6 text-slate-500">Nenhum post encontrado.</p>}

                    <table className="w-full text-left border-collapse">
                        <thead className={blogPosts?.length === 0 ? "hidden" : ""}>
                            <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                                <th className="px-6 py-4">Imagem</th>
                                <th className="px-6 py-4">Título</th>
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {blogPosts?.map((post: any) => (
                                <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        {post.image && (
                                            <img
                                                src={post.image}
                                                alt={post.title}
                                                className="w-16 h-12 object-cover rounded-lg shadow-sm"
                                            />
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-900 max-w-xs truncate">{post.title}</p>
                                        <p className="text-xs text-slate-500">{post.author}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                            {post.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(post.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => deleteMutation.mutate(post.id)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Novo Artigo</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Título</Label>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ex: 5 Dicas para..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={v => setFormData({ ...formData, category: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Imagem de Capa</Label>
                            <div className="flex items-center gap-4">
                                {formData.image && (
                                    <img src={formData.image} className="h-20 w-32 object-cover rounded-md border" />
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                    {uploading ? <Loader2 className="animate-spin" /> : <Upload size={16} className="mr-2" />}
                                    {uploading ? "Enviando..." : "Carregar Imagem"}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Conteúdo</Label>
                            <Textarea
                                className="min-h-[200px]"
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Escreva seu artigo aqui..."
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={createMutation.isPending || uploading}>
                            {createMutation.isPending ? "Publicando..." : "Publicar Artigo"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
};

export default AdminBlog;
