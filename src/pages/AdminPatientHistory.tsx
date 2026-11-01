import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchClient } from "@/lib/api";
import { money, type TreatmentPlanItemDraft } from "@/lib/treatmentPlans";
import { ArrowLeft, CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AppointmentHistoryItem {
  id: number;
  date: string;
  scheduledAt?: string | null;
  procedure: string;
  professional?: string;
  status: string;
  price?: number | null;
  paymentStatus?: string | null;
  appointmentType?: string;
}
interface PlanHistoryItem {
  id: number;
  createdAt: string;
  validUntil: string;
  status: string;
  items: TreatmentPlanItemDraft[];
  payments: Array<{ id: number; amount: number; method: string; receivedAt: string }>;
  totals: { quoted: number; authorized: number; received: number; balance: number };
}
interface PatientHistory {
  patient: { id: number; name: string; birthDate?: string | null; sex?: string | null };
  nextAppointment: AppointmentHistoryItem | null;
  appointments: AppointmentHistoryItem[];
  plans: PlanHistoryItem[];
  financialSummary: { received: number; legacyPending: number; planBalance: number; totalReceivable: number; pendingTransactions: Array<{ id: number; amount: number; category?: string | null; description?: string | null; date: string }> };
}

const appointmentLabels: Record<string, string> = { scheduled: "Agendada", attended: "Concluída", cancelled: "Cancelada" };
const paymentLabels: Record<string, string> = { received: "Recebido", paid: "Recebido", pending: "Pendente", courtesy: "Cortesia", voided: "Estornado" };
const planLabels: Record<string, string> = { awaiting_authorization: "Aguardando autorização", partially_authorized: "Autorizado parcialmente", authorized: "Autorizado", expired: "Expirado", cancelled: "Cancelado" };
const clinicalLabels: Record<string, string> = { proposed: "Proposto", authorized: "Autorizado", in_progress: "Em andamento", completed: "Concluído" };
const appointmentStatus = (status: string) => appointmentLabels[status] || status;
const paymentStatus = (status?: string | null) => paymentLabels[status || ""] || "Sem cobrança";
const planStatus = (status: string) => planLabels[status] || status;

export default function AdminPatientHistory() {
  const { id } = useParams();
  const [history, setHistory] = useState<PatientHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const loadHistory = useCallback(async () => {
    if (!id || !/^\d+$/.test(id)) { setLoading(false); return; }
    setLoading(true);
    try {
      const response = await fetchClient(`/patients/${id}/history`);
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Não foi possível carregar o histórico do paciente.");
      setHistory(body);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao carregar o histórico."); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void loadHistory(); }, [loadHistory]);

  return <AdminLayout title={history?.patient.name || "Histórico do paciente"}>
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><Button asChild variant="outline" className="min-h-11"><Link to="/admin/pacientes"><ArrowLeft size={16} className="mr-2" />Pacientes</Link></Button>{history ? <Button asChild className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"><Link to={`/admin/consultas/new?patientId=${history.patient.id}`}><CalendarPlus size={16} className="mr-2" />Nova consulta</Link></Button> : null}</div>
      {loading ? <Card><CardContent className="flex min-h-64 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="animate-spin motion-reduce:animate-none" size={18} />Carregando histórico…</CardContent></Card> : history ? <>
        <Card><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="text-xs font-bold uppercase tracking-widest text-foreground">Paciente</p><h2 className="mt-1 text-2xl font-black text-foreground">{history.patient.name}</h2><p className="mt-1 text-sm text-muted-foreground">{history.patient.birthDate ? `Nascimento ${new Date(`${history.patient.birthDate.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")}` : "Nascimento não informado"}{history.patient.sex ? ` · ${history.patient.sex === "female" ? "Feminino" : "Masculino"}` : ""}</p></div><div className="grid w-full min-w-0 sm:w-auto grid-cols-2 gap-3 text-center"><div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs text-muted-foreground">Já recebido</p><p className="mt-1 text-lg font-black text-emerald-800">{money(history.financialSummary.received)}</p></div><div className="rounded-xl bg-amber-50 p-3"><p className="text-xs text-muted-foreground">A receber</p><p className="mt-1 text-lg font-black text-amber-800">{money(history.financialSummary.totalReceivable)}</p></div></div></CardContent></Card>
        {history.nextAppointment ? <Card className="border-primary/30 bg-primary/5"><CardHeader><CardTitle className="text-base text-foreground">Próximo horário</CardTitle></CardHeader><CardContent className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{new Date(history.nextAppointment.scheduledAt!).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" })}</p><p className="text-sm text-slate-600">{history.nextAppointment.procedure} · {appointmentStatus(history.nextAppointment.status)}</p></div><Button asChild variant="outline" className="min-h-11"><Link to={`/admin/consultas/${history.nextAppointment.id}`}>Abrir consulta</Link></Button></CardContent></Card> : null}
        <div className="grid gap-5 lg:grid-cols-2">
          {history.financialSummary.pendingTransactions.length > 0 ? <Card className="border-amber-200 bg-amber-50/30 lg:col-span-2"><CardHeader><CardTitle className="text-amber-900">Cobranças pendentes</CardTitle></CardHeader><CardContent className="divide-y">{history.financialSummary.pendingTransactions.map((entry) => <div key={entry.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><div><p className="font-medium">{entry.description || entry.category || "Atendimento"}</p><p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString("pt-BR")}</p></div><strong>{money(entry.amount)}</strong></div>)}</CardContent></Card> : null}
          <Card><CardHeader><CardTitle>Planos e tratamentos</CardTitle></CardHeader><CardContent className="space-y-3">{history.plans.length ? history.plans.map((plan) => <article key={plan.id} className="rounded-xl border p-4"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-semibold text-foreground">Orçamento #{plan.id}</p><p className="text-xs text-muted-foreground">{new Date(plan.createdAt).toLocaleDateString("pt-BR")} · {planStatus(plan.status)}</p></div><p className="font-bold">{money(plan.totals.quoted)}</p></div><div className="mt-3 space-y-2">{plan.items.map((item, index) => <div key={item.id || index} className="flex flex-wrap justify-between gap-2 border-t pt-2 text-sm"><span>{item.toothNumber ? `Dente ${item.toothNumber} · ` : ""}{item.name}<span className="ml-2 text-xs text-muted-foreground">{clinicalLabels[item.clinicalStatus || "proposed"] || "Proposto"}</span></span><span>{money(item.authorizedTotal ?? item.quotedTotal ?? item.unitPrice * item.quantity)}</span></div>)}</div>{plan.payments.length ? <div className="mt-3 space-y-1 border-t pt-3 text-xs text-muted-foreground">{plan.payments.map((payment) => <p key={payment.id} className="flex justify-between gap-2"><span>Recebido em {new Date(payment.receivedAt).toLocaleDateString("pt-BR")} · {payment.method}</span><strong>{money(payment.amount)}</strong></p>)}</div> : null}<div className="mt-3 flex flex-wrap justify-between gap-2 border-t pt-3 text-sm text-slate-600"><span>Recebido: {money(plan.totals.received)}</span><strong>Saldo: {money(plan.totals.balance)}</strong></div><Button asChild size="sm" variant="outline" className="mt-3 min-h-10"><Link to={`/admin/planos-tratamento?planId=${plan.id}`}>Abrir orçamento</Link></Button></article>) : <p className="py-8 text-center text-sm text-muted-foreground">Nenhum orçamento ou tratamento cadastrado.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle>Consultas e atendimentos</CardTitle></CardHeader><CardContent className="space-y-2">{history.appointments.length ? history.appointments.map((appointment) => <Link key={appointment.id} to={`/admin/consultas/${appointment.id}`} className="block rounded-xl border p-3 transition-colors hover:bg-muted/50"><div className="flex flex-wrap justify-between gap-2"><strong>{appointment.procedure || "Atendimento"}</strong><span className="text-sm">{appointment.price ? money(appointment.price) : "—"}</span></div><p className="mt-1 text-xs text-muted-foreground">{new Date(appointment.scheduledAt || appointment.date).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" })} · {appointmentStatus(appointment.status)} · {paymentStatus(appointment.paymentStatus)}</p>{appointment.professional ? <p className="mt-1 text-xs text-muted-foreground">{appointment.professional}</p> : null}</Link>) : <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma consulta registrada.</p>}</CardContent></Card>
        </div>
      </> : <Card><CardContent className="py-12 text-center text-muted-foreground">Paciente não encontrado.</CardContent></Card>}
    </div>
  </AdminLayout>;
}
