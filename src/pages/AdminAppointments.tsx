import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { API_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Calendar, Search, User, History, MoreVertical, Edit, Trash2, X, Plus, Clock,
    FileText, CheckCircle, Save, Printer, FileSignature, ArrowRight, Stethoscope, CreditCard
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PatientPicker } from "@/components/admin/PatientPicker";
import { useAuth } from "@/hooks/useAuth";

interface AppointmentRecord {
    id: number;
    patientName: string;
    cpf?: string;
    date: string;
    procedure: string;
    notes: string;
    weight?: string;
    materials?: string;
    complications?: string;
    returnDate?: string;
    professional: string;
    patient?: {
        name: string;
        cpf: string;
    };
}

const AdminAppointments = () => {
    const [patientName, setPatientName] = useState("");
    const [patientCpf, setPatientCpf] = useState("");
    const [patientId, setPatientId] = useState<number | null>(null);
    const [procedure, setProcedure] = useState("");
    const [notes, setNotes] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRecord, setSelectedRecord] = useState<AppointmentRecord | null>(null);
    const [editCpf, setEditCpf] = useState("");
    const [editNotes, setEditNotes] = useState("");
    const [editWeight, setEditWeight] = useState("");
    const [editMaterials, setEditMaterials] = useState("");
    const [editComplications, setEditComplications] = useState("");
    const [editReturnDate, setEditReturnDate] = useState("");
    const detailsRef = React.useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const leadId = searchParams.get("leadId");

    const userStr = localStorage.getItem("admin_user");
    const currentUser = userStr ? JSON.parse(userStr) : { name: "Profissional" };

    const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);



    // Fetch appointments on load
    React.useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const res = await fetch(`${API_URL}/appointments`);
                if (res.ok) {
                    const data = await res.json();
                    setAppointments(data);
                }
            } catch (error) {
                console.error("Failed to fetch appointments:", error);
                toast.error("Erro ao carregar atendimentos.");
            }
        };
        fetchAppointments();
    }, []);

    // Fetch lead data if leadId is present
    React.useEffect(() => {
        if (leadId) {
            const fetchLead = async () => {
                try {
                    const res = await fetch(`${API_URL}/leads`);
                    if (res.ok) {
                        const leads = await res.json();
                        const lead = leads.find((l: any) => l.id === parseInt(leadId));
                        if (lead) {
                            setPatientName(lead.name || "");
                            setProcedure(lead.treatment || "");
                            setNotes(lead.message || "");
                            toast.info(`Dados carregados da solicitação de ${lead.name}`);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching lead:", error);
                }
            };
            fetchLead();
        }
    }, [leadId]);

    const handleAddRecord = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            let finalPatientId = patientId;

            // Auto-create patient if it doesn't exist but name and CPF are provided
            if (!finalPatientId && patientName && patientCpf) {
                const pRes = await fetch(`${API_URL}/patients`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: patientName, cpf: patientCpf })
                });
                if (pRes.ok) {
                    const newPatient = await pRes.json();
                    finalPatientId = newPatient.id;
                } else {
                    toast.error("Erro ao criar cadastro do paciente.");
                    return;
                }
            }

            const newRecord = {
                patientName,
                cpf: patientCpf,
                patientId: finalPatientId,
                date: new Date().toISOString(),
                procedure,
                notes,
                professional: currentUser.name || "Profissional"
            };

            const res = await fetch(`${API_URL}/appointments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newRecord)
            });

            if (res.ok) {
                const savedRecord = await res.json();
                setAppointments([savedRecord, ...appointments]);

                // If leadId was used, update lead status to scheduled
                if (leadId) {
                    await fetch(`${API_URL}/leads/${leadId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: 'scheduled' })
                    });
                }

                setPatientName("");
                setPatientCpf("");
                setPatientId(null);
                setProcedure("");
                setNotes("");
                toast.success("Histórico de atendimento registrado!");

                if (leadId) {
                    // Remove leadId from URL without jumping
                    window.history.replaceState({}, '', '/admin/consultas');
                }
            } else {
                toast.error("Erro ao salvar registro.");
            }
        } catch (error) {
            console.error("Error saving appointment:", error);
            toast.error("Erro de conexão ao salvar.");
        }
    };

    const filteredAppointments = appointments.filter(record => {
        const name = (record.patientName || record.patient?.name || "").toLowerCase();
        const cpf = (record.cpf || record.patient?.cpf || "");
        const term = searchTerm.toLowerCase();
        return name.includes(term) || cpf.includes(searchTerm);
    });

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <AdminLayout title="Atendimentos & Consultas">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="border-slate-100 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Stethoscope size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Atendimentos</p>
                                <p className="text-2xl font-bold text-slate-900">{appointments.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
                {/* Form to add new record */}
                <div className="lg:col-span-1">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-serif">Novo Registro</CardTitle>
                            <CardDescription className="text-xs">Insira os detalhes do atendimento.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddRecord} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="patient" className="text-xs font-bold uppercase text-slate-500">Paciente</Label>
                                    <PatientPicker
                                        onSelect={(p) => {
                                            setPatientName(p.name);
                                            setPatientCpf(p.cpf);
                                            setPatientId(p.id);
                                        }}
                                    />
                                    <div className="grid grid-cols-1 gap-3 pt-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-slate-400">Nome do Paciente</Label>
                                            <Input
                                                value={patientName}
                                                onChange={(e) => setPatientName(e.target.value)}
                                                placeholder="Nome completo"
                                                className="h-8 text-xs font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-slate-400">CPF (Obrigatório para novo cadastro)</Label>
                                            <Input
                                                value={patientCpf}
                                                onChange={(e) => setPatientCpf(e.target.value)}
                                                placeholder="000.000.000-00"
                                                className="h-8 text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="procedure" className="text-xs font-bold uppercase text-slate-500">Procedimento</Label>
                                    <Input
                                        id="procedure"
                                        placeholder="Ex: Harmonização"
                                        className="h-9 text-sm"
                                        value={procedure}
                                        onChange={(e) => setProcedure(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="notes" className="text-xs font-bold uppercase text-slate-500">Notas Clínicas</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Detalhes técnicos..."
                                        className="min-h-[100px] text-sm"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full gap-2 h-9 text-sm font-bold">
                                    <Plus size={16} />
                                    Registrar
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Main History Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-slate-900">Histórico de Atendimentos</h2>
                                <p className="text-sm text-slate-500">Consulte e filtre registros anteriores.</p>
                            </div>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input
                                    placeholder="Pesquisar por nome..."
                                    className="pl-10 h-10 border-slate-200 focus:ring-primary/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {filteredAppointments.length > 0 ? (
                                filteredAppointments.map((record) => (
                                    <div key={record.id} className="py-6 first:pt-0 last:pb-0 hover:bg-slate-50/50 transition-colors rounded-xl px-4 -mx-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                                                    <User size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-lg leading-tight">
                                                        {record.patientName || record.patient?.name}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs text-slate-500 font-mono">
                                                            {record.cpf || record.patient?.cpf}
                                                        </span>
                                                        <span className="text-xs text-slate-300">|</span>
                                                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                                            <History size={12} />
                                                            {formatDate(record.date)}
                                                        </span>
                                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-slate-200">
                                                            {record.professional}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs font-bold text-primary hover:text-primary hover:bg-primary/5"
                                                onClick={() => {
                                                    setSelectedRecord(record);
                                                    setEditCpf(record.cpf || "");
                                                    setEditNotes(record.notes || "");
                                                    setEditWeight(record.weight || "");
                                                    setEditMaterials(record.materials || "");
                                                    setEditComplications(record.complications || "");
                                                    setEditReturnDate(record.returnDate ? record.returnDate.split('T')[0] : "");
                                                    setTimeout(() => detailsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                                                }}
                                            >
                                                Ver Detalhes
                                            </Button>
                                        </div>
                                        <div className="bg-[#fcfdfd] p-5 rounded-2xl border border-slate-100 ml-16 cursor-pointer hover:border-primary/20 transition-all" onClick={() => {
                                            setSelectedRecord(record);
                                            setEditCpf(record.cpf || "");
                                            setEditNotes(record.notes || "");
                                            setEditWeight(record.weight || "");
                                            setEditMaterials(record.materials || "");
                                            setEditComplications(record.complications || "");
                                            setEditReturnDate(record.returnDate ? record.returnDate.split('T')[0] : "");
                                            setTimeout(() => detailsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                                        }}>
                                            <p className="text-xs font-bold text-primary mb-2 uppercase tracking-widest">{record.procedure}</p>
                                            <p className="text-slate-600 leading-relaxed text-sm italic">"{record.notes}"</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                        <Search size={32} />
                                    </div>
                                    <p className="text-slate-500 font-medium">Nenhum paciente encontrado com "{searchTerm}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Details Section */}
            <div ref={detailsRef} className={`transition-all duration-500 overflow-hidden ${selectedRecord ? 'max-h-[2000px] opacity-100 mb-20' : 'max-h-0 opacity-0'}`}>
                {selectedRecord && (
                    <Card className="border-slate-200 shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <div className="bg-[#0f172a] p-8 text-white relative">
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <User size={32} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-3xl font-serif font-bold leading-none">{selectedRecord.patientName}</h3>
                                    <div className="flex items-center gap-4 mt-3">
                                        <span className="text-white/60 text-xs font-bold uppercase tracking-widest bg-white/5 py-1 px-3 rounded-full border border-white/10">
                                            {selectedRecord.procedure}
                                        </span>
                                        <span className="text-white/40 text-xs flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            Record ID: #{selectedRecord.id}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-8 md:p-12">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                {/* Left Column: Basic Info & Health */}
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <FileText size={16} /> Dados Cadastrais
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold text-slate-400 uppercase">CPF do Paciente</Label>
                                                <div className="relative">
                                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                    <Input
                                                        value={editCpf}
                                                        onChange={(e) => setEditCpf(e.target.value)}
                                                        className="pl-10 font-mono font-bold bg-slate-50 border-slate-100"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold text-slate-400 uppercase">Peso Aproximado (kg)</Label>
                                                <div className="relative">
                                                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                    <Input
                                                        value={editWeight}
                                                        onChange={(e) => setEditWeight(e.target.value)}
                                                        placeholder="75kg"
                                                        className="pl-10 font-bold bg-slate-50 border-slate-100"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock size={16} /> Retorno Programado
                                        </h4>
                                        <Input
                                            type="date"
                                            value={editReturnDate}
                                            onChange={(e) => setEditReturnDate(e.target.value)}
                                            className="font-bold bg-slate-50 border-slate-100"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 pt-4">
                                        <Button
                                            onClick={() => navigate(`/admin/prescricao?cpf=${editCpf}`)}
                                            className="h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl gap-3 shadow-lg shadow-primary/20"
                                        >
                                            <FileSignature size={20} />
                                            Emitir Receita
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate("/admin/prescricao")}
                                            className="h-14 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl gap-3"
                                        >
                                            <History size={20} />
                                            Histórico de Receitas
                                        </Button>
                                    </div>
                                </div>

                                {/* Middle & Right Column: Clinical Content */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                                                <Edit size={14} className="text-primary" /> Notas Clínicas Detalhadas
                                            </Label>
                                            <Textarea
                                                value={editNotes}
                                                onChange={(e) => setEditNotes(e.target.value)}
                                                className="min-h-[150px] bg-slate-50 border-slate-100 rounded-2xl p-6 italic text-slate-600 leading-relaxed transition-all focus:bg-white focus:shadow-inner"
                                                placeholder="Descreva a evolução clínica..."
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                                                <Plus size={14} className="text-primary" /> Materiais Utilizados
                                            </Label>
                                            <Textarea
                                                value={editMaterials}
                                                onChange={(e) => setEditMaterials(e.target.value)}
                                                className="min-h-[150px] bg-slate-50 border-slate-100 rounded-2xl p-6 text-sm text-slate-600 leading-relaxed transition-all focus:bg-white focus:shadow-inner"
                                                placeholder="Ex: Toxina Botulínica 50U, Ácido Hialurônico 1ml..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                                            <Stethoscope size={14} className="text-red-500" /> Intercorrências ou Observações de Alerta
                                        </Label>
                                        <Textarea
                                            value={editComplications}
                                            onChange={(e) => setEditComplications(e.target.value)}
                                            className="min-h-[100px] bg-red-50/30 border-red-100 rounded-2xl p-6 text-sm text-slate-600 leading-relaxed transition-all focus:bg-white focus:border-red-200"
                                            placeholder="Nenhuma intercorrência registrada..."
                                        />
                                    </div>

                                    <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            Profissional: {selectedRecord.professional}
                                        </div>
                                        <div className="flex gap-4">
                                            <Button
                                                variant="ghost"
                                                onClick={() => setSelectedRecord(null)}
                                                className="font-bold text-slate-500"
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`${API_URL}/appointments/${selectedRecord.id}`, {
                                                            method: "PUT",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({
                                                                cpf: editCpf,
                                                                notes: editNotes,
                                                                weight: editWeight,
                                                                materials: editMaterials,
                                                                complications: editComplications,
                                                                returnDate: editReturnDate
                                                            })
                                                        });

                                                        if (res.ok) {
                                                            const updated = await res.json();
                                                            setAppointments(prev => prev.map(p => p.id === updated.id ? updated : p));
                                                            setSelectedRecord(updated);
                                                            toast.success("Prontuário atualizado com sucesso!");
                                                            // Optional: hide after save
                                                            // setSelectedRecord(null);
                                                        } else {
                                                            toast.error("Erro ao salvar alterações.");
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                        toast.error("Erro de conexão.");
                                                    }
                                                }}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-10 rounded-xl shadow-lg shadow-emerald-200"
                                            >
                                                Salvar Atendimento
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

        </AdminLayout>
    );
};

export default AdminAppointments;
