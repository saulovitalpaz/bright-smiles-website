import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Stethoscope, FileText, Pill, Home, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "clinical";
  const isPersonal = mode === "personal";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [allConsultations, setAllConsultations] = useState<Consultation[]>(mockConsultations);
  const [allTreatments, setAllTreatments] = useState<Treatment[]>(mockTreatments);
  const [allDocuments, setAllDocuments] = useState<PetDocument[]>(mockDocuments);
  const [allMetrics, setAllMetrics] = useState<any[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("prontuario");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const prevSelectedId = useRef<number | null>(null);

  // Carrega todos os pacientes do backend ao montar
  useEffect(() => {
    fetch(`/api/patients/?is_personal=${isPersonal}`)
      .then(res => res.json())
      .then(data => {
        const formatted = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          species: p.species || "Cão",
          breed: p.breed || "S/R",
          birthDate: p.birth_date || "01/01/2024",
          tutorName: p.tutor_name || "Tutor",
          phone: p.phone || "(00) 00000-0000",
          conditions: p.conditions || "",
          photo: p.photo_path ? `/api/patients/${p.id}/photo?t=${new Date().getTime()}` : undefined
        }));
        setPatients(formatted);
        if (formatted.length > 0) setSelectedId(formatted[0].id);
      })
      .catch(err => console.error("Erro ao carregar pacientes:", err));
  }, []);

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

  // Auto-save: Dispara um PUT 1.5s após a última modificação no paciente atual
  useEffect(() => {
    if (!selectedPatient) return;
    
    // Se acabou de carregar/mudar o paciente selecionado, apenas atualiza a ref e não tenta salvar
    if (prevSelectedId.current !== selectedPatient.id) {
      prevSelectedId.current = selectedPatient.id;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/patients/${selectedPatient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: selectedPatient.name,
            species: selectedPatient.species,
            breed: selectedPatient.breed,
            birth_date: selectedPatient.birthDate,
            tutor_name: selectedPatient.tutorName,
            phone: selectedPatient.phone,
            conditions: selectedPatient.conditions,
            is_personal: isPersonal
          })
        });
        console.log(`Auto-save: Paciente ${selectedPatient.id} salvo em background.`);
      } catch (err) {
        console.error("Auto-save falhou:", err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [selectedPatient]);

  const patientConsultations = allConsultations.filter((c) => c.patientId === selectedId);
  const patientTreatments = allTreatments.filter((t) => t.patientId === selectedId);
  const patientDocuments = allDocuments.filter((d) => d.patientId === selectedId);

  const handleUpdatePatient = useCallback((updated: Patient) => {
    setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const handleAddNew = async () => {
    try {
      const resp = await fetch("/api/patients/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Novo Paciente",
          species: "Cão",
          breed: "S/R",
          birth_date: "01/01/2024",
          tutor_name: "Tutor",
          phone: "(00) 00000-0000",
          conditions: "",
          is_personal: isPersonal
        })
      });
      if (resp.ok) {
        const p = await resp.json();
        const newPatient: Patient = {
          id: p.id,
          name: p.name,
          species: p.species || "Cão",
          breed: p.breed || "S/R",
          birthDate: p.birth_date || "01/01/2024",
          tutorName: p.tutor_name || "Tutor",
          phone: p.phone || "(00) 00000-0000",
          conditions: p.conditions || "",
        };
        setPatients(prev => [newPatient, ...prev]);
        setSelectedId(p.id);
        setActiveTab("prontuario");
        setSidebarOpen(false);
        toast({ title: "Paciente Criado", description: "Edite as informações na aba Prontuário." });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Falha ao criar paciente", variant: "destructive" });
    }
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

  const handleDeletePatient = async (id: number) => {
    const patient = patients.find(p => p.id === id);
    if (!patient) return;
    if (confirm(`Tem certeza que deseja excluir o paciente ${patient.name}? Todos os registros serão perdidos.`)) {
      try {
        const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
        if (res.ok) {
          setPatients(prev => prev.filter(p => p.id !== id));
          if (selectedId === id) setSelectedId(null);
          toast({ title: "Paciente excluído", variant: "destructive" });
        } else {
          toast({ title: "Erro", description: "Falha ao excluir", variant: "destructive" });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar — drawer on mobile, static on md+ */}
      <PatientSidebar
        patients={patients}
        selectedId={selectedId}
        onSelect={(id) => { setSelectedId(id); setActiveTab("prontuario"); }}
        onAddNew={handleAddNew}
        onDelete={handleDeletePatient}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-primary to-primary-light px-4 py-3 sm:px-6 sm:py-5 flex items-center justify-between text-primary-foreground shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — only on mobile */}
            <Button
              onClick={() => setSidebarOpen(true)}
              size="icon"
              variant="ghost"
              className="md:hidden rounded-xl bg-white/10 hover:bg-white/25 text-primary-foreground border-0 h-9 w-9"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold leading-tight">Reviver Pet</h1>
              <p className="text-xs sm:text-sm text-primary-foreground/80 tracking-wide hidden sm:block">
                Fisiatria e Reabilitação Veterinária
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/", { replace: true })}
              size="sm"
              variant="ghost"
              className="rounded-xl gap-2 bg-white/10 hover:bg-white/25 text-primary-foreground border-0"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Início</span>
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <nav className="bg-muted/30 px-2 sm:px-4 py-2 flex gap-1 overflow-x-auto shrink-0 border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-1 sm:flex-none justify-center sm:justify-start",
                  activeTab === tab.id
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden xs:inline sm:inline text-xs sm:text-sm">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
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
                    patientName={selectedPatient?.name}
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
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 py-16">
                <p className="text-center">Selecione um paciente para começar</p>
                <Button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden rounded-xl gap-2 bg-primary hover:bg-primary-light"
                >
                  <Menu className="h-4 w-4" /> Abrir Lista de Pacientes
                </Button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="px-4 py-3 text-center border-t border-border text-xs text-muted-foreground shrink-0">
          <strong>Reviver Pet - Gestão de Pacientes</strong>
          <br />
          R. Vinte e Seis - Gov. Valadares, MG, 35020-630
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
