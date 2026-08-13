import { useId, type JSX } from "react";
import { ANATOMICAL_GEOMETRY } from "./odontogramGeometry";
import { FACE_KEYS, getConditionVisual, getToothFamily, type ToothData, type ToothRecord } from "./odontogramModel";

interface AnatomicalToothProps {
  toothNumber: number;
  data: ToothData;
  size?: "arch" | "editor";
  selected?: boolean;
  record?: ToothRecord;
}

const STATUS_OVERLAYS = {
  Saudável: "transparent",
  Implante: "#8b5cf6",
  Ponte: "#f59e0b",
} as const;

export function AnatomicalTooth({
  toothNumber,
  data,
  size = "arch",
  selected = false,
  record,
}: AnatomicalToothProps): JSX.Element {
  const instanceId = useId().replace(/:/g, "");
  const family = getToothFamily(toothNumber);
  const anatomy = ANATOMICAL_GEOMETRY[family].frontal;
  const idPrefix = `tooth-${toothNumber}-${instanceId}`;
  const enamelId = `${idPrefix}-enamel`;
  const rootId = `${idPrefix}-root`;
  const highlightClipId = `${idPrefix}-highlight-clip`;
  const treatPatternId = `${idPrefix}-treat-pattern`;
  const assessPatternId = `${idPrefix}-assess-pattern`;
  const progressPatternId = `${idPrefix}-progress-pattern`;
  const mutedPatternId = `${idPrefix}-muted-pattern`;
  const crownClipId = `${idPrefix}-crown-clip`;
  const overlay = STATUS_OVERLAYS[data.status as keyof typeof STATUS_OVERLAYS] ?? "#e05252";
  const isMissing = data.status === "Ausente";
  const viewBoxHeight = anatomy.viewBox.split(/\s+/)[3];
  const orientationTransform =
    toothNumber >= 31 && toothNumber <= 48
      ? `translate(0 ${viewBoxHeight}) scale(1 -1)`
      : undefined;
  const isLower = toothNumber >= 31 && toothNumber <= 48;

  return (
    <svg
      role="img"
      aria-label={`Dente ${toothNumber}, ${data.status}`}
      viewBox={anatomy.viewBox}
      className={`anatomical-tooth anatomical-tooth--${size}`}
      data-tooth-family={family}
      data-selected={selected || undefined}
    >
      <defs>
        <linearGradient id={rootId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5e8c9" />
          <stop offset="0.55" stopColor="#d6b77d" />
          <stop offset="1" stopColor="#9c7549" />
        </linearGradient>
        <radialGradient id={enamelId} cx="31%" cy="20%" r="78%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.48" stopColor="#fbfaf2" />
          <stop offset="1" stopColor="#d7d0b8" />
        </radialGradient>
        <clipPath id={highlightClipId}>
          <path d={anatomy.crown} />
        </clipPath>
        <clipPath id={crownClipId}>
          <path d={anatomy.crown} />
        </clipPath>
        <pattern id={treatPatternId} patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(35)">
          <rect width="5" height="5" fill="#fce8e6" />
          <path d="M0 0V5" stroke="#b42318" strokeWidth="2" />
        </pattern>
        <pattern id={assessPatternId} patternUnits="userSpaceOnUse" width="5" height="5">
          <rect width="5" height="5" fill="#fef3c7" />
          <circle cx="1.25" cy="1.25" fill="#b45309" r="0.8" />
          <circle cx="3.75" cy="3.75" fill="#b45309" r="0.8" />
        </pattern>
        <pattern id={progressPatternId} patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
          <rect width="5" height="5" fill="#ffedd5" />
          <path d="M0 0V5M2.5 0V5" stroke="#c2410c" strokeWidth="1" />
        </pattern>
        <pattern id={mutedPatternId} patternUnits="userSpaceOnUse" width="6" height="6">
          <rect width="6" height="6" fill="#e2e8f0" />
          <path d="M0 3H6" stroke="#475569" strokeDasharray="2 1" strokeWidth="1" />
        </pattern>
      </defs>

      <g
        data-tooth-orientation={isLower ? "lower" : "upper"}
        transform={orientationTransform}
      >
        <g data-anatomy-layer="root-shadow" opacity="0.22" transform="translate(1 1.5)">
          {anatomy.roots.map((root) => (
            <path key={root} d={root} fill="#46331e" />
          ))}
        </g>
        <g data-anatomy-layer="dentin-roots">
          {anatomy.roots.map((root) => (
            <path key={root} d={root} fill={`url(#${rootId})`} stroke="#876544" strokeWidth="0.85" />
          ))}
        </g>
        <path
          data-anatomy-layer="cervical-transition"
          d={anatomy.cervical}
          fill="none"
          stroke="#c38a7a"
          strokeWidth="2.3"
          strokeLinecap="round"
          opacity="0.62"
        />
        <path
          data-anatomy-layer="enamel-crown"
          d={anatomy.crown}
          fill={`url(#${enamelId})`}
          stroke="#867c68"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          data-anatomy-layer="enamel-highlight"
          d={anatomy.highlight}
          clipPath={`url(#${highlightClipId})`}
          fill="#ffffff"
          opacity="0.58"
        />
        <g
          clipPath={`url(#${crownClipId})`}
          data-anatomy-layer="face-overlays"
        >
          {FACE_KEYS.map((face) => {
            const status = data.faces?.[face]?.status ?? "Saudável";
            if (status === "Saudável") return null;

            const isTreatment = status === "Tratado";
            return (
              <path
                data-face-key={face}
                data-face-status={status}
                d={anatomy.surfaces[face]}
                fill={isTreatment ? "#22d3ee" : `url(#${treatPatternId})`}
                key={face}
                opacity={isTreatment ? 0.58 : 0.86}
                stroke={isTreatment ? "#0e7490" : "#b42318"}
                strokeWidth="0.7"
              />
            );
          })}
        </g>
        <g data-anatomy-layer="layered-v2-face-overlays" clipPath={`url(#${crownClipId})`}>
          {FACE_KEYS.map((face) => {
            const matching = record?.conditions.filter((condition) => condition.targets.some((target) => target.kind === "surface" && target.face === face)) ?? [];
            const condition = matching.at(-1);
            if (!condition) return null;
            const visual = getConditionVisual(condition);
            const fill = visual.pattern === "dots"
              ? `url(#${assessPatternId})`
              : visual.pattern === "diagonal"
                ? `url(#${treatPatternId})`
                : visual.pattern === "crosshatch"
                  ? `url(#${progressPatternId})`
                  : visual.pattern === "dashed"
                    ? `url(#${mutedPatternId})`
                    : visual.fill;
            return (
              <path
                data-condition-count={matching.length}
                data-condition-stage={condition.stage}
                data-condition-type={condition.type}
                data-condition-visual={visual.label}
                data-layered-face={face}
                d={anatomy.surfaces[face]}
                fill={fill}
                key={face}
                opacity={condition.stage === "concluido" ? 0.72 : 0.9}
                stroke={visual.stroke}
                strokeWidth="1"
              />
            );
          })}
        </g>
        <g
          data-testid="whole-tooth-overlay"
          data-anatomy-layer="whole-tooth-overlay"
          data-status={data.status}
          fill={overlay}
          opacity={data.status === "Saudável" ? 0 : 0.3}
        >
          {anatomy.roots.map((root) => (
            <path key={root} d={root} />
          ))}
          <path d={anatomy.crown} />
        </g>
        {isMissing ? (
          <g
            data-testid="missing-tooth-mark"
            data-anatomy-layer="missing-tooth-cross"
            stroke="#b42318"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <path d="M10.5 12L37.5 66" />
            <path d="M37.5 12L10.5 66" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}
