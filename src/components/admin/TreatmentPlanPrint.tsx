import { ClinicPrintHeader, type ClinicPrintDetails } from './ClinicPrintHeader';
import { ProfessionalSignature } from './ProfessionalSignature';
import Odontogram from './attendance/Odontogram';
import type { OdontogramData } from './attendance/odontogram/odontogramModel';
import { printDocumentClass } from '@/lib/print-layout';
import type { ProfessionalIdentity } from '@/lib/professional-signature';
import { conditionTargetsLabel, money, TREATMENT_PHASES, type TreatmentPlanItemDraft } from '@/lib/treatmentPlans';
import './TreatmentPlanPrint.css';

export interface PrintableTreatmentPlan {
  id: number;
  patientId: number;
  patient: { id: number; name: string; birthDate?: string | null };
  sourceAppointment?: { id: number; date: string; procedure: string; dentalNotes?: OdontogramData } | null;
  createdAt: string;
  validUntil: string;
  status: string;
  notes?: string | null;
  paymentTerms?: string | null;
  items: TreatmentPlanItemDraft[];
  payments: Array<{ id: number; amount: number; method: string; receivedAt: string }>;
  totals: { quoted: number; authorized: number; received: number; balance: number; discount: number; byPhase: Record<string, number> };
}

const statuses: Record<string, string> = { awaiting_authorization: 'Aguardando autorização', partially_authorized: 'Autorizado parcialmente', authorized: 'Autorizado', expired: 'Expirado', cancelled: 'Cancelado' };
const clinicalStatuses: Record<string, string> = { proposed: 'Proposto', authorized: 'Autorizado · não iniciado', in_progress: 'Em andamento', completed: 'Concluído' };
const methods: Record<string, string> = { pix: 'Pix', cash: 'Dinheiro', credit: 'Cartão de crédito', debit: 'Cartão de débito', transfer: 'Transferência', other: 'Outro' };
const date = (value: string) => new Date(value).toLocaleDateString('pt-BR');
const isAuthorized = (item: TreatmentPlanItemDraft) => item.authorizedTotal !== null && item.authorizedTotal !== undefined;

export function TreatmentPlanPrint({ plan, clinic, professional, includeOdontogram = false }: { plan: PrintableTreatmentPlan; clinic: ClinicPrintDetails; professional: ProfessionalIdentity; includeOdontogram?: boolean }) {
  const unapproved = plan.items.filter(item => !isAuthorized(item));
  const unapprovedTotal = unapproved.reduce((sum, item) => sum + (item.quotedTotal ?? item.unitPrice * item.quantity), 0);
  const approved = plan.items.filter(isAuthorized);
  const completed = approved.filter(item => item.clinicalStatus === 'completed').length;
  const financialStatus = !approved.length ? 'Aguardando autorização' : plan.totals.balance === 0 ? 'Saldo autorizado quitado' : plan.totals.received > 0 ? 'Pagamento parcial' : 'Pagamento pendente';
  return <section className={`hidden print-only print-root ${printDocumentClass('clinic')} treatment-plan-document`} data-print-target="treatment-plan">
    <ClinicPrintHeader clinic={clinic} />
    <div className="print-patient-block treatment-plan-identity">
      <h2>Plano de tratamento · Orçamento #{plan.id}</h2>
      <p><strong>Paciente:</strong> {plan.patient.name}{plan.patient.birthDate ? ` · Nascimento: ${date(`${plan.patient.birthDate.slice(0, 10)}T12:00:00`)}` : ''}</p>
      <p><strong>Profissional:</strong> {professional.name || 'Equipe clínica'}{professional.cro ? ` · ${professional.cro}` : ''}</p>
      <p>Emitido em {date(plan.createdAt)} · Válido até {date(plan.validUntil)}</p>
      <p><strong>{statuses[plan.status] || plan.status}</strong> · {financialStatus}</p>
      {approved.length > 0 ? <p>Execução clínica: {completed} de {approved.length} procedimentos autorizados concluídos.</p> : null}
    </div>
    {includeOdontogram && plan.sourceAppointment?.dentalNotes ? <section className="print-section treatment-plan-odontogram"><h3>Referência dos dentes no orçamento</h3><div className="print-odontogram"><Odontogram data={plan.sourceAppointment.dentalNotes} onChange={() => undefined} readOnly printable compactReference referenceTeeth={plan.items.flatMap(item => item.toothNumber ? [item.toothNumber] : [])} birthDate={plan.patient.birthDate} /></div><p>Traço sob o dente: procedimento incluído neste orçamento. A situação e os valores constam na tabela abaixo.</p></section> : null}
    <table className="treatment-plan-items">
      <thead><tr><th scope="col">Procedimento / região</th><th scope="col">Situação clínica</th><th scope="col">Orçado</th><th scope="col">Autorizado</th></tr></thead>
      {TREATMENT_PHASES.map(phase => {
        const items = plan.items.filter(item => item.phase === phase.value);
        if (!items.length) return null;
        return <tbody key={phase.value}>
          <tr className="treatment-plan-phase"><th colSpan={4} scope="rowgroup">{phase.label}</th></tr>
          {items.map((item, index) => <tr key={item.id ?? index}>
            <td><strong>{item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ''}</strong><small>{conditionTargetsLabel(item.toothNumber, item.targets)}</small></td>
            <td>{isAuthorized(item) ? clinicalStatuses[item.clinicalStatus || 'authorized'] || 'Autorizado' : 'Não autorizado · proposto'}</td>
            <td>{money(item.quotedTotal ?? item.unitPrice * item.quantity)}</td>
            <td>{isAuthorized(item) ? money(item.authorizedTotal) : '—'}</td>
          </tr>)}
        </tbody>;
      })}
    </table>
    <section className="print-section treatment-plan-summary" aria-label="Resumo financeiro">
      <h3>Resumo financeiro</h3>
      <dl>
        <div><dt>Total orçado</dt><dd>{money(plan.totals.quoted)}</dd></div>
        <div><dt>Procedimentos não autorizados ({unapproved.length})</dt><dd>{money(unapprovedTotal)}</dd></div>
        <div><dt>Desconto nos itens autorizados</dt><dd>{money(plan.totals.discount)}</dd></div>
        <div><dt>Total autorizado</dt><dd>{money(plan.totals.authorized)}</dd></div>
        <div><dt>Total recebido</dt><dd>{money(plan.totals.received)}</dd></div>
        <div className="treatment-plan-balance"><dt>Saldo autorizado a receber</dt><dd>{money(plan.totals.balance)}</dd></div>
      </dl>
      <p>{financialStatus}. Valores não autorizados não compõem o saldo a receber.</p>
    </section>
    {plan.payments.length > 0 ? <table className="treatment-plan-payments"><caption>Recebimentos registrados</caption><thead><tr><th scope="col">Data</th><th scope="col">Forma de pagamento</th><th scope="col">Valor recebido</th></tr></thead><tbody>{plan.payments.map(payment => <tr key={payment.id}><td>{date(payment.receivedAt)}</td><td>{methods[payment.method] || payment.method}</td><td>{money(payment.amount)}</td></tr>)}</tbody></table> : <p className="treatment-plan-note">Nenhum recebimento registrado.</p>}
    {plan.notes ? <p className="treatment-plan-note"><strong>Observações:</strong> {plan.notes}</p> : null}
    {plan.paymentTerms ? <p className="treatment-plan-note"><strong>Condição de pagamento:</strong> {plan.paymentTerms}</p> : null}
    <footer className="print-signature treatment-plan-signatures"><div><div className="treatment-plan-patient-signature" /><p>Assinatura do paciente</p><small>{plan.patient.name}</small></div><ProfessionalSignature professional={professional} /></footer>
  </section>;
}
