import type { JSX } from "react";
import {
  getClinicalStageLabel,
  getConditionDisplayName,
  getFaceLabels,
  type ClinicalCondition,
} from "./odontogramModel";

interface ClinicalConditionListProps {
  toothNumber: number;
  conditions: ClinicalCondition[];
  onRemove?: (conditionId: string) => void;
  readOnly?: boolean;
}

const REGION_LABELS = {
  entire: "face inteira",
  cervical: "cervical",
  middle: "média",
  incisalOcclusal: "incisal/oclusal",
} as const;

const REGION_ORDER = ["entire", "cervical", "middle", "incisalOcclusal"] as const;

function formatConditionTargets(
  toothNumber: number,
  targets: ClinicalCondition["targets"],
): string {
  const faceLabels = getFaceLabels(toothNumber);
  const groupedSurfaceTargets = new Map<string, Set<keyof typeof REGION_LABELS>>();
  const targetLabels: string[] = [];

  targets.forEach((target) => {
    if (target.kind === "tooth") {
      targetLabels.push("Dente inteiro");
      return;
    }

    const regions = groupedSurfaceTargets.get(target.face) ?? new Set<keyof typeof REGION_LABELS>();
    regions.add(target.region);
    groupedSurfaceTargets.set(target.face, regions);
  });

  groupedSurfaceTargets.forEach((regions, face) => {
    const orderedRegions = REGION_ORDER.filter((region) => regions.has(region));
    const faceLabel = faceLabels[face as keyof typeof faceLabels];

    if (orderedRegions.length === 1) {
      const [region] = orderedRegions;
      if (region === "incisalOcclusal") {
        targetLabels.push(faceLabel);
        return;
      }
      if (region === "entire" && face !== "center") {
        targetLabels.push(faceLabel);
        return;
      }
    }

    targetLabels.push(`${faceLabel} (${orderedRegions.map((region) => REGION_LABELS[region]).join(", ")})`);
  });

  return targetLabels.join(", ");
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
        const targets = formatConditionTargets(toothNumber, condition.targets);
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
