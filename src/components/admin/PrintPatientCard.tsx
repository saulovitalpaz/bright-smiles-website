type PrintPatient = { name: string; cpf: string; phone?: string; address?: string };

export function PrintPatientCard({ patient, blank = false, compact = false }: { patient: PrintPatient; blank?: boolean; compact?: boolean }) {
  if (compact) return <div className="print-patient-block mb-4 space-y-1 border-b border-slate-200 pb-2 text-[10px] leading-relaxed">
    <p><span className="text-slate-500">Paciente: </span><strong data-patient-value>{blank ? null : patient.name || "________________________________"}</strong></p>
    <div className="flex flex-wrap gap-x-6">
      <p><span className="text-slate-500">CPF: </span><span data-patient-value>{blank ? null : patient.cpf || "___.___.___-__"}</span></p>
      <p><span className="text-slate-500">Telefone: </span><span data-patient-value>{blank ? null : patient.phone || 'Não informado'}</span></p>
    </div>
    <p><span className="text-slate-500">Endereço: </span><span data-patient-value>{blank ? null : patient.address || 'Não informado'}</span></p>
  </div>;

  return <div className="print-patient-block mb-5 rounded-lg border border-slate-100 bg-slate-50 p-3">
    <div className="grid grid-cols-12 gap-x-4 gap-y-2">
      <div className="col-span-7">
        <p className="mb-0.5 text-[7px] font-black uppercase tracking-[0.15em] text-primary">Paciente</p>
        <p data-patient-value className="min-h-5 font-serif text-sm font-bold text-slate-900">{blank ? null : patient.name || "________________________________"}</p>
      </div>
      <div className="col-span-3">
        <p className="mb-0.5 text-[7px] font-black uppercase tracking-[0.15em] text-primary">CPF</p>
        <p data-patient-value className="min-h-5 font-mono text-[11px] font-bold text-slate-700">{blank ? null : patient.cpf || "___.___.___-__"}</p>
      </div>
      <div className="col-span-2 text-right">
        <p className="mb-0.5 text-[7px] font-black uppercase tracking-[0.15em] text-primary">Telefone</p>
        <p data-patient-value className="min-h-5 font-mono text-[10px] text-slate-600">{blank ? null : patient.phone || "—"}</p>
      </div>
      {(blank || patient.address) && <div className="col-span-12 border-t border-slate-200/60 pt-1.5">
        <p className="mb-0.5 text-[7px] font-black uppercase tracking-[0.15em] text-primary">Endereço</p>
        <p data-patient-value className="min-h-5 text-[10px] italic text-slate-600">{blank ? null : patient.address}</p>
      </div>}
    </div>
  </div>;
}
