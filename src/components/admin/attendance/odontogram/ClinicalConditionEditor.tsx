import { useEffect, useState, type JSX } from "react";
import {
  CLINICAL_CATALOG,
  createCondition,
  getAllowedTargets,
  getClinicalStageOptions,
  getOdontogramStateDefinition,
  MAX_CONDITION_TARGETS,
  type ClinicalCategory,
  type ClinicalCondition,
  type ClinicalConditionType,
  type ClinicalStage,
  type ConditionTarget,
} from "./odontogramModel";
import { OdontogramStateSwatch } from "./OdontogramStateSwatch";
import { ToothSurfaceSelector } from "./ToothSurfaceSelector";
import { money, type ClinicalProcedure } from "@/lib/treatmentPlans";
import type { ClinicalConditionGroup } from "@/lib/clinicalConditions";

type EditableCategory = ClinicalCategory;
const CLINICAL_STAGE_OPTIONS = getClinicalStageOptions();
const LEGACY_TYPES: ReadonlyArray<ClinicalConditionType> = [
  "legado_tratar",
  "legado_tratado",
  "legado_ausente",
  "legado_ponte",
];

interface ClinicalConditionEditorProps {
  toothNumber: number;
  onSave: (condition: ClinicalCondition) => void;
  onCancel: () => void;
  initialCondition?: ClinicalCondition | null;
  procedures?: ClinicalProcedure[];
  conditionGroups?: ClinicalConditionGroup[];
  onAddProcedure?: (procedure: ClinicalProcedure, toothNumber: number, conditionType: ClinicalConditionType, targets: ConditionTarget[]) => void;
}

export function ClinicalConditionEditor({ toothNumber, onSave, onCancel, initialCondition = null, procedures = [], conditionGroups, onAddProcedure }: ClinicalConditionEditorProps): JSX.Element {
  const [category, setCategory] = useState<EditableCategory | "">(initialCondition?.category ?? "");
  const [type, setType] = useState<ClinicalConditionType | "">(initialCondition?.type ?? "");
  const [stage, setStage] = useState<ClinicalStage | "">(initialCondition?.stage ?? "");
  const [targets, setTargets] = useState<ConditionTarget[]>(initialCondition?.targets.map((target) => ({ ...target })) ?? []);
  const [targetError, setTargetError] = useState("");
  const [notes, setNotes] = useState(initialCondition?.notes ?? "");

  useEffect(() => {
    setCategory(initialCondition?.category ?? "");
    setType(initialCondition?.type ?? "");
    setStage(initialCondition?.stage ?? "");
    setTargets(initialCondition?.targets.map((target) => ({ ...target })) ?? []);
    setTargetError("");
    setNotes(initialCondition?.notes ?? "");
  }, [initialCondition]);
  const availableGroups = conditionGroups?.filter(group => group.active && group.conditions.some(condition => condition.active));
  const availableConditions = conditionGroups?.flatMap(group => group.active ? group.conditions.filter(condition => condition.active) : []);
  const configuredTypes = availableConditions?.filter(condition => condition.groupKey === category).map(condition => condition.key);
  const types: readonly ClinicalConditionType[] = configuredTypes !== undefined
    ? [...new Set([...configuredTypes, ...(initialCondition?.category === category ? [initialCondition.type] : [])])]
    : category === "legado"
    ? LEGACY_TYPES
    : category
      ? CLINICAL_CATALOG[category as keyof typeof CLINICAL_CATALOG] || []
      : [];
  const allowedTargets = type ? getAllowedTargets(type) : [];
  const allowsSurface = allowedTargets.includes("surface");
  const allowsWholeTooth = allowedTargets.includes("tooth");
  const canSave = Boolean(category && type && stage && targets.length && !targetError);

  const handleTargetsChange = (nextTargets: ConditionTarget[]): void => {
    if (nextTargets.length > MAX_CONDITION_TARGETS) {
      setTargetError(`Uma ocorrência pode ter no máximo ${MAX_CONDITION_TARGETS} regiões.`);
      return;
    }
    setTargetError("");
    setTargets(nextTargets);
  };

  const selectWholeTooth = (): void => {
    if (!allowsWholeTooth) return;
    setTargetError("");
    setTargets((current) => current.some((target) => target.kind === "tooth") ? [] : [{ kind: "tooth" }]);
  };

  function resetForm(): void {
    setCategory("");
    setType("");
    setStage("");
    setTargets([]);
    setTargetError("");
    setNotes("");
  }

  return (
    <form className="space-y-3" onSubmit={(event) => {
      event.preventDefault();
      if (!canSave || !category || !type || !stage) return;
      const label = availableConditions?.find(condition => condition.key === type)?.name || initialCondition?.label;
      onSave(createCondition({ id: initialCondition?.id, category, type, stage, targets, notes: notes.trim() || undefined, ...(label ? { label } : {}) }));
      resetForm();
    }}>
      <label className="block text-sm">Categoria
        <select aria-label="Categoria" className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2 text-slate-100" value={category} onChange={(event) => {
          setCategory(event.target.value as EditableCategory); setType(""); setTargets([]); setTargetError("");
        }}>
          <option value="">Selecione</option>
          {initialCondition?.category === "legado" ? <option value="legado">Legado (migrado)</option> : null}
          {availableGroups ? <>
            {availableGroups.map(group => <option key={group.key} value={group.key}>{group.name}</option>)}
            {initialCondition && initialCondition.category !== "legado" && !availableGroups.some(group => group.key === initialCondition.category) ? <option value={initialCondition.category}>Grupo do registro anterior</option> : null}
          </> : Object.keys(CLINICAL_CATALOG).map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="block text-sm">Procedimento
        <select aria-label="Procedimento" className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2 text-slate-100 disabled:opacity-60" disabled={!category} value={type} onChange={(event) => { setType(event.target.value as ClinicalConditionType); setTargets([]); setTargetError(""); }}>
          <option value="">Selecione</option>
          {types.map((value) => <option key={value} value={value}>{availableConditions?.find(condition => condition.key === value)?.name || (initialCondition?.type === value ? initialCondition.label : null) || value.replace(/_/g, " ")}</option>)}
        </select>
      </label>
      {availableGroups?.length === 0 ? <p role="status" className="text-sm text-slate-300">Nenhuma condição habilitada. Configure os grupos e condições em Minha tabela.</p> : null}
      {type ? (
        <div className="space-y-3">
          {allowsSurface ? (
            <fieldset className="space-y-3 rounded-lg border border-slate-700 p-3">
              <legend className="px-1 text-sm font-medium text-slate-100">Condições das faces</legend>
              <ToothSurfaceSelector
                data={{ status: "Saudável", notes: "" }}
                onSelectFace={() => undefined}
                onTargetsChange={handleTargetsChange}
                selectedFace={null}
                selectedTargets={targets.filter((target) => target.kind === "surface")}
                toothNumber={toothNumber}
              />
            </fieldset>
          ) : null}
          {allowsWholeTooth ? (
            <fieldset className="space-y-3 rounded-lg border border-slate-700 p-3">
              <legend className="px-1 text-sm font-medium text-slate-100">Condição do dente inteiro</legend>
              <button
                aria-label="Definir condição do dente inteiro"
                aria-pressed={targets.some((target) => target.kind === "tooth")}
                className={`min-h-11 rounded-md border px-3 text-sm font-medium transition-colors ${targets.some((target) => target.kind === "tooth") ? "border-blue-400 bg-blue-500/20 text-white ring-1 ring-blue-400" : "border-slate-600 bg-slate-950 text-slate-100 hover:border-slate-400"}`}
                onClick={selectWholeTooth}
                type="button"
              >
                Dente inteiro
              </button>
            </fieldset>
          ) : null}
          {targetError ? <p className="text-sm text-amber-300" role="alert">{targetError}</p> : null}
        </div>
      ) : null}
      {type && targets.length > 0 && onAddProcedure ? (() => {
        const suggestions = procedures.filter((procedure) => procedure.conditionTypes.includes(type as ClinicalConditionType));
        if (!suggestions.length) return null;
        return <section aria-label="Procedimentos relacionados ao plano" className="space-y-2 rounded-lg border border-teal-700/50 bg-teal-950/30 p-3">
          <div><h3 className="text-sm font-semibold text-teal-100">Procedimentos da tabela</h3><p className="text-xs text-slate-400">Relacionados a esta condição. Adicionar aqui não altera o registro clínico.</p></div>
          <div className="space-y-2">{suggestions.map((procedure) => <div key={procedure.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2">
            <div className="min-w-0"><p className="break-words text-sm text-slate-100">{procedure.name}</p><p className="text-xs text-slate-400">{procedure.category} · {money(procedure.price)}{procedure.pricingUnit === "face" ? " por face" : procedure.pricingUnit === "tooth" ? " por dente" : " por procedimento"}</p></div>
            <button type="button" className="min-h-11 shrink-0 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-600" onClick={() => onAddProcedure(procedure, toothNumber, type as ClinicalConditionType, targets)}>Adicionar ao plano</button>
          </div>)}</div>
        </section>;
      })() : null}
      <fieldset className="space-y-2" aria-label="Situação">
        <legend className="text-sm">Situação</legend>
        <p className="text-xs text-slate-400">Selecione o estado clínico da ocorrência.</p>
        <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
          {CLINICAL_STAGE_OPTIONS.map((item) => {
            const definition = getOdontogramStateDefinition(item.value, "surface");
            const selected = stage === item.value;
            return (
              <button
                aria-label={`Selecionar situação ${item.label}`}
                aria-pressed={selected}
                className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  selected
                    ? "border-blue-400 bg-blue-500/15 text-white ring-1 ring-blue-400"
                    : "border-slate-700 bg-slate-950/60 text-slate-200 hover:border-slate-500 hover:bg-slate-900"
                }`}
                key={item.value}
                onClick={() => setStage(item.value)}
                type="button"
              >
                <OdontogramStateSwatch definition={definition} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="block text-sm">Observação da ocorrência
        <textarea aria-label="Observação da ocorrência" className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2 text-slate-100" maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <div className="flex gap-2"><button className="min-h-11 rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50" disabled={!canSave} type="submit">{initialCondition ? "Atualizar ocorrência" : "Salvar ocorrência"}</button><button className="min-h-11 rounded border px-3 py-2" onClick={onCancel} type="button">Cancelar</button></div>
    </form>
  );
}
