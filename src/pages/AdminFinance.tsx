import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientPicker } from "@/components/admin/PatientPicker";
import { DownloadFinanceReportButton } from "@/components/admin/FinanceReportPDF";
import { fetchClient, API_URL } from "@/lib/api";
import { createExpenseCategorySummary, financePeriodQuery, financePeriodTitle, todayInput as createTodayInput } from "@/lib/finance";
import { mediaUrl } from "@/lib/media";
import axios from "axios";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, FileText, Loader2, Plus, Receipt, Trash2, TrendingUp, Upload, Wallet } from "lucide-react";
import { toast } from "sonner";

type Transaction = {
    id: number;
    type: "income" | "expense";
    description: string | null;
    amount: number;
    date: string;
    category: string | null;
    paymentStatus?: string | null;
    patient?: { name: string } | null;
    receiptUrl?: string;
    nfeUrl?: string;
};

type FinanceCategory = { id: number; name: string };

type FinanceStats = {
    income: number;
    pendingIncome: number;
    expense: number;
    monthlyBalance: number;
    openingBalance: number;
    closingBalance: number;
};

const EMPTY_STATS: FinanceStats = { income: 0, pendingIncome: 0, expense: 0, monthlyBalance: 0, openingBalance: 0, closingBalance: 0 };

const AdminFinance = () => {
    const todayInput = createTodayInput();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<FinanceStats>(EMPTY_STATS);
    const [financeCategories, setFinanceCategories] = useState<FinanceCategory[]>([]);
    const [filterByMonth, setFilterByMonth] = useState(new Date().getMonth() + 1);
    const [filterByYear, setFilterByYear] = useState(new Date().getFullYear());
    const [transactionTypeFilter, setTransactionTypeFilter] = useState<"income" | "expense" | null>(null);
    const [newDesc, setNewDesc] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [newDate, setNewDate] = useState(todayInput);
    const [newCategoryId, setNewCategoryId] = useState("");
    const [newType, setNewType] = useState<"income" | "expense">("income");
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState("");
    const [loadError, setLoadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadFinanceData = useCallback(async () => {
        try {
            const period = financePeriodQuery(filterByMonth, filterByYear);
            const [transactionsResponse, statsResponse, categoriesResponse] = await Promise.all([
                fetchClient(`/finance?${period}`),
                fetchClient(`/finance/stats?${period}`),
                fetchClient("/finance/categories"),
            ]);

            let hasLoadError = false;
            if (transactionsResponse.ok) setTransactions(await transactionsResponse.json());
            else hasLoadError = true;
            if (statsResponse.ok) setStats(await statsResponse.json());
            else hasLoadError = true;
            if (categoriesResponse.ok) {
                const categories: unknown = await categoriesResponse.json();
                if (Array.isArray(categories)) {
                    const validCategories = categories.filter((category): category is FinanceCategory =>
                        typeof category?.id === "number" && typeof category.name === "string",
                    );
                    setFinanceCategories(validCategories);
                    setNewCategoryId((current) => validCategories.some((category) => String(category.id) === current)
                        ? current
                        : String(validCategories[0]?.id ?? ""));
                } else hasLoadError = true;
            } else hasLoadError = true;
            if (hasLoadError) {
                const message = "Não foi possível carregar o fluxo financeiro.";
                setLoadError(message);
                toast.error(message);
            } else {
                setLoadError(null);
            }
        } catch {
            const message = "Não foi possível carregar o fluxo financeiro.";
            setLoadError(message);
            toast.error(message);
        }
    }, [filterByMonth, filterByYear]);

    useEffect(() => {
        setTransactionTypeFilter(null);
        void loadFinanceData();
    }, [loadFinanceData]);

    const categorySummary = useMemo(() => createExpenseCategorySummary(transactions), [transactions]);
    const displayedTransactions = transactionTypeFilter ? transactions.filter((transaction) => transaction.type === transactionTypeFilter) : transactions;
    const activeFilterLabel = transactionTypeFilter === "income" ? "Receitas" : transactionTypeFilter === "expense" ? "Despesas" : null;
    const selectedPeriodStats = {
        income: stats.income,
        expense: stats.expense,
        balance: stats.monthlyBalance,
        monthlyBalance: stats.monthlyBalance,
        openingBalance: stats.openingBalance,
        closingBalance: stats.closingBalance,
    };

    const handleConfirmNfe = async (transactionId: number) => {
        try {
            const response = await fetchClient("/finance/nfe", { method: "POST", body: JSON.stringify({ transactionIds: [transactionId], nfeUrl: "" }) });
            if (response.ok) {
                toast.success("NF-e confirmada com sucesso!");
                void loadFinanceData();
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao confirmar NF-e");
        }
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await axios.post(`${API_URL}/financial-assets`, formData, { headers: { "Content-Type": "multipart/form-data" }, withCredentials: true });
            setReceiptUrl(res.data.reference);
            toast.success("Comprovante anexado!");
        } catch (error) {
            console.error(error);
            toast.error("Erro no upload");
        } finally {
            setUploading(false);
        }
    };

    const handleAddTransaction = async (event: React.FormEvent) => {
        event.preventDefault();
        if (newType === "expense" && !newCategoryId) {
            toast.error("Selecione uma categoria para a despesa.");
            return;
        }
        const selectedCategory = newType === "expense"
            ? financeCategories.find((category) => category.id === Number(newCategoryId))
            : undefined;
        try {
            const response = await fetchClient("/finance", {
                method: "POST",
                body: JSON.stringify({
                    type: newType,
                    description: newDesc.trim() || null,
                    amount: parseFloat(newAmount),
                    date: newDate,
                    categoryId: newType === 'expense' ? Number(newCategoryId) : undefined,
                    category: newType === "expense" ? selectedCategory?.name : undefined,
                    patientId: newType === "income" ? selectedPatientId : undefined,
                    receiptUrl: receiptUrl || undefined,
                }),
            });
            if (!response.ok) {
                toast.error("Erro ao salvar transação");
                return;
            }
            toast.success("Transação registrada!");
            setNewDesc("");
            setNewAmount("");
            setNewDate(todayInput);
            setSelectedPatientId(null);
            setReceiptUrl("");
            void loadFinanceData();
        } catch (error) {
            console.error(error);
            toast.error("Erro de conexão");
        }
    };

    const handleDelete = async (transactionId: number) => {
        if (!window.confirm("Tem certeza que deseja excluir?")) return;
        try {
            await fetchClient(`/finance/${transactionId}`, { method: "DELETE" });
            toast.success("Transação excluída");
            void loadFinanceData();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao excluir");
        }
    };

    const downloadCSV = () => {
        if (transactions.length === 0) {
            toast.error("Nenhuma transação neste período para exportar.");
            return;
        }
        const headers = ["Data", "Tipo", "Descrição", "Categoria", "Valor", "Paciente"];
        const rows = transactions.map((transaction) => [
            new Date(transaction.date).toLocaleDateString("pt-BR"),
            transaction.type === "income" ? "Receita" : "Despesa",
            `"${(transaction.description || "").replace(/"/g, '""')}"`,
            transaction.category || "-",
            transaction.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 }).replace(/\./g, "").replace(",", "."),
            transaction.patient?.name || "-",
        ]);
        const link = document.createElement("a");
        link.href = encodeURI(`data:text/csv;charset=utf-8,\uFEFF${headers.join(";")}\n${rows.map((row) => row.join(";")).join("\n")}`);
        link.download = `relatorio_financeiro_${filterByYear}_${filterByMonth}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Relatório CSV gerado!");
    };

    const toggleTransactionTypeFilter = (type: "income" | "expense") => setTransactionTypeFilter((current) => current === type ? null : type);
    const handleFilterCardKeyDown = (event: React.KeyboardEvent, action: () => void) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            action();
        }
    };

    return (
        <AdminLayout title="Gestão Financeira">
            <div className="print-root flex min-w-0 flex-col">
                {loadError && <div role="alert" className="no-print order-0 mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</div>}
                <div className="no-print order-3 mb-8 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 lg:order-1">
                    <Card role="button" tabIndex={0} aria-label="Filtrar fluxo de caixa por receitas" aria-pressed={transactionTypeFilter === "income"} onClick={() => toggleTransactionTypeFilter("income")} onKeyDown={(event) => handleFilterCardKeyDown(event, () => toggleTransactionTypeFilter("income"))} className={`cursor-pointer overflow-hidden border-slate-100 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${transactionTypeFilter === "income" ? "border-emerald-400 ring-2 ring-emerald-100" : ""}`}>
                        <CardContent className="p-6"><div className="flex items-start justify-between"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-600"><TrendingUp size={24} /></div><span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600"><ArrowUpRight size={14} /> Receitas</span></div><p className="mt-4 text-sm font-medium text-slate-500">Receita recebida</p><p className="mt-1 text-2xl font-bold text-slate-900">R$ {stats.income.toLocaleString("pt-BR")}</p><p className="mt-1 text-xs text-amber-700">A receber: R$ {stats.pendingIncome.toLocaleString("pt-BR")}</p></CardContent>
                    </Card>
                    <Card role="button" tabIndex={0} aria-label="Filtrar fluxo de caixa por despesas" aria-pressed={transactionTypeFilter === "expense"} onClick={() => toggleTransactionTypeFilter("expense")} onKeyDown={(event) => handleFilterCardKeyDown(event, () => toggleTransactionTypeFilter("expense"))} className={`cursor-pointer overflow-hidden border-slate-100 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${transactionTypeFilter === "expense" ? "border-rose-400 ring-2 ring-rose-100" : ""}`}>
                        <CardContent className="p-6"><div className="flex items-start justify-between"><div className="rounded-xl bg-rose-50 p-3 text-rose-600"><ArrowDownRight size={24} /></div><span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600">Despesas</span></div><p className="mt-4 text-sm font-medium text-slate-500">Despesas totais</p><p className="mt-1 text-2xl font-bold text-slate-900">R$ {stats.expense.toLocaleString("pt-BR")}</p>{categorySummary.length > 0 && <div className="mt-4 space-y-2">{categorySummary.map((category) => <div key={category.name} className="space-y-1"><div className="flex justify-between gap-3 text-[10px] font-medium text-slate-500"><span className="truncate uppercase">{category.name}</span><span>R$ {category.amount.toLocaleString("pt-BR")}</span></div><div className="h-1 overflow-hidden rounded-full bg-rose-100"><div className="h-full rounded-full bg-rose-400" style={{ width: `${category.percentage}%` }} /></div></div>)}</div>}</CardContent>
                    </Card>
                    <Card role="button" tabIndex={0} aria-label="Mostrar todas as movimentações do período" aria-pressed={transactionTypeFilter === null} onClick={() => setTransactionTypeFilter(null)} onKeyDown={(event) => handleFilterCardKeyDown(event, () => setTransactionTypeFilter(null))} className={`cursor-pointer border-2 border-primary/10 bg-white shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${transactionTypeFilter === null ? "ring-2 ring-primary/20" : ""}`}>
                        <CardContent className="p-6"><div className="w-fit rounded-xl bg-primary/10 p-3 text-primary"><Wallet size={24} /></div><p className="mt-4 text-sm font-medium text-slate-500">Líquido do mês</p><p className={`mt-1 text-2xl font-bold ${stats.monthlyBalance >= 0 ? "text-primary" : "text-rose-600"}`}>R$ {stats.monthlyBalance.toLocaleString("pt-BR")}</p><p className="mt-2 text-xs text-slate-500">Saldo inicial: R$ {stats.openingBalance.toLocaleString("pt-BR")}</p><p className="mt-1 text-xs text-slate-500">Total em conta: R$ {stats.closingBalance.toLocaleString("pt-BR")}</p><p className="mt-1 text-xs text-slate-400">Inclui o fechamento anterior</p></CardContent>
                    </Card>
                </div>

                <div className="order-2 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                    <div className="no-print order-2 min-w-0 space-y-6 lg:order-1">
                        <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle className="font-serif text-xl">Nova Transação</CardTitle><CardDescription>Registre entradas ou saídas manuais.</CardDescription></CardHeader><CardContent><form onSubmit={handleAddTransaction} className="space-y-4">
                            <div className="space-y-2"><Label>Tipo</Label><div className="flex gap-2"><Button type="button" variant={newType === "income" ? "default" : "outline"} className="flex-1" onClick={() => setNewType("income")}>Receita</Button><Button type="button" variant={newType === "expense" ? "destructive" : "outline"} className="flex-1" onClick={() => setNewType("expense")}>Despesa</Button></div></div>
                            {newType === "income" && <div className="space-y-2"><Label>Vincular paciente (opcional)</Label><PatientPicker onSelect={(patient) => { setSelectedPatientId(patient.id); if (!newDesc) setNewDesc(`Pagamento - ${patient.name}`); }} /></div>}
                            <div className="space-y-2"><Label htmlFor="transaction-date">Data da transação</Label><Input id="transaction-date" type="date" value={newDate} onChange={(event) => setNewDate(event.target.value)} required /></div>
                            {newType === "expense" && <div className="space-y-2"><Label htmlFor="transaction-category">Categoria</Label>{financeCategories.length > 0 ? <Select value={newCategoryId} onValueChange={setNewCategoryId}><SelectTrigger id="transaction-category" aria-required="true"><SelectValue placeholder="Selecione a categoria" /></SelectTrigger><SelectContent>{financeCategories.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectContent></Select> : <p className="text-sm text-slate-500">Cadastre uma categoria em <Link to="/admin/settings" className="font-semibold text-primary underline">Configurações</Link> para registrar despesas.</p>}</div>}
                            <div className="space-y-2"><Label htmlFor="desc">Descrição (opcional)</Label><Input id="desc" value={newDesc} onChange={(event) => setNewDesc(event.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="amount">Valor (R$)</Label><Input id="amount" type="number" min="0.01" step="0.01" placeholder="0,00" value={newAmount} onChange={(event) => setNewAmount(event.target.value)} required /></div>
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Anexo de comprovante</Label><Button type="button" variant="outline" className="h-11 w-full gap-2 border-2 border-dashed hover:bg-slate-50" onClick={() => fileInputRef.current?.click()} disabled={uploading}>{uploading ? <Loader2 className="w-4 animate-spin" /> : <Upload className="w-4" />}{receiptUrl ? "Substituir comprovante" : "Anexar foto / PDF"}</Button><input ref={fileInputRef} type="file" className="hidden" accept="image/*,application/pdf" onChange={handleUpload} />{receiptUrl && <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2"><CheckCircle2 size={14} className="text-emerald-600" /><span className="text-[10px] font-bold uppercase text-emerald-700">Documento vinculado</span></div>}</div>
                            <Button type="submit" className="mt-2 w-full gap-2" disabled={uploading || (newType === "expense" && !newCategoryId)}><Plus size={18} /> Registrar</Button>
                        </form></CardContent></Card>
                        <Card className="border-2 border-primary/10 bg-white shadow-sm"><CardContent className="flex flex-col items-center p-6 text-center"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Receipt size={24} /></div><h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-900">Faturamento & NF-e</h4><div className="w-full space-y-4"><div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="mb-1 flex justify-between text-xs font-medium text-slate-500"><span>NF-e pendentes</span><span className={transactions.filter((transaction) => transaction.type === "income" && !transaction.nfeUrl).length > 0 ? "text-rose-600" : "text-emerald-600"}>{transactions.filter((transaction) => transaction.type === "income" && !transaction.nfeUrl).length}</span></div></div><Button variant="outline" size="sm" className="h-10 w-full text-[10px] font-bold text-slate-700" onClick={downloadCSV}><FileText size={14} className="mr-2" /> Exportar relatório contábil (.csv)</Button></div></CardContent></Card>
                    </div>

                    <div className="print-report order-1 min-w-0 lg:order-2 lg:col-span-2"><Card className="min-w-0 border-slate-200 shadow-sm"><CardHeader className="min-w-0 gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><CardTitle className="break-words font-serif text-xl">Fluxo de Caixa - {financePeriodTitle(filterByMonth, filterByYear)}</CardTitle><CardDescription>Histórico de movimentações financeiras{activeFilterLabel ? ` · ${activeFilterLabel}` : ""}.</CardDescription><div className="grid grid-cols-2 gap-3 pt-4 sm:max-w-sm"><div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Mês</Label><Select value={String(filterByMonth)} onValueChange={(value) => setFilterByMonth(Number(value))}><SelectTrigger className="h-11 border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 12 }, (_, index) => <SelectItem key={index + 1} value={String(index + 1)}>{new Date(0, index).toLocaleString("pt-BR", { month: "long" })}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Ano</Label><Select value={String(filterByYear)} onValueChange={(value) => setFilterByYear(Number(value))}><SelectTrigger className="h-11 border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent>{[2024, 2025, 2026].map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent></Select></div></div>{activeFilterLabel && <Button type="button" variant="ghost" size="sm" className="mt-2 h-9 px-0 text-xs font-bold text-primary" onClick={() => setTransactionTypeFilter(null)}>Limpar filtro de {activeFilterLabel.toLowerCase()}</Button>}</div><div className="no-print flex w-full items-center lg:w-auto"><DownloadFinanceReportButton transactions={transactions} stats={selectedPeriodStats} reportTitle={financePeriodTitle(filterByMonth, filterByYear)} periodLabel={financePeriodTitle(filterByMonth, filterByYear)} periodKey={`${filterByYear}-${String(filterByMonth).padStart(2, "0")}`} label="PDF do período selecionado" /></div></CardHeader><CardContent>
                        {displayedTransactions.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">{activeFilterLabel ? `Nenhuma movimentação de ${activeFilterLabel.toLowerCase()} neste período.` : "Nenhuma movimentação neste período."}</div>}
                        <div className="admin-scroll-region hidden lg:block"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100 text-left text-slate-400"><th className="pb-4 font-medium">Data</th><th className="pb-4 font-medium">Movimentação</th><th className="pb-4 font-medium text-right">Valor</th><th className="no-print w-10 pb-4"></th></tr></thead><tbody className="divide-y divide-slate-50">{displayedTransactions.map((t) => <tr key={t.id} className="group transition-colors hover:bg-slate-50"><td className="py-4 font-mono text-xs text-slate-500">{new Date(t.date).toLocaleDateString("pt-BR")}</td><td className="py-4"><div className="flex items-start gap-3"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${t.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{t.type === "income" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}</div><div className="min-w-0"><p className="font-medium text-slate-900">{t.patient?.name || (t.description || t.category)}</p>{t.patient && t.description && <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>}{t.category && <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{t.category}</p>}<div className="mt-1 flex gap-2">{t.receiptUrl && <a href={mediaUrl(t.receiptUrl) || undefined} target="_blank" rel="noreferrer" className="text-[9px] font-bold uppercase text-primary hover:underline"><Receipt size={10} className="mr-1 inline" /> Recibo</a>}{t.nfeUrl ? <span className="text-[9px] font-bold uppercase text-emerald-600"><CheckCircle2 size={10} className="mr-1 inline" /> NF-e emitida</span> : t.type === "income" ? <Button variant="ghost" size="sm" className="no-print h-5 px-1 text-[9px] font-bold text-rose-500" onClick={() => handleConfirmNfe(t.id)}><Plus size={10} className="mr-1" /> Confirmar NF-e</Button> : null}</div></div></div></td><td className={`py-4 text-right font-bold ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>{t.type === "income" ? "+" : "-"} R$ {t.amount.toLocaleString("pt-BR")}</td><td className="no-print py-4 text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100" aria-label={`Excluir ${t.patient?.name || (t.description || t.category)}`} onClick={() => handleDelete(t.id)}><Trash2 size={14} /></Button></td></tr>)}</tbody></table></div>
                        <div className="min-w-0 space-y-3 lg:hidden">{displayedTransactions.map((t) => <article key={`mobile-${t.id}`} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/50 p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{t.type === "income" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}</div><div className="min-w-0"><p className="break-words font-semibold text-slate-900">{t.patient?.name || (t.description || t.category)}</p>{t.patient && t.description && <p className="mt-0.5 break-words text-xs text-slate-500">{t.description}</p>}{t.category && <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{t.category}</p>}<p className="mt-1 text-xs text-slate-500">{new Date(t.date).toLocaleDateString("pt-BR")}</p></div></div><p className={`shrink-0 text-right text-sm font-black ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>{t.type === "income" ? "+" : "-"} R$ {t.amount.toLocaleString("pt-BR")}</p></div><div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide">{t.receiptUrl && <a href={mediaUrl(t.receiptUrl) || undefined} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center gap-1 text-primary hover:underline"><Receipt size={11} /> Recibo</a>}{t.nfeUrl ? <span className="inline-flex min-h-8 items-center gap-1 text-emerald-600"><CheckCircle2 size={11} /> NF-e emitida</span> : t.type === "income" ? <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold text-rose-500" onClick={() => handleConfirmNfe(t.id)}><Plus size={11} className="mr-1" /> Confirmar NF-e</Button> : null}<Button variant="ghost" size="icon" className="ml-auto h-9 w-9 text-slate-400 hover:text-red-500" aria-label={`Excluir ${t.patient?.name || (t.description || t.category)}`} onClick={() => handleDelete(t.id)}><Trash2 size={15} /></Button></div></article>)}</div>
                    </CardContent></Card></div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminFinance;
