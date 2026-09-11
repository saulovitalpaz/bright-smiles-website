import type { JSX } from "react";
import { ANATOMICAL_GEOMETRY } from "./odontogramGeometry";
import {
  FACE_KEYS,
  getClinicalStageLabel,
  getConditionDisplayName,
  getConditionVisual,
  getFaceLabels,
  getLatestWholeToothCondition,
  getOdontogramStateDefinition,
  getToothFamily,
  type ToothRecord,
} from "./odontogramModel";

interface OcclusalToothProps {
  toothNumber: number;
  record?: ToothRecord;
}

export function OcclusalTooth({ toothNumber, record }: OcclusalToothProps): JSX.Element {
  const anatomy = ANATOMICAL_GEOMETRY[getToothFamily(toothNumber)].occlusal;
  const faceConditions = FACE_KEYS.map((face) => {
    const matching = record?.conditions.filter((condition) =>
      condition.targets.some((target) => target.kind === "surface" && target.face === face),
    ) ?? [];
    return { face, matching, last: matching.at(-1) };
  });
  const affectedFaces = faceConditions
    .filter(({ last }) => last)
    .map(({ face, last }) => `${getFaceLabels(toothNumber)[face]}: ${getConditionDisplayName(last!.type)} (${getClinicalStageLabel(last!.stage)})`);
  const wholeCondition = getLatestWholeToothCondition(record);
  const wholeConditionVisual = wholeCondition ? getConditionVisual(wholeCondition) : null;
  const accessibleName = [
    `Vista oclusal do dente ${toothNumber}`,
    affectedFaces.length ? affectedFaces.join("; ") : "sem condições registradas",
    wholeCondition ? `dente inteiro: ${getConditionDisplayName(wholeCondition.type)} (${getClinicalStageLabel(wholeCondition.stage)})` : null,
  ].filter(Boolean).join(". ");

  return (
    <svg
      aria-label={accessibleName}
      className="occlusal-tooth occlusal-tooth--arch"
      role="img"
      viewBox={anatomy.viewBox}
    >
      <path
        className="occlusal-tooth__outline"
        d={anatomy.outline}
        data-whole-condition-stage={wholeCondition?.stage}
        fill={wholeConditionVisual?.fill}
        opacity={wholeConditionVisual ? 0.34 : undefined}
      />
      {faceConditions.map(({ face, matching, last }) => {
        const visual = last ? getConditionVisual(last) : getOdontogramStateDefinition("Saudável", "surface").visual;
        return (
          <path
            data-condition-count={matching.length || undefined}
            data-occlusal-face={face}
            d={anatomy.faces[face]}
            fill={visual.fill}
            key={face}
          />
        );
      })}
      <g className="occlusal-tooth__grooves">
        {anatomy.grooves.map((groove) => <path d={groove} key={groove} />)}
      </g>
    </svg>
  );
}
