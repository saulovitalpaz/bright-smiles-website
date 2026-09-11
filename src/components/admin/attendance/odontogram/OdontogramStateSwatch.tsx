import type { CSSProperties, JSX } from "react";
import type { OdontogramStateDefinition } from "./odontogramModel";

interface OdontogramStateSwatchProps {
  definition: OdontogramStateDefinition;
}

function getBackground(definition: OdontogramStateDefinition): string {
  const { fill, stroke, pattern } = definition.visual;
  if (pattern === "diagonal") return `repeating-linear-gradient(135deg, ${stroke} 0 2px, ${fill} 2px 5px)`;
  if (pattern === "crosshatch") return `repeating-linear-gradient(45deg, ${stroke} 0 1px, ${fill} 1px 4px), repeating-linear-gradient(-45deg, ${stroke} 0 1px, transparent 1px 4px)`;
  if (pattern === "dots") {
    return `radial-gradient(circle at 1.25px 1.25px, ${stroke} 0 0.8px, transparent 1px), radial-gradient(circle at 3.75px 3.75px, ${stroke} 0 0.8px, transparent 1px), ${fill}`;
  }
  if (pattern === "dashed") return `repeating-linear-gradient(0deg, ${stroke} 0 1px, ${fill} 1px 3px)`;
  return fill;
}

export function OdontogramStateSwatch({ definition }: OdontogramStateSwatchProps): JSX.Element {
  const style = {
    background: getBackground(definition),
    borderColor: definition.visual.stroke,
  } satisfies CSSProperties;

  return (
    <span
      aria-hidden="true"
      className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ring-1 ring-white/10"
      data-symbol={definition.visual.symbol}
      data-testid={`legend-swatch-${definition.id}`}
      style={style}
    >
      {definition.visual.symbol === "cross" ? <span className="text-sm font-bold leading-none text-red-700">×</span> : null}
    </span>
  );
}
