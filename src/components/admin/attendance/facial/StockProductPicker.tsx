import { useEffect, useState } from "react";
import { loadStockProducts, stockClasses, stockDateLabel, type StockProduct } from "@/lib/stock";
import type { FacialProcedureType } from "./facialModel";

export default function StockProductPicker({ procedureType, selectedId, onSelect }: { procedureType: FacialProcedureType; selectedId?: string; onSelect: (product: StockProduct) => void }) {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setProducts([]);
    loadStockProducts(procedureType, controller.signal).then(data => { if (!controller.signal.aborted) { setProducts(data); setStatus("ready"); } }).catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [procedureType, attempt]);
  const matches = products.filter(p => (p.active || p.id === selectedId) && `${p.name} ${p.batch || ""}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")));
  return <div className="facial-stock-picker">
    <div className="facial-stock-heading"><span>{stockClasses.find(item => item.value === procedureType)?.label}</span><button type="button" disabled={status === "loading"} onClick={() => setAttempt(n => n + 1)}>Atualizar produtos</button></div>
    <label>Nome ou lote<input aria-label="Pesquisar produto do estoque" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar nome ou lote…" /></label>
    {status === "loading" && <p role="status">Carregando produtos…</p>}
    {status === "error" && <p role="alert">Estoque indisponível. <button type="button" onClick={() => setAttempt(n => n + 1)}>Tentar novamente</button></p>}
    {status === "ready" && !matches.length && <p>{search.trim() ? "Nenhum produto corresponde à busca. Tente outro nome ou lote." : "Nenhum produto ativo disponível nesta classe. Confira o cadastro em Configurações → Estoque e atualize a lista."}</p>}
    <div className="facial-stock-results">{matches.map(p => <button type="button" key={p.id} aria-pressed={selectedId === p.id} onClick={() => onSelect(p)}>
      <strong>{p.name}</strong><span>{p.quantity.toLocaleString("pt-BR")} {p.stockUnit === "unit" ? "un." : "ml"}{p.concentration ? ` · ${p.concentration} UI/ml` : ""} · {p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/{p.stockUnit === "unit" ? "un." : "ml"}</span>
      <span>Lote: {p.batch || "Não informado"}{p.reconstitutedAt && ` · Reconstituído em ${stockDateLabel(p.reconstitutedAt)}`}{!p.active && " · Inativo"}</span>
    </button>)}</div>
  </div>;
}
