import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ApplicationEditor, { type FacialApplicationDraft } from "./ApplicationEditor";
import ApplicationList from "./ApplicationList";
import ProcedureSelector from "./ProcedureSelector";
import { regionLabel, type FacialApplication, type FacialProcedureType, type FacialRegion } from "./facialModel";

type RegionInspectorProps = {
  region: FacialRegion | null;
  applications: FacialApplication[];
  procedureType: FacialProcedureType;
  readOnly?: boolean;
  editingApplication?: FacialApplication | null;
  onProcedureChange: (value: FacialProcedureType) => void;
  onDraftChange?: (draft: FacialApplicationDraft) => void;
  onRegister: (draft: FacialApplicationDraft) => void;
  onEdit: (application: FacialApplication) => void;
  onDuplicate: (application: FacialApplication) => void;
  onDelete: (applicationId: string) => void;
  onCancelEdit?: () => void;
};

export function RegionInspector({ region, applications, procedureType, readOnly = false, editingApplication, onProcedureChange, onDraftChange, onRegister, onEdit, onDuplicate, onDelete, onCancelEdit }: RegionInspectorProps) {
  if (!region) {
    return <Card className="h-full"><CardContent className="flex min-h-64 items-center justify-center p-6 text-center text-sm text-muted-foreground">Selecione uma região no mapa</CardContent></Card>;
  }

  const totalUnits = applications.filter((application) => application.unit === "U").reduce((total, application) => total + (application.amount ?? 0), 0);
  const totalMl = applications.filter((application) => application.unit === "ml").reduce((total, application) => total + (application.amount ?? 0), 0);
  const regionTotal = [totalUnits ? `${totalUnits.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} U` : "", totalMl ? `${totalMl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ml` : ""].filter(Boolean).join(" · ");

  return (
    <Card className="flex min-h-0 h-full flex-col">
      <CardHeader className="shrink-0 border-b border-border pb-3">
        <div className="flex items-start justify-between gap-3">
          <div><CardTitle className="text-lg">{regionLabel(region)}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{region.group}</p></div>
          {applications.length > 0 && <Badge variant="secondary">{applications.length} aplicação{applications.length > 1 ? "ões" : ""}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="facial-inspector-scroll space-y-5 p-4">
        {!readOnly && <>
          <ProcedureSelector value={procedureType} onChange={onProcedureChange} />
          <div className="space-y-2"><h3 className="text-sm font-semibold">{editingApplication ? "Editar aplicação" : "Nova aplicação"}</h3><ApplicationEditor regionId={region.id} procedureType={procedureType} application={editingApplication} onSave={onRegister} onDraftChange={onDraftChange} onCancel={editingApplication ? onCancelEdit : undefined} /></div>
        </>}
        <div className={`${readOnly ? "" : "border-t border-border pt-4"} space-y-2`}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Aplicações nesta região</h3>{regionTotal && <span className="text-xs font-medium text-muted-foreground">Total da região: {regionTotal}</span>}</div><ApplicationList applications={applications} readOnly={readOnly} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} /></div>
      </CardContent>
    </Card>
  );
}

export default RegionInspector;
