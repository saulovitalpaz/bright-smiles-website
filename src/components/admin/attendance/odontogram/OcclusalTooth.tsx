import type { JSX } from "react";
import { ANATOMICAL_GEOMETRY } from "./odontogramGeometry";
import { FACE_KEYS, getToothFamily, type ToothRecord } from "./odontogramModel";

interface OcclusalToothProps {
  toothNumber: number;
  record?: ToothRecord;
}

export function OcclusalTooth({ toothNumber, record }: OcclusalToothProps): JSX.Element {
  const anatomy = ANATOMICAL_GEOMETRY[getToothFamily(toothNumber)].occlusal;

  return (
    <svg
      aria-label={`Vista oclusal do dente ${toothNumber}`}
      className="occlusal-tooth occlusal-tooth--arch"
      role="img"
      viewBox={anatomy.viewBox}
    >
      <path className="occlusal-tooth__outline" d={anatomy.outline} />
      {FACE_KEYS.map((face) => {
        const matching = record?.conditions.filter((condition) =>
          condition.targets.some((target) => target.kind === "surface" && target.face === face),
        ) ?? [];
        const last = matching.at(-1);

        return (
          <path
            data-condition-count={matching.length || undefined}
            data-occlusal-face={face}
            d={anatomy.faces[face]}
            fill={last ? (last.type === "carie" ? "#fce8e6" : "#38bdf8") : "#f7f0dc"}
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
