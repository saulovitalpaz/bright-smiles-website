import type { JSX } from "react";
import { mediaUrl } from "@/lib/media";
import {
  electronicSignatureLabel,
  hasUsableProfessionalSignature,
  type ProfessionalIdentity,
} from "@/lib/professional-signature";

interface ProfessionalSignatureProps {
  professional: ProfessionalIdentity;
  includeElectronic?: boolean;
  className?: string;
}

export function ProfessionalSignature({
  professional,
  includeElectronic = false,
  className = "",
}: ProfessionalSignatureProps): JSX.Element {
  const hasElectronicSignature = includeElectronic
    && hasUsableProfessionalSignature(professional);
  const signatureImage = hasElectronicSignature
    ? mediaUrl(professional.signatureUrl)
    : null;
  const name = professional.name?.trim() || "Nome profissional não configurado";
  const cro = professional.cro?.trim() || "CRO não configurado";

  return (
    <section
      aria-label="Identificação do profissional"
      className={`professional-signature-block min-w-0 text-center ${className}`.trim()}
    >
      {signatureImage ? (
        <img
          alt={`Assinatura de ${name}`}
          className="professional-signature-image mx-auto mb-2 h-14 max-w-48 object-contain"
          src={signatureImage}
        />
      ) : (
        <div aria-hidden="true" className="professional-signature-line mx-auto mb-2 w-48 border-b border-slate-400" />
      )}
      <p className="break-words text-xs font-bold text-slate-900">{name}</p>
      <p className="mt-0.5 break-words text-[9px] font-bold uppercase tracking-wider text-primary">
        {cro}
      </p>
      {hasElectronicSignature ? (
        <p className="mt-2 break-words text-[8px] leading-relaxed text-slate-500">
          {electronicSignatureLabel(professional)}
        </p>
      ) : null}
    </section>
  );
}
