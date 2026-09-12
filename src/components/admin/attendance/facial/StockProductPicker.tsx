import { useEffect, useState } from "react";
import { loadStockProducts, type StockProduct } from "@/lib/stock";
import type { FacialProcedureType } from "./facialModel";

export default function StockProductPicker({ procedureType, selectedId, onSelect }: { procedureType: FacialProcedureType; selectedId?: string; onSelect: (product: StockProduct) => void }) {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    loadStockProducts(procedureType, controller.signal).then(data => { if (!controller.signal.aborted) { setProducts(data); setStatus("ready"); } }).catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [procedureType, attempt]);
  const matches = products.filter(p => (p.active || p.id === selectedId) && p.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
  return <div className="facial-stock-picker">
    <label>Produto do estoque<input aria-label="Pesquisar produto do estoque" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar produto…" /></label>
    {status === "loading" && <p role="status">Carregando produtos…</p>}
    {status === "error" && <p role="alert">Estoque indisponível. <button type="button" onClick={() => setAttempt(n => n + 1)}>Tentar novamente</button></p>}
    {status === "ready" && !matches.length && <p>Nenhum produto encontrado nesta classe. Cadastre em Configurações → Estoque.</p>}
    <div className="facial-stock-results">{matches.map(p => <button type="button" key={p.id} aria-pressed={selectedId === p.id} onClick={() => onSelect(p)}>
      <strong>{p.name}</strong><span>{p.quantity.toLocaleString("pt-BR")} {p.stockUnit === "unit" ? "un." : "ml"}{p.concentration ? ` · ${p.concentration} UI/ml` : ""} · {p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/{p.stockUnit === "unit" ? "un." : "ml"}</span>
    </button>)}</div>
  </div>;
}
