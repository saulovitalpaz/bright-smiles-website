import { adminApi } from "./api";
import type { FacialProcedureType } from "@/components/admin/attendance/facial/facialModel";
export type StockProduct = { id: string; name: string; batch?: string | null; reconstitutedAt?: string | null; procedureType: FacialProcedureType; stockUnit: "ml" | "unit"; quantity: number; concentration: number | null; price: number; active: boolean; version: number };
export const stockDateLabel = (date: string) => date.slice(0, 10).split("-").reverse().join("/");
export const stockClasses: { value: FacialProcedureType; label: string }[] = [
  { value: "botulinum-toxin", label: "Toxina Botulínica" }, { value: "filler", label: "Preenchimento" }, { value: "biostimulator", label: "Bioestimulador" },
  { value: "bioremodeler", label: "Biorremodelador" }, { value: "skinbooster", label: "Skinbooster" }, { value: "thread", label: "Fio de PDO" }, { value: "other", label: "Injetável" },
];
export async function loadStockProducts(procedureType?: string, signal?: AbortSignal): Promise<StockProduct[]> {
  return (await adminApi.get("/stock/products", { params: { procedureType }, signal })).data;
}
export function doseInStockUnit(amount: number, unit: string, product: StockProduct) {
  return unit === "U" ? (product.concentration ? amount / product.concentration : null) : amount;
}
