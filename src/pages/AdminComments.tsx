import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, Trash2, CheckSquare } from "lucide-react";

const AdminComments = () => {
    const comments = [
        { id: 1, user: "Maria Oliveira", rating: 5, date: "09/01/2026", text: "Atendimento excelente, as doutoras são muito atenciosas!", status: "Publicado" },
        { id: 2, user: "João Silva", rating: 4, date: "08/01/2026", text: "Gostei muito do resultado da harmonização facial.", status: "Publicado" },
        { id: 3, user: "Clara Santos", rating: 5, date: "07/01/2026", text: "Consultório muito limpo e moderno. Profissionais incríveis.", status: "Pendente" },
    ];

    return (
        <AdminLayout title="Comentários dos Clientes">
            <div className="grid grid-cols-1 gap-6">
                {comments.map((comment) => (
                    <div key={comment.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                                    {comment.user.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{comment.user}</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="flex text-yellow-400">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} size={14} fill={s <= comment.rating ? "currentColor" : "none"} />
                                            ))}
                                        </div>
                                        <span className="text-xs text-slate-400">• {comment.date}</span>
                                    </div>
                                </div>
                            </div>
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${comment.status === 'Publicado' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                {comment.status}
                            </span>
                        </div>

                        <p className="text-slate-600 italic mb-6">"{comment.text}"</p>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                    <MessageSquare size={14} />
                                    Original do Site
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 gap-2">
                                    <Trash2 size={16} />
                                    Excluir
                                </Button>
                                {comment.status === 'Pendente' && (
                                    <Button size="sm" className="bg-green-500 hover:bg-green-600 gap-2">
                                        <CheckSquare size={16} />
                                        Aprovar
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
