type PrintPatient = { name: string; cpf: string; phone?: string; address?: string };

export function PrintPatientCard({ patient, blank = false }: { patient: PrintPatient; blank?: boolean }) {
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
