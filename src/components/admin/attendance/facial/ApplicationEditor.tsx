import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FacialApplication, FacialProcedureType } from "./facialModel";

export type FacialApplicationDraft = Omit<FacialApplication, "id">;

type ApplicationEditorProps = {
  regionId: string;
  procedureType: FacialProcedureType;
  application?: FacialApplication | null;
  onSave: (draft: FacialApplicationDraft) => void;
  onDraftChange?: (draft: FacialApplicationDraft) => void;
  onCancel?: () => void;
};

type EditorState = {
  productName: string;
  amount: string;
  unit: "U" | "ml" | "fio" | "";
  technique: string;
  plane: string;
  device: string;
  notes: string;
};

const emptyState: EditorState = { productName: "", amount: "", unit: "", technique: "", plane: "", device: "", notes: "" };

const toDraft = (state: EditorState, regionId: string, procedureType: FacialProcedureType): FacialApplicationDraft => {
  const amountText = state.amount.trim();
  const amount = amountText ? Number(amountText.replace(",", ".")) : undefined;
  return {
    regionId,
    procedureType,
    ...(state.productName.trim() ? { productName: state.productName.trim() } : {}),
    ...(amount !== undefined && Number.isFinite(amount) ? { amount } : {}),
    ...(state.unit ? { unit: state.unit } : {}),
    ...(state.technique.trim() ? { technique: state.technique.trim() } : {}),
    ...(state.plane.trim() ? { plane: state.plane.trim() } : {}),
    ...(state.device.trim() ? { device: state.device.trim() } : {}),
    ...(state.notes.trim() ? { notes: state.notes.trim() } : {}),
  };
};

export function ApplicationEditor({ regionId, procedureType, application, onSave, onDraftChange, onCancel }: ApplicationEditorProps) {
  const [state, setState] = useState<EditorState>(emptyState);

  useEffect(() => {
    setState(application ? {
      productName: application.productName ?? "",
      amount: application.amount === undefined ? "" : String(application.amount).replace(".", ","),
      unit: application.unit ?? "",
      technique: application.technique ?? "",
      plane: application.plane ?? "",
      device: application.device ?? "",
      notes: application.notes ?? "",
    } : emptyState);
  }, [application]);

  const update = (key: keyof EditorState, value: string) => {
    const next = { ...state, [key]: value };
    setState(next);
    onDraftChange?.(toDraft(next, regionId, procedureType));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(toDraft(state, regionId, procedureType));
  };

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="space-y-1.5">
        <Label htmlFor="facial-product">Produto</Label>
        <Input id="facial-product" value={state.productName} onChange={(event) => update("productName", event.target.value)} placeholder="Ex.: Ácido hialurônico" className="min-h-11" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="facial-amount">Quantidade</Label>
          <Input id="facial-amount" inputMode="decimal" value={state.amount} onChange={(event) => update("amount", event.target.value)} placeholder="0,2" className="min-h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="facial-unit">Unidade</Label>
          <select id="facial-unit" value={state.unit} onChange={(event) => update("unit", event.target.value)} className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">Selecione</option>
            <option value="U">U</option>
            <option value="ml">ml</option>
            <option value="fio">Fio</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="facial-technique">Técnica</Label><Input id="facial-technique" value={state.technique} onChange={(event) => update("technique", event.target.value)} className="min-h-11" /></div>
        <div className="space-y-1.5"><Label htmlFor="facial-plane">Plano</Label><Input id="facial-plane" value={state.plane} onChange={(event) => update("plane", event.target.value)} className="min-h-11" /></div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="facial-device">Dispositivo</Label><Input id="facial-device" value={state.device} onChange={(event) => update("device", event.target.value)} className="min-h-11" /></div>
      <div className="space-y-1.5"><Label htmlFor="facial-notes">Observações</Label><Textarea id="facial-notes" value={state.notes} onChange={(event) => update("notes", event.target.value)} rows={3} /></div>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" className="min-h-11">{application ? "Salvar alterações" : "Registrar aplicação"}</Button>
        {application && onCancel && <Button type="button" variant="outline" className="min-h-11" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}

export default ApplicationEditor;
