import { useId, type JSX } from "react";
import { ANATOMICAL_GEOMETRY } from "./odontogramGeometry";
import {
  FACE_KEYS,
  getFaceLabels,
  getToothFamily,
  type FaceKey,
  type FaceStatus,
  type ConditionTarget,
  type ToothData,
} from "./odontogramModel";

interface ToothSurfaceSelectorProps {
  toothNumber: number;
  data: ToothData;
  selectedFace: FaceKey | null;
  onSelectFace: (face: FaceKey) => void;
  readOnly?: boolean;
  selectedTargets?: ConditionTarget[];
  onTargetsChange?: (targets: ConditionTarget[]) => void;
}

const FACE_POSITIONS: Record<FaceKey, string> = {
  top: "surface-selector__control--top",
  right: "surface-selector__control--right",
  bottom: "surface-selector__control--bottom",
  left: "surface-selector__control--left",
  center: "surface-selector__control--center",
};

function getFaceStatus(data: ToothData, face: FaceKey): FaceStatus {
  return data.faces?.[face]?.status ?? "Saudável";
}

function getFaceClass(status: FaceStatus): string {
  if (status === "Tratar") return "surface-selector__face--treat";
  if (status === "Tratado") return "surface-selector__face--treated";
  return "surface-selector__face--healthy";
}

interface FaceVisualProps {
  path: string;
  status: FaceStatus;
  isSelected: boolean;
  hatchId: string;
}

function HatchPattern({ id }: { id: string }): JSX.Element {
  return (
    <pattern
      id={id}
      width="3"
      height="3"
      patternTransform="rotate(45)"
      patternUnits="userSpaceOnUse"
    >
      <line stroke="#b42318" strokeWidth="1.2" x1="0" x2="0" y2="3" />
    </pattern>
  );
}

function FaceVisual({ path, status, isSelected, hatchId }: FaceVisualProps): JSX.Element {
  const visualStyle =
    status === "Tratar"
      ? { fill: `url(#${hatchId})` }
      : status === "Tratado"
        ? { fill: "#d9eff3", stroke: "#0e7490", strokeWidth: 2.4 }
        : undefined;

  return (
    <>
      {status === "Tratar" ? (
        <defs>
          <HatchPattern id={hatchId} />
        </defs>
      ) : null}
      <path
        className={`surface-selector__button-face ${getFaceClass(status)}`}
        d={path}
        fill={status === "Tratar" ? `url(#${hatchId})` : undefined}
        style={visualStyle}
      />
      {status === "Tratado" ? (
        <path aria-hidden="true" className="surface-selector__treated-inset" d={path} />
      ) : null}
      {isSelected ? (
        <path aria-hidden="true" className="surface-selector__selected-ring" d={path} />
      ) : null}
    </>
  );
}

export function ToothSurfaceSelector({
  toothNumber,
  data,
  selectedFace,
  onSelectFace,
  readOnly = false,
  selectedTargets,
  onTargetsChange,
}: ToothSurfaceSelectorProps): JSX.Element {
  const instanceId = useId().replace(/:/g, "");
  const family = getToothFamily(toothNumber);
  const anatomy = ANATOMICAL_GEOMETRY[family].occlusal;
  const labels = getFaceLabels(toothNumber);
  const hatchId = `surface-hatch-${toothNumber}-${instanceId}`;

  const toggleTarget = (target: ConditionTarget): void => {
    if (!selectedTargets || !onTargetsChange || readOnly) return;
    const targetKey = JSON.stringify(target);
    const next = selectedTargets.some((item) => JSON.stringify(item) === targetKey)
      ? selectedTargets.filter((item) => JSON.stringify(item) !== targetKey)
      : [...selectedTargets, target];
    onTargetsChange(next);
  };

  return (
    <div
      className="tooth-surface-selector__container"
      data-testid="tooth-surface-selector-container"
    >
      <div
        className="tooth-surface-selector"
        data-tooth-family={family}
        data-testid="tooth-surface-selector"
      >
        <svg
          aria-hidden="true"
          className="surface-selector__base"
          focusable="false"
          viewBox={anatomy.viewBox}
        >
          <path className="surface-selector__outline" d={anatomy.outline} />
          {FACE_KEYS.map((face) => {
            const status = getFaceStatus(data, face);
            const isSelected = selectedFace === face;

            return (
              <g key={face} data-surface-face={face}>
                <FaceVisual
                  hatchId={`${hatchId}-base-${face}`}
                  isSelected={isSelected}
                  path={anatomy.faces[face]}
                  status={status}
                />
              </g>
            );
          })}
          <g className="surface-selector__grooves">
            {anatomy.grooves.map((groove) => (
              <path d={groove} key={groove} />
            ))}
          </g>
        </svg>

        {FACE_KEYS.map((face) => {
          const status = getFaceStatus(data, face);
          const isSelected = selectedFace === face;

          return (
            <button
              aria-label={`${labels[face]}: ${status}`}
              aria-pressed={isSelected}
              className={`surface-selector__control ${FACE_POSITIONS[face]} ${getFaceClass(status)}${
                isSelected ? " surface-selector__control--selected" : ""
              }`}
              disabled={readOnly}
              key={face}
              onClick={() => {
                if (!readOnly) onSelectFace(face);
              }}
              type="button"
            >
              <svg aria-hidden="true" focusable="false" viewBox={anatomy.viewBox}>
                <FaceVisual
                  hatchId={`${hatchId}-${face}`}
                  isSelected={isSelected}
                  path={anatomy.faces[face]}
                  status={status}
                />
              </svg>
            </button>
          );
        })}
      </div>
      {selectedTargets && onTargetsChange ? (
        <div className="mt-3 grid grid-cols-3 gap-2" aria-label="Regiões anatômicas precisas">
          {FACE_KEYS.flatMap((face) => (["cervical", "middle", "incisalOcclusal"] as const).map((region) => ({ face, region }))).map(({ face, region }) => {
            const target: ConditionTarget = { kind: "surface", face, region };
            const selected = selectedTargets.some((item) => JSON.stringify(item) === JSON.stringify(target));
            const regionLabel = region === "cervical" ? "cervical" : region === "middle" ? "média" : "incisal ou oclusal";
            return (
              <button
                aria-pressed={selected}
                className="min-h-11 rounded-md border border-slate-600 px-2 text-xs text-slate-100"
                disabled={readOnly}
                key={`${face}-${region}`}
                onClick={() => toggleTarget(target)}
                type="button"
              >
                {labels[face]} {regionLabel}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
