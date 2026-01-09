import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, History, User, Stethoscope } from "lucide-react";
import { toast } from "sonner";

interface AppointmentRecord {
    id: number;
    patientName: string;
    date: string;
    procedure: string;
    notes: string;
    professional: string;
}

const AdminAppointments = () => {
    const [patientName, setPatientName] = useState("");
    const [procedure, setProcedure] = useState("");
    const [notes, setNotes] = useState("");

    const userStr = localStorage.getItem("admin_user");
    const currentUser = userStr ? JSON.parse(userStr) : { name: "Profissional" };

    const [appointments, setAppointments] = useState<AppointmentRecord[]>([
        {
            id: 1,
            patientName: "João Silva",
            date: "2023-10-24",
            procedure: "Limpeza e Clareamento",
            notes: "Paciente relatou sensibilidade. Aplicado dessensibilizante.",
            professional: "Dra. Ana Karolina"
        },
        {
            id: 2,
            patientName: "Maria Oliveira",
            date: "2023-10-23",
            procedure: "Harmonização Facial - Preenchimento",
            notes: "Retorno em 15 dias para avaliação.",
            professional: "Dra. Clara Lima de Souza"
        }
    ]);

    const handleAddRecord = (e: React.FormEvent) => {
        e.preventDefault();
        const newRecord: AppointmentRecord = {
            id: Date.now(),
            patientName,
            date: new Date().toISOString().split('T')[0],
            procedure,
            notes,
            professional: currentUser.name
        };

        setAppointments([newRecord, ...appointments]);
        setPatientName("");
        setProcedure("");
        setNotes("");
        toast.success("Histórico de atendimento registrado!");
    };

    return (
        <AdminLayout title="Atendimentos & Consultas">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form to add new record */}
                <div className="lg:col-span-1">
                    <Card className="border-slate-200 shadow-sm sticky top-8">
                        <CardHeader>
                            <CardTitle className="text-xl font-serif">Novo Registro</CardTitle>
                            <CardDescription>Insira os detalhes do atendimento realizado.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddRecord} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="patient">Paciente</Label>
                                    <Input
                                        id="patient"
                                        placeholder="Nome completo"
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="procedure">Procedimento</Label>
                                    <Input
                                        id="procedure"
                                        placeholder="Ex: Harmonização, Canal, etc"
                                        value={procedure}
                                        onChange={(e) => setProcedure(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notas Clínicas</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Detalhes técnicos, observações e plano futuro..."
                                        className="min-h-[120px]"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full gap-2">
                                    <Plus size={18} />
                                    Registrar Atendimento
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* History list */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-serif font-bold text-slate-900">Histórico Recente</h2>
                        <div className="flex gap-2">
                            <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200 font-medium">
                                Total: {appointments.length}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {appointments.map((record) => (
                            <Card key={record.id} className="border-slate-200 hover:border-primary/30 transition-all shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{record.patientName}</h3>
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    <History size={12} />
                                                    {record.date}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                                                {record.professional}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-sm font-bold text-primary mb-1 uppercase tracking-tight">{record.procedure}</p>
                                        <p className="text-sm text-slate-600 leading-relaxed italic">"{record.notes}"</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminAppointments;
