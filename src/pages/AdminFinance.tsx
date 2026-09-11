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
import { FinanceInvoiceAction } from "@/components/admin/FinanceInvoiceAction";
import { hasInvoiceDocument, needsInvoiceDocument } from "@/lib/financeInvoices";
import { createFinanceEntriesCsv } from "@/lib/financeExport";
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
    patient?: { name: string; cpf?: string | null; phone?: string | null; address?: string | null } | null;
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
    const [missingInvoicesOnly, setMissingInvoicesOnly] = useState(false);
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
        setMissingInvoicesOnly(false);
        void loadFinanceData();
    }, [loadFinanceData]);

    const categorySummary = useMemo(() => createExpenseCategorySummary(transactions), [transactions]);
    const missingInvoices = transactions.filter(needsInvoiceDocument);
    const displayedTransactions = transactions.filter((transaction) =>
        (!transactionTypeFilter || transaction.type === transactionTypeFilter) && (!missingInvoicesOnly || needsInvoiceDocument(transaction)),
    );
    const activeFilterLabel = missingInvoicesOnly ? "Receitas sem nota anexada" : transactionTypeFilter === "income" ? "Receitas" : transactionTypeFilter === "expense" ? "Despesas" : null;
    const selectedPeriodStats = {
        income: stats.income,
        expense: stats.expense,
        balance: stats.monthlyBalance,
        monthlyBalance: stats.monthlyBalance,
        openingBalance: stats.openingBalance,
        closingBalance: stats.closingBalance,
    };

    const handleInvoiceSaved = (id: number, nfeUrl: string) => {
        setTransactions((current) => current.map((transaction) => transaction.id === id ? { ...transaction, nfeUrl } : transaction));
    };

    const clearFilters = () => {
        setTransactionTypeFilter(null);
        setMissingInvoicesOnly(false);
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
            ? financeCategories.find((category) => String(category.id) === newCategoryId)
            : undefined;
        if (newType === "expense" && !selectedCategory) {
            toast.error("Selecione uma categoria válida para a despesa.");
            return;
        }
        try {
            const response = await fetchClient("/finance", {
                method: "POST",
                body: JSON.stringify({
                    type: newType,
                    description: newDesc.trim() || null,
                    amount: parseFloat(newAmount),
                    date: newDate,
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
        const headers = ["Data", "Tipo", "Descrição", "Categoria", "Valor", "Paciente", "Nota fiscal"];
        const rows = transactions.map((transaction) => [
            new Date(transaction.date).toLocaleDateString("pt-BR"),
            transaction.type === "income" ? "Receita" : "Despesa",
            `"${(transaction.description || "").replace(/"/g, '""')}"`,
            transaction.category || "-",
            transaction.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 }).replace(/\./g, "").replace(",", "."),
            transaction.patient?.name || "-",
            transaction.type === "income" && transaction.paymentStatus !== "voided" ? (hasInvoiceDocument(transaction.nfeUrl) ? "Anexada" : "Sem anexo") : "Não se aplica",
        ]);
        const link = document.createElement("a");
        link.href = encodeURI(`data:text/csv;charset=utf-8,\uFEFF${headers.join(";")}\n${rows.map((row) => row.join(";")).join("\n")}`);
        link.download = `relatorio_financeiro_${filterByYear}_${filterByMonth}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Relatório CSV gerado!");
    };

    const downloadEntriesForInvoices = () => {
        const entries = transactions.filter((transaction) => transaction.type === "income");
        if (entries.length === 0) {
            toast.error("Nenhuma entrada neste período para exportar.");
            return;
        }
        const link = document.createElement("a");
        link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(createFinanceEntriesCsv(entries))}`;
        link.download = `entradas_nf-e_${filterByYear}_${String(filterByMonth).padStart(2, "0")}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Tabela de entradas para NF-e gerada!");
    };

    const toggleTransactionTypeFilter = (type: "income" | "expense") => {
        setMissingInvoicesOnly(false);
        setTransactionTypeFilter((current) => current === type ? null : type);
    };

    return (
        <AdminLayout title="Gestão Financeira">
            <div className="print-root flex min-w-0 flex-col">
                {loadError && <div role="alert" className="no-print order-0 mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</div>}
                <section aria-label="Resumo financeiro e filtros" className="no-print order-1 mb-4 grid min-w-0 grid-cols-2 gap-3 md:mb-6 md:grid-cols-3">
                    <button type="button" aria-label="Filtrar fluxo de caixa por receitas" aria-pressed={transactionTypeFilter === "income"} onClick={() => toggleTransactionTypeFilter("income")} className={"admin-card min-w-0 p-3 text-left transition-colors sm:p-4 " + (transactionTypeFilter === "income" ? "ring-2 ring-emerald-500" : "")}>
                        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><TrendingUp size={16} aria-hidden="true" /> Receitas</span>
                        <span className="mt-2 block text-xs text-slate-600">Receita recebida</span>
                        <span className="admin-metric-value mt-1 block text-slate-900">R$ {stats.income.toLocaleString("pt-BR")}</span>
                        <span className="mt-2 block text-xs text-amber-800">A receber: R$ {stats.pendingIncome.toLocaleString("pt-BR")}</span>
                    </button>
                    <button type="button" aria-label="Filtrar fluxo de caixa por despesas" aria-pressed={transactionTypeFilter === "expense"} onClick={() => toggleTransactionTypeFilter("expense")} className={"admin-card min-w-0 p-3 text-left transition-colors sm:p-4 " + (transactionTypeFilter === "expense" ? "ring-2 ring-rose-500" : "")}>
                        <span className="flex items-center gap-2 text-xs font-semibold text-rose-700"><ArrowDownRight size={16} aria-hidden="true" /> Despesas</span>
                        <span className="mt-2 block text-xs text-slate-600">Despesas totais</span>
                        <span className="admin-metric-value mt-1 block text-slate-900">R$ {stats.expense.toLocaleString("pt-BR")}</span>
                        <span className="mt-2 block text-xs text-slate-600">Toque para filtrar o fluxo</span>
                    </button>
                    <button type="button" aria-label="Mostrar todas as movimentações do período" aria-pressed={transactionTypeFilter === null && !missingInvoicesOnly} onClick={clearFilters} className={"admin-card col-span-2 min-w-0 p-3 text-left transition-colors sm:p-4 md:col-span-1 " + (transactionTypeFilter === null && !missingInvoicesOnly ? "ring-2 ring-primary/30" : "")}>
                        <span className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Wallet size={16} aria-hidden="true" /> Líquido do mês</span>
                        <span className={"admin-metric-value mt-2 block " + (stats.monthlyBalance >= 0 ? "text-primary" : "text-rose-700")}>R$ {stats.monthlyBalance.toLocaleString("pt-BR")}</span>
                        <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600"><span>Saldo inicial: R$ {stats.openingBalance.toLocaleString("pt-BR")}</span><span>Total em conta: R$ {stats.closingBalance.toLocaleString("pt-BR")}</span></span>
                        <span className="mt-1 block text-xs text-slate-500">Inclui o fechamento anterior</span>
                    </button>
                    {categorySummary.length > 0 && <details className="col-span-2 rounded-xl border border-slate-200 bg-white px-3 md:col-span-3">
                        <summary className="flex min-h-11 cursor-pointer items-center text-xs font-semibold text-slate-700">Despesas por categoria · {categorySummary.length}</summary>
                        <div className="grid gap-3 pb-3 sm:grid-cols-2">{categorySummary.map(category => <div key={category.name}><div className="mb-1 flex justify-between gap-3 text-xs text-slate-600"><span className="min-w-0 break-words">{category.name}</span><span className="shrink-0 tabular-nums">R$ {category.amount.toLocaleString("pt-BR")}</span></div><div className="h-1 rounded-full bg-rose-100"><div className="h-full rounded-full bg-rose-400" style={{ width: category.percentage + "%" }} /></div></div>)}</div>
                    </details>}
                </section>

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
                        <Card className="admin-card"><CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3"><CardTitle className="text-base font-semibold">Notas fiscais</CardTitle><CardDescription>Documentos vinculados às receitas de {financePeriodTitle(filterByMonth, filterByYear)}.</CardDescription></CardHeader><CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
                            <Button type="button" variant="outline" aria-pressed={missingInvoicesOnly} className="h-auto min-h-11 w-full justify-between gap-3 whitespace-normal text-left" onClick={() => { setTransactionTypeFilter(null); setMissingInvoicesOnly((current) => !current); }}><span>Receitas sem nota anexada</span><span className="rounded-md bg-amber-50 px-2 py-1 text-amber-800">{missingInvoices.length}</span></Button>
                            <p className="text-xs leading-relaxed text-slate-500">Anexe notas já emitidas pelo seu emissor fiscal. Abra cada documento pelo fluxo de caixa.</p>
                            <Button variant="outline" size="sm" className="h-auto min-h-11 w-full whitespace-normal text-xs" onClick={downloadEntriesForInvoices}><FileText size={14} className="mr-2 shrink-0" /> Exportar entradas para NF-e (.csv)</Button>
                            <Button variant="ghost" size="sm" className="h-auto min-h-11 w-full whitespace-normal text-xs" onClick={downloadCSV}><FileText size={14} className="mr-2 shrink-0" /> Exportar todas as movimentações (.csv)</Button>
                        </CardContent></Card>
                    </div>

                    <div className="print-report order-1 min-w-0 lg:order-2 lg:col-span-2"><Card className="admin-card">
                        <CardHeader className="gap-4 p-4 sm:p-5">
                            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0"><CardTitle className="text-lg font-semibold tracking-tight text-slate-900">Fluxo de caixa</CardTitle><CardDescription className="mt-1 capitalize">{financePeriodTitle(filterByMonth, filterByYear)}</CardDescription></div>
                                <div className="no-print w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-center text-xs font-semibold text-slate-700 sm:w-auto">
                                    <DownloadFinanceReportButton transactions={transactions} stats={selectedPeriodStats} reportTitle={financePeriodTitle(filterByMonth, filterByYear)} periodLabel={financePeriodTitle(filterByMonth, filterByYear)} periodKey={`${filterByYear}-${String(filterByMonth).padStart(2, "0")}`} label="PDF do período selecionado" />
                                </div>
                            </div>
                            <div className="no-print grid grid-cols-2 gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-3">
                                <div className="min-w-0 space-y-1.5"><Label htmlFor="cash-flow-month" className="text-xs text-slate-600">Mês</Label><Select value={String(filterByMonth)} onValueChange={(value) => setFilterByMonth(Number(value))}><SelectTrigger id="cash-flow-month" className="h-11 bg-white"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 12 }, (_, index) => <SelectItem key={index + 1} value={String(index + 1)}>{new Date(0, index).toLocaleString("pt-BR", { month: "long" })}</SelectItem>)}</SelectContent></Select></div>
                                <div className="min-w-0 space-y-1.5"><Label htmlFor="cash-flow-year" className="text-xs text-slate-600">Ano</Label><Select value={String(filterByYear)} onValueChange={(value) => setFilterByYear(Number(value))}><SelectTrigger id="cash-flow-year" className="h-11 bg-white"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: Math.max(new Date().getFullYear(), filterByYear) - 2024 + 2 }, (_, index) => 2024 + index).map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{displayedTransactions.length} movimentações{activeFilterLabel ? ` · ${activeFilterLabel}` : ""}</span>{activeFilterLabel && <Button type="button" variant="ghost" size="sm" className="no-print min-h-11 text-xs" onClick={clearFilters}>Limpar filtro</Button>}</div>
                        </CardHeader><CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
                        {displayedTransactions.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">{activeFilterLabel ? `Nenhuma movimentação de ${activeFilterLabel.toLowerCase()} neste período.` : "Nenhuma movimentação neste período."}</div>}
                        <div className="admin-scroll-region hidden lg:block"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100 text-left text-slate-400"><th className="pb-4 font-medium">Data</th><th className="pb-4 font-medium">Movimentação</th><th className="pb-4 font-medium text-right">Valor</th><th className="no-print w-10 pb-4"></th></tr></thead><tbody className="divide-y divide-slate-50">{displayedTransactions.map((t) => <tr key={t.id} className="group transition-colors hover:bg-slate-50"><td className="py-4 font-mono text-xs text-slate-500">{new Date(t.date).toLocaleDateString("pt-BR")}</td><td className="py-4"><div className="flex items-start gap-3"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${t.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{t.type === "income" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}</div><div className="min-w-0"><p className="font-medium text-slate-900">{t.patient?.name || (t.description || t.category)}</p>{t.patient && t.description && <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>}{t.category && <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{t.category}</p>}<div className="mt-1 flex flex-wrap items-center gap-2">{t.receiptUrl && <a href={mediaUrl(t.receiptUrl) || undefined} target="_blank" rel="noreferrer" className="text-[9px] font-bold uppercase text-primary hover:underline"><Receipt size={10} className="mr-1 inline" /> Recibo</a>}<FinanceInvoiceAction transaction={t} onSaved={handleInvoiceSaved} /></div></div></div></td><td className={`py-4 text-right font-bold ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>{t.type === "income" ? "+" : "-"} R$ {t.amount.toLocaleString("pt-BR")}</td><td className="no-print py-4 text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100" aria-label={`Excluir ${t.patient?.name || (t.description || t.category)}`} onClick={() => handleDelete(t.id)}><Trash2 size={14} /></Button></td></tr>)}</tbody></table></div>
                        <div className="min-w-0 space-y-3 lg:hidden">{displayedTransactions.map((t) => <article key={`mobile-${t.id}`} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/50 p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{t.type === "income" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}</div><div className="min-w-0"><p className="break-words font-semibold text-slate-900">{t.patient?.name || (t.description || t.category)}</p>{t.patient && t.description && <p className="mt-0.5 break-words text-xs text-slate-500">{t.description}</p>}{t.category && <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{t.category}</p>}<p className="mt-1 text-xs text-slate-500">{new Date(t.date).toLocaleDateString("pt-BR")}</p></div></div><p className={`shrink-0 text-right text-sm font-black ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>{t.type === "income" ? "+" : "-"} R$ {t.amount.toLocaleString("pt-BR")}</p></div><div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide">{t.receiptUrl && <a href={mediaUrl(t.receiptUrl) || undefined} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center gap-1 text-primary hover:underline"><Receipt size={11} /> Recibo</a>}<FinanceInvoiceAction transaction={t} onSaved={handleInvoiceSaved} /><Button variant="ghost" size="icon" className="ml-auto h-9 w-9 text-slate-400 hover:text-red-500" aria-label={`Excluir ${t.patient?.name || (t.description || t.category)}`} onClick={() => handleDelete(t.id)}><Trash2 size={15} /></Button></div></article>)}</div>
                    </CardContent></Card></div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminFinance;
