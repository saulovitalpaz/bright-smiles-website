export interface ProfessionalIdentity {
  name: string;
  cro?: string | null;
  signatureUrl?: string | null;
}

const PUBLIC_SIGNATURE_REFERENCE = /^bucket:\/\/public\/.+\.(?:jpe?g|png|webp)$/i;
const INLINE_SIGNATURE_IMAGE = /^data:image\/(?:jpeg|png|webp);base64,/i;

export function hasCompleteProfessionalIdentity(
  professional: ProfessionalIdentity,
): boolean {
  return Boolean(professional.name?.trim() && professional.cro?.trim());
}

export function hasUsableProfessionalSignature(
  professional: ProfessionalIdentity,
): boolean {
  const reference = professional.signatureUrl?.trim() ?? "";
  return hasCompleteProfessionalIdentity(professional)
    && (PUBLIC_SIGNATURE_REFERENCE.test(reference) || INLINE_SIGNATURE_IMAGE.test(reference));
}

export function readStoredProfessionalIdentity(): ProfessionalIdentity {
  const fallback = { name: "", cro: "", signatureUrl: "" };
  try {
    const value = localStorage.getItem("admin_user");
    if (!value) return fallback;
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fallback;
    const user = parsed as Record<string, unknown>;
    return {
      name: typeof user.name === "string" ? user.name : "",
      cro: typeof user.cro === "string" ? user.cro : "",
      signatureUrl: typeof user.signatureUrl === "string" ? user.signatureUrl : "",
    };
  } catch {
    return fallback;
  }
}

export function electronicSignatureLabel(professional: ProfessionalIdentity): string {
  if (!hasCompleteProfessionalIdentity(professional)) {
    throw new Error("Configure nome e CRO antes de inserir a assinatura.");
  }
  return `Assinado eletronicamente por: ${professional.name.trim()} - ${professional.cro?.trim()}`;
}
