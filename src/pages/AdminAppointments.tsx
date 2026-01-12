import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { API_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, History, User, Stethoscope, Search, CreditCard, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { FileSignature, ArrowRight } from "lucide-react";

interface AppointmentRecord {
    id: number;
    patientName: string;
    cpf?: string;
    date: string;
    procedure: string;
    notes: string;
    professional: string;
}

const AdminAppointments = () => {
    const [patientName, setPatientName] = useState("");
    const [procedure, setProcedure] = useState("");
    const [notes, setNotes] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRecord, setSelectedRecord] = useState<AppointmentRecord | null>(null);
    const [editCpf, setEditCpf] = useState("");
    const [editNotes, setEditNotes] = useState("");
    const navigate = useNavigate();

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

    const handleAddRecord = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const newRecord = {
                patientName,
                // If patientName is not a full name, validation normally happens here. 
                // For now we assume simle string.
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
                setPatientName("");
                setProcedure("");
                setNotes("");
                toast.success("Histórico de atendimento registrado!");
            } else {
                toast.error("Erro ao salvar registro.");
            }
        } catch (error) {
            console.error("Error saving appointment:", error);
            toast.error("Erro de conexão ao salvar.");
        }
    };

    const filteredAppointments = appointments.filter(record =>
        record.patientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                    <Input
                                        id="patient"
                                        placeholder="Nome completo"
                                        className="h-9 text-sm"
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                        required
                                    />
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
                                                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{record.patientName}</h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                                            <History size={12} />
                                                            {record.date}
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
                                                }}
                                            >
                                                Ver Detalhes
                                            </Button>
                                        </div>
                                        <div className="bg-[#fcfdfd] p-5 rounded-2xl border border-slate-100 ml-16 cursor-pointer hover:border-primary/20 transition-all" onClick={() => {
                                            setSelectedRecord(record);
                                            setEditCpf(record.cpf || "");
                                            setEditNotes(record.notes || "");
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

            {/* Record Details Dialog */}
            <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
                <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-primary p-8 text-white relative">
                        <DialogHeader>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <User size={28} />
                                </div>
                                <div className="text-left">
                                    <DialogTitle className="text-2xl font-serif font-bold leading-none">{selectedRecord?.patientName}</DialogTitle>
                                    <DialogDescription className="text-white/70 text-xs mt-1">
                                        Edite os detalhes do atendimento abaixo.
                                    </DialogDescription>
                                    <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-2">{selectedRecord?.procedure}</p>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">CPF do Paciente</Label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <Input
                                        value={editCpf}
                                        onChange={(e) => setEditCpf(e.target.value)}
                                        className="pl-10 font-mono font-bold text-slate-700 bg-slate-50 border-slate-100 focus:border-primary transition-all"
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Data do Atendimento</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <Input value={selectedRecord?.date} disabled className="pl-10 bg-slate-50/50 border-slate-100 font-bold text-slate-600" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Notas Clínicas Detalhadas</Label>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 min-h-[120px] relative transition-all hover:bg-white hover:shadow-inner">
                                <Textarea
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    placeholder="Inserir e editar observações..."
                                    className="border-none bg-transparent shadow-none focus-visible:ring-0 p-0 text-sm italic text-slate-600 min-h-[100px]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate(`/admin/prescricao?cpf=${editCpf}`)}
                                className="group flex flex-col items-start p-6 rounded-2xl bg-[#0f172a] text-white hover:bg-[#1a2b4b] transition-all text-left shadow-lg shadow-slate-900/10"
                            >
                                <div className="p-2 bg-white/10 rounded-lg mb-4 text-primary">
                                    <FileSignature size={20} />
                                </div>
                                <span className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Prescrição</span>
                                <span className="font-serif font-bold text-lg flex items-center gap-2">
                                    Emitir Receita <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>

                            <button
                                onClick={() => navigate("/admin/prescricao")}
                                className="group flex flex-col items-start p-6 rounded-2xl bg-white border border-slate-100 highlight-gold hover:bg-primary/5 hover:border-primary/20 transition-all text-left"
                            >
                                <div className="p-2 bg-primary/10 rounded-lg mb-4 text-primary">
                                    <History size={20} />
                                </div>
                                <span className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">Histórico Facial</span>
                                <span className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
                                    Ver receitas <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>
                        </div>
                    </div>

                    <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100">
                        <div className="flex justify-between items-center w-full px-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                Responsável: {selectedRecord?.professional}
                            </div>
                            <div className="flex gap-2">
                                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold" size="sm" onClick={async () => {
                                    if (!selectedRecord) return;
                                    try {
                                        const res = await fetch(`${API_URL}/appointments/${selectedRecord.id}`, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                cpf: editCpf,
                                                notes: editNotes
                                            })
                                        });

                                        if (res.ok) {
                                            const updated = await res.json();
                                            // Update local list
                                            setAppointments(prev => prev.map(p => p.id === updated.id ? updated : p));
                                            setSelectedRecord(updated);
                                            toast.success("Dados atualizados com sucesso!");
                                        } else {
                                            toast.error("Erro ao salvar.");
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        toast.error("Erro de conexão.");
                                    }
                                }}>Salvar Alterações</Button>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(null)} className="text-[10px] font-black uppercase">Fechar</Button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </AdminLayout>
    );
};

export default AdminAppointments;
