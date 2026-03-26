import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, ClipboardList, Stethoscope, FileText, Pill, Dog, Home, Plus, Search, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import PatientSidebar from "@/components/PatientSidebar";
import ProntuarioTab from "@/components/tabs/ProntuarioTab";
import ConsultasTab from "@/components/tabs/ConsultasTab";
import DocumentosTab from "@/components/tabs/DocumentosTab";
import TratamentosTab from "@/components/tabs/TratamentosTab";

import { cn } from "@/lib/utils";
import {
  mockPatients,
  mockConsultations,
  mockTreatments,
  mockDocuments,
  Patient,
  Consultation,
  Treatment,
  Document as PetDocument,
} from "@/lib/mock-data";

const tabs = [
  { id: "prontuario", label: "Prontuário", icon: ClipboardList },
  { id: "consultas", label: "Consultas", icon: Stethoscope },
  { id: "documentos", label: "Documentos", icon: FileText },
  { id: "tratamentos", label: "Tratamentos", icon: Pill },
];

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [patients, setPatients] = useState(mockPatients);
  const [allConsultations, setAllConsultations] = useState(mockConsultations);
  const [allTreatments, setAllTreatments] = useState<Treatment[]>(mockTreatments);
  const [allDocuments, setAllDocuments] = useState<PetDocument[]>(mockDocuments);
  const [allMetrics, setAllMetrics] = useState<any[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(mockPatients[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState("prontuario");

  // Carrega métricas e documentos reais do backend ao selecionar paciente
  useEffect(() => {
    if (selectedId) {
      fetch(`/api/patients/${selectedId}/metrics/`)
        .then(res => res.json())
        .then(data => setAllMetrics(data))
        .catch(err => console.error("Erro ao carregar métricas:", err));

      fetch(`/api/patients/${selectedId}/treatments/`)
        .then(res => res.json())
        .then(data => setAllTreatments(data))
        .catch(err => console.error("Erro ao carregar tratamentos:", err));

      fetch(`/api/patients/${selectedId}/consultations/`)

        .then(res => res.json())
        .then(data => setAllConsultations(data))
        .catch(err => console.error("Erro ao carregar consultas:", err));

      fetch(`/api/patients/${selectedId}/documents/`)
        .then(res => res.json())
        .then(data => {
          const formatted = data.map((d: any) => ({
            id: d.id,
            patientId: d.patient_id,
            name: d.name,
            type: "pdf",
            uploadedAt: new Date(d.uploaded_at).toLocaleDateString("pt-BR")
          }));
          setAllDocuments(formatted);
        })
        .catch(err => console.error("Erro ao carregar documentos:", err));
    }
  }, [selectedId]);

  const selectedPatient = patients.find((p) => p.id === selectedId);

  const patientConsultations = allConsultations.filter((c) => c.patientId === selectedId);
  const patientTreatments = allTreatments.filter((t) => t.patientId === selectedId);
  const patientDocuments = allDocuments.filter((d) => d.patientId === selectedId);

  const handleUpdatePatient = useCallback((updated: Patient) => {
    setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const handleAddNew = () => {
    const newPatient: Patient = {
      id: Date.now(),
      name: "Novo Paciente",
      species: "Cão",
      breed: "S/R",
      birthDate: "01/01/2024",
      tutorName: "Tutor",
      phone: "(00) 00000-0000",
      conditions: "",
    };
    setPatients([newPatient, ...patients]);
    setSelectedId(newPatient.id);
    setActiveTab("prontuario");
    toast({ title: "Novo paciente criado", description: "Edite as informações na aba Prontuário." });
  };

  const handleDeleteDocument = async (id: number) => {
    if (!confirm("Deseja excluir este documento?")) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) setAllDocuments(prev => prev.filter((d: PetDocument) => d.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleDeleteConsultation = async (id: number) => {
    if (!confirm("Deseja excluir esta consulta?")) return;
    try {
      const res = await fetch(`/api/consultations/${id}`, { method: "DELETE" });
      if (res.ok) setAllConsultations(prev => prev.filter(c => c.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleDeleteMetric = async (id: number) => {
    if (!confirm("Deseja excluir este resultado?")) return;
    try {
      const res = await fetch(`/api/metrics/${id}`, { method: "DELETE" });
      if (res.ok) setAllMetrics(prev => prev.filter(m => m.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleToggleTreatment = async (id: number) => {
    try {
      const res = await fetch(`/api/treatments/${id}/toggle`, { method: "PUT" });
      if (res.ok) {
        const updatedTreatment = await res.json();
        setAllTreatments(prev => prev.map(t => t.id === id ? updatedTreatment : t));
      }
    } catch (e) { console.error(e); }
  };

  const handleDeletePatient = (id: number) => {
    const patient = patients.find(p => p.id === id);
    if (confirm(`Tem certeza que deseja excluir o paciente ${patient?.name}? Todos os registros serão perdidos.`)) {
      setPatients(prev => prev.filter(p => p.id !== id));
      if (selectedId === id) setSelectedId(null);
      toast({ title: "Paciente excluído", variant: "destructive" });
    }
  };

  const handleSave = () => {
    toast({ title: "✓ Salvo com sucesso", description: "Alterações persistidas no estado local." });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <PatientSidebar
        patients={patients}
        selectedId={selectedId}
        onSelect={(id) => { setSelectedId(id); setActiveTab("prontuario"); }}
        onAddNew={handleAddNew}
        onDelete={handleDeletePatient}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-primary to-primary-light px-6 py-5 flex items-center justify-between text-primary-foreground shrink-0">
          <div>
            <h1 className="text-2xl font-bold">Reviver Pet</h1>
            <p className="text-sm text-primary-foreground/80 tracking-wide">
              Fisiatria e Reabilitação Veterinária
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/", { replace: true })}
              size="sm"
              variant="ghost"
              className="rounded-xl gap-2 bg-white/10 hover:bg-white/25 text-primary-foreground border-0"
            >
              <Home className="h-4 w-4" /> Início
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="rounded-xl gap-2 bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
            >
              <Save className="h-4 w-4" /> Salvar
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <nav className="bg-muted/30 px-4 py-2 flex gap-1 overflow-x-auto shrink-0 border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {selectedPatient ? (
              <div key={`${selectedId}-${activeTab}`}>
                {activeTab === "prontuario" && selectedPatient && (
                  <ProntuarioTab
                    patient={selectedPatient}
                    onChange={(updated) => {
                      setPatients(patients.map((p) => (p.id === updated.id ? updated : p)));
                    }}
                    consultations={patientConsultations}
                    treatments={patientTreatments}
                    documents={patientDocuments as any}
                    metrics={allMetrics}
                  />
                )}
                {activeTab === "consultas" && (
                  <ConsultasTab
                    patientId={selectedId!}
                    consultations={patientConsultations}
                    onAdd={(newConsultation) => setAllConsultations(prev => [newConsultation, ...prev])}
                    onDelete={handleDeleteConsultation}
                  />
                )}
                {activeTab === "documentos" && (
                  <DocumentosTab
                    patientId={selectedId!}
                    documents={allDocuments.filter((d) => d.patientId === selectedId)}
                    metrics={allMetrics}
                    onAdd={(newDoc) => {
                      setAllDocuments((prev) => [newDoc, ...prev]);
                    }}
                    onDelete={handleDeleteDocument}
                    onAddMetric={(newMetric) => {
                      setAllMetrics((prev) => [newMetric, ...prev]);
                    }}
                    onDeleteMetric={handleDeleteMetric}
                  />
                )}
                {activeTab === "tratamentos" && (
                  <TratamentosTab
                    patientId={selectedId!}
                    treatments={patientTreatments}
                    onAdd={(newT) => setAllTreatments(prev => [newT, ...prev])}
                    onDelete={(id) => {
                      if (confirm("Deseja excluir este tratamento?")) {
                        setAllTreatments(prev => prev.filter(t => t.id !== id));
                        fetch(`/api/treatments/${id}`, { method: "DELETE" }).catch(console.error);
                      }
                    }}
                    onToggle={handleToggleTreatment}
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Selecione um paciente para começar
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 text-center border-t border-border text-xs text-muted-foreground shrink-0">
          <strong>Reviver Pet - Gestão de Pacientes</strong>
          <br />
          R. Vinte e Seis - Gov. Valadares, MG, 35020-630
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
