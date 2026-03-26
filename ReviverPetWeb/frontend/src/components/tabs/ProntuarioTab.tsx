import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  User, Phone, Calendar, AlertTriangle,
  Stethoscope, Pill, FileText, Dog,
  ChevronDown, ChevronUp, ClipboardList, Camera, Upload
} from "lucide-react";
import { Patient, Consultation, Treatment, Document } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Activity } from "lucide-react";

interface ProntuarioTabProps {
  patient: Patient;
  onChange: (updated: Patient) => void;
  consultations: Consultation[];
  treatments: Treatment[];
  documents: Document[];
  metrics: any[];
}

interface HistoryGroupProps {
  icon: React.ReactNode;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

const HistoryGroup = ({ icon, title, color, count, children }: HistoryGroupProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-left transition-colors",
          open ? "bg-muted/60" : "bg-card hover:bg-muted/30"
        )}
      >
        <span className="flex items-center gap-2 font-semibold text-sm text-foreground">
          <span className={color}>{icon}</span>
          {title}
          <span className="ml-1 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {count}
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="border-t border-border divide-y divide-border">
          {children}
        </div>
      )}
    </div>
  );
};

const ProntuarioTab = ({
  patient,
  onChange,
  consultations,
  treatments,
  documents,
  metrics,
}: ProntuarioTabProps) => {
  const { toast } = useToast();

  const update = (field: keyof Patient, value: string) => {
    onChange({ ...patient, [field]: value });
  };

  const hasHistory =
    consultations.length > 0 ||
    treatments.length > 0 ||
    documents.length > 0 ||
    (metrics && metrics.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Patient card */}
      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-8">
            {/* Photo */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative group">
                <div className="w-36 h-36 rounded-2xl bg-muted border-4 border-card shadow-lg flex items-center justify-center text-5xl overflow-hidden">
                  {patient.photo ? (
                    <img src={patient.photo.startsWith('http') ? patient.photo : `/api/patients/${patient.id}/photo?t=${new Date().getTime()}`} alt={patient.name} className="w-full h-full object-cover" />
                  ) : (
                    patient.species === "Cão" ? "🐕" : "🐈"
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                  <Camera className="h-8 w-8 text-white" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const formData = new FormData();
                      formData.append("file", file);

                      try {
                        const response = await fetch(`/api/patients/${patient.id}/photo/`, {
                          method: "POST",
                          body: formData,
                        });

                        if (response.ok) {
                          // Update photo to force reload from backend
                          onChange({ ...patient, photo: `/api/patients/${patient.id}/photo?t=${new Date().getTime()}` });
                          toast({ title: "Foto de perfil atualizada!" });
                        } else {
                          toast({ title: "Erro ao atualizar a foto.", variant: "destructive" });
                        }
                      } catch (err) {
                        toast({ title: "Verifique a conexão", description: "O servidor parece estar indisponível.", variant: "destructive" })
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Nome do Paciente
                </Label>
                <Input
                  value={patient.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-primary uppercase tracking-wide">Espécie</Label>
                <Input
                  value={patient.species}
                  onChange={(e) => update("species", e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-primary uppercase tracking-wide">Raça</Label>
                <Input
                  value={patient.breed}
                  onChange={(e) => update("breed", e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> Nascimento
                </Label>
                <Input
                  value={patient.birthDate}
                  onChange={(e) => update("birthDate", e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-primary uppercase tracking-wide">Tutor(a)</Label>
                <Input
                  value={patient.tutorName}
                  onChange={(e) => update("tutorName", e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1.5">
                  <Phone className="h-3 w-3" /> Telefone
                </Label>
                <Input
                  value={patient.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card className="border-none shadow-sm bg-card border-l-4 border-l-warning">
        <CardContent className="p-6">
          <Label className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" /> Alergias e Condições
          </Label>
          <Textarea
            value={patient.conditions}
            onChange={(e) => update("conditions", e.target.value)}
            placeholder="Sem alergias ou condições registradas"
            className="rounded-xl min-h-[80px] resize-none"
          />
        </CardContent>
      </Card>

      {/* Medical History */}
      <Card className="border-none shadow-sm bg-card">
        <CardContent className="p-6">
          <Label className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
            <ClipboardList className="h-4 w-4 text-primary" /> Histórico Médico
          </Label>

          {!hasHistory ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum registro encontrado para este paciente.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Consultas */}
              {consultations.length > 0 && (
                <HistoryGroup
                  icon={<Stethoscope className="h-4 w-4" />}
                  title="Consultas"
                  color="text-primary"
                  count={consultations.length}
                >
                  {consultations.map((c) => (
                    <div key={c.id} className="px-4 py-2.5 flex items-start gap-3 text-sm hover:bg-muted/20 transition-colors">
                      <span className="text-xs font-mono font-semibold text-muted-foreground min-w-[60px] pt-0.5">
                        #{c.id} · {c.date}
                      </span>
                      <span className="text-foreground truncate">
                        <span className="font-medium">Queixa:</span> {c.complaint || "—"}
                        {c.diagnosis && (
                          <span className="text-muted-foreground ml-2">· {c.diagnosis}</span>
                        )}
                      </span>
                    </div>
                  ))}
                </HistoryGroup>
              )}

              {/* Tratamentos */}
              {treatments.length > 0 && (
                <HistoryGroup
                  icon={<Pill className="h-4 w-4" />}
                  title="Tratamentos"
                  color="text-green-600"
                  count={treatments.length}
                >
                  {treatments.map((t) => (
                    <div key={t.id} className="px-4 py-2.5 flex items-start gap-3 text-sm hover:bg-muted/20 transition-colors">
                      <span className="text-xs font-mono font-semibold text-muted-foreground min-w-[40px] pt-0.5">
                        #{t.id}
                      </span>
                      <span className="text-foreground">
                        <span className="font-medium">{t.medication}</span>
                        <span className="text-muted-foreground ml-2">
                          {t.dosage} · {t.frequency} · {t.duration}
                        </span>
                      </span>
                    </div>
                  ))}
                </HistoryGroup>
              )}



              {/* Documentos */}
              {documents.length > 0 && (
                <HistoryGroup
                  icon={<FileText className="h-4 w-4" />}
                  title="Documentos"
                  color="text-blue-600"
                  count={documents.length}
                >
                  {documents.map((d) => (
                    <div key={d.id} className="px-4 py-2.5 flex items-start gap-3 text-sm hover:bg-muted/20 transition-colors">
                      <span className="text-xs font-mono font-semibold text-muted-foreground min-w-[60px] pt-0.5">
                        #{d.id} · {d.uploadedAt}
                      </span>
                      <span className="text-foreground truncate">{d.name}</span>
                    </div>
                  ))}
                </HistoryGroup>
              )}

              {/* Exames / Resultados Lançados */}
              {metrics && metrics.length > 0 && (
                <HistoryGroup
                  icon={<Activity className="h-4 w-4" />}
                  title="Resultados de Exames"
                  color="text-amber-600"
                  count={metrics.length}
                >
                  {metrics.map((m) => (
                    <div key={m.id} className="px-4 py-2.5 flex items-start gap-3 text-sm hover:bg-muted/20 transition-colors">
                      <span className="text-xs font-mono font-semibold text-muted-foreground min-w-[60px] pt-0.5">
                        {m.date.substring(0, 5)}
                      </span>
                      <span className="text-foreground flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="font-medium">{m.metric_name}</span>
                        <span className="text-muted-foreground text-xs bg-muted px-2 py-0.5 rounded-full inline-block w-fit">
                          {m.value} {m.unit}
                          {m.reference_range && ` (Ref: ${m.reference_range})`}
                        </span>
                      </span>
                    </div>
                  ))}
                </HistoryGroup>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProntuarioTab;
