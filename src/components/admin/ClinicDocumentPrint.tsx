import { ProfessionalSignature } from "@/components/admin/ProfessionalSignature";
import { printDocumentClass } from "@/lib/print-layout";
import type { ProfessionalIdentity } from "@/lib/professional-signature";
import { PrintPatientCard } from "./PrintPatientCard";
import { ClinicPrintHeader, type ClinicPrintDetails } from "./ClinicPrintHeader";

interface ClinicDocumentPrintProps {
  professional: ProfessionalIdentity;
  patient: { name: string; cpf: string; date: string; address?: string; phone?: string };
  clinic?: ClinicPrintDetails;
  content: string;
  includeElectronic?: boolean;
  manual?: boolean;
}

export function ClinicDocumentPrint({ professional, patient, clinic, content, includeElectronic = false, manual = false }: ClinicDocumentPrintProps) {
  return (
    <div className={`hidden print-only print-root ${printDocumentClass("clinic")} text-slate-900`} data-print-target="document">
      <ClinicPrintHeader clinic={clinic} />
      <PrintPatientCard patient={patient} blank={manual} compact={!manual} />
      <div className="print-flow-content whitespace-pre-wrap px-4 text-justify font-serif text-base leading-[1.6] text-slate-800">
        {manual ? (
          <div className="min-h-[100mm]" />
        ) : <div dangerouslySetInnerHTML={{ __html: content }} />}
      </div>
      <div className={`print-signature mt-20 ${manual ? "text-center" : "grid grid-cols-2 gap-12"} border-t border-slate-200 pt-8`}>
        {!manual && <div className="text-center">
          <div className="mx-auto mb-2 w-64 border-b border-slate-900" />
          <p className="text-[10px] font-bold uppercase">Assinatura do Paciente</p>
          <p className="mt-1 text-[9px] text-slate-500">{patient.name} - {patient.cpf}</p>
        </div>}
        <ProfessionalSignature professional={professional} includeElectronic={!manual && includeElectronic} />
      </div>
      <p className="mt-12 text-center text-[10px] uppercase tracking-widest text-slate-400">
        Governador Valadares, {manual ? "____/____/________" : patient.date}
      </p>
    </div>
  );
}
