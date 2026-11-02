import type { ConditionTarget, ClinicalConditionType } from "@/components/admin/attendance/odontogram/odontogramModel";

export type TreatmentPhase = "urgency" | "mouth_adjustment" | "rehabilitation" | "aesthetics" | "other";
export type PricingUnit = "procedure" | "tooth" | "face";

export interface ClinicalProcedure {
  id: number;
  name: string;
  category: string;
  pricingUnit: PricingUnit;
  sector?: "odontologia" | "harmonizacao";
  facialType?: string | null;
  price: number;
  conditionTypes: ClinicalConditionType[];
  active: boolean;
}

export interface TreatmentPlanItemDraft {
  id?: number;
  procedureId?: number | null;
  name: string;
  category: string;
  pricingUnit: PricingUnit;
  conditionType?: ClinicalConditionType | null;
  phase: TreatmentPhase;
  quantity: number;
  unitPrice: number;
  toothNumber?: number | null;
  facialRegion?: string | null;
  targets?: ConditionTarget[];
  notes?: string;
  quotedTotal?: number;
  authorizedTotal?: number | null;
  clinicalStatus?: string;
}

export const TREATMENT_PHASES: Array<{ value: TreatmentPhase; label: string }> = [
  { value: "urgency", label: "Urgência" },
  { value: "mouth_adjustment", label: "Adequação do meio bucal" },
  { value: "rehabilitation", label: "Reabilitação" },
  { value: "aesthetics", label: "Estética" },
  { value: "other", label: "Outros" },
];

export const phaseForCategory = (category: string): TreatmentPhase => {
  const value = category.toLocaleLowerCase("pt-BR");
  if (value.includes("urg") || value.includes("endo")) return "urgency";
  if (value.includes("prot") || value.includes("reabil") || value.includes("implante")) return "rehabilitation";
  if (value.includes("est")) return "aesthetics";
  if (value.includes("rest") || value.includes("dent") || value.includes("period")) return "mouth_adjustment";
  return "other";
};

export const money = (value: number): string => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export const conditionTargetsLabel = (toothNumber?: number | null, targets?: ConditionTarget[]): string => {
  if (!toothNumber) return "";
  if (!targets?.length || targets.some((target) => target.kind === "tooth")) return `Dente ${toothNumber}`;
  const surfaceCount = targets.filter((target) => target.kind === "surface").length;
  return `Dente ${toothNumber}${surfaceCount ? ` · ${surfaceCount} ${surfaceCount === 1 ? "face" : "faces"}` : ""}`;
};
