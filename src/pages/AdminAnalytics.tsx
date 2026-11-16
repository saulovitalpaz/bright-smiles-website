import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchClient } from "@/lib/api";

type Item = { name: string; count: number };
type MoneyGroup = { count: number; total: number; categories: Record<string, { count: number; total: number }> };
type Data = {
    clinic: null | { appointments: { status: string; type: string; count: number }[]; procedures: Item[]; treatments: Item[]; patients: number; plans: { pending: number; completed: number } };
    finance: { income: MoneyGroup; expense: MoneyGroup; pending: { count: number; total: number } };
    website: { visits: number; leads: number };
};
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const monthStart = () => `${today().slice(0, 7)}-01`;
const monthEnd = () => { const [year, month] = today().split("-").map(Number); return `${year}-${String(month).padStart(2, "0")}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`; };
const typeName = (type: string) => ({ odontologia: "Odontologia", facial: "Harmonização facial" }[type] || type || "Não informado");

function Panel({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
    return <Card className="min-w-0 border-slate-200 shadow-sm"><CardHeader className="p-4 pb-2"><CardTitle className="text-base font-semibold">{title}</CardTitle>{note && <p className="text-xs leading-relaxed text-slate-500">{note}</p>}</CardHeader><CardContent className="p-4 pt-2">{children}</CardContent></Card>;
}
function List({ items }: { items: Item[] }) {
    const sorted = [...items].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR"));
    return sorted.length ? <ul className="divide-y divide-slate-100">{sorted.map(item => <li key={item.name} className="flex min-w-0 justify-between gap-3 py-2 text-sm"><span className="min-w-0 break-words text-slate-700">{item.name}</span><strong className="shrink-0 tabular-nums">{item.count}</strong></li>)}</ul> : <p className="py-2 text-sm text-slate-500">Nenhum registro no período.</p>;
}
function FinanceList({ group }: { group: MoneyGroup }) {
    const items = Object.entries(group.categories).sort((a, b) => b[1].total - a[1].total);
    return <><p className="break-words text-xl font-semibold tabular-nums text-slate-900">{money(group.total)}</p><p className="mb-2 text-xs text-slate-500">{group.count} lançamento(s)</p>{items.length ? <ul className="divide-y divide-slate-100">{items.map(([name, item]) => <li key={name} className="flex flex-wrap justify-between gap-x-3 py-2 text-sm"><span className="break-words">{name} <span className="text-slate-500">({item.count})</span></span><strong className="tabular-nums">{money(item.total)}</strong></li>)}</ul> : <p className="text-sm text-slate-500">Nenhum lançamento no período.</p>}</>;
}
export default function AdminAnalytics() {
    const [mode, setMode] = useState("month");
    const [start, setStart] = useState(monthStart);
    const [end, setEnd] = useState(monthEnd);
    const [range, setRange] = useState({ start: monthStart(), end: monthEnd() });
    const [data, setData] = useState<Data | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setLoading(true); setError("");
        const query = mode === "all" ? "" : `?${new URLSearchParams(range).toString()}`;
        fetchClient(`/analytics/clinic${query}`).then(async response => {
            if (!response.ok) throw new Error();
            const result = await response.json() as Data;
            if (active) setData(result);
        }).catch(() => { if (active) { setData(null); setError("Não foi possível carregar os indicadores."); } }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [mode, range, attempt]);
    const chooseMode = (value: string) => { setMode(value); if (value === "month") { const next = { start: monthStart(), end: monthEnd() }; setStart(next.start); setEnd(next.end); setRange(next); } };
    const appointments = data?.clinic?.appointments || [];
    const attended = appointments.filter(item => item.status === "attended");
    const attendedCount = attended.reduce((sum, item) => sum + item.count, 0);
    const scheduled = appointments.filter(item => item.status === "scheduled").reduce((sum, item) => sum + item.count, 0);
    const cancelled = appointments.filter(item => item.status === "cancelled").reduce((sum, item) => sum + item.count, 0);
    return <AdminLayout title="Análise de Dados"><div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-900">Visão da clínica</h2><p className="mt-1 text-sm text-slate-600">Acompanhe atendimentos, pacientes e movimento financeiro.</p></div><div className="w-full sm:w-auto"><label htmlFor="period-mode" className="mb-1 block text-sm font-medium">Período</label><select id="period-mode" value={mode} onChange={e => chooseMode(e.target.value)} className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm sm:w-48"><option value="month">Este mês</option><option value="all">Todo o histórico</option><option value="custom">Personalizado</option></select></div></div>
        {mode === "custom" && <form className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4" onSubmit={e => { e.preventDefault(); if (start && end && start <= end) setRange({ start, end }); }}><div><label htmlFor="start" className="block text-sm font-medium">De</label><input id="start" type="date" required value={start} max={end} onChange={e => setStart(e.target.value)} className="mt-1 min-h-11 max-w-full rounded-md border px-3" /></div><div><label htmlFor="end" className="block text-sm font-medium">Até</label><input id="end" type="date" required value={end} min={start} onChange={e => setEnd(e.target.value)} className="mt-1 min-h-11 max-w-full rounded-md border px-3" /></div><button className="min-h-11 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white" type="submit">Aplicar período</button></form>}
        {loading ? <p role="status" className="py-8 text-center text-slate-500">Carregando indicadores...</p> : error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error} <button type="button" className="ml-2 min-h-11 underline" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div> : data && <>
            {data.clinic && <><div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">{[{ label: "Consultas realizadas", value: attendedCount }, { label: "Agendamentos", value: scheduled }, { label: "Cancelados", value: cancelled }, { label: "Pacientes cadastrados", value: data.clinic.patients }].map(item => <Card key={item.label} className="min-w-0 border-slate-200"><CardContent className="p-4"><p className="text-sm text-slate-600">{item.label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p></CardContent></Card>)}</div><p className="text-xs text-slate-500">Consultas e agendamentos pela data do atendimento; pacientes pela data de cadastro. Agendamentos mostram a situação atual.</p><Panel title="Planos de tratamento" note="Planos criados no período, pela situação atual. Concluído: todos os itens autorizados e concluídos. Pendentes incluem planos expirados ou parcialmente autorizados; planos cancelados não são contados."><div className="flex flex-wrap gap-x-8 gap-y-2 text-sm"><p><strong className="text-lg tabular-nums">{data.clinic.plans.pending}</strong> pendentes</p><p><strong className="text-lg tabular-nums">{data.clinic.plans.completed}</strong> concluídos</p></div></Panel><div className="grid items-start gap-4 lg:grid-cols-3"><Panel title="Consultas por tipo"><List items={attended.map(item => ({ name: typeName(item.type), count: item.count }))} /></Panel><Panel title="Procedimentos em consultas"><List items={data.clinic.procedures} /></Panel><Panel title="Tratamentos concluídos" note="Itens de planos concluídos, pela data da última atualização."><List items={data.clinic.treatments} /></Panel></div></>}
            <section aria-labelledby="financial-title" className="space-y-3"><h3 id="financial-title" className="text-lg font-semibold">Financeiro</h3><div className="grid items-start gap-4 md:grid-cols-2"><Panel title="Entradas recebidas" note="Receitas realizadas, por categoria."><FinanceList group={data.finance.income} /></Panel><Panel title="Despesas" note="Lançamentos não estornados, por categoria."><FinanceList group={data.finance.expense} /></Panel></div><p className="text-sm text-slate-600">A receber: <strong>{money(data.finance.pending.total)}</strong> em {data.finance.pending.count} lançamento(s). Valores pela data do lançamento.</p></section>
            <Panel title="Site e solicitações" note="Visitas ao site e solicitações recebidas no período."><div className="flex flex-wrap gap-x-8 gap-y-2 text-sm"><p><strong className="text-lg tabular-nums">{data.website.visits}</strong> visitas</p><p><strong className="text-lg tabular-nums">{data.website.leads}</strong> solicitações</p></div></Panel>
        </>}
    </div></AdminLayout>;
}
