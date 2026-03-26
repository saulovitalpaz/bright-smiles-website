import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pill, Trash2, ChevronLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Treatment } from "@/lib/mock-data";
import { LudicCard } from "@/components/ui/LudicCard";
import { Syringe, Sparkles, CheckCircle2 } from "lucide-react";

interface TratamentosTabProps {
  patientId: number;
  treatments: Treatment[];
  onAdd: (t: Treatment) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}

const TratamentosTab = ({ patientId, treatments, onAdd, onDelete, onToggle }: TratamentosTabProps) => {
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");

  const handleSave = () => {
    if (!medication.trim()) return;

    const newTreatment: Treatment = {
      id: Date.now(),
      patientId,
      medication,
      dosage,
      frequency,
      duration,
    };

    onAdd(newTreatment);

    // Reset
    setIsAdding(false);
    setMedication("");
    setDosage("");
    setFrequency("");
    setDuration("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {!isAdding ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Plano Terapêutico</h2>
            <Button onClick={() => setIsAdding(true)} className="rounded-xl gap-2 bg-primary hover:bg-primary-light">
              <Plus className="h-4 w-4" /> Novo Tratamento
            </Button>
          </div>

          {treatments.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-10 text-center text-muted-foreground">
                Nenhum tratamento registrado.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {treatments.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <LudicCard
                    title={t.medication}
                    icon={
                      t.medication.toLowerCase().includes('inj') || t.medication.toLowerCase().includes('vac') ? (
                        <Syringe className="h-6 w-6" />
                      ) : t.medication.toLowerCase().includes('laser') ? (
                        <Sparkles className="h-6 w-6" />
                      ) : (
                        <Pill className="h-6 w-6" />
                      )
                    }
                    accentColor={t.completed ? "bg-emerald-100/50 border-emerald-200" : "bg-primary/10 border-primary/20"}
                    className="h-full flex flex-col"
                  >
                    <div className="flex-1 space-y-2 mb-4">
                      <p className="text-sm font-medium text-foreground">
                        <strong>Dosagem:</strong> {t.dosage}
                      </p>
                      <p className="text-sm text-foreground">
                        <strong>Freq:</strong> {t.frequency}
                      </p>
                      <p className="text-sm text-foreground">
                        <strong>Duração:</strong> {t.duration}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <button
                        onClick={() => onToggle(t.id)}
                        className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${t.completed
                          ? "text-emerald-600 hover:text-emerald-700"
                          : "text-primary hover:text-primary-light"
                          }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {t.completed ? "Concluído (Desmarcar)" : "Marcar como Concluído"}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(t.id)}
                        title="Excluir Tratamento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </LudicCard>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Form */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => setIsAdding(false)} className="rounded-xl">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold text-foreground">Novo Tratamento</h2>
          </div>

          <Card className="border-none shadow-md bg-card">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Medicamento / Suplemento</Label>
                <Input
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                  placeholder="Ex: Meloxicam, Condroitina..."
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Dosagem</Label>
                  <Input
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="Ex: 500mg, 2 gotas..."
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Input
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    placeholder="Ex: 1x ao dia, 12/12h..."
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duração</Label>
                  <Input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Ex: 15 dias, Uso contínuo..."
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl">
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={!medication.trim()} className="rounded-xl gap-2">
                  <Save className="h-4 w-4" /> Salvar Item
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TratamentosTab;
