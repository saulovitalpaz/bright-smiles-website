import { useEffect, useState, type JSX } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnatomicalTooth } from "./odontogram/AnatomicalTooth";
import {
  getFaceLabels,
  getTooth,
  updateToothFace,
  updateWholeTooth,
  type FaceKey,
  type FaceStatus,
  type ToothData,
  type ToothStatus,
  type WholeToothStatus,
} from "./odontogram/odontogramModel";
import { ToothSurfaceSelector } from "./odontogram/ToothSurfaceSelector";

export type { ToothData, ToothFaceData } from "./odontogram/odontogramModel";

interface OdontogramProps {
  data: Record<string, ToothData>;
  onChange: (data: Record<string, ToothData>) => void;
  readOnly?: boolean;
  printable?: boolean;
}

const TEETH_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const TEETH_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const FACE_CONDITIONS: ReadonlyArray<{ label: string; value: FaceStatus }> = [
  { label: "Saudável", value: "Saudável" },
  { label: "A tratar", value: "Tratar" },
  { label: "Tratada", value: "Tratado" },
];

const WHOLE_TOOTH_CONDITIONS: readonly WholeToothStatus[] = [
  "Saudável",
  "Ausente",
  "Implante",
  "Ponte",
];

const LEGEND_STATUSES: readonly ToothStatus[] = [
  "Saudável",
  "Tratar",
  "Tratado",
  "Ausente",
  "Implante",
  "Ponte",
];

const STATUS_STYLES: Record<ToothStatus, { badge: string; dot: string }> = {
  Saudável: {
    badge: "border-slate-500/40 bg-white/10 text-slate-100",
    dot: "linear-gradient(135deg,#fff 0%,#d7d0b8 100%)",
  },
  Tratar: {
    badge: "border-red-500/40 bg-red-500/15 text-red-200",
    dot: "repeating-linear-gradient(45deg,#b42318 0 2px,#fce8e6 2px 4px)",
  },
  Tratado: {
    badge: "border-cyan-500/40 bg-cyan-500/15 text-cyan-100",
    dot: "#0e7490",
  },
  Ausente: {
    badge: "border-slate-600 bg-slate-800/60 text-slate-400",
    dot: "transparent",
  },
  Implante: {
    badge: "border-violet-500/40 bg-violet-500/15 text-violet-200",
    dot: "#8b5cf6",
  },
  Ponte: {
    badge: "border-amber-500/40 bg-amber-500/15 text-amber-200",
    dot: "#f59e0b",
  },
};

function isRecorded(tooth: ToothData): boolean {
  return (
    tooth.status !== "Saudável" ||
    Boolean(tooth.notes) ||
    Boolean(tooth.faces && Object.keys(tooth.faces).length)
  );
}

function ConditionButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      aria-pressed={active}
      className={`min-h-11 min-w-0 rounded-xl border px-3 py-2 text-sm font-medium touch-manipulation transition-colors ${
        active
          ? "border-blue-400 bg-blue-500/20 text-white ring-1 ring-blue-400"
          : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

const Odontogram = ({
  data = {},
  onChange,
  readOnly = false,
  printable = false,
}: OdontogramProps): JSX.Element => {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedFace, setSelectedFace] = useState<FaceKey | null>(null);
  const [wholeToothOpen, setWholeToothOpen] = useState(false);

  useEffect(() => {
    if (!readOnly) return;
    setSelectedTooth(null);
    setSelectedFace(null);
    setWholeToothOpen(false);
  }, [readOnly]);

  const openTooth = (toothNumber: number): void => {
    if (readOnly) return;
    setSelectedTooth(toothNumber);
    setSelectedFace(null);
    setWholeToothOpen(false);
  };

  const closeEditor = (): void => {
    setSelectedTooth(null);
    setSelectedFace(null);
    setWholeToothOpen(false);
  };

  const setFaceCondition = (status: FaceStatus): void => {
    if (readOnly || selectedTooth === null || selectedFace === null) return;
    onChange(updateToothFace(data, selectedTooth, selectedFace, status));
  };

  const setWholeToothCondition = (status: WholeToothStatus): void => {
    if (readOnly || selectedTooth === null) return;
    onChange(updateWholeTooth(data, selectedTooth, status));
  };

  const setNotes = (notes: string): void => {
    if (readOnly || selectedTooth === null) return;
    onChange({
      ...data,
      [selectedTooth]: { ...getTooth(data, selectedTooth), notes },
    });
  };

  const recorded = Object.keys(data).filter((key) => isRecorded(data[key]));

  const TeethRow = ({ teeth }: { teeth: readonly number[] }): JSX.Element => (
    <div className="odontogram-grid">
      {teeth.map((toothNumber) => {
        const tooth = getTooth(data, toothNumber);
        const content = (
          <>
            <span className="font-mono text-[10px] text-slate-500">{toothNumber}</span>
            <AnatomicalTooth toothNumber={toothNumber} data={tooth} />
            {isRecorded(tooth) ? (
              <span
                aria-hidden="true"
                className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,.8)]"
              />
            ) : null}
          </>
        );

        if (readOnly) {
          return (
            <div className="relative flex min-w-0 flex-col items-center gap-0.5" key={toothNumber}>
              {content}
            </div>
          );
        }

        return (
          <button
            aria-label={`Abrir dente ${toothNumber}, condição ${tooth.status}`}
            className="relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg touch-manipulation hover:bg-slate-800/50"
            key={toothNumber}
            onClick={() => openTooth(toothNumber)}
            type="button"
          >
            {content}
          </button>
        );
      })}
    </div>
  );

  const selectedData = selectedTooth === null ? null : getTooth(data, selectedTooth);
  const selectedLabels = selectedTooth === null ? null : getFaceLabels(selectedTooth);

  return (
    <Card
      className={`odontogram-card overflow-hidden border-slate-800 bg-[#0a1120] text-slate-200 shadow-2xl${
        printable ? " odontogram-card--printable" : ""
      }`}
      data-printable={printable || undefined}
    >
      <CardHeader className="odontogram-header border-b border-slate-800/70 bg-gradient-to-r from-[#0f172a] to-[#0a1120] p-4 pb-4 sm:p-6 sm:pb-4">
        <CardTitle className="font-serif text-xl tracking-wide text-white">Odontograma</CardTitle>
        <CardDescription className="text-sm text-slate-400">
          Selecione o dente e depois a face exata antes de registrar a condição.
        </CardDescription>
      </CardHeader>

      <CardContent className="min-w-0 touch-pan-y overflow-x-hidden p-2 min-[360px]:p-3 sm:p-6">
        <div className="flex w-full min-w-0 flex-col gap-4">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
            Arcada Superior
          </p>
          <TeethRow teeth={TEETH_UPPER} />

          <div className="my-1 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <span className="text-[9px] uppercase tracking-widest text-slate-600">Linha Oclusal</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          </div>

          <TeethRow teeth={TEETH_LOWER} />
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
            Arcada Inferior
          </p>
        </div>

        <div className="odontogram-legend mt-7 flex min-w-0 flex-wrap items-center justify-center gap-3 rounded-xl border border-slate-800 bg-[#0f172a] p-3 sm:p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Legenda:</span>
          {LEGEND_STATUSES.map((status) => (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300" key={status}>
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-full ring-1 ring-white/15"
                style={{ background: STATUS_STYLES[status].dot }}
              />
              {status}
            </div>
          ))}
        </div>

        {readOnly && recorded.length > 0 ? (
          <section aria-labelledby="odontogram-summary" className="mt-8 space-y-3">
            <h4
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
              id="odontogram-summary"
            >
              Resumo Clínico
            </h4>
            <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {recorded.map((toothNumber) => {
                const tooth = data[toothNumber];
                const labels = getFaceLabels(Number(toothNumber));

                return (
                  <article
                    className="min-w-0 rounded-xl border border-slate-700/50 bg-slate-800/50 p-3"
                    key={toothNumber}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                        {toothNumber}
                      </span>
                      <Badge
                        className={`min-w-0 max-w-full text-[10px] ${STATUS_STYLES[tooth.status].badge}`}
                        variant="outline"
                      >
                        {tooth.status}
                      </Badge>
                    </div>
                    {tooth.faces ? (
                      <div className="mt-2 flex min-w-0 flex-wrap gap-1">
                        {Object.entries(tooth.faces)
                          .filter((entry) => entry[1]?.status !== "Saudável")
                          .map(([face, faceData]) => (
                            <Badge
                              className="max-w-full whitespace-normal break-words border-slate-700 bg-slate-900 text-[9px] text-slate-300"
                              key={face}
                              variant="secondary"
                            >
                              {labels[face as FaceKey]}: {faceData?.status}
                            </Badge>
                          ))}
                      </div>
                    ) : null}
                    {tooth.notes ? (
                      <p className="mt-2 break-words border-t border-slate-700 pt-2 text-xs italic text-slate-400">
                        “{tooth.notes}”
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </CardContent>

      <Dialog
        onOpenChange={(open) => {
          if (!open) closeEditor();
        }}
        open={!readOnly && selectedTooth !== null}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] min-w-0 max-w-[540px] overscroll-y-contain overflow-x-hidden overflow-y-auto border-slate-800 bg-[#0a1120] p-4 text-slate-200 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-white">Dente {selectedTooth}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Selecione uma face para registrar sua condição clínica.
            </DialogDescription>
          </DialogHeader>

          {selectedTooth !== null && selectedData && selectedLabels ? (
            <div className="flex min-w-0 flex-col gap-5 pt-1">
              <div className="grid min-w-0 grid-cols-1 gap-5 rounded-xl border border-slate-800 bg-[#0f172a] p-3 sm:grid-cols-[minmax(0,.75fr)_minmax(0,1.25fr)] sm:p-5">
                <div className="flex min-w-0 flex-col items-center gap-2">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500">Anatomia</span>
                  <AnatomicalTooth
                    data={selectedData}
                    selected
                    size="editor"
                    toothNumber={selectedTooth}
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <span className="text-center text-[9px] uppercase tracking-wider text-slate-500">
                    Selecione a face
                  </span>
                  <ToothSurfaceSelector
                    data={selectedData}
                    onSelectFace={(face) => {
                      setSelectedFace(face);
                      setWholeToothOpen(false);
                    }}
                    selectedFace={selectedFace}
                    toothNumber={selectedTooth}
                    readOnly={readOnly}
                  />
                </div>
              </div>

              {selectedFace ? (
                <section className="min-w-0 rounded-xl border border-blue-800/40 bg-blue-900/10 p-3 sm:p-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-blue-300">
                    Face selecionada: {selectedLabels[selectedFace]}
                  </p>
                  <div className="grid min-w-0 grid-cols-1 gap-2 min-[360px]:grid-cols-3">
                    {FACE_CONDITIONS.map((condition) => (
                      <ConditionButton
                        active={
                          (selectedData.faces?.[selectedFace]?.status ?? "Saudável") === condition.value
                        }
                        key={condition.value}
                        label={condition.label}
                        onClick={() => setFaceCondition(condition.value)}
                      />
                    ))}
                  </div>
                </section>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-3 text-center text-sm text-slate-400">
                  Toque primeiro na face exata que será avaliada.
                </p>
              )}

              <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/40">
                <button
                  aria-expanded={wholeToothOpen}
                  className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-200 touch-manipulation hover:bg-slate-800/60"
                  onClick={() => setWholeToothOpen((open) => !open)}
                  type="button"
                >
                  <span>Dente inteiro</span>
                  <span aria-hidden="true" className="text-slate-500">
                    {wholeToothOpen ? "−" : "+"}
                  </span>
                </button>
                {wholeToothOpen ? (
                  <div className="grid min-w-0 grid-cols-2 gap-2 border-t border-slate-800 p-3 sm:grid-cols-4">
                    {WHOLE_TOOTH_CONDITIONS.map((status) => (
                      <ConditionButton
                        active={selectedData.status === status}
                        key={status}
                        label={status}
                        onClick={() => setWholeToothCondition(status)}
                      />
                    ))}
                  </div>
                ) : null}
              </section>

              <div className="min-w-0 space-y-1.5">
                <Label
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                  htmlFor="odontogram-notes"
                >
                  Observações Clínicas
                </Label>
                <Input
                  className="min-w-0 border-slate-700 bg-slate-900/60 text-slate-200 placeholder:text-slate-600 focus-visible:ring-slate-600"
                  id="odontogram-notes"
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Descreva particularidades, prognóstico..."
                  value={selectedData.notes || ""}
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default Odontogram;
