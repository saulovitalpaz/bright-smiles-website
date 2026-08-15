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

type SurfaceTarget = Extract<ConditionTarget, { kind: "surface" }>;
type SurfaceRegion = SurfaceTarget["region"];

const FACE_POSITIONS: Record<FaceKey, string> = {
  top: "surface-selector__control--top",
  right: "surface-selector__control--right",
  bottom: "surface-selector__control--bottom",
  left: "surface-selector__control--left",
  center: "surface-selector__control--center",
};

const FACE_REGION_OPTIONS: Readonly<Record<FaceKey, readonly SurfaceRegion[]>> = {
  top: ["cervical", "middle"],
  right: ["cervical", "middle"],
  bottom: ["cervical", "middle"],
  left: ["cervical", "middle"],
  center: [],
};

function getFaceStatus(data: ToothData, face: FaceKey): FaceStatus {
  return data.faces?.[face]?.status ?? "Saudável";
}

function getFaceClass(status: FaceStatus): string {
  if (status === "Tratar") return "surface-selector__face--treat";
  if (status === "Tratado") return "surface-selector__face--treated";
  return "surface-selector__face--healthy";
}

function getDefaultRegion(face: FaceKey): SurfaceRegion {
  return face === "center" ? "incisalOcclusal" : "entire";
}

function getRegionLabel(region: SurfaceRegion): string {
  if (region === "incisalOcclusal") return "incisal ou oclusal";
  if (region === "middle") return "média";
  if (region === "cervical") return "cervical";
  return "face inteira";
}

function isSameTarget(left: ConditionTarget, right: ConditionTarget): boolean {
  if (left.kind !== right.kind) return false;
  if (left.kind === "tooth" && right.kind === "tooth") return true;
  return (
    left.kind === "surface" &&
    right.kind === "surface" &&
    left.face === right.face &&
    left.region === right.region
  );
}

function isSelectedTarget(targets: ConditionTarget[], target: ConditionTarget): boolean {
  return targets.some((item) => isSameTarget(item, target));
}

function normalizeTargets(targets: ConditionTarget[], target: ConditionTarget): ConditionTarget[] {
  if (isSelectedTarget(targets, target)) {
    return targets.filter((item) => !isSameTarget(item, target));
  }
  if (target.kind !== "surface") return [...targets, target];
  const next = targets.filter((item) => {
    if (item.kind !== "surface" || item.face !== target.face) return true;
    if (target.region === "entire") return false;
    return item.region !== "entire";
  });
  return [...next, target];
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
  const layeredMode = Boolean(selectedTargets && onTargetsChange);

  const toggleTarget = (target: ConditionTarget): void => {
    if (!selectedTargets || !onTargetsChange || readOnly) return;
    onTargetsChange(normalizeTargets(selectedTargets, target));
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
            const target: SurfaceTarget = { kind: "surface", face, region: getDefaultRegion(face) };
            const isSelected = layeredMode
              ? Boolean(selectedTargets && isSelectedTarget(selectedTargets, target))
              : selectedFace === face;

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
          const target: SurfaceTarget = { kind: "surface", face, region: getDefaultRegion(face) };
          const isSelected = layeredMode
            ? Boolean(selectedTargets && isSelectedTarget(selectedTargets, target))
            : selectedFace === face;
          const ariaLabel = layeredMode
            ? `${labels[face]} - ${getRegionLabel(target.region)}`
            : `${labels[face]}: ${status}`;

          return (
            <button
              aria-label={ariaLabel}
              aria-pressed={isSelected}
              className={`surface-selector__control ${FACE_POSITIONS[face]} ${getFaceClass(status)}${
                isSelected ? " surface-selector__control--selected" : ""
              }`}
              disabled={readOnly}
              key={face}
              onClick={() => {
                if (readOnly) return;
                if (layeredMode) {
                  toggleTarget(target);
                  return;
                }
                onSelectFace(face);
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
      {layeredMode && selectedTargets ? (
        <div className="mt-3 grid grid-cols-2 gap-2" aria-label="Regiões anatômicas">
          {FACE_KEYS.flatMap((face) =>
            FACE_REGION_OPTIONS[face].map((region) => {
              const target: SurfaceTarget = { kind: "surface", face, region };
              const selected = isSelectedTarget(selectedTargets, target);
              const label = `${labels[face]} - ${getRegionLabel(region)}`;
              return (
                <button
                  aria-label={label}
                  aria-pressed={selected}
                  className={`min-h-11 rounded-md border px-2 text-xs text-slate-100 transition-colors ${selected ? "border-blue-400 bg-blue-500/20 ring-1 ring-blue-400" : "border-slate-600 bg-slate-950 hover:border-slate-400"}`}
                  disabled={readOnly}
                  key={`${face}-${region}`}
                  onClick={() => toggleTarget(target)}
                  type="button"
                >
                  {label}
                </button>
              );
            }),
          )}
        </div>
      ) : null}
    </div>
  );
}
