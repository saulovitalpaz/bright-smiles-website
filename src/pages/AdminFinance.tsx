import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DollarSign,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    FileText,
    PieChart,
    Wallet,
    Receipt
} from "lucide-react";
import { toast } from "sonner";

interface Transaction {
    id: number;
    type: "revenue" | "expense";
    description: string;
    amount: number;
    date: string;
    category: string;
    status: "paid" | "pending";
}

const AdminFinance = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([
        { id: 1, type: "revenue", description: "Clareamento - João Silva", amount: 1500, date: "2023-10-24", category: "Procedimento", status: "paid" },
        { id: 2, type: "expense", description: "Material Odontológico", amount: 450, date: "2023-10-23", category: "Insumos", status: "paid" },
        { id: 3, type: "revenue", description: "Preenchimento - Maria Oliveira", amount: 2500, date: "2023-10-23", category: "Harmonização", status: "paid" },
        { id: 4, type: "expense", description: "Aluguel Sala 206", amount: 3200, date: "2023-10-05", category: "Fixo", status: "paid" },
    ]);

    const [newDesc, setNewDesc] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [newType, setNewType] = useState<"revenue" | "expense">("revenue");

    const totalRevenue = transactions.filter(t => t.type === "revenue").reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
    const balance = totalRevenue - totalExpense;

    const handleAddTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        const transaction: Transaction = {
            id: Date.now(),
            type: newType,
            description: newDesc,
            amount: parseFloat(newAmount),
            date: new Date().toISOString().split('T')[0],
            category: "Geral",
            status: "paid"
        };
        setTransactions([transaction, ...transactions]);
        setNewDesc("");
        setNewAmount("");
        toast.success("Transação registrada com sucesso!");
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
                                <ArrowUpRight size={14} /> +8%
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium mt-4">Receita Total (Mês)</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">R$ {totalRevenue.toLocaleString()}</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
                                <ArrowDownRight size={24} />
                            </div>
                            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">Estável</span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium mt-4">Despesas Totais</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">R$ {totalExpense.toLocaleString()}</p>
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
                        <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? "text-primary" : "text-rose-600"}`}>
                            R$ {balance.toLocaleString()}
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
                                            variant={newType === 'revenue' ? 'default' : 'outline'}
                                            className="flex-1"
                                            onClick={() => setNewType('revenue')}
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
                            <p className="text-xs text-slate-500 mb-4">Vincule seu certificado digital para emitir notas fiscais diretamente após o pagamento.</p>
                            <Button variant="outline" size="sm" className="w-full border-slate-300">Configurar Conexão</Button>
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
                                            <th className="pb-4 font-medium">Categoria</th>
                                            <th className="pb-4 font-medium text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {transactions.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-4 text-slate-500 font-mono text-xs">{t.date}</td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'revenue' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                            {t.type === 'revenue' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                        </div>
                                                        <span className="font-medium text-slate-900">{t.description}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">{t.category}</span>
                                                </td>
                                                <td className={`py-4 text-right font-bold ${t.type === 'revenue' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {t.type === 'revenue' ? '+' : '-'} R$ {t.amount.toLocaleString()}
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
