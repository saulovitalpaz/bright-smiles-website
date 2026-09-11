import React from "react";
import { Button } from "@/components/ui/button";

export type FacialSessionSummary = { treatedRegions: number; applications: number; totalUnits: number; totalMl: number };

type SessionSummaryBarProps = {
  summary: FacialSessionSummary;
  onViewSummary?: () => void;
  onSave?: () => void;
  readOnly?: boolean;
};

const numberLabel = (value: number, fractionDigits = 0) => value.toLocaleString("pt-BR", { minimumFractionDigits: fractionDigits, maximumFractionDigits: 2 });

export function SessionSummaryBar({ summary, onViewSummary, onSave, readOnly = false }: SessionSummaryBarProps) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 py-3 backdrop-blur" data-session-summary>
      <p className="text-sm font-medium text-foreground" aria-live="polite">
        {summary.treatedRegions} {summary.treatedRegions === 1 ? "região" : "regiões"} · {summary.applications} {summary.applications === 1 ? "aplicação" : "aplicações"} · {numberLabel(summary.totalUnits)} U · {numberLabel(summary.totalMl, 2)} ml
      </p>
      <div className="flex gap-2">
        {onViewSummary && <Button type="button" variant="outline" className="min-h-11" onClick={onViewSummary}>Ver resumo</Button>}
        {!readOnly && onSave && <Button type="button" className="min-h-11" onClick={onSave}>Salvar</Button>}
      </div>
    </footer>
  );
}

export default SessionSummaryBar;
