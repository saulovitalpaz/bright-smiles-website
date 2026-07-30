import { useState, type JSX } from "react";
import {
  CLINICAL_CATALOG,
  createCondition,
  type ClinicalCategory,
  type ClinicalCondition,
  type ClinicalConditionType,
  type ClinicalStage,
  type ConditionTarget,
} from "./odontogramModel";
import { ToothSurfaceSelector } from "./ToothSurfaceSelector";

type EditableCategory = Exclude<ClinicalCategory, "legado">;

interface ClinicalConditionEditorProps {
  toothNumber: number;
  onSave: (condition: ClinicalCondition) => void;
  onCancel: () => void;
}

const STAGES: ReadonlyArray<{ value: ClinicalStage; label: string }> = [
  { value: "aAvaliar", label: "A avaliar" },
  { value: "planejado", label: "Planejado" },
  { value: "emAndamento", label: "Em andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "monitorado", label: "Monitorado" },
  { value: "suspenso", label: "Suspenso" },
  { value: "removido", label: "Removido" },
];

export function ClinicalConditionEditor({ toothNumber, onSave, onCancel }: ClinicalConditionEditorProps): JSX.Element {
  const [category, setCategory] = useState<EditableCategory | "">("");
  const [type, setType] = useState<ClinicalConditionType | "">("");
  const [stage, setStage] = useState<ClinicalStage | "">("");
  const [targets, setTargets] = useState<ConditionTarget[]>([]);
  const [notes, setNotes] = useState("");
  const types = category ? CLINICAL_CATALOG[category] : [];
  const canSave = Boolean(category && type && stage && targets.length);

  return (
    <form className="space-y-3" onSubmit={(event) => {
      event.preventDefault();
      if (!canSave || !category || !type || !stage) return;
      onSave(createCondition({ category, type, stage, targets, notes: notes.trim() || undefined }));
    }}>
      <label className="block text-sm">Categoria
        <select aria-label="Categoria" className="mt-1 w-full rounded border p-2" value={category} onChange={(event) => {
          setCategory(event.target.value as EditableCategory); setType(""); setTargets([]);
        }}>
          <option value="">Selecione</option>
          {Object.keys(CLINICAL_CATALOG).map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="block text-sm">Procedimento
        <select aria-label="Procedimento" className="mt-1 w-full rounded border p-2" disabled={!category} value={type} onChange={(event) => setType(event.target.value as ClinicalConditionType)}>
          <option value="">Selecione</option>
          {types.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
        </select>
      </label>
      {type ? <ToothSurfaceSelector toothNumber={toothNumber} data={{ status: "Saudável", notes: "" }} selectedFace={null} onSelectFace={() => undefined} selectedTargets={targets} onTargetsChange={setTargets} /> : null}
      <label className="block text-sm">Situação
        <select aria-label="Situação" className="mt-1 w-full rounded border p-2" value={stage} onChange={(event) => setStage(event.target.value as ClinicalStage)}>
          <option value="">Selecione</option>
          {STAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <label className="block text-sm">Observação da ocorrência
        <textarea aria-label="Observação da ocorrência" className="mt-1 w-full rounded border p-2" maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <div className="flex gap-2"><button className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50" disabled={!canSave} type="submit">Salvar ocorrência</button><button className="rounded border px-3 py-2" onClick={onCancel} type="button">Cancelar</button></div>
    </form>
  );
}
