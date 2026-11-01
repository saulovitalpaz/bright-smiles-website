import { useCallback, useEffect, useState, type FormEvent } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchClient } from "@/lib/api";
import { money, type ClinicalProcedure, type PricingUnit } from "@/lib/treatmentPlans";
import { type ClinicalConditionType } from "@/components/admin/attendance/odontogram/odontogramModel";
import { Check, Loader2, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import ClinicalConditionsSettings from "@/components/admin/ClinicalConditionsSettings";
import type { ClinicalConditionGroup } from "@/lib/clinicalConditions";

const emptyForm = { name: "", category: "Dentística", pricingUnit: "procedure" as PricingUnit, price: "", conditionTypes: [] as ClinicalConditionType[], active: true };

export default function AdminClinicalProcedures() {
  const currentUser = JSON.parse(localStorage.getItem("admin_user") || "{}");
  const canManage = currentUser.role === "admin";
  const [procedures, setProcedures] = useState<ClinicalProcedure[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<ClinicalConditionGroup[]>([]);
  const loadConditions = useCallback(async () => {
    const response = await fetchClient('/clinical-conditions');
    if (!response.ok) throw new Error('Não foi possível carregar as condições.');
    setGroups(await response.json());
  }, []);
  useEffect(() => { void loadConditions().catch(error => toast.error(error.message)); }, [loadConditions]);
  const conditionOptions = groups.flatMap(group => group.conditions.filter(condition =>
    (group.active && condition.active) || form.conditionTypes.includes(condition.key)));

  const loadProcedures = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchClient("/clinical-procedures");
      if (!response.ok) throw new Error("Não foi possível carregar a tabela de procedimentos.");
      setProcedures(await response.json());
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao carregar a tabela."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadProcedures(); }, [loadProcedures]);

  const reset = () => { setForm(emptyForm); setEditingId(null); };
  const edit = (procedure: ClinicalProcedure) => {
    setEditingId(procedure.id);
    setForm({ name: procedure.name, category: procedure.category, pricingUnit: procedure.pricingUnit, price: String(procedure.price), conditionTypes: procedure.conditionTypes, active: procedure.active });
  };
  const toggleCondition = (condition: ClinicalConditionType) => setForm((current) => ({
    ...current,
    conditionTypes: current.conditionTypes.includes(condition) ? current.conditionTypes.filter((item) => item !== condition) : [...current.conditionTypes, condition],
  }));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.category.trim() || !form.price || Number(form.price) < 0) return toast.error("Informe nome, categoria e preço válido.");
    setSaving(true);
    try {
      const response = await fetchClient(editingId ? `/clinical-procedures/${editingId}` : "/clinical-procedures", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({ ...form, name: form.name.trim(), category: form.category.trim(), price: Number(form.price) }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Não foi possível salvar o procedimento.");
      toast.success(editingId ? "Procedimento atualizado." : "Procedimento cadastrado.");
      reset();
      await loadProcedures();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao salvar."); }
    finally { setSaving(false); }
  };

  const toggleActive = async (procedure: ClinicalProcedure) => {
    setSaving(true);
    try {
      const response = await fetchClient(`/clinical-procedures/${procedure.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: procedure.name, category: procedure.category, pricingUnit: procedure.pricingUnit, price: procedure.price, conditionTypes: procedure.conditionTypes, active: !procedure.active }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Não foi possível alterar a disponibilidade.");
      await loadProcedures();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao alterar procedimento."); }
    finally { setSaving(false); }
  };

  return <AdminLayout title="Minha tabela de procedimentos">
    <ClinicalConditionsSettings groups={groups} onChange={loadConditions} canManage={canManage} />
    <div className="mx-auto grid max-w-6xl gap-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
      <Card className="h-fit"><CardHeader><CardTitle>{editingId ? "Editar procedimento" : "Cadastrar procedimento"}</CardTitle><p className="text-sm text-muted-foreground">{canManage ? "Cadastre seus valores e associe condições para sugerir procedimentos no odontograma." : "Visualização da tabela de procedimentos e valores."}</p></CardHeader><CardContent>
        {canManage ?
        <form className="space-y-4" onSubmit={save}>
          <div className="space-y-1"><Label htmlFor="procedure-name">Nome</Label><Input id="procedure-name" maxLength={160} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required placeholder="Ex.: Restauração em resina — MOD" /></div>
          <div className="space-y-1"><Label htmlFor="procedure-category">Categoria</Label><Input id="procedure-category" maxLength={160} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} required placeholder="Dentística, Endodontia…" /></div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label>Unidade de cobrança</Label><Select value={form.pricingUnit} onValueChange={(value) => setForm((current) => ({ ...current, pricingUnit: value as PricingUnit }))}><SelectTrigger aria-label="Unidade de cobrança"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="procedure">Por procedimento</SelectItem><SelectItem value="tooth">Por dente</SelectItem><SelectItem value="face">Por face</SelectItem></SelectContent></Select></div><div className="space-y-1"><Label htmlFor="procedure-price">Preço (R$)</Label><Input id="procedure-price" min="0" step="0.01" type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} required /></div></div>
          <fieldset className="space-y-2"><legend className="text-sm font-medium">Condições relacionadas</legend><p className="text-xs text-muted-foreground">Estas associações controlam as sugestões exibidas ao selecionar a condição.</p><div className="grid max-h-64 grid-cols-1 gap-1 overflow-y-auto rounded-lg border p-2 sm:grid-cols-2">{conditionOptions.map((condition) => <label key={condition.key} className="flex min-h-10 items-center gap-2 rounded px-2 text-xs hover:bg-muted/50"><input className="h-4 w-4 accent-primary" type="checkbox" checked={form.conditionTypes.includes(condition.key)} onChange={() => toggleCondition(condition.key)} />{condition.name}</label>)}</div></fieldset>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />Disponível para novos planos</label>
          <div className="flex flex-wrap gap-2"><Button type="submit" className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90" disabled={saving}>{saving ? <Loader2 className="mr-2 animate-spin motion-reduce:animate-none" size={16} /> : <Plus className="mr-2" size={16} />}{editingId ? "Salvar alterações" : "Adicionar à tabela"}</Button>{editingId ? <Button type="button" variant="outline" className="min-h-11" onClick={reset}>Cancelar</Button> : null}</div>
        </form>
          : <p className="rounded-lg bg-muted/50 p-3 text-sm text-slate-600">Apenas administradores podem cadastrar ou editar procedimentos e preços.</p>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Procedimentos cadastrados</CardTitle></CardHeader><CardContent className="space-y-3">
        {loading ? <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="animate-spin motion-reduce:animate-none" size={16} />Carregando tabela…</p> : procedures.length === 0 ? <div className="rounded-lg border border-dashed p-8 text-center"><p className="font-semibold text-slate-700">Sua tabela ainda está vazia</p><p className="mt-1 text-sm text-muted-foreground">Cadastre seus procedimentos e preços para habilitar sugestões no plano de tratamento.</p></div> : procedures.map((procedure) => <article key={procedure.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${procedure.active ? "border-border" : "border-slate-100 bg-muted/50 text-slate-400"}`}>
          <div className="min-w-0"><p className="font-semibold text-foreground">{procedure.name}</p><p className="text-xs text-muted-foreground">{procedure.category} · {procedure.pricingUnit === "face" ? "por face" : procedure.pricingUnit === "tooth" ? "por dente" : "por procedimento"} · {procedure.conditionTypes.length ? procedure.conditionTypes.map((condition) => groups.flatMap(group => group.conditions).find(item => item.key === condition)?.name || condition.replace(/_/g, " ")).join(", ") : "sem associação clínica"}</p><p className="mt-1 text-sm font-bold text-foreground">{money(procedure.price)}</p></div>
          <div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs ${procedure.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{procedure.active ? "Ativo" : "Inativo"}</span>{canManage ? <><Button type="button" variant="outline" size="icon" className="h-11 w-11" onClick={() => edit(procedure)} aria-label={`Editar ${procedure.name}`}><Pencil size={15} /></Button><Button type="button" variant="outline" size="icon" className="h-11 w-11" disabled={saving} title={procedure.active ? "Desativar" : "Reativar"} aria-label={procedure.active ? `Desativar ${procedure.name}` : `Reativar ${procedure.name}`} onClick={() => void toggleActive(procedure)}><span aria-hidden="true">{procedure.active ? <X size={15} /> : <Check size={15} />}</span></Button></> : null}</div>
        </article>)}
      </CardContent></Card>
    </div>
  </AdminLayout>;
}
