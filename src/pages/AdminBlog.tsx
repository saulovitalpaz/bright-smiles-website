import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Eye } from "lucide-react";
import { blogPosts } from "@/data/posts";

const AdminBlog = () => {
    return (
        <AdminLayout title="Gerenciar Blog">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="font-serif font-bold text-xl">Artigos Publicados</h3>
                        <p className="text-xs text-slate-500 mt-1">Sua conta tem permissão para editar e excluir qualquer post.</p>
                    </div>
                    <Button className="gap-2">
                        <Plus size={18} />
                        Novo Post
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                                <th className="px-6 py-4">Imagem</th>
                                <th className="px-6 py-4">Título</th>
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {blogPosts.map((post) => (
                                <tr key={post.slug} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <img
                                            src={post.image}
                                            alt={post.title}
                                            className="w-16 h-12 object-cover rounded-lg shadow-sm"
                                        />
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
                                        {post.date}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                                                <Eye size={16} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-500">
                                                <Edit2 size={16} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
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
        </AdminLayout>
    );
};

export default AdminBlog;
