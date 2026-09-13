import Odontogram from "./Odontogram";
import type { OdontogramData } from "./odontogram/odontogramModel";
import { printDocumentClass } from "@/lib/print-layout";
import type { ProfessionalIdentity } from "@/lib/professional-signature";

export function AttendanceOdontogramPrint({ data, patientName, cpf, birthDate, professional }: {
  data: OdontogramData;
  patientName: string;
  cpf: string;
  birthDate?: string | null;
  professional: ProfessionalIdentity;
}) {
  return <div className={`hidden print-only print-root ${printDocumentClass("clinic")} text-slate-900`} data-print-target="odontogram">
    <header className="print-section mb-5 flex items-center gap-4 border-b border-slate-200 pb-4">
      <img src="/images/logo-oficial.png" alt="Logo" className="h-14 w-14 object-contain" />
      <div><h1 className="font-serif text-lg font-bold">Núcleo Odontológico</h1><p className="text-xs">Especializado &amp; Harmonização</p></div>
      <p className="ml-auto text-xs">Odontograma · {new Date().toLocaleDateString("pt-BR")}</p>
    </header>
    <div className="print-patient-block mb-5 rounded-lg border border-slate-100 p-3 text-sm">
      <p>Paciente: {patientName || "________________________________"}</p>
      <p>CPF: {cpf || "___.___.___-__"}</p>
    </div>
    <div className="print-odontogram"><Odontogram data={data} onChange={() => {}} readOnly printable birthDate={birthDate} /></div>
    <footer className="print-signature mt-6 border-t border-slate-200 pt-3 text-xs"><p>{professional.name} · {professional.cro}</p><p>Rua Barão do Rio Branco, 461 - Sala 206 · Governador Valadares - MG</p></footer>
  </div>;
}
