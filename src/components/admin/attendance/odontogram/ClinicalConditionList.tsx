import type { JSX } from "react";
import {
  getClinicalStageLabel,
  getConditionDisplayName,
  getConditionTargetLabel,
  type ClinicalCondition,
} from "./odontogramModel";

interface ClinicalConditionListProps {
  toothNumber: number;
  conditions: ClinicalCondition[];
  onRemove?: (conditionId: string) => void;
  readOnly?: boolean;
}

export function ClinicalConditionList({
  toothNumber,
  conditions,
  onRemove,
  readOnly = false,
}: ClinicalConditionListProps): JSX.Element {
  if (!conditions.length) {
    return <p className="text-sm text-slate-400">Nenhuma ocorrência registrada neste dente.</p>;
  }

  return (
    <ol aria-label={`Ocorrências clínicas do dente ${toothNumber}`} className="space-y-2">
      {conditions.map((condition) => {
        const name = getConditionDisplayName(condition.type);
        const stage = getClinicalStageLabel(condition.stage);
        const targets = condition.targets.map((target) => getConditionTargetLabel(toothNumber, target)).join(", ");
        return (
          <li className="rounded-lg border border-slate-700 bg-slate-950/30 p-3" key={condition.id}>
            <p className="font-medium text-white">{name}</p>
            <p className="text-xs text-slate-300">{stage}</p>
            <p className="mt-2 text-xs text-slate-300">
              {targets}
            </p>
            {condition.notes ? <p className="mt-2 text-xs text-slate-400">{condition.notes}</p> : null}
            {!readOnly && onRemove ? (
              <button aria-label={`Remover ${name}: ${stage}; ${targets}`} onClick={() => onRemove(condition.id)} type="button">Remover</button>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
