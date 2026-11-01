import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Odontogram from "@/components/admin/attendance/Odontogram";
import type { ClinicalConditionType, ConditionTarget, OdontogramData } from "@/components/admin/attendance/odontogram/odontogramModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchClient } from "@/lib/api";
import { conditionTargetsLabel, money, phaseForCategory, TREATMENT_PHASES, type ClinicalProcedure, type TreatmentPhase, type TreatmentPlanItemDraft } from "@/lib/treatmentPlans";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";

interface TreatmentPlanResponse {
  id: number;
  patientId: number;
  sourceAppointmentId?: number | null;
  validUntil: string;
  status: string;
  notes?: string | null;
  paymentTerms?: string | null;
  items: TreatmentPlanItemDraft[];
  totals: { quoted: number; authorized: number; received: number; balance: number };
}

interface TreatmentPlanAttendanceSectionProps {
  data: OdontogramData;
  onChange: (data: OdontogramData) => void;
  appointmentId: string;
  patientId: number | null;
  patientName: string;
  birthDate?: string | null;
  readOnly?: boolean;
  onPrintOdontogram?: () => void;
}

const validId = (value: string): number | null => /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : null;

export default function TreatmentPlanAttendanceSection({ data, onChange, appointmentId, patientId, patientName, birthDate, readOnly = false, onPrintOdontogram }: TreatmentPlanAttendanceSectionProps) {
  const [procedures, setProcedures] = useState<ClinicalProcedure[]>([]);
  const [items, setItems] = useState<TreatmentPlanItemDraft[]>([]);
  const [savedPlan, setSavedPlan] = useState<TreatmentPlanResponse | null>(null);
  const [catalogId, setCatalogId] = useState("");
  const [procedureSearch, setProcedureSearch] = useState("");
  const [planNotes, setPlanNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(() => Boolean(validId(appointmentId) && patientId));
  const persistedAppointmentId = validId(appointmentId);
  const canEditSavedPlan = !savedPlan || (savedPlan.status === "awaiting_authorization" && new Date(savedPlan.validUntil).getTime() >= Date.now());

  useEffect(() => {
    if (readOnly) return;
    let active = true;
    void fetchClient("/clinical-procedures").then(async (response) => {
      if (!response.ok) return;
      const result: unknown = await response.json();
      if (active && Array.isArray(result)) setProcedures(result.filter((item): item is ClinicalProcedure => typeof item?.id === "number" && item.active === true));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [readOnly]);

  useEffect(() => {
    if (!persistedAppointmentId || !patientId) return;
    let active = true;
    setLoadingPlan(true);
    void fetchClient(`/treatment-plans?sourceAppointmentId=${persistedAppointmentId}`).then(async (response) => {
      if (!response.ok) return;
      const result: TreatmentPlanResponse[] = await response.json();
      if (!active || !Array.isArray(result) || result.length === 0) return;
      const plan = result[0];
      setSavedPlan(plan);
      setPlanNotes(plan.notes || "");
      setPaymentTerms(plan.paymentTerms || "");
      setItems(plan.items.map((item) => ({ ...item, targets: Array.isArray(item.targets) ? item.targets : [] })));
    }).catch(() => undefined).finally(() => { if (active) setLoadingPlan(false); });
    return () => { active = false; };
  }, [persistedAppointmentId, patientId]);

  const addProcedure = useCallback((procedure: ClinicalProcedure, toothNumber?: number, conditionType?: ClinicalConditionType, targets?: ConditionTarget[]) => {
    if (loadingPlan) return toast.info("Aguarde enquanto carregamos o orçamento deste atendimento.");
    const surfaceCount = new Set(targets?.filter((target) => target.kind === "surface").map((target) => target.face) || []).size;
    const quantity = procedure.pricingUnit === "face" ? Math.max(1, surfaceCount) : 1;
    const sameItem = items.some((item) => item.procedureId === procedure.id && item.toothNumber === toothNumber
      && item.conditionType === conditionType && JSON.stringify(item.targets || []) === JSON.stringify(targets || []));
    if (sameItem) return toast.info("Este procedimento já está no plano.");
    setItems((current) => [...current, {
      procedureId: procedure.id,
      name: procedure.name,
      category: procedure.category,
      pricingUnit: procedure.pricingUnit,
      conditionType: conditionType || null,
      phase: phaseForCategory(procedure.category),
      quantity,
      unitPrice: procedure.price,
      toothNumber: toothNumber || null,
      targets: targets || [],
    }]);
  }, [items, loadingPlan]);

  const addSelectedProcedure = () => {
    if (loadingPlan) return;
    const procedure = procedures.find((item) => String(item.id) === catalogId);
    if (!procedure) return toast.error("Selecione um procedimento da tabela.");
    addProcedure(procedure);
  };

  const addManualItem = () => setItems((current) => [...current, {
    name: "Novo procedimento",
    category: "Procedimento manual",
    pricingUnit: "procedure",
    phase: "other",
    quantity: 1,
    unitPrice: 0,
  }]);

  const updateItem = (index: number, patch: Partial<TreatmentPlanItemDraft>) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const removeItem = (index: number) => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  const total = useMemo(() => items.reduce((sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0), 0), [items]);
  const matchingProcedures = useMemo(() => procedures.filter((procedure) =>
    `${procedure.name} ${procedure.category}`.toLocaleLowerCase("pt-BR").includes(procedureSearch.trim().toLocaleLowerCase("pt-BR")),
  ), [procedures, procedureSearch]);

  const savePlan = async () => {
    if (!persistedAppointmentId) return toast.error("Salve o atendimento antes de gerar o orçamento.");
    if (!patientId) return toast.error("Vincule este atendimento a um paciente para gerar o orçamento.");
    if (!items.length || items.some((item) => !item.name.trim() || !item.category.trim() || item.unitPrice < 0 || item.quantity < 1)) return toast.error("Revise os procedimentos, quantidades e preços do plano.");
    setSaving(true);
    const payload = {
      patientId,
      sourceAppointmentId: persistedAppointmentId,
      notes: planNotes.trim() || null,
      paymentTerms: paymentTerms.trim() || null,
      items: items.map((item) => ({
        procedureId: item.procedureId || null,
        name: item.name.trim(),
        category: item.category.trim(),
        pricingUnit: item.pricingUnit,
        conditionType: item.conditionType || null,
        phase: item.phase,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        toothNumber: item.toothNumber || null,
        targets: item.targets || [],
        notes: item.notes || undefined,
      })),
    };
    try {
      const response = await fetchClient(savedPlan ? `/treatment-plans/${savedPlan.id}` : "/treatment-plans", {
        method: savedPlan ? "PUT" : "POST",
        body: JSON.stringify(savedPlan ? { notes: payload.notes, paymentTerms: payload.paymentTerms, items: payload.items } : payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Não foi possível salvar o orçamento.");
      setSavedPlan(body);
      setItems(body.items || []);
      toast.success("Orçamento salvo com validade de 30 dias.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o orçamento.");
    } finally {
      setSaving(false);
    }
  };

  const startNewPlan = () => {
    setSavedPlan(null);
    setItems([]);
    setPlanNotes("");
    setPaymentTerms("");
  };

  return <section className="space-y-4">
    <Odontogram data={data} onChange={onChange} readOnly={readOnly} birthDate={birthDate} onPrint={onPrintOdontogram}
      procedures={procedures} onAddProcedure={!readOnly && canEditSavedPlan ? addProcedure : undefined} />
    <div className="admin-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-foreground">Plano de tratamento</p>
          <h3 className="mt-1 text-lg font-bold text-foreground">Procedimentos e orçamento</h3>
          <p className="mt-1 text-sm text-muted-foreground">As condições do odontograma sugerem itens da tabela. Ajuste valores, fases e quantidades antes de salvar.</p>
        </div>
        {savedPlan ? <div className="text-right text-xs text-muted-foreground">Orçamento #{savedPlan.id}<br />Válido até {new Date(savedPlan.validUntil).toLocaleDateString("pt-BR")}</div> : null}
      </div>

      {loadingPlan ? <p className="mt-4 text-sm text-muted-foreground">Carregando orçamento deste atendimento…</p> : null}
      {!readOnly ? <>
        {!persistedAppointmentId ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Você pode montar o plano agora; salve o atendimento para gerar o orçamento.</p> : null}
        {!patientId ? <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Este atendimento ainda não está vinculado a um cadastro de paciente.</p> : null}
        {savedPlan && !canEditSavedPlan ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 p-3 text-sm text-slate-600"><span>Este orçamento já foi autorizado ou expirou e não pode mais ser editado.</span><Button type="button" variant="outline" onClick={startNewPlan}>Criar novo orçamento</Button></div> : null}
        {(!savedPlan || canEditSavedPlan) ? <>
          <div className="mt-4 space-y-2">
            <Input aria-label="Buscar procedimento na tabela" placeholder="Buscar procedimento na tabela…" value={procedureSearch} onChange={(event) => setProcedureSearch(event.target.value)} disabled={loadingPlan} />
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <Select value={catalogId} onValueChange={setCatalogId} disabled={loadingPlan}><SelectTrigger aria-label="Procedimento da tabela"><SelectValue placeholder="Adicionar procedimento da tabela" /></SelectTrigger><SelectContent>{matchingProcedures.map((procedure) => <SelectItem key={procedure.id} value={String(procedure.id)}>{procedure.name} · {money(procedure.price)}{procedure.conditionTypes.length ? ` · ${procedure.conditionTypes.length} condições` : ""}</SelectItem>)}</SelectContent></Select>
              <Button type="button" variant="outline" className="min-h-11" disabled={loadingPlan} onClick={addSelectedProcedure}><Plus size={16} className="mr-2" />Adicionar item</Button>
              <Button type="button" variant="outline" className="min-h-11" disabled={loadingPlan} onClick={addManualItem}>Manual</Button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {items.length === 0 ? <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum procedimento no plano. Selecione uma condição no odontograma ou adicione um item manual.</div> : items.map((item, index) => <article key={`${item.id || item.procedureId || "manual"}-${index}`} className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-12 sm:items-end">
              <div className="space-y-1 sm:col-span-4"><Label>Procedimento</Label><Input aria-label={`Procedimento ${index + 1}`} value={item.name} onChange={(event) => updateItem(index, { name: event.target.value })} disabled={readOnly || loadingPlan || !canEditSavedPlan} /></div>
              <div className="space-y-1 sm:col-span-2"><Label>Fase</Label><Select value={item.phase} onValueChange={(value) => updateItem(index, { phase: value as TreatmentPhase })} disabled={readOnly || loadingPlan || !canEditSavedPlan}><SelectTrigger aria-label={`Fase do procedimento ${index + 1}`}><SelectValue /></SelectTrigger><SelectContent>{TREATMENT_PHASES.map((phase) => <SelectItem key={phase.value} value={phase.value}>{phase.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1 sm:col-span-2"><Label>Quantidade</Label><Input aria-label={`Quantidade do procedimento ${index + 1}`} type="number" min="1" max="999" value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} disabled={readOnly || loadingPlan || !canEditSavedPlan} /></div>
              <div className="space-y-1 sm:col-span-2"><Label>Valor unitário</Label><Input aria-label={`Valor unitário do procedimento ${index + 1}`} type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) })} disabled={readOnly || loadingPlan || !canEditSavedPlan} /></div>
              <div className="sm:col-span-2 sm:text-right"><p className="text-xs text-muted-foreground">{conditionTargetsLabel(item.toothNumber, item.targets)}</p><p className="font-bold text-foreground">{money(item.unitPrice * item.quantity)}</p>{!readOnly && canEditSavedPlan ? <Button type="button" variant="ghost" size="icon" disabled={loadingPlan} aria-label={`Remover ${item.name}`} onClick={() => removeItem(index)}><Trash2 size={16} /></Button> : null}</div>
            </article>)}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="space-y-1"><Label htmlFor="treatment-plan-notes">Observação do orçamento</Label><Input id="treatment-plan-notes" maxLength={1000} value={planNotes} onChange={(event) => setPlanNotes(event.target.value)} disabled={readOnly || loadingPlan || !canEditSavedPlan} placeholder="Observação clínica que aparecerá no orçamento" /></div>
            <div className="space-y-1"><Label htmlFor="treatment-plan-terms">Condição de pagamento</Label><Input id="treatment-plan-terms" maxLength={1000} value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} disabled={readOnly || loadingPlan || !canEditSavedPlan} placeholder="Ex.: entrada e parcelas sem juros" /></div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div><p className="text-sm text-muted-foreground">Total do plano</p><p className="text-2xl font-black text-foreground">{money(total)}</p></div>
            <Button type="button" className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90" onClick={savePlan} disabled={saving || loadingPlan || readOnly || items.length === 0}><Save size={16} className="mr-2" />{saving ? <Loader2 className="mr-2 animate-spin motion-reduce:animate-none" size={16} /> : null}{savedPlan ? "Atualizar orçamento" : "Salvar e gerar orçamento"}</Button>
          </div>
        </> : null}
      </> : savedPlan ? <div className="mt-4 space-y-2 text-sm text-slate-700"><p>{savedPlan.items.length} procedimentos · orçamento {money(savedPlan.totals.quoted)} · recebido {money(savedPlan.totals.received)} · saldo {money(savedPlan.totals.balance)}</p><p>Paciente: {patientName}</p></div> : <p className="mt-4 text-sm text-muted-foreground">Nenhum orçamento registrado para este atendimento.</p>}
    </div>
  </section>;
}
