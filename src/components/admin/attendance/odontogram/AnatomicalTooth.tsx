import type { JSX } from "react";
import { ANATOMICAL_GEOMETRY } from "./odontogramGeometry";
import { getToothFamily, type ToothData } from "./odontogramModel";

interface AnatomicalToothProps {
  toothNumber: number;
  data: ToothData;
  size?: "arch" | "editor";
  selected?: boolean;
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
}: AnatomicalToothProps): JSX.Element {
  const family = getToothFamily(toothNumber);
  const anatomy = ANATOMICAL_GEOMETRY[family].frontal;
  const idPrefix = `tooth-${toothNumber}`;
  const enamelId = `${idPrefix}-enamel`;
  const rootId = `${idPrefix}-root`;
  const highlightClipId = `${idPrefix}-highlight-clip`;
  const overlay = STATUS_OVERLAYS[data.status as keyof typeof STATUS_OVERLAYS] ?? "#e05252";
  const isMissing = data.status === "Ausente";

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
      </defs>

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
      <path
        data-anatomy-layer="whole-tooth-overlay"
        d={anatomy.crown}
        fill={overlay}
        opacity={data.status === "Saudável" ? 0 : 0.42}
      />
      {isMissing && (
        <g data-testid="missing-tooth-mark" data-anatomy-layer="missing-tooth-cross" stroke="#b42318" strokeWidth="3" strokeLinecap="round">
          <path d="M10.5 12L37.5 66" />
          <path d="M37.5 12L10.5 66" />
        </g>
      )}
    </svg>
  );
}
