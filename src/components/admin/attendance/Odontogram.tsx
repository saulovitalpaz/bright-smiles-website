import { useEffect, useMemo, useState, type JSX } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnatomicalTooth } from "./odontogram/AnatomicalTooth";
import { ClinicalConditionEditor } from "./odontogram/ClinicalConditionEditor";
import { ClinicalConditionList } from "./odontogram/ClinicalConditionList";
import { OcclusalTooth } from "./odontogram/OcclusalTooth";
import { OdontogramLegend } from "./odontogram/OdontogramLegend";
import {
  getClinicalStageLabel, getConditionDisplayName, getConditionTargetLabel, getConditionVisual,
  getTeethForDentition, getTooth, normalizeOdontogram, removeCondition, upsertCondition,
  type ClinicalCondition, type Dentition, type OdontogramData,
} from "./odontogram/odontogramModel";
import { derivePatientAge } from "@/lib/patient-age";

export type { ToothData, ToothFaceData } from "./odontogram/odontogramModel";

interface OdontogramProps {
  data: OdontogramData;
  onChange: (data: OdontogramData) => void;
  readOnly?: boolean;
  printable?: boolean;
  birthDate?: string | Date | null;
  dentition?: Dentition;
}

const Odontogram = ({ data, onChange, readOnly = false, printable = false, birthDate = null, dentition }: OdontogramProps): JSX.Element => {
  const derivedDentition = derivePatientAge(birthDate).dentition;
  const requestedDentition = dentition ?? (derivedDentition === "legacy" ? "permanent" : derivedDentition);
  const layeredData = useMemo(() => {
    const normalized = normalizeOdontogram(data);
    return !("version" in data) && birthDate && derivedDentition !== "legacy"
      ? { ...normalized, version: 3 as const, dentition: requestedDentition }
      : normalized;
  }, [data, birthDate, derivedDentition, requestedDentition]);
  const activeDentition = layeredData.version === 3 ? layeredData.dentition : requestedDentition;
  const teeth = getTeethForDentition(activeDentition);
  const upper = teeth.filter((number) => (number >= 11 && number <= 28) || (number >= 51 && number <= 65));
  const lower = teeth.filter((number) => !upper.includes(number));
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [editingCondition, setEditingCondition] = useState<ClinicalCondition | null>(null);
  const closeEditor = () => { setSelectedTooth(null); setEditingCondition(null); };

  useEffect(() => {
    if (readOnly) { setSelectedTooth(null); setEditingCondition(null); }
  }, [readOnly]);

  const renderRow = (numbers: readonly number[]) => (
    <div className="odontogram-grid">
      {numbers.map((number) => {
        const record = layeredData.teeth[String(number)];
        const legacyTooth = "version" in data ? { status: "Saudável" as const, notes: record?.notes ?? "" } : getTooth(data, number);
        const details = record?.conditions.map((condition) =>
          `${getConditionDisplayName(condition.type)} (${getClinicalStageLabel(condition.stage)}): ${condition.targets.map((target) => getConditionTargetLabel(number, target)).join(", ")}`,
        );
        const content = <>
          <span className="font-mono text-[10px] text-slate-500">{number}</span>
          <AnatomicalTooth record={record} toothNumber={number} data={legacyTooth} />
          <OcclusalTooth record={record} toothNumber={number} />
          {record?.conditions.length ? (
            <span className="flex w-full min-w-0 flex-col gap-1" aria-label={`Afecções do dente ${number}`}>
              {record.conditions.map((condition, index) => (
                <span key={condition.id} title={details?.[index]} className="break-words rounded border px-0.5 py-1 text-center text-[9px] leading-tight"
                  style={{ borderColor: getConditionVisual(condition).stroke, backgroundColor: getConditionVisual(condition).fill, color: "#0f172a" }}>
                  {getConditionDisplayName(condition.type)}
                </span>
              ))}
            </span>
          ) : null}
        </>;
        return readOnly ? (
          <div className="relative flex min-w-0 flex-col items-center gap-0.5" key={number}>{content}</div>
        ) : (
          <button aria-label={`Abrir dente ${number}, ${details?.length ? details.join("; ") : "condição " + legacyTooth.status}`}
            className="relative flex min-h-11 min-w-0 flex-col items-center gap-0.5 rounded-lg touch-manipulation hover:bg-slate-800/50"
            key={number} onClick={() => { setEditingCondition(null); setSelectedTooth(number); }} type="button">{content}</button>
        );
      })}
    </div>
  );
  const selectedRecord = selectedTooth === null ? null : layeredData.teeth[String(selectedTooth)];
  const recorded = teeth.filter((number) => {
    const record = layeredData.teeth[String(number)];
    return record && (record.notes || record.conditions.length);
  });

  return (
    <Card className={`odontogram-card overflow-hidden border-slate-800 bg-[#0a1120] text-slate-200 shadow-2xl${printable ? " odontogram-card--printable" : ""}`} data-printable={printable || undefined}>
      <CardHeader className="odontogram-header border-b border-slate-800/70 p-4 sm:p-6">
        <CardTitle className="font-serif text-xl tracking-wide text-white">Odontograma</CardTitle>
        <CardDescription className="text-sm text-slate-400">Selecione o dente para registrar a condição e suas regiões diretamente no formulário clínico.</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 touch-pan-y overflow-x-hidden p-2 min-[360px]:p-3 sm:p-6">
        <div className="flex w-full min-w-0 flex-col gap-4">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Arcada Superior</p>
          {renderRow(upper)}
          <p className="text-center text-[9px] uppercase tracking-widest text-slate-600">Linha Oclusal</p>
          {renderRow(lower)}
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Arcada Inferior</p>
        </div>
        <OdontogramLegend />
        {readOnly && recorded.length > 0 ? (
          <section aria-label="Resumo Clínico" className="mt-8 space-y-3">
            <h4 className="text-xs font-bold text-slate-400">Resumo Clínico</h4>
            <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {recorded.map((number) => <article className="min-w-0 rounded-xl border border-slate-700/50 bg-slate-800/50 p-3" key={number}>
                <span className="text-sm font-bold">{number}</span>
                <ClinicalConditionList conditions={layeredData.teeth[String(number)].conditions} readOnly toothNumber={number} />
                {layeredData.teeth[String(number)].notes ? <p className="mt-2 break-words text-xs text-slate-400">{layeredData.teeth[String(number)].notes}</p> : null}
              </article>)}
            </div>
          </section>
        ) : null}
      </CardContent>
      <Dialog open={!readOnly && selectedTooth !== null} onOpenChange={(open) => { if (!open) closeEditor(); }}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] min-w-0 max-w-[540px] overscroll-y-contain overflow-x-hidden overflow-y-auto border-slate-800 bg-[#0a1120] p-4 text-slate-200 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-white">Dente {selectedTooth}</DialogTitle>
            <DialogDescription className="text-slate-400">Selecione as regiões precisas no formulário clínico para registrar a ocorrência.</DialogDescription>
          </DialogHeader>
          {selectedTooth !== null ? <div className="min-w-0 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="odontogram-notes">Observações Clínicas</Label>
              <Input id="odontogram-notes" className="border-slate-700 bg-slate-900 text-slate-200" value={selectedRecord?.notes ?? ""}
                onChange={(event) => {
                  if (readOnly) return;
                  onChange({ ...layeredData, teeth: { ...layeredData.teeth, [selectedTooth]: { notes: event.target.value, conditions: selectedRecord?.conditions ?? [] } } });
                }} />
            </div>
            <section className="min-w-0 rounded-xl border border-slate-700 bg-slate-950/30 p-3">
              <h3 className="mb-3 text-sm font-semibold text-white">Ocorrências registradas</h3>
              <ClinicalConditionList conditions={selectedRecord?.conditions ?? []} onEdit={setEditingCondition} toothNumber={selectedTooth}
                onRemove={(id) => {
                  if (readOnly) return;
                  onChange(removeCondition(layeredData, selectedTooth, id));
                  if (editingCondition?.id === id) setEditingCondition(null);
                }} />
              <div className="mt-5 border-t border-slate-700 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-white">Registro clínico em camadas</h3>
                <ClinicalConditionEditor key={selectedTooth} initialCondition={editingCondition} toothNumber={selectedTooth}
                  onCancel={() => setEditingCondition(null)}
                  onSave={(condition) => {
                    if (readOnly) return;
                    onChange(upsertCondition(layeredData, selectedTooth, condition));
                    setEditingCondition(null);
                  }} />
              </div>
            </section>
          </div> : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default Odontogram;
