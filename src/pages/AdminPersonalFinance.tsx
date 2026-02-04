import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchClient, API_URL } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Receipt, Upload, Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import axios from "axios";

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

const AdminPersonalFinance = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<"income" | "expense">("expense");
    const [category, setCategory] = useState("Contas");
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
                // Using axios for upload convenience or fetchClient if configured for multipart
                // Assuming direct upload endpoint usage for simplicity with axios usually, 
                // but checking index.js it uses 'authenticateToken' so we need credentials.
                // fetchClient handles credentials but FormData needs care.
                // Let's use axios with credentials manually or a helper if available.
                // Assuming API_URL is imported from lib/api
                const res = await axios.post(`${API_URL}/upload`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true
                });
                setReceiptUrl(res.data.url);
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
                    status: 'paid'
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
        <AdminLayout title="Minhas Finanças (Pessoal)">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 font-bold uppercase">Entradas</p>
                            <p className="text-2xl font-black text-emerald-600">R$ {income.toFixed(2)}</p>
                        </div>
                        <ArrowUpCircle className="text-emerald-100" size={40} />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 font-bold uppercase">Saídas</p>
                            <p className="text-2xl font-black text-rose-600">R$ {expense.toFixed(2)}</p>
                        </div>
                        <ArrowDownCircle className="text-rose-100" size={40} />
                    </CardContent>
                </Card>
                <Card className={balance >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 font-bold uppercase">Saldo Atual</p>
                            <p className={`text-2xl font-black ${balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>R$ {balance.toFixed(2)}</p>
                        </div>
                        <Receipt className={balance >= 0 ? "text-emerald-200" : "text-rose-200"} size={40} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle>Novo Registro</CardTitle>
                            <CardDescription>Adicione contas, Uber ou recebimentos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setType('expense')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === 'expense' ? 'bg-white shadow text-rose-600' : 'text-slate-500'}`}
                                    >
                                        Despesa
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('income')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === 'income' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}
                                    >
                                        Receita
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <Label>Descrição</Label>
                                    <Input
                                        value={desc}
                                        onChange={e => setDesc(e.target.value)}
                                        placeholder={type === 'expense' ? "Ex: Uber para clínica" : "Ex: Pix Recebido"}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor (R$)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Comprovante (Opcional)</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full border-dashed"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                            {receiptUrl ? "Alterar Arquivo" : "Enviar Foto/PDF"}
                                        </Button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept="image/*,application/pdf"
                                            onChange={handleUpload}
                                        />
                                    </div>
                                    {receiptUrl && (
                                        <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                            <Receipt size={12} /> Comprovante anexado
                                        </p>
                                    )}
                                </div>

                                <Button type="submit" className="w-full gap-2 font-bold" disabled={uploading}>
                                    <Plus size={18} /> Salvar
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card className="border-slate-200 shadow-sm h-full">
                        <CardHeader>
                            <CardTitle>Histórico</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primary" /></div>
                                ) : transactions.length === 0 ? (
                                    <p className="text-center text-slate-400 py-10 italic">Nenhum registro pessoal encontrado.</p>
                                ) : (
                                    transactions.map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                    {t.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{t.description}</p>
                                                    <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()} • {t.category}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                                </span>
                                                {t.receiptUrl && (
                                                    <a href={t.receiptUrl} target="_blank" rel="noreferrer" className="p-2 text-primary hover:bg-white rounded-full transition-colors" title="Ver Comprovante">
                                                        <Receipt size={16} />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
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
