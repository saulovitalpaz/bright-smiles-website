import { useId, useState, type JSX } from "react";
import { getOdontogramLegendGroups, type OdontogramStateDefinition } from "./odontogramModel";
import { OdontogramStateSwatch } from "./OdontogramStateSwatch";

function LegendGroup({ title, definitions, expanded }: { title: string; definitions: ReadonlyArray<OdontogramStateDefinition>; expanded: boolean }): JSX.Element {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
      <h4 className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400" id={headingId}>
        {title}
      </h4>
      <div className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-2">
        {definitions.map((definition) => (
          <div className="flex max-w-full items-center gap-1.5 text-[11px] leading-5 text-slate-300" key={definition.id}>
            <OdontogramStateSwatch definition={definition} />
            <span>{definition.label}<span className={expanded ? "ml-1 text-slate-400" : "hidden print:inline"}> — {definition.description}</span></span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function OdontogramLegend(): JSX.Element {
  const groups = getOdontogramLegendGroups();
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  return (
    <div className="odontogram-legend mt-4 min-w-0 rounded-xl border border-slate-800 bg-[#0f172a] px-3 pb-3">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Legenda</span>
          <button type="button" aria-expanded={expanded} aria-controls={contentId} onClick={() => setExpanded((value) => !value)} className="no-print min-h-11 rounded-md px-2 text-xs text-slate-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400">{expanded ? "Ocultar detalhes" : "Ver detalhes"}</button>
        </div>
        <div id={contentId} className="min-w-0 space-y-2">
          <LegendGroup definitions={groups.faces} title="Faces" expanded={expanded} />
          <LegendGroup definitions={groups.tooth} title="Dente inteiro" expanded={expanded} />
        </div>
        <p className={`${expanded ? "block" : "hidden print:block"} text-[11px] text-slate-400`}>
          Regiões: face inteira, cervical, média e incisal/oclusal. Se necessário, selecione mais de uma região para a mesma ocorrência.
        </p>
      </div>
    </div>
  );
}
