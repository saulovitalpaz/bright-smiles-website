import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientPicker } from "@/components/admin/PatientPicker";
import { fetchClient, API_URL } from "@/lib/api";
import axios from "axios";
import {
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    FileText,
    Wallet,
    Receipt,
    Trash2,
    Printer
} from "lucide-react";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";
import { DownloadFinanceReportButton } from "@/components/admin/FinanceReportPDF";
import { printDocumentClass, type PrintMode } from "@/lib/print-layout";
import { mediaUrl } from "@/lib/media";
import { financePeriodQuery, financePeriodTitle } from "@/lib/finance";

interface Transaction {
    id: number;
    type: "income" | "expense";
    description: string;
    amount: number;
    date: string;
    category: string;
    patient?: {
        name: string;
        cpf?: string;
        address?: string;
    };
    receiptUrl?: string;
    nfeUrl?: string;
}

const AdminFinance = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState({ income: 0, pendingIncome: 0, expense: 0, balance: 0 });
    const [filterByMonth, setFilterByMonth] = useState(new Date().getMonth() + 1);
    const [filterByYear, setFilterByYear] = useState(new Date().getFullYear());
    const [printMode, setPrintMode] = useState<PrintMode>("compact");
    const [transactionTypeFilter, setTransactionTypeFilter] = useState<"income" | "expense" | null>(null);

    // New Transaction Form State
    const [newDesc, setNewDesc] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [newType, setNewType] = useState<"income" | "expense">("income");
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTransactionTypeFilter(null);
        fetchTransactions();
    // The fetch function uses the selected month/year from this component state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterByMonth, filterByYear]);

    const fetchTransactions = async () => {
        try {
            const [txRes, statsRes] = await Promise.all([
                fetchClient(`/finance?${financePeriodQuery(filterByMonth, filterByYear)}`),
                fetchClient(`/finance/stats?${financePeriodQuery(filterByMonth, filterByYear)}`)
            ]);

            if (txRes.ok) setTransactions(await txRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
        } catch (error) {
            console.error(error);
        }
    };

    const handleConfirmNfe = async (txId: number) => {
        try {
            const res = await fetchClient(`/finance/nfe`, {
                method: "POST",
                body: JSON.stringify({ transactionIds: [txId], nfeUrl: "" })
            });

            if (res.ok) {
                toast.success("NF-e confirmada com sucesso!");
                fetchTransactions();
            }
        } catch (e) {
            console.error(e);
            toast.error("Erro ao confirmar NF-e");
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

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetchClient("/finance", {
                method: "POST",
                body: JSON.stringify({
                    type: newType,
                    description: newDesc,
                    amount: parseFloat(newAmount),
                    category: "Geral",
                    patientId: newType === 'income' ? selectedPatientId : undefined,
                    receiptUrl: receiptUrl || undefined
                })
            });

            if (res.ok) {
                toast.success("Transação registrada!");
                setNewDesc("");
                setNewAmount("");
                setSelectedPatientId(null);
                setReceiptUrl("");
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
            await fetchClient(`/finance/${id}`, { method: "DELETE" });
            toast.success("Transação excluída");
            fetchTransactions();
        } catch (error) {
            toast.error("Erro ao excluir");
        }
    };

    const downloadCSV = () => {
        if (transactions.length === 0) {
            toast.error("Nenhuma transação neste período para exportar.");
            return;
        }

        const headers = ["Data", "Tipo", "Descrição", "Categoria", "Valor", "Paciente", "CPF", "Endereço"];
        const rows = transactions.map(t => [
            new Date(t.date).toLocaleDateString('pt-BR'),
            t.type === 'income' ? 'Receita' : 'Despesa',
            `"${t.description.replace(/"/g, '""')}"`,
            t.category,
            t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).replace(/\./g, '').replace(',', '.'),
            t.patient?.name || "-",
            t.patient?.cpf || "-",
            t.patient?.address || "-"
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
            + headers.join(";") + "\n"
            + rows.map(e => e.join(";")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `relatorio_financeiro_${filterByYear}_${filterByMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Relatório CSV gerado!");
    };

    const toggleTransactionTypeFilter = (type: "income" | "expense") => {
        setTransactionTypeFilter((current) => current === type ? null : type);
    };

    const resetTransactionTypeFilter = () => setTransactionTypeFilter(null);

    const displayedTransactions = transactionTypeFilter
        ? transactions.filter((transaction) => transaction.type === transactionTypeFilter)
        : transactions;

    const activeFilterLabel = transactionTypeFilter === "income"
        ? "Receitas"
        : transactionTypeFilter === "expense"
            ? "Despesas"
            : null;

    const handleFilterCardKeyDown = (event: React.KeyboardEvent, action: () => void) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            action();
        }
    };

    return (
        <AdminLayout title="Gestão Financeira">
            <div className={`print-root ${printDocumentClass(printMode)} flex min-w-0 flex-col`}>
            <div className="no-print order-3 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 mb-8 lg:order-1">
                <Card
                    role="button"
                    tabIndex={0}
                    aria-label="Filtrar fluxo de caixa por receitas"
                    aria-pressed={transactionTypeFilter === "income"}
                    onClick={() => toggleTransactionTypeFilter("income")}
                    onKeyDown={(event) => handleFilterCardKeyDown(event, () => toggleTransactionTypeFilter("income"))}
                    className={`cursor-pointer border-slate-100 shadow-sm overflow-hidden transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${transactionTypeFilter === "income" ? "border-emerald-400 ring-2 ring-emerald-100" : ""}`}
                >
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                                <TrendingUp size={24} />
                            </div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                                <ArrowUpRight size={14} /> Receitas
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium mt-4">Receita recebida</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">R$ {stats.income.toLocaleString()}</p>
                        <p className="mt-1 text-xs text-amber-700">A receber: R$ {stats.pendingIncome.toLocaleString()}</p>
                    </CardContent>
                </Card>

                <Card
                    role="button"
                    tabIndex={0}
                    aria-label="Filtrar fluxo de caixa por despesas"
                    aria-pressed={transactionTypeFilter === "expense"}
                    onClick={() => toggleTransactionTypeFilter("expense")}
                    onKeyDown={(event) => handleFilterCardKeyDown(event, () => toggleTransactionTypeFilter("expense"))}
                    className={`cursor-pointer border-slate-100 shadow-sm overflow-hidden transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${transactionTypeFilter === "expense" ? "border-rose-400 ring-2 ring-rose-100" : ""}`}
                >
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

                <Card
                    role="button"
                    tabIndex={0}
                    aria-label="Mostrar todas as movimentações do período"
                    aria-pressed={transactionTypeFilter === null}
                    onClick={resetTransactionTypeFilter}
                    onKeyDown={(event) => handleFilterCardKeyDown(event, resetTransactionTypeFilter)}
                    className={`cursor-pointer border-primary/10 shadow-md bg-white border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${transactionTypeFilter === null ? "ring-2 ring-primary/20" : ""}`}
                >
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
                        <p className="mt-1 text-xs text-slate-500">Visão geral de {financePeriodTitle(filterByMonth, filterByYear)}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="order-2 grid min-w-0 grid-cols-1 gap-6 lg:order-2 lg:grid-cols-3 lg:gap-8">
                <div className="no-print order-2 min-w-0 space-y-6 lg:order-1 lg:col-span-1">
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
                                        {receiptUrl ? "Substituir Comprovante" : "Anexar Foto / PDF"}
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

                                <Button type="submit" className="w-full gap-2 mt-2" disabled={uploading}>
                                    <Plus size={18} /> Registrar
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm bg-white border-2 border-primary/10">
                        <CardContent className="p-6 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <Receipt size={24} />
                            </div>
                            <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-widest text-xs">Faturamento & NF-e</h4>
                            <p className="text-[10px] text-slate-500 mb-4 px-4 leading-relaxed">Emissão de notas fiscais eletrônicas e sincronização contábil.</p>

                            <div className="w-full space-y-4">
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                                        <span>NF-e Pendentes</span>
                                        <span className={transactions.filter(t => t.type === 'income' && !t.nfeUrl).length > 0 ? "text-rose-600" : "text-emerald-600"}>
                                            {transactions.filter(t => t.type === 'income' && !t.nfeUrl).length}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${transactions.filter(t => t.type === 'income' && !t.nfeUrl).length > 0 ? "bg-rose-500" : "bg-emerald-500"}`}
                                            style={{
                                                width: transactions.filter(t => t.type === 'income').length > 0
                                                    ? `${(transactions.filter(t => t.type === 'income' && !t.nfeUrl).length / transactions.filter(t => t.type === 'income').length) * 100}%`
                                                    : '0%'
                                            }}
                                        />
                                    </div>
                                    <p className="text-[9px] text-slate-400 mt-2 text-left italic">
                                        {transactions.filter(t => t.type === 'income' && !t.nfeUrl).length > 0
                                            ? `Faltam confirmar ${transactions.filter(t => t.type === 'income' && !t.nfeUrl).length} nota(s) fiscal(is) deste período.`
                                            : "Todas as NF-e do período foram confirmadas."}
                                    </p>
                                </div>

                                <div className="w-full">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-slate-200 font-bold text-[10px] h-10 hover:bg-slate-50 text-slate-700"
                                        onClick={downloadCSV}
                                    >
                                        <FileText size={14} className="mr-2" />
                                        Exportar Relatório Contábil (.csv)
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="print-report order-1 min-w-0 lg:order-2 lg:col-span-2">
                    <Card className="min-w-0 border-slate-200 shadow-sm">
                        <CardHeader className="min-w-0 gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                                <CardTitle className="text-xl font-serif break-words">Fluxo de Caixa - {new Date(filterByYear, filterByMonth - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</CardTitle>
                                <CardDescription>Histórico de movimentações financeiras{activeFilterLabel ? ` · ${activeFilterLabel}` : ""}.</CardDescription>
                                <div className="grid grid-cols-2 gap-3 pt-4 sm:max-w-sm">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Mês</Label>
                                        <Select value={filterByMonth.toString()} onValueChange={(value) => setFilterByMonth(parseInt(value))}>
                                            <SelectTrigger className="h-11 bg-slate-50 border-slate-100">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 12 }, (_, index) => (
                                                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                                                        {new Date(0, index).toLocaleString('pt-BR', { month: 'long' })}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Ano</Label>
                                        <Select value={filterByYear.toString()} onValueChange={(value) => setFilterByYear(parseInt(value))}>
                                            <SelectTrigger className="h-11 bg-slate-50 border-slate-100">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[2024, 2025, 2026].map(year => (
                                                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {activeFilterLabel && (
                                    <Button type="button" variant="ghost" size="sm" className="mt-2 h-9 px-0 text-xs font-bold text-primary" onClick={resetTransactionTypeFilter}>
                                        Limpar filtro de {activeFilterLabel.toLowerCase()}
                                    </Button>
                                )}
                            </div>
                            <div className="no-print flex w-full flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
                                <label className="inline-flex w-full items-center justify-between gap-2 text-sm text-muted-foreground sm:w-auto sm:justify-start">
                                    <span>Formato</span>
                                    <select value={printMode} onChange={(e) => setPrintMode(e.target.value as PrintMode)} className="h-10 min-w-0 max-w-full rounded-lg border bg-background px-3">
                                        <option value="clinic">A4 clínico</option>
                                        <option value="compact">A4 compacto</option>
                                    </select>
                                </label>
                                <Button variant="ghost" size="sm" className="text-primary font-bold" onClick={() => window.print()}>
                                    <Printer size={16} className="mr-2" /> Imprimir
                                </Button>
                                <DownloadFinanceReportButton
                                    transactions={transactions}
                                    stats={{
                                        income: transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
                                        expense: transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
                                        balance: transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) - transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)
                                    }}
                                    reportTitle={`Relatório - ${new Date(0, filterByMonth - 1).toLocaleString('pt-BR', { month: 'long' })} / ${filterByYear}`}
                                    mode={printMode}
                                    label={
                                        <Button variant="ghost" size="sm" className="w-full text-primary font-bold sm:w-auto">
                                            <FileText size={16} className="mr-2" /> Exportar PDF (Histórico)
                                        </Button>
                                    }
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {displayedTransactions.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">
                                    {activeFilterLabel ? `Nenhuma movimentação de ${activeFilterLabel.toLowerCase()} neste período.` : "Nenhuma movimentação neste período."}
                                </div>
                            ) : null}
                            <div className="admin-scroll-region hidden lg:block">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 text-left">
                                            <th className="pb-4 font-medium">Data</th>
                                            <th className="pb-4 font-medium">Descrição</th>
                                            <th className="pb-4 font-medium">Paciente</th>
                                            <th className="pb-4 font-medium text-right">Valor</th>
                                            <th className="no-print pb-4 font-medium w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {displayedTransactions.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="py-4 text-slate-500 font-mono text-xs">{new Date(t.date).toLocaleDateString()}</td>
                                                <td className="py-4">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                {t.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                            </div>
                                                            <span className="font-medium text-slate-900">{t.description}</span>
                                                        </div>
                                                        <div className="flex gap-2 mt-1 ml-11">
                                                            {t.receiptUrl && (
                                                                <a href={mediaUrl(t.receiptUrl) || undefined} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-primary uppercase hover:underline flex items-center gap-1">
                                                                    <Receipt size={10} /> Recibo
                                                                </a>
                                                            )}
                                                            {t.nfeUrl ? (
                                                                <span className="text-[9px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                                                                    <CheckCircle2 size={10} /> NF-e Emitida
                                                                </span>
                                                            ) : t.type === 'income' ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="no-print h-5 px-1 text-[9px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                                    onClick={() => handleConfirmNfe(t.id)}
                                                                >
                                                                    <Plus size={10} className="mr-1" /> Confirmar NF-e
                                                                </Button>
                                                            ) : null}
                                                        </div>
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
                                                <td className="no-print py-4 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(t.id)}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="min-w-0 space-y-3 lg:hidden">
                                {displayedTransactions.map((t) => (
                                    <article key={`mobile-${t.id}`} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="break-words font-semibold text-slate-900">{t.description}</p>
                                                    <p className="mt-1 text-xs text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                            </div>
                                            <p className={`shrink-0 text-right text-sm font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
                                            {t.patient ? <span className="max-w-full break-words rounded bg-blue-50 px-2 py-1 text-blue-600">{t.patient.name}</span> : <span className="text-slate-400">Sem paciente</span>}
                                            {t.receiptUrl && <a href={mediaUrl(t.receiptUrl) || undefined} target="_blank" rel="noreferrer" className="min-h-8 inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"><Receipt size={11} /> Recibo</a>}
                                            {t.nfeUrl ? <span className="inline-flex min-h-8 items-center gap-1 text-emerald-600"><CheckCircle2 size={11} /> NF-e emitida</span> : t.type === 'income' ? <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold text-rose-500" onClick={() => handleConfirmNfe(t.id)}><Plus size={11} className="mr-1" /> Confirmar NF-e</Button> : null}
                                            <Button variant="ghost" size="icon" className="ml-auto h-9 w-9 text-slate-400 hover:text-red-500" aria-label={`Excluir ${t.description}`} onClick={() => handleDelete(t.id)}><Trash2 size={15} /></Button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            </div>
        </AdminLayout >
    );
};

export default AdminFinance;
