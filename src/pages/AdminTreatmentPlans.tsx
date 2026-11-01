import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchClient } from "@/lib/api";
import { conditionTargetsLabel, money, TREATMENT_PHASES, type TreatmentPlanItemDraft } from "@/lib/treatmentPlans";
import { TreatmentPlanPrint, type PrintableTreatmentPlan as TreatmentPlan } from "@/components/admin/TreatmentPlanPrint";
import type { ClinicPrintDetails } from "@/components/admin/ClinicPrintHeader";
import { printWhenReady } from "@/lib/print-layout";
import { readStoredProfessionalIdentity } from "@/lib/professional-signature";
import { Loader2, Printer, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";

interface AuthorizationChoice { authorized: boolean; amount: string }

const statusLabels: Record<string, string> = {
  awaiting_authorization: "Aguardando autorização",
  partially_authorized: "Autorizado parcialmente",
  authorized: "Autorizado",
  expired: "Expirado",
  cancelled: "Cancelado",
};
const clinicalStatusLabels: Record<string, string> = { proposed: "Proposto", authorized: "Autorizado", in_progress: "Em andamento", completed: "Concluído" };
const paymentMethods = [{ value: "pix", label: "Pix" }, { value: "cash", label: "Dinheiro" }, { value: "credit", label: "Cartão de crédito" }, { value: "debit", label: "Cartão de débito" }, { value: "transfer", label: "Transferência" }, { value: "other", label: "Outro" }];

export default function AdminTreatmentPlans() {
  const professional = readStoredProfessionalIdentity();
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const requestedPlanId = Number(new URLSearchParams(window.location.search).get("planId"));
  const [selectedId, setSelectedId] = useState<number | null>(() => Number.isSafeInteger(requestedPlanId) && requestedPlanId > 0 ? requestedPlanId : null);
  const [choices, setChoices] = useState<Record<number, AuthorizationChoice>>({});
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const paymentAttempts = useRef(new Map<string, string>());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [includeOdontogram, setIncludeOdontogram] = useState(true);
  const [printSnapshot, setPrintSnapshot] = useState<{ plan: TreatmentPlan; clinic: ClinicPrintDetails; includeOdontogram: boolean } | null>(null);

  const preparePrint = async () => {
    if (!selectedId || printing || saving) return;
    setPrinting(true);
    try {
      const [planResponse, clinicResponse] = await Promise.all([
        fetchClient(`/treatment-plans/${selectedId}`),
        fetchClient('/digital-signatures/clinic'),
      ]);
      if (!planResponse.ok || !clinicResponse.ok) throw new Error('Não foi possível atualizar os dados para impressão. Tente novamente.');
      const [plan, clinic] = await Promise.all([planResponse.json(), clinicResponse.json()]);
      setPrintSnapshot({ plan, clinic, includeOdontogram });
    } catch (error) {
      setPrinting(false);
      toast.error(error instanceof Error ? error.message : 'Falha ao preparar impressão.');
    }
  };

  useEffect(() => {
    if (!printSnapshot) return;
    const controller = new AbortController();
    const clearPrint = () => { setPrintSnapshot(null); setPrinting(false); };
    window.addEventListener('afterprint', clearPrint);
    const frame = window.requestAnimationFrame(() => {
      void (async () => {
        try {
          await document.fonts?.ready;
          const printed = await printWhenReady(document, '[data-print-target="treatment-plan"]', () => window.print(), controller.signal);
          if (!printed && !controller.signal.aborted) clearPrint();
        } catch {
          if (!controller.signal.aborted) { clearPrint(); toast.error('Não foi possível abrir a impressão. Tente novamente.'); }
        }
      })();
    });
    return () => {
      controller.abort();
      window.cancelAnimationFrame(frame);
      window.removeEventListener('afterprint', clearPrint);
    };
  }, [printSnapshot]);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchClient("/treatment-plans");
      if (!response.ok) throw new Error("Não foi possível carregar os planos de tratamento.");
      const result: TreatmentPlan[] = await response.json();
      setPlans((current) => result.map((plan) => {
        const previous = current.find((item) => item.id === plan.id);
        const odontogram = previous?.sourceAppointment?.dentalNotes;
        return odontogram && plan.sourceAppointment
          ? { ...plan, sourceAppointment: { ...plan.sourceAppointment, dentalNotes: odontogram } }
          : plan;
      }));
      setSelectedId((current) => current && result.some((plan) => plan.id === current)
        ? current
        : result.find((plan) => plan.id === requestedPlanId)?.id ?? result[0]?.id ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar planos.");
    } finally { setLoading(false); }
  }, [requestedPlanId]);

  useEffect(() => { void loadPlans(); }, [loadPlans]);

  const selected = plans.find((plan) => plan.id === selectedId) || null;
  const authorizationWindowOpen = Boolean(selected
    && ["awaiting_authorization", "partially_authorized"].includes(selected.status)
    && new Date(selected.validUntil).getTime() >= Date.now());
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    void fetchClient(`/treatment-plans/${selectedId}`).then(async (response) => {
      if (!response.ok) return;
      const detail: TreatmentPlan = await response.json();
      if (active) setPlans((current) => current.map((plan) => plan.id === detail.id ? detail : plan));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [selectedId]);
  useEffect(() => {
    if (!selected) return;
    setChoices(Object.fromEntries(selected.items.map((item) => [item.id!, {
      authorized: item.authorizedTotal !== null && item.authorizedTotal !== undefined,
      amount: String(item.authorizedTotal ?? item.quotedTotal ?? (item.unitPrice * item.quantity)),
    }])));
    setPaymentAmount(selected.totals.balance > 0 ? selected.totals.balance.toFixed(2) : "");
  }, [selected]);

  const groupedItems = useMemo(() => {
    if (!selected) return [];
    return TREATMENT_PHASES.map((phase) => ({ phase, items: selected.items.filter((item) => item.phase === phase.value) })).filter((group) => group.items.length > 0);
  }, [selected]);

  const updatePlanState = (updated: TreatmentPlan) => {
    setPlans((current) => current.map((plan) => plan.id === updated.id ? updated : plan));
  };

  const authorizeSelected = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await fetchClient(`/treatment-plans/${selected.id}/authorization`, {
        method: "POST",
        body: JSON.stringify({ items: selected.items.map((item) => {
          const choice = choices[item.id!] || { authorized: false, amount: "" };
          return { itemId: item.id!, authorized: choice.authorized, ...(choice.authorized && Number(choice.amount) !== Number(item.quotedTotal) ? { authorizedTotal: Number(choice.amount) } : {}) };
        }) }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Não foi possível autorizar os procedimentos.");
      updatePlanState(result);
      toast.success("Autorização atualizada.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao autorizar."); }
    finally { setSaving(false); }
  };

  const receivePayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !paymentAmount || Number(paymentAmount) <= 0) return toast.error("Informe um valor recebido válido.");
    setSaving(true);
    try {
      const attempt = JSON.stringify([selected.id, Number(paymentAmount), paymentMethod]);
      const idempotencyKey = paymentAttempts.current.get(attempt) || crypto.randomUUID();
      paymentAttempts.current.set(attempt, idempotencyKey);
      const response = await fetchClient(`/treatment-plans/${selected.id}/payments`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(paymentAmount), method: paymentMethod, receivedAt: new Date().toISOString(), idempotencyKey }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Não foi possível registrar o recebimento.");
      paymentAttempts.current.delete(attempt);
      toast.success("Recebimento registrado e lançado no fluxo de caixa.");
      await loadPlans();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao registrar o pagamento."); }
    finally { setSaving(false); }
  };

  const updateClinicalStatus = async (itemId: number, status: string) => {
    setSaving(true);
    try {
    const response = await fetchClient(`/treatment-plan-items/${itemId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    const result = await response.json().catch(() => null);
    if (!response.ok) return toast.error(result?.error || "Não foi possível atualizar a execução.");
    toast.success("Execução clínica atualizada.");
    await loadPlans();
    } catch {
      toast.error("Não foi possível atualizar a execução. Tente novamente.");
    } finally { setSaving(false); }
  };

  return <AdminLayout title="Planos de tratamento">
    <div className="space-y-5 tabular-nums">
      <div className="no-plan-print flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-muted-foreground">Orçamentos válidos, autorizações, execução e recebimentos</p></div><Button variant="outline" className="min-h-11" onClick={() => void loadPlans()} disabled={loading}><RefreshCw size={16} className="mr-2" />Atualizar</Button></div>
      <div className="no-plan-print grid gap-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.6fr)]">
        <Card><CardHeader><CardTitle>Orçamentos</CardTitle></CardHeader><CardContent className="space-y-2">
          {loading ? <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="animate-spin motion-reduce:animate-none" size={16} />Carregando…</div> : plans.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nenhum plano de tratamento foi gerado.</p> : plans.map((plan) => <button type="button" key={plan.id} onClick={() => setSelectedId(plan.id)} className={`w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedId === plan.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"}`}>
            <span className="flex items-start justify-between gap-2"><span className="font-semibold text-foreground">{plan.patient.name}</span><span className="text-xs text-muted-foreground">#{plan.id}</span></span><span className="mt-1 block text-xs text-muted-foreground">{new Date(plan.createdAt).toLocaleDateString("pt-BR")} · {statusLabels[plan.status] || plan.status}</span><span className="mt-2 block text-sm font-bold">{money(plan.totals.quoted)}</span><span className="mt-1 block text-xs text-muted-foreground">Saldo: {money(plan.totals.balance)}</span>
          </button>)}
        </CardContent></Card>

        <div className="space-y-4">{selected ? <>
          <Card><CardHeader className="flex flex-col items-start justify-between gap-3 sm:flex-row"><div><CardTitle>{selected.patient.name}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Orçamento #{selected.id} · emitido em {new Date(selected.createdAt).toLocaleDateString("pt-BR")} · válido até {new Date(selected.validUntil).toLocaleDateString("pt-BR")}</p><p className="mt-1 text-sm font-medium text-foreground">{statusLabels[selected.status] || selected.status}</p></div><Button variant="outline" className="no-plan-print min-h-11 shrink-0" onClick={() => void preparePrint()} disabled={printing || saving || loading}><Printer size={16} className="mr-2" />{printing ? "Preparando…" : "Imprimir"}</Button></CardHeader>
            <CardContent className="space-y-4">
              <div className="no-print rounded-lg border bg-muted/30 p-3">
                <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={includeOdontogram} disabled={!selected.sourceAppointment || printing} onChange={event => setIncludeOdontogram(event.target.checked)} />Incluir odontograma na impressão</label>
                <p className="text-xs text-muted-foreground">{selected.sourceAppointment ? "Referência compacta antes dos procedimentos, com marcação dos dentes incluídos no orçamento." : "Este orçamento não possui uma consulta de origem com odontograma."}</p>
              </div>
              {groupedItems.map(({ phase, items: phaseItems }) => <section key={phase.value}><h3 className="mb-2 flex justify-between rounded bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800"><span>{phase.label}</span><span>{money(phaseItems.reduce((sum, item) => sum + (item.quotedTotal ?? item.unitPrice * item.quantity), 0))}</span></h3><div className="divide-y rounded-lg border">{phaseItems.map((item) => <div key={item.id} className="grid gap-2 p-3 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-medium text-foreground">{item.toothNumber ? `${item.toothNumber} · ` : ""}{item.name}</p><p className="text-xs text-muted-foreground">{conditionTargetsLabel(item.toothNumber, item.targets)}{item.quantity > 1 ? ` · ${item.quantity} ${item.pricingUnit === "face" ? "faces" : "unidades"}` : ""} · {clinicalStatusLabels[item.clinicalStatus || "proposed"] || "Proposto"}</p></div><div className="flex items-center justify-between gap-3 sm:justify-end"><span className="font-semibold">{money(item.authorizedTotal ?? item.quotedTotal ?? item.unitPrice * item.quantity)}</span>{item.authorizedTotal !== null && item.authorizedTotal !== undefined ? <Select value={item.clinicalStatus || "authorized"} onValueChange={(value) => void updateClinicalStatus(item.id!, value)}><SelectTrigger aria-label={`Execução de ${item.name}`} className="min-h-11 w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="authorized">Autorizado</SelectItem><SelectItem value="in_progress">Em andamento</SelectItem><SelectItem value="completed">Concluído</SelectItem></SelectContent></Select> : null}</div></div>)}</div></section>)}
              <div className="space-y-1 border-t pt-3 text-sm"><p className="flex justify-between"><span>Orçado</span><strong>{money(selected.totals.quoted)}</strong></p><p className="flex justify-between"><span>Desconto autorizado</span><span>− {money(selected.totals.discount)}</span></p><p className="flex justify-between"><span>Recebido</span><span>{money(selected.totals.received)}</span></p><p className="flex justify-between text-lg font-black"><span>Saldo autorizado</span><span>{money(selected.totals.balance)}</span></p></div>
              {selected.notes ? <p className="rounded-lg bg-muted/50 p-3 text-sm"><strong>Observação:</strong> {selected.notes}</p> : null}
              {selected.paymentTerms ? <p className="text-sm text-slate-600"><strong>Condição de pagamento:</strong> {selected.paymentTerms}</p> : null}
            </CardContent>
          </Card>

          {selected.status === "partially_authorized" && !authorizationWindowOpen ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">O prazo do orçamento terminou. Itens já autorizados continuam disponíveis para execução e recebimento; gere um novo orçamento para incluir outros procedimentos.</p> : null}
          {authorizationWindowOpen ? <Card className="no-plan-print"><CardHeader><CardTitle>Autorizar procedimentos</CardTitle><p className="text-sm text-muted-foreground">Marque todos ou apenas os procedimentos aprovados. Ajuste o valor para registrar desconto.</p></CardHeader><CardContent className="space-y-4">
            {selected.items.map((item) => { const choice = choices[item.id!] || { authorized: false, amount: String(item.quotedTotal || 0) }; const alreadyAuthorized = item.authorizedTotal !== null && item.authorizedTotal !== undefined; return <div key={item.id} className="grid gap-3 border-b pb-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5 accent-primary" checked={alreadyAuthorized || choice.authorized} disabled={alreadyAuthorized} onChange={(event) => setChoices((current) => ({ ...current, [item.id!]: { ...choice, authorized: event.target.checked } }))} /><span>{item.toothNumber ? `${item.toothNumber} · ` : ""}{item.name}</span></label><span className="text-sm text-muted-foreground">Orçado {money(item.quotedTotal)}</span><Input aria-label={`Valor autorizado de ${item.name}`} className="w-36" type="number" min="0" max={item.quotedTotal} step="0.01" value={alreadyAuthorized ? String(item.authorizedTotal) : choice.amount} disabled={alreadyAuthorized || !choice.authorized} onChange={(event) => setChoices((current) => ({ ...current, [item.id!]: { ...choice, amount: event.target.value } }))} /></div>; })}
            <Button className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90" disabled={saving || !selected.items.some((item) => choices[item.id!]?.authorized || item.authorizedTotal !== null)} onClick={() => void authorizeSelected()}>{saving ? <Loader2 className="mr-2 animate-spin motion-reduce:animate-none" size={16} /> : null}Autorizar selecionados</Button>
          </CardContent></Card> : null}

          {["authorized", "partially_authorized"].includes(selected.status) ? <Card className="no-plan-print"><CardHeader><CardTitle className="flex items-center gap-2"><Wallet size={18} />Registrar recebimento</CardTitle><p className="text-sm text-muted-foreground">O lançamento no fluxo de caixa é criado apenas depois que o recebimento for registrado.</p></CardHeader><CardContent>{selected.totals.balance > 0 ? <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={receivePayment}><div className="space-y-1"><Label htmlFor="plan-payment-amount">Valor recebido (saldo {money(selected.totals.balance)})</Label><Input id="plan-payment-amount" type="number" min="0.01" max={selected.totals.balance} step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} required /></div><div className="space-y-1"><Label htmlFor="plan-payment-method">Método</Label><Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger id="plan-payment-method"><SelectValue /></SelectTrigger><SelectContent>{paymentMethods.map((method) => <SelectItem value={method.value} key={method.value}>{method.label}</SelectItem>)}</SelectContent></Select></div><Button type="submit" className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90" disabled={saving}>{saving ? <Loader2 className="mr-2 animate-spin motion-reduce:animate-none" size={16} /> : null}Registrar</Button></form> : <p className="text-sm text-muted-foreground">Saldo quitado.</p>}{selected.payments.length ? <div className="mt-4 space-y-2 border-t pt-3"><h4 className="text-sm font-semibold">Recebimentos</h4>{selected.payments.map((payment) => <p key={payment.id} className="flex justify-between text-sm text-slate-600"><span>{new Date(payment.receivedAt).toLocaleDateString("pt-BR")} · {paymentMethods.find((method) => method.value === payment.method)?.label || payment.method}</span><strong>{money(payment.amount)}</strong></p>)}</div> : null}</CardContent></Card> : null}
        </> : !loading ? <Card><CardContent className="py-16 text-center text-muted-foreground">Selecione um orçamento para ver os procedimentos e recebimentos.</CardContent></Card> : null}</div>
      </div>

    </div>
    {printSnapshot ? <TreatmentPlanPrint plan={printSnapshot.plan} clinic={printSnapshot.clinic} professional={professional} includeOdontogram={printSnapshot.includeOdontogram} /> : null}
  </AdminLayout>;
}
