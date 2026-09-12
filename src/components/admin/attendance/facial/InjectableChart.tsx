import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, ChevronDown, Circle, Hand, Maximize, Minimize, Minus, X } from "lucide-react";
import SessionSummaryBar from "./SessionSummaryBar";
import { normalizeFacialNotes, summarizeFacialNotes, type FacialApplication, type FacialNotesDocument, type FacialProcedureType } from "./facialModel";
import "./injectable-chart.css";
import StockProductPicker from "./StockProductPicker";
import { doseInStockUnit, type StockProduct } from "@/lib/stock";

type Props = { value: unknown; onChange: (value: FacialNotesDocument) => void; onSave?: () => void; onViewSummary?: () => void; readOnly?: boolean; sex?: "female" | "male" | null };
type Position = { x: number; y: number };
const procedures: { value: FacialProcedureType; label: string; color: string; unit: "U" | "ml" | "fio"; arrow?: boolean }[] = [
  { value: "botulinum-toxin", label: "Toxina Botulínica", color: "#22a86b", unit: "U" },
  { value: "filler", label: "Preenchimento", color: "#8b45e5", unit: "ml", arrow: true },
  { value: "biostimulator", label: "Bioestimulador", color: "#2783de", unit: "ml" },
  { value: "bioremodeler", label: "Biorremodelador", color: "#ce951e", unit: "ml" },
  { value: "skinbooster", label: "Skinbooster", color: "#e74671", unit: "ml" },
  { value: "thread", label: "Fio de PDO", color: "#159b95", unit: "fio", arrow: true },
  { value: "other", label: "Injetável", color: "#d29b16", unit: "ml" },
];
const format = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 6 });
const regionAt = ({ x, y }: Position) => {
  const side = x < .5 ? "left" : "right";
  if (y < .33) return "frontal";
  if (y < .40 && x > .42 && x < .58) return "glabella";
  if (y < .47) return `periorbital-${side}`;
  if (y > .84) return "neck";
  if (y > .72 && x > .34 && x < .66) return "chin";
  if (y > .60 && y < .73 && x > .34 && x < .66) return "lips";
  if (y > .68) return `jawline-${side}`;
  if (x > .35 && x < .65) return `nasolabial-${side}`;
  return `malar-${side}`;
};

export default function InjectableChart({ value, onChange, onSave, onViewSummary, readOnly = false, sex }: Props) {
  const [document, setDocument] = useState(() => normalizeFacialNotes(value));
  const incoming = useRef(JSON.stringify(normalizeFacialNotes(value)));
  const [procedure, setProcedure] = useState(procedures[0]);
  const [mode, setMode] = useState<"point" | "arrow" | "select">("point");
  const [start, setStart] = useState<Position | null>(null);
  const [preview, setPreview] = useState<Position | null>(null);
  const [editing, setEditing] = useState<FacialApplication | null>(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [labels, setLabels] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<StockProduct | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const pointer = useRef<Position | null>(null);
  const map = useRef<SVGSVGElement>(null);
  const editor = useRef<HTMLDivElement>(null);
  const keyboardPosition = useRef<Position>({ x: .5, y: .3 });
  const helpId = React.useId();

  useEffect(() => {
    const next = normalizeFacialNotes(value);
    const key = JSON.stringify(next);
    if (key !== incoming.current) { incoming.current = key; setDocument(next); setEditing(null); setStart(null); }
  }, [value]);
  useEffect(() => { if (editing) editor.current?.querySelector("input")?.focus(); }, [editing]);
  const commit = (next: FacialNotesDocument) => { incoming.current = JSON.stringify(next); setDocument(next); onChange(next); };
  const open = (application: FacialApplication) => { setEditing(application); setSelectedProduct(null); setShowProductPicker(!application.productId); setAmount(application.amount === undefined ? "" : format(application.amount)); setError(""); setStart(null); setPreview(null); };
  const create = (position: Position, endCoordinates?: Position) => {
    if (readOnly) return;
    open({ id: crypto.randomUUID(), regionId: regionAt(position), procedureType: procedure.value, unit: procedure.unit, coordinates: position,
      device: endCoordinates ? (procedure.value === "thread" ? "Fio" : "Cânula") : "Agulha",
      ...(endCoordinates ? { endCoordinates } : {}) });
  };
  const positionAt = (event: React.PointerEvent<SVGSVGElement>): Position => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)), y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)) };
  };
  const place = (position: Position) => {
    if (mode === "select" || readOnly || editing) return;
    if (mode === "point") create(position);
    else if (start) { if (Math.hypot(start.x - position.x, start.y - position.y) > .01) create(start, position); }
    else { setStart(position); setPreview(position); }
  };
  const save = () => {
    if (!editing || readOnly) return;
    const parsed = Number(amount.trim().replace(",", "."));
    if (!amount.trim() || !Number.isFinite(parsed) || parsed <= 0) { setError("Informe uma quantidade maior que zero."); return; }
    if (editing.unit === "fio" && !Number.isInteger(parsed)) { setError("Informe uma quantidade inteira de fios."); return; }
    const application = { ...editing, amount: parsed };
    commit({ ...document, applications: document.applications.some(item => item.id === editing.id) ? document.applications.map(item => item.id === editing.id ? application : item) : [...document.applications, application] });
    setEditing(null); map.current?.focus();
  };
  const remove = () => { if (!editing || readOnly) return; commit({ ...document, applications: document.applications.filter(item => item.id !== editing.id) }); setEditing(null); map.current?.focus(); };
  const cancel = () => { setEditing(null); setStart(null); setPreview(null); pointer.current = null; map.current?.focus(); };
  const applications = editing && !document.applications.some(item => item.id === editing.id) ? [...document.applications, editing] : document.applications;

  return <section className={`injectable-workspace${expanded ? " injectable-workspace--expanded" : ""}`} data-facial-workspace
    onKeyDown={event => { if (event.key === "Escape" && (editing || start || expanded)) { event.stopPropagation(); if (editing || start) cancel(); else setExpanded(false); } }}>
    <header className="injectable-heading"><div><p>REGISTRO CLÍNICO</p><h2>Harmonização facial</h2></div><span>{readOnly ? "Somente leitura" : "Mapa de aplicações"}</span></header>
    <div className="injectable-layout">
      <aside className="injectable-sidebar" aria-label="Procedimentos injetáveis">
        <h3>Injetáveis</h3>
        <div className="injectable-procedures">{procedures.map(item => {
          const matching = document.applications.filter(a => a.procedureType === item.value);
          const totals = (["U", "ml", "fio"] as const).map(unit => ({ unit, amount: matching.filter(a => a.unit === unit).reduce((sum, a) => sum + (a.amount ?? 0), 0) })).filter(total => total.amount > 0);
          return <button type="button" key={item.value} aria-pressed={procedure.value === item.value} className="injectable-procedure" onClick={() => { cancel(); setProcedure(item); setMode(item.arrow ? "arrow" : "point"); }}>
            <span className={`injectable-swatch${item.arrow ? " injectable-swatch--arrow" : ""}`} style={{ background: item.color }} />
            <span>{item.label}</span><small>{totals.length ? totals.map(total => `${format(total.amount)} ${total.unit}`).join(" / ") : `0 ${item.unit}`}</small>
          </button>;
        })}</div>
        {!readOnly && <div className="injectable-tools" aria-label="Técnica de aplicação">
          <button type="button" aria-pressed={mode === "point"} onClick={() => { cancel(); setMode("point"); }}><Circle size={17} />Agulha · ponto</button>
          <button type="button" aria-pressed={mode === "arrow"} onClick={() => { cancel(); setMode("arrow"); }}><ArrowUpRight size={18} />{procedure.value === "thread" ? "Fio" : "Cânula"} · seta</button>
        </div>}
        <p className="injectable-instruction">{readOnly ? "Selecione uma marcação para consultar o registro." : mode === "select" ? "Selecione uma marcação para editar." : mode === "arrow" ? "Arraste do ponto de entrada até o fim do trajeto. Também é possível tocar no início e no fim." : "Toque no local da aplicação direta com agulha."}</p>
        <label className="injectable-label-toggle"><input type="checkbox" checked={labels} onChange={e => setLabels(e.target.checked)} />Mostrar quantidades</label>
        <details className="injectable-history"><summary>Registros ({document.applications.length})</summary>
          {document.applications.map(a => <button key={a.id} type="button" onClick={() => open(a)}>{a.productName || procedures.find(p => p.value === a.procedureType)?.label} · {format(a.amount ?? 0)} {a.unit}{!a.coordinates && " · sem posição"}</button>)}
          {Object.entries(document.legacyRegions ?? {}).map(([region, data]) => <p key={region}><strong>{region}</strong>: {[data.product, data.dose, data.notes].filter(Boolean).join(" · ")}</p>)}
        </details>
      </aside>
      <div className="injectable-stage">
        <div className="injectable-stage-tools">
          <button type="button" aria-label={expanded ? "Reduzir mapa" : "Ampliar mapa"} onClick={() => setExpanded(!expanded)}>{expanded ? <Minimize size={20} /> : <Maximize size={20} />}</button>
          {!readOnly && <button type="button" aria-label="Selecionar marcações" aria-pressed={mode === "select"} onClick={() => { cancel(); setMode(mode === "select" ? (procedure.arrow ? "arrow" : "point") : "select"); }}><Hand size={21} /></button>}
        </div>
        <div className="injectable-face">
          <svg ref={map} viewBox="0 0 750 1000" role="group" aria-label="Mapa facial de aplicações" aria-describedby={helpId} tabIndex={readOnly ? -1 : 0} className={`injectable-svg injectable-svg--${mode}`}
            onPointerDown={e => { if (readOnly || editing || mode === "select" || e.button !== 0) return; pointer.current = positionAt(e); e.currentTarget.setPointerCapture?.(e.pointerId); }}
            onPointerMove={e => { if (mode === "arrow" && (start || pointer.current)) setPreview(positionAt(e)); }}
            onPointerCancel={() => { pointer.current = null; setPreview(null); }}
            onPointerUp={e => { if (!pointer.current) return; const origin = pointer.current; pointer.current = null; const end = positionAt(e); if (mode === "arrow" && Math.hypot(origin.x - end.x, origin.y - end.y) > .015) create(start ?? origin, end); else place(end); }}
            onKeyDown={e => { if (e.target !== e.currentTarget || readOnly) return; if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) { e.preventDefault(); const p = keyboardPosition.current; keyboardPosition.current = { x: Math.max(0, Math.min(1, p.x + (e.key === "ArrowLeft" ? -.01 : e.key === "ArrowRight" ? .01 : 0))), y: Math.max(0, Math.min(1, p.y + (e.key === "ArrowUp" ? -.01 : e.key === "ArrowDown" ? .01 : 0))) }; setPreview(keyboardPosition.current); } if (e.key === "Enter" || e.key === " ") { e.preventDefault(); place(keyboardPosition.current); } }}>
            <image href={sex === "male" ? "/facial-chart-front-male.png" : "/facial-chart-front.png"} width="750" height="1000" preserveAspectRatio="none" />
            {applications.filter(a => a.coordinates).map(a => {
              const x = a.coordinates!.x * 750, y = a.coordinates!.y * 1000;
              const color = procedures.find(p => p.value === a.procedureType)?.color ?? "#8b45e5";
              const end = a.endCoordinates;
              const markerLabel = `${format(a.amount ?? 0)} ${a.unit ?? ""}`;
              const labelWidth = Math.max(66, markerLabel.length * 8 + 12);
              const angle = end ? Math.atan2((end.y - a.coordinates!.y) * 1000, (end.x - a.coordinates!.x) * 750) * 180 / Math.PI : 0;
              return <g key={a.id} role="button" tabIndex={0} aria-label={`${readOnly ? "Consultar" : "Editar"} aplicação ${procedures.find(p => p.value === a.procedureType)?.label}, ${format(a.amount ?? 0)} ${a.unit ?? ""}`} className="injectable-mark"
                onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); open(a); }} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); open(a); } }}>
                {end && <><line x1={x} y1={y} x2={end.x * 750} y2={end.y * 1000} stroke="transparent" strokeWidth="30" /><line x1={x} y1={y} x2={end.x * 750} y2={end.y * 1000} stroke={color} strokeWidth="4" /><path d="M-15 -8 L0 0 L-15 8 Z" fill={color} transform={`translate(${end.x * 750} ${end.y * 1000}) rotate(${angle})`} /></>}
                <circle cx={x} cy={y} r="23" fill="transparent" className="injectable-hit" />
                <circle cx={x} cy={y} r={editing?.id === a.id ? 9 : 7} fill={color} stroke="white" strokeWidth="2" />
                {labels && a.amount !== undefined && <g transform={`translate(${Math.max(labelWidth / 2, Math.min(750 - labelWidth / 2, x))} ${y < 50 ? y + 38 : y - 26})`}><rect x={-labelWidth / 2} y="-15" width={labelWidth} height="29" rx="5" fill="#292332" /><text textAnchor="middle" dy="5" fill="white" fontSize="15" fontWeight="600">{markerLabel}</text></g>}
              </g>;
            })}
            {(start || pointer.current) && preview && mode === "arrow" && <line x1={(start ?? pointer.current)!.x * 750} y1={(start ?? pointer.current)!.y * 1000} x2={preview.x * 750} y2={preview.y * 1000} stroke={procedure.color} strokeWidth="4" strokeDasharray="7 5" pointerEvents="none" />}
            {preview && !pointer.current && !start && !editing && <circle cx={preview.x * 750} cy={preview.y * 1000} r="10" stroke={procedure.color} fill="none" strokeWidth="2" pointerEvents="none" />}
          </svg>
          {editing && <div ref={editor} role="dialog" aria-label="Quantidade da aplicação" className="injectable-popover" style={{ left: `${Math.max(26, Math.min(74, (editing.coordinates?.x ?? .5) * 100))}%`, top: `${Math.max(20, Math.min(85, (editing.coordinates?.y ?? .5) * 100))}%` }}>
            {!readOnly && <button type="button" className="facial-product-trigger" aria-expanded={showProductPicker} onClick={() => setShowProductPicker(!showProductPicker)}><span>{editing.productName ? `${editing.productName} · Trocar produto` : showProductPicker ? "Produto do estoque" : "Selecionar produto do estoque"}</span><ChevronDown size={16} aria-hidden="true" /></button>}
            {!readOnly && showProductPicker && <StockProductPicker procedureType={editing.procedureType} selectedId={editing.productId} onSelect={product => { setSelectedProduct(product); setEditing({ ...editing, productId: product.id, productName: product.name, unit: product.stockUnit === "unit" ? "fio" : editing.unit === "U" ? "U" : "ml" }); setShowProductPicker(false); }} />}
            <form onSubmit={e => { e.preventDefault(); save(); }}>
              <label><span>{editing.device || "Aplicação"} · {editing.unit ?? "ml"}</span><input aria-label="Quantidade" inputMode="decimal" value={amount} readOnly={readOnly} placeholder="0" onChange={e => { setAmount(e.target.value); setError(""); }} aria-invalid={!!error} /></label>
              {!readOnly && <><button type="submit" className="injectable-confirm" aria-label="Confirmar quantidade"><Check size={21} /></button><button type="button" className="injectable-remove" aria-label="Excluir aplicação" onClick={remove}><Minus size={21} /></button></>}
              <button type="button" className="injectable-close" aria-label="Fechar edição" onClick={cancel}><X size={16} /></button>
            </form>
            {error && <p role="alert">{error}</p>}
            {!readOnly && !editing.productId && <p>Sem produto vinculado: esta marcação não movimenta o estoque.</p>}
            {selectedProduct && <p>Consumo: {format(doseInStockUnit(Number(amount.replace(",", ".")) || 0, editing.unit ?? "ml", selectedProduct) ?? 0)} {selectedProduct.stockUnit === "unit" ? "un." : "ml"}. Baixa ao salvar o atendimento.</p>}
            {(editing.productName || editing.notes) && <p>{[editing.productName, editing.notes].filter(Boolean).join(" · ")}</p>}
          </div>}
        </div>
        <span className="injectable-view-label">Face frontal</span>
      </div>
    </div>
    <p id={helpId} className="sr-only">No mapa, use as setas do teclado para posicionar e Enter para marcar. Para desenhar uma seta, confirme o início e o fim. Escape cancela a edição.</p>
    <SessionSummaryBar summary={summarizeFacialNotes(document)} readOnly={readOnly} onViewSummary={onViewSummary} onSave={editing ? undefined : onSave} />
  </section>;
}
