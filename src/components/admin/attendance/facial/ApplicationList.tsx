import React from "react";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { procedureLabel, type FacialApplication } from "./facialModel";

type ApplicationListProps = {
  applications: FacialApplication[];
  onEdit: (application: FacialApplication) => void;
  onDuplicate: (application: FacialApplication) => void;
  onDelete: (applicationId: string) => void;
  readOnly?: boolean;
};

const amountLabel = (application: FacialApplication) => application.amount === undefined ? "Dose não informada" : `${application.amount.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}${application.unit ? ` ${application.unit}` : ""}`;

export function ApplicationList({ applications, onEdit, onDuplicate, onDelete, readOnly = false }: ApplicationListProps) {
  if (!applications.length) return <p className="text-sm text-muted-foreground">Nenhuma aplicação registrada nesta região.</p>;
  return (
    <div className="space-y-2" aria-label="Aplicações nesta região">
      {applications.map((application) => (
        <article key={application.id} className="rounded-lg border border-border bg-background p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{application.productName || "Produto não informado"}</p>
              <p className="text-xs text-muted-foreground">{procedureLabel(application.procedureType)} · {amountLabel(application)}</p>
            </div>
            <Badge variant="outline">Aplicação</Badge>
          </div>
          {!readOnly && <div className="mt-2 flex flex-wrap gap-1">
            <Button type="button" variant="ghost" size="sm" className="min-h-10 gap-1" aria-label="Editar aplicação" onClick={() => onEdit(application)}><Pencil aria-hidden="true" className="h-3.5 w-3.5" />Editar</Button>
            <Button type="button" variant="ghost" size="sm" className="min-h-10 gap-1" aria-label="Duplicar aplicação" onClick={() => onDuplicate(application)}><Copy aria-hidden="true" className="h-3.5 w-3.5" />Duplicar</Button>
            <Button type="button" variant="ghost" size="sm" className="min-h-10 gap-1 text-destructive hover:text-destructive" aria-label="Excluir aplicação" onClick={() => onDelete(application.id)}><Trash2 aria-hidden="true" className="h-3.5 w-3.5" />Excluir</Button>
          </div>}
        </article>
      ))}
    </div>
  );
}

export default ApplicationList;
