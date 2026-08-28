import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchClient, API_URL } from "@/lib/api";
import { toast } from "sonner";
import { 
    Plus, 
    Trash2, 
    Receipt, 
    Upload, 
    Loader2, 
    ArrowUpCircle, 
    ArrowDownCircle,
    Filter,
    Calendar as CalendarIcon,
    CheckCircle2,
    Clock,
    DollarSign
} from "lucide-react";
import axios from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { mediaUrl } from "@/lib/media";

interface Transaction {
    id: number;
    description: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    date: string;
    receiptUrl?: string;
    status: string;
}

const CATEGORIES = [
    "Uber/Transporte",
    "Alimentação",
    "Boletos/Contas",
    "Lazer",
    "Saúde",
    "Investimentos",
    "Outros"
];

const AdminPersonalFinance = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<"income" | "expense">("expense");
    const [category, setCategory] = useState("Uber/Transporte");
    const [status, setStatus] = useState("paid");
    const [receiptUrl, setReceiptUrl] = useState("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            const res = await fetchClient('/personal-finance');
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar finanças pessoais");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', e.target.files[0]);
            try {
                const res = await axios.post(`${API_URL}/financial-assets`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true
                });
                setReceiptUrl(res.data.reference);
                toast.success("Comprovante anexado!");
            } catch (error) {
                console.error(error);
                toast.error("Erro no upload");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetchClient('/personal-finance', {
                method: 'POST',
                body: JSON.stringify({
                    description: desc,
                    amount: parseFloat(amount),
                    type,
                    category,
                    receiptUrl,
                    status
                })
            });
            if (res.ok) {
                toast.success("Registro adicionado!");
                setDesc("");
                setAmount("");
                setReceiptUrl("");
                loadTransactions();
            } else {
                toast.error("Erro ao salvar");
            }
        } catch (error) {
            toast.error("Erro de conexão");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Excluir este registro?")) return;
        try {
            await fetchClient(`/personal-finance/${id}`, { method: 'DELETE' });
            toast.success("Excluído!");
            loadTransactions();
        } catch (error) {
            toast.error("Erro ao excluir");
        }
    };

    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;

    return (
        <AdminLayout title="Caixa Pessoal - Neli Vital">
            <div className="grid min-w-0 grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white border-slate-100 shadow-sm">
                    <CardContent className="flex min-w-0 items-center gap-3 p-4 sm:gap-4 sm:p-5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <ArrowUpCircle size={24} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Entradas</p>
                            <p className="text-xl font-bold text-slate-900">R$ {income.toFixed(2)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-100 shadow-sm">
                    <CardContent className="flex min-w-0 items-center gap-3 p-4 sm:gap-4 sm:p-5">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <ArrowDownCircle size={24} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Saídas</p>
                            <p className="text-xl font-bold text-slate-900">R$ {expense.toFixed(2)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className={`bg-white border-2 shadow-md ${balance >= 0 ? "border-emerald-100" : "border-rose-100"}`}>
                    <CardContent className="flex min-w-0 items-center gap-3 p-4 sm:gap-4 sm:p-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${balance >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            <DollarSign size={24} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Saldo</p>
                            <p className={`text-xl font-black ${balance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>R$ {balance.toFixed(2)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 text-white border-none shadow-xl">
                    <CardContent className="flex min-w-0 items-center gap-3 p-4 sm:gap-4 sm:p-5">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                            <Clock size={24} className="text-amber-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Pendentes</p>
                            <p className="text-xl font-bold">R$ {transactions.filter(t => t.status === 'pending').reduce((acc, t) => acc + t.amount, 0).toFixed(2)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                <div className="lg:col-span-1">
                    <Card className="min-w-0 border-slate-200 shadow-lg lg:sticky lg:top-24">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-lg font-serif">Lançamento de Caixa</CardTitle>
                            <CardDescription className="text-xs">Gestão de gastos e recebimentos pessoais.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="flex p-1 bg-slate-100 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setType('expense')}
                                        className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${type === 'expense' ? 'bg-white shadow text-rose-600' : 'text-slate-400'}`}
                                    >
                                        Despesa
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('income')}
                                        className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${type === 'income' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}
                                    >
                                        Receita
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Descrição do Item</Label>
                                    <Input 
                                        value={desc} 
                                        onChange={e => setDesc(e.target.value)} 
                                        placeholder="Ex: Uber Clínica, Almoço..." 
                                        className="h-11 font-medium bg-slate-50/50 border-slate-200"
                                        required 
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Valor (R$)</Label>
                                        <Input 
                                            type="number" 
                                            step="0.01" 
                                            value={amount} 
                                            onChange={e => setAmount(e.target.value)} 
                                            className="h-11 font-bold bg-slate-50/50 border-slate-200"
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Status</Label>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger className="h-11 font-medium bg-slate-50/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="paid">Pago</SelectItem>
                                                <SelectItem value="pending">Pendente</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Categoria</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="h-11 font-medium bg-slate-50/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Anexo de Comprovante</Label>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        className="w-full h-11 border-dashed border-2 hover:bg-slate-50 transition-all gap-2"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        {uploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
                                        {receiptUrl ? "Substituir Arquivo" : "Enviar Foto / PDF"}
                                    </Button>
                                    <input 
                                        ref={fileInputRef} 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*,application/pdf"
                                        onChange={handleUpload}
                                    />
                                    {receiptUrl && (
                                        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                            <CheckCircle2 size={14} className="text-emerald-600" />
                                            <span className="text-[10px] font-bold text-emerald-700 uppercase">Documento Vinculado</span>
                                        </div>
                                    )}
                                </div>

                                <Button type="submit" className="w-full h-12 gap-2 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20" disabled={uploading}>
                                    <Plus size={18} /> Confirmar Lançamento
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="min-w-0 lg:col-span-2">
                    <Card className="min-w-0 border-slate-200 shadow-sm min-h-0 sm:min-h-[600px]">
                        <CardHeader className="flex flex-col gap-3 bg-white border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-xl font-serif">Fluxo de Caixa Histórico</CardTitle>
                                <CardDescription className="text-xs">Listagem detalhada de movimentações.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="gap-2 font-bold text-xs">
                                <Filter size={14} /> Filtros
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <Loader2 className="animate-spin text-primary" size={32} />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando dados...</p>
                                    </div>
                                ) : transactions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                        <Receipt size={48} className="mb-4 opacity-20" />
                                        <p className="font-serif italic text-lg">Nenhuma movimentação registrada.</p>
                                    </div>
                                ) : (
                                    transactions.map(t => (
                                         <div key={t.id} className="group flex min-w-0 flex-col gap-4 border-l-4 border-transparent p-4 transition-all hover:border-primary hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                             <div className="flex min-w-0 items-start gap-3 sm:gap-5">
                                                 <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                     {t.type === 'income' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                                                 </div>
                                                 <div className="min-w-0 flex-1 space-y-1">
                                                     <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                         <p className="min-w-0 break-words font-bold text-slate-900">{t.description}</p>
                                                         <Badge variant={t.status === 'paid' ? "outline" : "secondary"} className={`shrink-0 text-[9px] h-4 uppercase ${t.status === 'paid' ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"}`}>
                                                             {t.status === 'paid' ? 'Pago' : 'Pendente'}
                                                         </Badge>
                                                     </div>
                                                     <div className="flex flex-wrap items-center gap-2 break-words text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                         <span className="flex items-center gap-1"><CalendarIcon size={12} /> {new Date(t.date).toLocaleDateString()}</span>
                                                         <span>•</span>
                                                         <span className="break-words text-primary/70">{t.category}</span>
                                                     </div>
                                                 </div>
                                             </div>
                                             <div className="flex w-full min-w-0 items-center justify-between gap-3 sm:w-auto sm:gap-6">
                                                 <div className="min-w-0 text-right">
                                                     <p className={`break-words text-lg font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                         {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                                     </p>
                                                     {t.receiptUrl && (
                                                         <a href={mediaUrl(t.receiptUrl) || undefined} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 break-words text-[10px] font-black text-primary uppercase hover:underline">
                                                             <Receipt size={10} /> Ver Recibo
                                                         </a>
                                                     )}
                                                 </div>
                                                 <div className="flex shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                                     <Button
                                                         variant="ghost"
                                                         size="icon"
                                                         type="button"
                                                         aria-label={`Excluir ${t.description}`}
                                                         onClick={() => handleDelete(t.id)}
                                                         className="h-10 w-10 text-slate-300 hover:bg-red-50 hover:text-red-500"
                                                     >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminPersonalFinance;
