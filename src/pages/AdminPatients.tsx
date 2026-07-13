import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { fetchClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Pencil, Trash2, RotateCcw, Save, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

interface Patient {
    id: number;
    name: string;
    cpf: string;
    phone?: string | null;
    address?: string | null;
    history?: string | null;
    consent?: boolean;
    consentDate?: string | null;
    odontogram?: unknown;
}

interface Appointment {
    id: number;
    patientId?: number | null;
    patientName?: string;
    date: string;
    procedure?: string;
}

type PatientForm = Omit<Patient, "id">;

const emptyForm: PatientForm = {
    name: "",
    cpf: "",
    phone: "",
    address: "",
    history: "",
    consent: false,
    consentDate: null,
    odontogram: "",
};

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString("pt-BR") : "—";

const AdminPatients = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState<PatientForm>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadPatients = useCallback(async (term: string) => {
        setLoading(true);
        try {
            const [patientsResponse, appointmentsResponse] = await Promise.all([
                fetchClient(`/patients?search=${encodeURIComponent(term)}`),
                fetchClient("/appointments"),
            ]);
            if (!patientsResponse.ok) throw new Error("Não foi possível carregar os pacientes.");
            setPatients(await patientsResponse.json());
            if (appointmentsResponse.ok) setAppointments(await appointmentsResponse.json());
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao carregar pacientes.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => loadPatients(search), 280);
        return () => window.clearTimeout(timer);
    }, [search, loadPatients]);

    const latestAppointments = useMemo(() => {
        const map = new Map<number, Appointment>();
        appointments.forEach((appointment) => {
            if (!appointment.patientId) return;
            const current = map.get(appointment.patientId);
            if (!current || new Date(appointment.date) > new Date(current.date)) map.set(appointment.patientId, appointment);
        });
        return map;
    }, [appointments]);

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
    };

    const beginEdit = (patient: Patient) => {
        setEditingId(patient.id);
        setForm({
            name: patient.name || "",
            cpf: patient.cpf || "",
            phone: patient.phone || "",
            address: patient.address || "",
            history: patient.history || "",
            consent: Boolean(patient.consent),
            consentDate: patient.consentDate || null,
            odontogram: typeof patient.odontogram === "string" ? patient.odontogram : patient.odontogram ? JSON.stringify(patient.odontogram, null, 2) : "",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const savePatient = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.name.trim() || !form.cpf.trim()) {
            toast.error("Nome e CPF são obrigatórios.");
            return;
        }
        setSaving(true);
        try {
            let odontogram: unknown = form.odontogram || null;
            if (typeof odontogram === "string" && odontogram.trim()) {
                try { odontogram = JSON.parse(odontogram); } catch { /* keep plain text for backwards compatibility */ }
            }
            const payload = { ...form, name: form.name.trim(), cpf: form.cpf.trim(), odontogram };
            const response = await fetchClient(editingId ? `/patients/${editingId}` : "/patients", {
                method: editingId ? "PUT" : "POST",
                body: JSON.stringify(payload),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || "Não foi possível salvar o paciente.");
            toast.success(editingId ? "Paciente atualizado." : "Paciente criado.");
            resetForm();
            await loadPatients(search);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao salvar paciente.");
        } finally {
            setSaving(false);
        }
    };

    const deletePatient = async (patient: Patient) => {
        if (!window.confirm(`Excluir o paciente ${patient.name}? Esta ação não pode ser desfeita.`)) return;
        try {
            const response = await fetchClient(`/patients/${patient.id}`, { method: "DELETE" });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || "Não foi possível excluir o paciente.");
            toast.success("Paciente excluído.");
            if (editingId === patient.id) resetForm();
            await loadPatients(search);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao excluir paciente.");
        }
    };

    return (
        <AdminLayout title="Pacientes">
            <div className="mx-auto w-full max-w-7xl space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-slate-500">Pesquise e mantenha os dados clínicos dos pacientes.</p>
                    </div>
                    <Button onClick={resetForm} className="w-full sm:w-auto"><Plus size={16} className="mr-2" /> Novo paciente</Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
                    <Card className="min-w-0">
                        <CardHeader className="space-y-4">
                            <CardTitle className="flex items-center gap-2"><Users size={20} /> Pacientes cadastrados</CardTitle>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou CPF" className="pl-9" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : patients.length === 0 ? (
                                <div className="py-10 text-center text-sm text-slate-500">Nenhum paciente encontrado.</div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {patients.map((patient) => {
                                        const appointment = latestAppointments.get(patient.id);
                                        return <article key={patient.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0"><h3 className="truncate font-semibold text-slate-900">{patient.name}</h3><p className="text-xs text-slate-500">CPF: {patient.cpf || "—"}</p></div>
                                                {patient.consent && <Badge variant="secondary">Consentimento</Badge>}
                                            </div>
                                            <div className="mt-3 space-y-1 text-sm text-slate-600"><p>Telefone: {patient.phone || "—"}</p><p>Último atendimento: {appointment ? `${formatDate(appointment.date)}${appointment.procedure ? ` · ${appointment.procedure}` : ""}` : "—"}</p></div>
                                            <div className="mt-4 flex flex-col gap-2 sm:flex-row"><Button variant="outline" className="w-full sm:flex-1" onClick={() => beginEdit(patient)}><Pencil size={14} className="mr-2" /> Editar</Button><Button variant="outline" className="w-full text-red-600 hover:text-red-700 sm:w-auto" onClick={() => deletePatient(patient)} aria-label={`Excluir ${patient.name}`}><Trash2 size={14} /></Button></div>
                                        </article>;
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="min-w-0">
                        <CardHeader><CardTitle>{editingId ? "Editar paciente" : "Novo paciente"}</CardTitle></CardHeader>
                        <CardContent><form onSubmit={savePatient} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1"><div className="space-y-2"><Label htmlFor="patient-name">Nome *</Label><Input id="patient-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="patient-cpf">CPF *</Label><Input id="patient-cpf" value={form.cpf} onChange={(event) => setForm({ ...form, cpf: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="patient-phone">Telefone</Label><Input id="patient-phone" value={form.phone || ""} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="patient-address">Endereço</Label><Input id="patient-address" value={form.address || ""} onChange={(event) => setForm({ ...form, address: event.target.value })} /></div></div>
                            <div className="space-y-2"><Label htmlFor="patient-history">Histórico</Label><Textarea id="patient-history" rows={3} value={form.history || ""} onChange={(event) => setForm({ ...form, history: event.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="patient-odontogram">Odontograma (JSON opcional)</Label><Textarea id="patient-odontogram" rows={3} value={String(form.odontogram || "")} onChange={(event) => setForm({ ...form, odontogram: event.target.value })} /></div>
                            <label className="flex items-center gap-2 text-sm text-slate-700"><Checkbox checked={Boolean(form.consent)} onCheckedChange={(checked) => setForm({ ...form, consent: checked === true, consentDate: checked === true ? new Date().toISOString() : null })} /> Consentimento registrado</label>
                            <div className="flex flex-col gap-2 sm:flex-row"><Button type="submit" disabled={saving} className="w-full sm:flex-1">{saving ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Save className="mr-2" size={16} />}{editingId ? "Salvar alterações" : "Cadastrar paciente"}</Button><Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto"><RotateCcw size={16} className="mr-2" /> Limpar</Button></div>
                        </form></CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminPatients;
