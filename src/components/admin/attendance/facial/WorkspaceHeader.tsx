import React from "react";
import { Badge } from "@/components/ui/badge";

type WorkspaceHeaderProps = { readOnly?: boolean };

export function WorkspaceHeader({ readOnly = false }: WorkspaceHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
      <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Registro clínico</p><h2 className="text-xl font-semibold tracking-tight">Harmonização facial</h2><p className="mt-1 text-sm text-muted-foreground">Selecione uma região e registre cada aplicação no mapa.</p></div>
      {readOnly && <Badge variant="outline">Somente leitura</Badge>}
    </header>
  );
}

export default WorkspaceHeader;
