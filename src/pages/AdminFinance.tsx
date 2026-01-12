import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientPicker } from "@/components/admin/PatientPicker";
import { API_URL } from "@/lib/api";
import {
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    FileText,
    Wallet,
    Receipt,
    Trash2
} from "lucide-react";
import { toast } from "sonner";

interface Transaction {
    id: number;
    type: "income" | "expense";
    description: string;
    amount: number;
    date: string;
    category: string;
    patient?: { name: string };
}

const AdminFinance = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });

    // New Transaction Form State
    const [newDesc, setNewDesc] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [newType, setNewType] = useState<"income" | "expense">("income");
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const [txRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/finance`),
                fetch(`${API_URL}/finance/stats`)
            ]);

            if (txRes.ok) setTransactions(await txRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/finance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: newType,
                    description: newDesc,
                    amount: parseFloat(newAmount),
                    category: "Geral",
                    patientId: newType === 'income' ? selectedPatientId : undefined
                })
            });

            if (res.ok) {
                toast.success("Transação registrada!");
                setNewDesc("");
                setNewAmount("");
                setSelectedPatientId(null);
                fetchTransactions(); // Refresh
            } else {
                toast.error("Erro ao salvar transação");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro de conexão");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Tem certeza que deseja excluir?")) return;
        try {
            await fetch(`${API_URL}/finance/${id}`, { method: "DELETE" });
            toast.success("Transação excluída");
            fetchTransactions();
        } catch (error) {
            toast.error("Erro ao excluir");
        }
    };

    return (
        <AdminLayout title="Gestão Financeira">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="border-slate-100 shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                                <TrendingUp size={24} />
                            </div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                                <ArrowUpRight size={14} /> Receitas
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium mt-4">Receita Total</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">R$ {stats.income.toLocaleString()}</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
                                <ArrowDownRight size={24} />
                            </div>
                            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">Despesas</span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium mt-4">Despesas Totais</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">R$ {stats.expense.toLocaleString()}</p>
                    </CardContent>
                </Card>

                <Card className="border-primary/10 shadow-md bg-white border-2">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="bg-primary/10 p-3 rounded-xl text-primary">
                                <Wallet size={24} />
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm font-medium mt-4">Saldo Líquido</p>
                        <p className={`text-2xl font-bold mt-1 ${stats.balance >= 0 ? "text-primary" : "text-rose-600"}`}>
                            R$ {stats.balance.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl font-serif">Nova Transação</CardTitle>
                            <CardDescription>Registre entradas ou saídas manuais.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddTransaction} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={newType === 'income' ? 'default' : 'outline'}
                                            className="flex-1"
                                            onClick={() => setNewType('income')}
                                        >
                                            Receita
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={newType === 'expense' ? 'destructive' : 'outline'}
                                            className="flex-1"
                                            onClick={() => setNewType('expense')}
                                        >
                                            Despesa
                                        </Button>
                                    </div>
                                </div>

                                {newType === 'income' && (
                                    <div className="space-y-2">
                                        <Label>Vincular Paciente (Opcional)</Label>
                                        <PatientPicker onSelect={(p) => {
                                            setSelectedPatientId(p.id);
                                            // Auto-fill description if empty
                                            if (!newDesc) setNewDesc(`Pagamento - ${p.name}`);
                                        }} />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="desc">Descrição</Label>
                                    <Input
                                        id="desc"
                                        placeholder="Ex: Pagamento Consulta"
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Valor (R$)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="0.00"
                                        value={newAmount}
                                        onChange={(e) => setNewAmount(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full gap-2 mt-4">
                                    <Plus size={18} /> Registrar
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm mt-6 bg-slate-50 border-dashed">
                        <CardContent className="p-6 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 mb-4">
                                <Receipt size={24} />
                            </div>
                            <h4 className="font-bold text-slate-900 mb-2">NF-e Automática</h4>
                            <p className="text-xs text-slate-500 mb-4">Vincule seu certificado digital.</p>
                            <Button variant="outline" size="sm" className="w-full border-slate-300" disabled>Em breve</Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-serif">Fluxo de Caixa</CardTitle>
                                <CardDescription>Últimas movimentações financeiras.</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="text-primary font-bold">
                                <FileText size={16} className="mr-2" /> Exportar PDF
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 text-left">
                                            <th className="pb-4 font-medium">Data</th>
                                            <th className="pb-4 font-medium">Descrição</th>
                                            <th className="pb-4 font-medium">Paciente</th>
                                            <th className="pb-4 font-medium text-right">Valor</th>
                                            <th className="pb-4 font-medium w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {transactions.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="py-4 text-slate-500 font-mono text-xs">{new Date(t.date).toLocaleDateString()}</td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                            {t.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                        </div>
                                                        <span className="font-medium text-slate-900">{t.description}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    {t.patient ? (
                                                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase">{t.patient.name}</span>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className={`py-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString()}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(t.id)}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminFinance;
