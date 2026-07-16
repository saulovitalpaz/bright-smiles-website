import { useId, type JSX } from "react";
import { ANATOMICAL_GEOMETRY } from "./odontogramGeometry";
import {
  FACE_KEYS,
  getFaceLabels,
  getToothFamily,
  type FaceKey,
  type FaceStatus,
  type ToothData,
} from "./odontogramModel";

interface ToothSurfaceSelectorProps {
  toothNumber: number;
  data: ToothData;
  selectedFace: FaceKey | null;
  onSelectFace: (face: FaceKey) => void;
  readOnly?: boolean;
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
        style={status === "Tratar" ? { fill: `url(#${hatchId})` } : undefined}
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
}: ToothSurfaceSelectorProps): JSX.Element {
  const instanceId = useId().replace(/:/g, "");
  const family = getToothFamily(toothNumber);
  const anatomy = ANATOMICAL_GEOMETRY[family].occlusal;
  const labels = getFaceLabels(toothNumber);
  const hatchId = `surface-hatch-${toothNumber}-${instanceId}`;

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
    </div>
  );
}
