import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Calendar, Trash2, ChevronLeft, Activity, Stethoscope, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Consultation } from "@/lib/mock-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface ConsultasTabProps {
  patientId: number;
  consultations: Consultation[];
  onAdd: (c: Consultation) => void;
  onDelete: (id: number) => void;
}

const painOptions = [
  { value: 0, emoji: "😀", label: "Sem dor" },
  { value: 1, emoji: "🙂", label: "Dor Leve" },
  { value: 2, emoji: "😐", label: "Desconforto" },
  { value: 3, emoji: "😟", label: "Dor Moderada" },
  { value: 4, emoji: "😫", label: "Dor Intensa" },
  { value: 5, emoji: "😭", label: "Dor Severa" },
];

const availableProcedures = [
  "Acupuntura",
  "Cinesioterapia",
  "Laserterapia",
  "Magnetoterapia",
  "Ozonioterapia",
  "Eletroterapia",
  "Goniometria",
  "Massoterapia",
  "Hidroterapia",
];

const ConsultasTab = ({ patientId, consultations, onAdd, onDelete }: ConsultasTabProps) => {
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toLocaleDateString("pt-BR"));
  const [painLevel, setPainLevel] = useState<number | undefined>(undefined);
  const [complaint, setComplaint] = useState("");
  const [anamnesis, setAnamnesis] = useState("");
  const [inspection, setInspection] = useState("");
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [conduct, setConduct] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleProcedure = (proc: string) => {
    setSelectedProcedures(prev =>
      prev.includes(proc) ? prev.filter(p => p !== proc) : [...prev, proc]
    );
  };

  const handleSave = async () => {
    if (!complaint.trim()) return;
    setIsSaving(true);

    try {
      const consultData = {
        date,
        painLevel,
        complaint,
        anamnesis,
        inspection,
        procedures: selectedProcedures,
        diagnosis,
        conduct,
      };

      const res = await fetch(`/api/patients/${patientId}/consultations/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consultData),
      });

      if (!res.ok) throw new Error("Erro ao salvar a consulta");
      const savedConsultation = await res.json();

      const attachmentsList = [];
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          const attRes = await fetch(`/api/consultations/${savedConsultation.id}/attachments/`, {
            method: "POST",
            body: formData,
          });
          if (attRes.ok) {
            attachmentsList.push(await attRes.json());
          }
        }
      }

      savedConsultation.attachments = attachmentsList;
      onAdd(savedConsultation);

      setIsAdding(false);
      setDate(new Date().toLocaleDateString("pt-BR"));
      setPainLevel(undefined);
      setComplaint("");
      setAnamnesis("");
      setInspection("");
      setSelectedProcedures([]);
      setDiagnosis("");
      setConduct("");
      setSelectedFiles([]);
    } catch (err) {
      console.error(err);
      alert("Falha ao salvar atendimento.");
    } finally {
      setIsSaving(false);
    }
  };

  // Prepare chart data (chronological order)
  const chartData = [...consultations]
    .filter(c => c.painLevel !== undefined)
    .reverse()
    .map(c => ({
      date: c.date.substring(0, 5),
      dor: c.painLevel,
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-6"
    >
      {!isAdding ? (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Consultas e Evolução Fisiátrica</h2>
            <Button onClick={() => setIsAdding(true)} className="rounded-xl gap-2 bg-primary hover:bg-primary-light w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Nova Consulta
            </Button>
          </div>

          {/* Pain Evolution Chart */}
          {chartData.length > 0 && (
            <Card className="border-none shadow-sm bg-card mb-4 sm:mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-primary">
                  <Activity className="h-4 w-4" /> Gráfico de Melhora (Dor)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.75rem",
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="dor"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--primary))", r: 5 }}
                        name="Nível de Dor"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {consultations.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-8 sm:p-10 text-center text-muted-foreground">
                Nenhuma consulta registrada para este paciente.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {consultations.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-none shadow-sm bg-card border-l-4 border-l-primary hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                          <Calendar className="h-4 w-4" /> {c.date}
                        </span>
                        <div className="flex items-center gap-2">
                          {c.painLevel !== undefined && (
                            <span className={cn(
                              "px-2 py-1 text-xs font-bold rounded-full",
                              c.painLevel >= 4 ? "bg-red-100 text-red-700" : c.painLevel >= 2 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                            )}>
                              {painOptions.find(p => p.value === c.painLevel)?.emoji} {c.painLevel}/5
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => onDelete(c.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-3">
                          {c.complaint && (
                            <div>
                              <span className="text-xs font-bold text-muted-foreground uppercase">Queixa Principal:</span>
                              <p className="text-sm text-foreground">{c.complaint}</p>
                            </div>
                          )}
                          {c.anamnesis && (
                            <div>
                              <span className="text-xs font-bold text-muted-foreground uppercase">Anamnese:</span>
                              <p className="text-sm text-foreground">{c.anamnesis}</p>
                            </div>
                          )}
                          {c.inspection && (
                            <div>
                              <span className="text-xs font-bold text-muted-foreground uppercase">Inspeção/Físico:</span>
                              <p className="text-sm text-foreground">{c.inspection}</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          {c.procedures && c.procedures.length > 0 && (
                            <div>
                              <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">Procedimentos:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {c.procedures.map(proc => (
                                  <span key={proc} className="bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-md">
                                    {proc}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {c.diagnosis && (
                            <div>
                              <span className="text-xs font-bold text-muted-foreground uppercase">Diagnóstico/Evolução:</span>
                              <p className="text-sm text-foreground">{c.diagnosis}</p>
                            </div>
                          )}
                          {c.conduct && (
                            <div>
                              <span className="text-xs font-bold text-muted-foreground uppercase">Conduta:</span>
                              <p className="text-sm text-foreground">{c.conduct}</p>
                            </div>
                          )}

                          {/* Attachments */}
                          {c.attachments && c.attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-2">
                                <ImageIcon className="h-4 w-4" /> Anexos e Imagens
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {c.attachments.map(att => (
                                  <a
                                    key={att.id}
                                    href={`/api/consultations/attachments/${att.id}/view`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative group border border-border rounded-lg overflow-hidden shrink-0 w-20 h-20 sm:w-24 sm:h-24 block shadow-sm hover:shadow-md transition-all"
                                  >
                                    <img
                                      src={`/api/consultations/attachments/${att.id}/view`}
                                      alt={att.file_name}
                                      className="w-full h-full object-cover"
                                    />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Add New Consultation Form */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4 sm:space-y-6"
        >
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setIsAdding(false)} className="rounded-xl h-10 w-10 shrink-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary shrink-0" /> Registrar Atendimento
            </h2>
          </div>

          <Card className="border-none shadow-md bg-card">
            <CardContent className="p-4 sm:p-6 space-y-6">
              {/* Row 1: Date & Pain */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-primary">Data do Atendimento</Label>
                  <Input value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl h-11" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-primary">Escala de Dor (0 a 5)</Label>
                  <div className="flex justify-between gap-0.5 sm:gap-1 p-1.5 sm:p-2 bg-muted/30 rounded-xl border border-border">
                    {painOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setPainLevel(opt.value)}
                        className={cn(
                          "flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg transition-all flex-1",
                          painLevel === opt.value
                            ? "bg-primary text-primary-foreground shadow-md scale-105"
                            : "hover:bg-muted text-muted-foreground"
                        )}
                        title={opt.label}
                      >
                        <span className="text-xl sm:text-2xl">{opt.emoji}</span>
                        <span className="text-[9px] sm:text-[10px] font-semibold mt-0.5 hidden sm:block">{opt.value}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: Text fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground">Queixa Principal *</Label>
                  <Input
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    placeholder="Ex: Claudicação, Revisão..."
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground">Anamnese</Label>
                  <Textarea
                    value={anamnesis}
                    onChange={(e) => setAnamnesis(e.target.value)}
                    placeholder="Histórico do quadro atual..."
                    className="rounded-xl resize-none min-h-[42px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground">Inspeção Funcional / Físico</Label>
                  <Textarea
                    value={inspection}
                    onChange={(e) => setInspection(e.target.value)}
                    placeholder="Tônus, atrofia, posturas..."
                    className="rounded-xl resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-foreground">Diagnóstico / Evolução</Label>
                  <Textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Conclusão do atendimento..."
                    className="rounded-xl resize-none"
                  />
                </div>
              </div>

              {/* Row 3: Procedures */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-foreground border-b border-border pb-2 block">
                  Procedimentos Realizados (Fisiatria)
                </Label>
                <div className="flex flex-wrap gap-2 pt-2">
                  {availableProcedures.map(proc => {
                    const isSelected = selectedProcedures.includes(proc);
                    return (
                      <button
                        key={proc}
                        onClick={() => toggleProcedure(proc)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border",
                          isSelected
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-transparent border-border text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        {isSelected ? "✓ " : ""}{proc}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-foreground">Conduta / Parecer</Label>
                <Textarea
                  value={conduct}
                  onChange={(e) => setConduct(e.target.value)}
                  placeholder="Orientações e próximos passos..."
                  className="rounded-xl resize-none"
                />
              </div>

              {/* Anexos */}
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-bold text-foreground block">
                  Imagens e Anexos
                </Label>
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl cursor-pointer transition-colors border border-border text-sm">
                    <ImageIcon className="h-4 w-4" /> Escolher fotos...
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                        }
                      }}
                    />
                  </label>

                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="relative group w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-border shadow-sm">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${idx}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <X className="h-5 w-5 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-border">
                <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl" disabled={isSaving}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!complaint.trim() || isSaving}
                  className="rounded-xl bg-primary hover:bg-primary-light"
                >
                  {isSaving ? "Salvando..." : "Salvar Atendimento"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ConsultasTab;
