import { useEffect, useState } from "react";
import axios from "axios";
import { Package, Plus, Search } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminApi } from "@/lib/api";
import { loadStockProducts, stockClasses, type StockProduct } from "@/lib/stock";
import type { FacialProcedureType } from "@/components/admin/attendance/facial/facialModel";

type Form = { name: string; procedureType: FacialProcedureType; quantity: string; concentration: string; price: string; active: boolean };
type Movement = { id: number; quantity: number; reason: string; createdAt: string };
const blank: Form = { name: "", procedureType: "botulinum-toxin", quantity: "", concentration: "", price: "", active: true };
const decimal = (value: string) => value.trim() ? Number(value.replace(",", ".")) : NaN;
const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const labelClass = "grid gap-2 text-sm font-medium";
const selectClass = "h-11 rounded-md border border-input bg-background px-3 text-sm";
const errorMessage = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.error || "Não foi possível acessar o estoque." : "Não foi possível acessar o estoque.";

export default function AdminStock() {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [modal, setModal] = useState<"product" | "adjust" | "history" | null>(null);
  const [selected, setSelected] = useState<StockProduct | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [adjustment, setAdjustment] = useState({ quantity: "", reason: "" });
  const [movements, setMovements] = useState<Movement[]>([]);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");
  const [notice, setNotice] = useState("");
  const reload = async () => {
    setLoading(true); setError("");
    try { setProducts(await loadStockProducts()); } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); }
  };
  useEffect(() => { void reload(); }, []);
  const openProduct = (product: StockProduct | null) => {
    setSelected(product); setModalError(""); setModal("product");
    setForm(product ? { name: product.name, procedureType: product.procedureType, quantity: String(product.quantity), concentration: product.concentration === null ? "" : String(product.concentration), price: String(product.price), active: product.active } : blank);
  };
  const openHistory = async (product: StockProduct) => {
    setSelected(product); setModal("history"); setModalError(""); setMovements([]); setBusy(true);
    try { setMovements((await adminApi.get(`/stock/products/${product.id}/movements`)).data); } catch (e) { setModalError(errorMessage(e)); } finally { setBusy(false); }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return; setModalError("");
    const thread = form.procedureType === "thread";
    const concentration = form.concentration.trim() ? decimal(form.concentration) : null;
    const quantity = decimal(form.quantity), price = decimal(form.price);
    if (!form.name.trim() || !Number.isFinite(price) || price < 0 || (!selected && (!Number.isFinite(quantity) || quantity < 0 || (thread && !Number.isInteger(quantity)))) || (concentration !== null && (!Number.isFinite(concentration) || concentration <= 0)) || (form.procedureType === "botulinum-toxin" && !concentration)) {
      setModalError("Confira os campos. Informe saldo e preço não negativos e a concentração da toxina."); return;
    }
    const product = { name: form.name.trim(), procedureType: form.procedureType, stockUnit: thread ? "unit" : "ml", concentration: thread ? null : concentration, price, active: form.active };
    setBusy(true);
    try {
      if (selected) await adminApi.put(`/stock/products/${selected.id}`, { product, version: selected.version });
      else await adminApi.post("/stock/products", { product, quantity });
      setModal(null); setNotice(selected ? "Produto atualizado." : "Produto cadastrado."); await reload();
    } catch (e) { setModalError(errorMessage(e)); } finally { setBusy(false); }
  };
  const submitAdjustment = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selected || busy) return;
    const quantity = decimal(adjustment.quantity);
    if (!Number.isFinite(quantity) || !quantity || adjustment.reason.trim().length < 3) { setModalError("Informe uma quantidade diferente de zero e o motivo."); return; }
    setBusy(true); setModalError("");
    try { await adminApi.post(`/stock/products/${selected.id}/adjustments`, { quantity, reason: adjustment.reason.trim(), version: selected.version }); setModal(null); setNotice("Estoque ajustado."); await reload(); }
    catch (e) { setModalError(errorMessage(e)); } finally { setBusy(false); }
  };
  const visible = products.filter(p => p.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")) && (!filter || p.procedureType === filter));
  return <AdminLayout title="Estoque">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-muted-foreground">Configurações / Estoque</p><h1 className="mt-2 text-3xl font-semibold">Produtos e insumos</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">Cadastre os produtos utilizados no facegram. As doses vinculadas são descontadas quando o atendimento é salvo.</p></div><Button onClick={() => openProduct(null)} className="min-h-11 gap-2"><Plus size={18} />Novo produto</Button></header>
      <div className="grid gap-3 sm:grid-cols-3">{[{ label: "Produtos ativos", value: products.filter(p => p.active).length }, { label: "Sem saldo", value: products.filter(p => p.active && p.quantity === 0).length }, { label: "Valor em estoque", value: money(products.reduce((sum, p) => sum + p.quantity * p.price, 0)) }].map(card => <div key={card.label} className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{card.label}</p><p className="mt-2 text-2xl font-semibold">{card.value}</p></div>)}</div>
      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
      <div className="flex flex-wrap gap-3"><label className="relative min-w-52 flex-1"><Search size={17} className="absolute left-3 top-3 text-muted-foreground" /><Input aria-label="Pesquisar produtos" placeholder="Pesquisar produtos" value={search} onChange={e => setSearch(e.target.value)} className="h-11 pl-10" /></label><select aria-label="Filtrar classe" className={selectClass} value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todas as classes</option>{stockClasses.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select><Button variant="outline" onClick={reload} disabled={loading}>Atualizar</Button></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {loading ? <p role="status">Carregando estoque…</p> : <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40 text-muted-foreground"><tr>{["Produto / classe", "Saldo", "Concentração", "Preço", "Ações"].map(title => <th key={title} scope="col" className="whitespace-nowrap p-4 font-medium">{title}</th>)}</tr></thead><tbody>{visible.map(p => <tr key={p.id} className="border-b last:border-0"><td className="p-4"><strong className="font-medium">{p.name}</strong><p className="mt-1 text-xs text-muted-foreground">{stockClasses.find(c => c.value === p.procedureType)?.label}{!p.active && " · Inativo"}</p></td><td className="whitespace-nowrap p-4">{p.quantity.toLocaleString("pt-BR", { maximumFractionDigits: 6 })} {p.stockUnit === "unit" ? "un." : "ml"}</td><td className="whitespace-nowrap p-4">{p.concentration ? `${p.concentration.toLocaleString("pt-BR")} UI/ml` : "Não se aplica"}</td><td className="whitespace-nowrap p-4">{money(p.price)}/{p.stockUnit === "unit" ? "un." : "ml"}</td><td className="p-3"><div className="flex gap-1"><Button size="sm" variant="ghost" className="min-h-11" onClick={() => openProduct(p)}>Editar</Button><Button size="sm" variant="ghost" className="min-h-11" onClick={() => { setSelected(p); setAdjustment({ quantity: "", reason: "" }); setModalError(""); setModal("adjust"); }}>Ajustar</Button><Button size="sm" variant="ghost" className="min-h-11" onClick={() => openHistory(p)}>Histórico</Button></div></td></tr>)}</tbody></table>{!visible.length && <div className="p-12 text-center"><Package className="mx-auto mb-3 text-muted-foreground" /><p>Nenhum produto encontrado.</p><p className="mt-1 text-sm text-muted-foreground">Cadastre um produto para vinculá-lo às aplicações.</p></div>}</div>}
      <Dialog open={!!modal} onOpenChange={open => { if (!open && !busy) setModal(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{modal === "product" ? selected ? "Editar produto" : "Novo produto" : modal === "adjust" ? "Ajustar estoque" : "Histórico do estoque"}</DialogTitle><DialogDescription>{modal === "product" ? "Saldo em ml para líquidos e unidades para fios. Preço por ml ou unidade." : selected?.name}</DialogDescription></DialogHeader>
        {modalError && <p role="alert" className="text-sm text-destructive">{modalError}</p>}
        {modal === "product" && <form onSubmit={submit} className="space-y-4"><label className={labelClass}>Nome do produto<Input required maxLength={160} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label className={labelClass}>Classe<select className={selectClass} disabled={!!selected} value={form.procedureType} onChange={e => setForm({ ...form, procedureType: e.target.value as FacialProcedureType, concentration: "" })}>{stockClasses.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
          {!selected && <label className={labelClass}>Quantidade inicial ({form.procedureType === "thread" ? "unidades" : "ml"})<Input required inputMode="decimal" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></label>}
          {form.procedureType !== "thread" && <label className={labelClass}>Concentração (UI/ml){form.procedureType !== "botulinum-toxin" && <span className="text-xs font-normal text-muted-foreground">Opcional para produtos dosados em ml.</span>}<Input disabled={!!selected} required={form.procedureType === "botulinum-toxin"} inputMode="decimal" value={form.concentration} onChange={e => setForm({ ...form, concentration: e.target.value })} /></label>}
          <label className={labelClass}>Preço por {form.procedureType === "thread" ? "unidade" : "ml"} (R$)<Input required inputMode="decimal" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></label>
          {selected && <><p className="text-xs text-muted-foreground">Para mudar classe ou concentração, cadastre uma nova apresentação. Use Ajustar para entradas e correções de saldo.</p><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />Produto ativo</label></>}
          <Button type="submit" disabled={busy} className="min-h-11 w-full">{busy ? "Salvando…" : "Salvar produto"}</Button></form>}
        {modal === "adjust" && <form className="space-y-4" onSubmit={submitAdjustment}><p className="text-sm">Saldo atual: {selected?.quantity} {selected?.stockUnit === "unit" ? "un." : "ml"}</p><label className={labelClass}>Quantidade de entrada ou saída<Input inputMode="decimal" required value={adjustment.quantity} onChange={e => setAdjustment({ ...adjustment, quantity: e.target.value })} /><span className="text-xs font-normal text-muted-foreground">Positiva para entrada; negativa para saída ou descarte.</span></label><label className={labelClass}>Motivo<Input required minLength={3} maxLength={200} value={adjustment.reason} onChange={e => setAdjustment({ ...adjustment, reason: e.target.value })} /></label><Button type="submit" disabled={busy} className="min-h-11 w-full">{busy ? "Salvando…" : "Confirmar ajuste"}</Button></form>}
        {modal === "history" && (busy ? <p role="status">Carregando histórico…</p> : <div className="space-y-3">{movements.map(m => <div key={m.id} className="flex justify-between gap-4 border-b pb-3 text-sm"><div><p>{m.reason}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString("pt-BR")}</p></div><strong>{m.quantity > 0 ? "+" : ""}{m.quantity.toLocaleString("pt-BR", { maximumFractionDigits: 6 })} {selected?.stockUnit === "unit" ? "un." : "ml"}</strong></div>)}{!movements.length && <p className="text-sm">Nenhuma movimentação.</p>}<p className="text-xs text-muted-foreground">Últimas 100 movimentações.</p></div>)}
      </DialogContent></Dialog>
    </div>
  </AdminLayout>;
}
