import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, Trash2, CheckSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "@/lib/api";
import { toast } from "sonner";

const AdminComments = () => {
    const queryClient = useQueryClient();

    const { data: comments, isLoading } = useQuery({
        queryKey: ['testimonials'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/testimonials`); // Get all (approved and unapproved)
            return res.data;
        }
    });

    const approveMutation = useMutation({
        mutationFn: async ({ id, approved }: { id: number, approved: boolean }) => {
            await axios.put(`${API_URL}/testimonials/${id}`, { approved });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['testimonials'] });
            toast.success("Comentário atualizado!");
        },
        onError: () => toast.error("Erro ao atualizar.")
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await axios.delete(`${API_URL}/testimonials/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['testimonials'] });
            toast.success("Comentário removido.");
        },
        onError: () => toast.error("Erro ao remover.")
    });

    return (
        <AdminLayout title="Comentários dos Clientes">
            <div className="grid grid-cols-1 gap-6">
                {isLoading && <p>Carregando...</p>}
                {comments?.length === 0 && <p className="text-slate-500">Nenhum comentário encontrado.</p>}

                {comments?.map((comment: any) => (
                    <div key={comment.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                                    {(comment.name || "A").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{comment.name || "Anônimo"}</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="flex text-yellow-400">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} size={14} fill={s <= comment.rating ? "currentColor" : "none"} />
                                            ))}
                                        </div>
                                        <span className="text-xs text-slate-400">• {new Date(comment.createdAt).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>
                            </div>
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${comment.approved ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                {comment.approved ? 'Publicado' : 'Pendente'}
                            </span>
                        </div>

                        <p className="text-slate-600 italic mb-6">"{comment.comment}"</p>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                    <MessageSquare size={14} />
                                    Original do Site
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:bg-red-50 gap-2"
                                    onClick={() => deleteMutation.mutate(comment.id)}
                                >
                                    <Trash2 size={16} />
                                    Excluir
                                </Button>
                                {!comment.approved && (
                                    <Button
                                        size="sm"
                                        className="bg-green-500 hover:bg-green-600 gap-2"
                                        onClick={() => approveMutation.mutate({ id: comment.id, approved: true })}
                                    >
                                        <CheckSquare size={16} />
                                        Aprovar
                                    </Button>
                                )}
                                {comment.approved && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => approveMutation.mutate({ id: comment.id, approved: false })}
                                    >
                                        Ocultar
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </AdminLayout>
    );
};

export default AdminComments;
