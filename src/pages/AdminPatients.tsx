import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { AttendanceSection, AttendanceWorkspace } from "@/components/admin/attendance/AttendanceWorkspace";
import { fetchClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Pencil, Trash2, RotateCcw, Save, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { derivePatientAge } from "@/lib/patient-age";

interface Patient {
    id: number;
    name: string;
    cpf: string;
    phone?: string | null;
    address?: string | null;
    history?: string | null;
    birthDate?: string | null;
    sex?: "female" | "male" | null;
    weight?: string | null;
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

type PatientForm = Omit<Patient, "id" | "consent" | "consentDate">;

const emptyForm: PatientForm = {
    name: "",
    cpf: "",
    phone: "",
    address: "",
    history: "",
    birthDate: "",
    sex: null,
    weight: "",
    odontogram: "",
};

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString("pt-BR") : "—";
const ageGroupLabels = { child: "criança", adolescent: "adolescente", adult: "adulto" } as const;
const formatAgeSummary = (birthDate?: string | null) => {
    const derived = derivePatientAge(birthDate);
    return derived.ageGroup ? `${derived.age} anos · ${ageGroupLabels[derived.ageGroup]}` : "Não informada";
};

const AdminPatients = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState<PatientForm>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const focusPatientForm = useCallback(() => {
        setFormOpen(true);
        formRef.current?.scrollIntoView({ block: "start" });
        nameInputRef.current?.focus({ preventScroll: true });
    }, []);
    useEffect(() => {
        if (!formOpen) return;
        formRef.current?.scrollIntoView({ block: "start" });
        nameInputRef.current?.focus({ preventScroll: true });
    }, [formOpen]);
    const [searchParams] = useSearchParams();
    const requestedEditId = Number.parseInt(searchParams.get("edit") || "", 10);

    const loadPatients = useCallback(async (term: string) => {
        setLoading(true);
        try {
            const patientsResponse = await fetchClient(`/patients?search=${encodeURIComponent(term)}`);
            if (!patientsResponse.ok) throw new Error("Não foi possível carregar os pacientes.");
            setPatients(await patientsResponse.json());
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao carregar pacientes.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let active = true;
        void fetchClient("/appointments").then(async response => {
            if (response.ok) {
                const records = await response.json();
                if (active) setAppointments(Array.isArray(records) ? records : []);
            }
        }).catch(() => {});
        return () => { active = false; };
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

    const beginEdit = useCallback((patient: Patient) => {
        setEditingId(patient.id);
        setForm({
            name: patient.name || "",
            cpf: patient.cpf || "",
            phone: patient.phone || "",
            address: patient.address || "",
            history: patient.history || "",
            birthDate: patient.birthDate ? patient.birthDate.slice(0, 10) : "",
            sex: patient.sex ?? null,
            weight: patient.weight || "",
            odontogram: typeof patient.odontogram === "string" ? patient.odontogram : patient.odontogram ? JSON.stringify(patient.odontogram, null, 2) : "",
        });
        focusPatientForm();
    }, [focusPatientForm]);

    useEffect(() => {
        if (!Number.isInteger(requestedEditId) || editingId === requestedEditId) return;
        const patient = patients.find((item) => item.id === requestedEditId);
        if (patient) beginEdit(patient);
    }, [beginEdit, editingId, patients, requestedEditId]);

    const savePatient = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.name.trim() || !form.cpf.trim()) {
            toast.error("Nome e CPF são obrigatórios.");
            return;
        }
        if (form.weight?.trim() && (!/^\d{1,4}([.,]\d{1,3})?$/.test(form.weight.trim()) || Number(form.weight.replace(',', '.')) <= 0 || Number(form.weight.replace(',', '.')) > 1000)) {
            toast.error("Informe o peso em kg, maior que zero e até 1000.");
            return;
        }
        setSaving(true);
        try {
            let odontogram: unknown = form.odontogram || null;
            if (typeof odontogram === "string" && odontogram.trim()) {
                try { odontogram = JSON.parse(odontogram); } catch { /* keep plain text for backwards compatibility */ }
            }
            const payload = {
                name: form.name.trim(),
                cpf: form.cpf.trim(),
                phone: form.phone || undefined,
                address: form.address || undefined,
                history: form.history || undefined,
                birthDate: form.birthDate || null,
                sex: form.sex ?? null,
                weight: form.weight?.trim() || null,
                odontogram,
            };
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
            <AttendanceWorkspace active="pacientes">
            <div className="mx-auto w-full max-w-7xl space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-slate-500">Pesquise e mantenha os dados clínicos dos pacientes.</p>
                    </div>
                    <Button onClick={() => { resetForm(); focusPatientForm(); }} className="min-h-11 w-full sm:w-auto"><Plus size={16} className="mr-2" /> Novo paciente</Button>
                </div>

                <div className={"grid gap-3 lg:items-start " + (formOpen ? "lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]" : "")}>
                    <Card className="min-w-0">
                        <CardHeader className="space-y-4">
                            <CardTitle className="flex items-center gap-2"><Users size={20} /> Pacientes cadastrados</CardTitle>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                                <Input aria-label="Buscar pacientes por nome ou CPF" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou CPF…" className="pl-9" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : patients.length === 0 ? (
                                <div className="py-10 text-center text-sm text-slate-500">Nenhum paciente encontrado.</div>
                            ) : (
                                <div className="divide-y divide-slate-200">
                                    {patients.map((patient) => {
                                        const appointment = latestAppointments.get(patient.id);
                                        return <article key={patient.id} className="min-w-0 py-3 first:pt-0 last:pb-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0"><h3 className="break-words text-sm font-semibold text-slate-900">{patient.name}</h3><p className="text-xs text-slate-500">CPF: {patient.cpf || "—"}</p></div>
                                                {patient.consent && <Badge variant="secondary" className="shrink-0 text-[10px]">Consentimento</Badge>}
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600"><p>Telefone: {patient.phone || "—"}</p><p>{formatAgeSummary(patient.birthDate)}</p><p className="w-full break-words">Último atendimento: {appointment ? `${formatDate(appointment.date)}${appointment.procedure ? ` · ${appointment.procedure}` : ""}` : "—"}</p></div>
                                            <div className="mt-2 flex items-center justify-end gap-2"><Button variant="outline" className="min-h-11" onClick={() => beginEdit(patient)} aria-label={`Editar ${patient.name}`}><Pencil size={14} className="mr-2" /> Editar</Button><Button variant="ghost" className="h-11 w-11 shrink-0 p-0 text-slate-500 hover:text-red-700" onClick={() => deletePatient(patient)} aria-label={`Excluir ${patient.name}`}><Trash2 size={14} /></Button></div>
                                        </article>;
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card ref={formRef} hidden={!formOpen} className="attendance-reveal min-w-0 scroll-mt-24">
                        <CardHeader className="flex flex-row items-center justify-between gap-2"><CardTitle>{editingId ? "Editar paciente" : "Novo paciente"}</CardTitle><Button type="button" variant="ghost" className="min-h-11" onClick={() => setFormOpen(false)}>Recolher</Button></CardHeader>
                        <CardContent><form onSubmit={savePatient} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1"><div className="space-y-2"><Label htmlFor="patient-name">Nome *</Label><Input ref={nameInputRef} autoComplete="name" id="patient-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="patient-cpf">CPF *</Label><Input id="patient-cpf" value={form.cpf} onChange={(event) => setForm({ ...form, cpf: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="patient-birth-date">Data de nascimento</Label><Input id="patient-birth-date" type="date" value={form.birthDate || ""} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} max={new Date().toISOString().slice(0, 10)} /><p className="text-xs text-slate-500">{form.birthDate ? formatAgeSummary(form.birthDate) : "A idade será calculada pela data informada."}</p></div><div className="space-y-2"><Label htmlFor="patient-phone">Telefone</Label><Input type="tel" autoComplete="tel" id="patient-phone" value={form.phone || ""} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="patient-address">Endereço</Label><Input id="patient-address" value={form.address || ""} onChange={(event) => setForm({ ...form, address: event.target.value })} /></div></div>
                            <div className="space-y-2">
                                <Label htmlFor="patient-sex">Sexo</Label>
                                <select id="patient-sex" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={form.sex ?? ""} onChange={(event) => setForm({ ...form, sex: event.target.value === "male" ? "male" : event.target.value === "female" ? "female" : null })}>
                                    <option value="">Não informado</option>
                                    <option value="female">Feminino</option>
                                    <option value="male">Masculino</option>
                                </select>
                            </div>
                            <div className="space-y-2"><Label htmlFor="patient-weight">Peso (kg)</Label><Input id="patient-weight" inputMode="decimal" maxLength={8} value={form.weight || ""} onChange={event => setForm({ ...form, weight: event.target.value })} /><p className="text-xs text-slate-500">Mantenha o peso atualizado para consulta nos atendimentos e prescrições.</p></div>
                            <div className="space-y-2"><Label htmlFor="patient-history">Histórico</Label><Textarea id="patient-history" rows={3} value={form.history || ""} onChange={(event) => setForm({ ...form, history: event.target.value })} /></div>
                            <AttendanceSection title="Dados complementares do odontograma" summary="Editar registro existente"><div className="space-y-2"><Label htmlFor="patient-odontogram">Registro do odontograma</Label><Textarea id="patient-odontogram" rows={3} value={String(form.odontogram || "")} onChange={(event) => setForm({ ...form, odontogram: event.target.value })} /></div></AttendanceSection>
                            <div className="flex flex-col gap-2 sm:flex-row"><Button type="submit" disabled={saving} className="w-full sm:flex-1">{saving ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Save className="mr-2" size={16} />}{editingId ? "Salvar alterações" : "Cadastrar paciente"}</Button><Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto"><RotateCcw size={16} className="mr-2" /> Limpar</Button></div>
                        </form></CardContent>
                    </Card>
                </div>
            </div>
            </AttendanceWorkspace>
        </AdminLayout>
    );
};

export default AdminPatients;
