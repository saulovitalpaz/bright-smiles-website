import type { JSX } from "react";
import { getOdontogramLegendGroups, type OdontogramStateDefinition } from "./odontogramModel";
import { OdontogramStateSwatch } from "./OdontogramStateSwatch";

function LegendGroup({ title, definitions }: { title: string; definitions: ReadonlyArray<OdontogramStateDefinition> }): JSX.Element {
  return (
    <section aria-labelledby={`odontogram-legend-${title}`} className="min-w-0 space-y-2">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400" id={`odontogram-legend-${title}`}>
        {title}
      </h4>
      <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {definitions.map((definition) => (
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-950/30 px-2 py-1.5 text-[11px] text-slate-300" key={definition.id}>
            <OdontogramStateSwatch definition={definition} />
            <span className="min-w-0 truncate">{definition.label}</span>
            <span className="ml-auto min-w-0 truncate text-[10px] text-slate-500">— {definition.description}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function OdontogramLegend(): JSX.Element {
  const groups = getOdontogramLegendGroups();
  return (
    <div className="odontogram-legend mt-7 min-w-0 rounded-xl border border-slate-800 bg-[#0f172a] p-3 sm:p-4">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Legenda</span>
          <span className="text-[10px] text-slate-600">Padrões e símbolos clínicos</span>
        </div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <LegendGroup definitions={groups.faces} title="Faces" />
          <LegendGroup definitions={groups.tooth} title="Dente inteiro" />
        </div>
        <p className="text-center text-[11px] text-slate-400">
          Regiões: face inteira, cervical, média e incisal/oclusal. Se necessário, selecione mais de uma região para a mesma ocorrência.
        </p>
      </div>
    </div>
  );
}
