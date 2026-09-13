import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { AttendanceSection, AttendanceWorkspace } from "@/components/admin/attendance/AttendanceWorkspace";
import { API_URL, fetchClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Save, Trash2, Calendar, CalendarCheck, User, Clock, Stethoscope, Activity } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PatientPicker } from "@/components/admin/PatientPicker";
import PhotoGallery from "@/components/admin/attendance/PhotoGallery";
import Odontogram from "@/components/admin/attendance/Odontogram";
import FacialHarmonizationWorkspace from "@/components/admin/attendance/facial/FacialHarmonizationWorkspace";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EvolutionTimeline from "@/components/admin/attendance/EvolutionTimeline";
import { normalizeAppointmentType } from "@/lib/appointmentType";
import { normalizeOdontogram, OdontogramData } from "@/components/admin/attendance/odontogram/odontogramModel";
import { normalizeFacialNotes, FacialNotesDocument } from "@/components/admin/attendance/facial/facialModel";

// Interfaces
interface AppointmentData {
    id: number | 'new';
    patientName: string;
    cpf: string;
    phone: string;
    birthDate: string | null;
    sex: "female" | "male" | null;
    patientId: number | null;
    date: string;
    scheduledAt: string | null;
    createdAt?: string;
    procedure: string;
    professional: string;
    notes: string;
    weight: string;
    patientWeight: string | null;
    materials: string;
    complications: string;
    returnDate: string;
    returnAppointment: LinkedReturnAppointment | null;
    photos: string[];
    externalLinks: string[];
    appointmentType: string;
    price: string;
    paymentStatus: string;
    dentalNotes: OdontogramData;
    facialNotes: FacialNotesDocument;
}

interface LinkedReturnAppointment {
    id: number;
    scheduledAt: string | null;
    status: "scheduled" | "attended" | "cancelled";
}

export const formatDateTimeInput = (value?: string | null) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const localValue = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localValue.toISOString().slice(0, 16);
};

const formatDateTimeLabel = (value?: string | null) => {
    if (!value) return "Não informado";

    return new Date(value).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const DEFAULT_APPOINTMENT: AppointmentData = {
    id: 'new',
    patientName: "",
    cpf: "",
    phone: "",
    birthDate: null,
    sex: null,
    patientId: null,
    date: new Date().toISOString(),
    scheduledAt: null,
    procedure: "",
    professional: "",
    notes: "",
    weight: "",
    patientWeight: null,
    materials: "",
    complications: "",
    returnDate: "",
    returnAppointment: null,
    photos: [],
    externalLinks: [],
    appointmentType: "odontologia",
    price: "",
    paymentStatus: "received",
    dentalNotes: {},
    facialNotes: { version: 2, applications: [] }
};

interface AppointmentResponse {
    id?: number | "new";
    patientId?: number | null;
    patientName?: string | null;
    cpf?: string | null;
    phone?: string | null;
    birthDate?: string | null;
    patient?: { id?: number; name?: string; cpf?: string; phone?: string; birthDate?: string | null; sex?: "female" | "male" | null; weight?: string | null } | null;
    date?: string | null;
    scheduledAt?: string | null;
    createdAt?: string | null;
    returnDate?: string | null;
    returnAppointment?: {
        id?: number;
        scheduledAt?: string | null;
        status?: "scheduled" | "attended" | "cancelled" | null;
    } | null;
    photos?: unknown;
    externalLinks?: unknown;
    appointmentType?: unknown;
    price?: number | string | null;
    paymentStatus?: string | null;
    dentalNotes?: unknown;
    facialNotes?: unknown;
    weight?: string | null;
    materials?: string | null;
    complications?: string | null;
    notes?: string | null;
}

interface LeadResponse {
    id: number;
    name?: string;
    cpf?: string;
    phone?: string;
    scheduledAt?: string | null;
    treatment?: string;
    message?: string;
}

type AttendanceFlowStep = "summary" | "regions" | "records" | "evolution";

const ATTENDANCE_FLOW_STEPS: Array<{ id: AttendanceFlowStep; label: string }> = [
    { id: "summary", label: "Resumo" },
    { id: "regions", label: "Regiões clínicas" },
    { id: "records", label: "Registros" },
    { id: "evolution", label: "Evolução" },
];

export const normalizeAppointmentResponse = (fetched: AppointmentResponse): AppointmentData => {
    const patient = fetched.patient || {};

    return {
        ...DEFAULT_APPOINTMENT,
        ...fetched,
        patientId: fetched.patientId ?? patient.id ?? null,
        patientName: fetched.patientName || patient.name || "",
        cpf: fetched.cpf || patient.cpf || "",
        phone: fetched.phone || patient.phone || "",
        birthDate: fetched.birthDate || patient.birthDate || null,
        sex: patient.sex ?? null,
        scheduledAt: fetched.scheduledAt || null,
        createdAt: fetched.createdAt || undefined,
        returnDate: fetched.returnDate || "",
        returnAppointment: fetched.returnAppointment?.id
            ? {
                id: fetched.returnAppointment.id,
                scheduledAt: fetched.returnAppointment.scheduledAt || null,
                status: fetched.returnAppointment.status || "scheduled",
            }
            : null,
        photos: Array.isArray(fetched.photos) ? fetched.photos : [],
        externalLinks: Array.isArray(fetched.externalLinks) ? fetched.externalLinks : [],
        appointmentType: normalizeAppointmentType(fetched.appointmentType),
        price: fetched.price == null ? "" : String(fetched.price),
        paymentStatus: fetched.paymentStatus === "paid" ? "received" : (fetched.paymentStatus || "received"),
        dentalNotes: normalizeOdontogram(
            fetched.dentalNotes && typeof fetched.dentalNotes === "object"
                ? fetched.dentalNotes as OdontogramData
                : {},
        ),
        facialNotes: normalizeFacialNotes(fetched.facialNotes),
        weight: fetched.weight || "",
        patientWeight: patient.weight ?? null,
        materials: fetched.materials || "",
        complications: fetched.complications || "",
        notes: fetched.notes || ""
    };
};

const AdminAttendanceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const leadId = searchParams.get("leadId");
    const patientIdParam = searchParams.get("patientId");

    const [data, setData] = useState<AppointmentData>({ ...DEFAULT_APPOINTMENT });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"current" | "evolution">("current");
    const [flowStep, setFlowStep] = useState<AttendanceFlowStep>("summary");

    const userStr = localStorage.getItem("admin_user");
    const currentUser = userStr ? JSON.parse(userStr) : { name: "Profissional", role: 'admin' };
    const readOnly = currentUser.role === 'manager';

    useEffect(() => {
        if (id === 'new') {
            const parsedPatientId = patientIdParam ? Number.parseInt(patientIdParam, 10) : NaN;
            const dateParam = searchParams.get("date");
            const draft = {
                ...DEFAULT_APPOINTMENT,
                patientId: Number.isFinite(parsedPatientId) ? parsedPatientId : null,
                scheduledAt: dateParam ? new Date(dateParam).toISOString() : new Date().toISOString(),
                professional: currentUser.name || "Profissional"
            };
            if (leadId) {
                fetchLead(leadId, draft);
            } else {
                setData(draft);
                setIsLoading(false);
            }
        } else {
            fetchAppointment(id as string);
        }
    // These loaders are stable for the lifetime of this detail view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, leadId, patientIdParam]);

    const fetchLead = async (leadIdStr: string, draft: AppointmentData) => {
        try {
            const res = await fetchClient('/leads');
            if (res.ok) {
                const leads = await res.json();
                const lead = (leads as LeadResponse[]).find((l) => l.id === parseInt(leadIdStr));
                if (lead) {
                    const patient = await resolveLeadPatient(lead);
                    setData({
                        ...draft,
                        patientId: patient?.id ?? null,
                        sex: patient?.sex ?? null,
                        patientWeight: patient?.weight ?? null,
                        birthDate: patient?.birthDate ?? null,
                        patientName: lead.name || "",
                        cpf: lead.cpf || "",
                        phone: lead.phone || "",
                        scheduledAt: lead.scheduledAt || draft.scheduledAt,
                        procedure: lead.treatment || "",
                        notes: lead.message || "",
                    });
                    toast.info(`Iniciando atendimento para ${lead.name}`);
                }
            }
        } catch (error) {
            console.error("Error fetching lead:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const resolveLeadPatient = async (lead: LeadResponse): Promise<AppointmentResponse["patient"]> => {
        const findPatient = async (endpoint: string): Promise<AppointmentResponse["patient"]> => {
            try {
                const patientRes = await fetchClient(endpoint);
                if (!patientRes.ok) return null;
                const patients = await patientRes.json();
                if (Array.isArray(patients) && patients.length > 0 && Number.isFinite(patients[0]?.id)) {
                    return patients[0];
                }
            } catch (error) {
                console.error("Error resolving lead patient:", error);
            }
            return null;
        };

        const phone = typeof lead.phone === "string" ? lead.phone.trim() : "";
        if (phone) {
            const patientId = await findPatient(`/patients?phone=${encodeURIComponent(phone)}`);
            if (patientId) return patientId;
        }

        const cpf = typeof lead.cpf === "string" ? lead.cpf.trim() : "";
        if (cpf) {
            const patientId = await findPatient(`/patients?cpf=${encodeURIComponent(cpf)}`);
            if (patientId) return patientId;
        }

        return null;
    };

    const fetchAppointment = async (appId: string) => {
        try {
            const res = await fetchClient(`/appointments/${appId}`);
            if (res.ok) {
                const fetched = await res.json();
                setData(normalizeAppointmentResponse(fetched));
            } else {
                toast.error("Atendimento não encontrado.");
                navigate('/admin/consultas');
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!data.patientName || !data.procedure) {
            toast.error("Preencha ao menos o Nome do Paciente e o Procedimento.");
            return;
        }

        setIsSaving(true);
        try {
            const isNew = id === 'new';
            const url = isNew ? `${API_URL}/appointments` : `${API_URL}/appointments/${id}`;
            const method = isNew ? "POST" : "PUT";

            // If new and patient doesn't exist, create it via endpoint
            let finalPatientId = data.patientId;
            if (isNew && !finalPatientId) {
                if (data.patientName && data.cpf) {
                    const pRes = await fetchClient(`/patients`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: data.patientName, cpf: data.cpf, phone: data.phone || undefined })
                    });
                    if (pRes.ok) {
                        const newPatient = await pRes.json();
                        finalPatientId = newPatient.id;
                    } else {
                        toast.error("Erro ao cadastrar paciente. Verifique se o CPF já está em uso.");
                        setIsSaving(false);
                        return;
                    }
                } else {
                    toast.error("Selecione um paciente existente ou informe o CPF para cadastrá-lo antes de finalizar.");
                    setIsSaving(false);
                    return;
                }
            }

            const payload = {
                ...data,
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : null,
                patientId: finalPatientId,
                returnDate: data.returnDate ? new Date(data.returnDate).toISOString() : null
            };
            // `phone` is temporary patient-contact state used when creating a
            // patient from a lead. It is not an Appointment Prisma field, so
            // keep it out of both POST and PUT appointment payloads.
            const {
                phone: _phone,
                sex: _sex,
                patientWeight: _patientWeight,
                weight: _historicalWeight,
                id: _id,
                createdAt: _createdAt,
                ...payloadForRequest
            } = payload;

            const res = await fetchClient(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadForRequest)
            });

            if (res.ok) {
                const saved = await res.json();

                if (isNew && leadId) {
                    await fetchClient(`/leads/${leadId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: 'completed' })
                    });
                }

                toast.success(isNew ? "Atendimento registrado com sucesso!" : "Alterações salvas.");
                if (isNew) {
                    navigate(`/admin/consultas/${saved.id}`, { replace: true });
                } else {
                    setData(previous => normalizeAppointmentResponse({ ...saved, patient: saved.patient ?? { id: previous.patientId, birthDate: previous.birthDate, sex: previous.sex, weight: previous.patientWeight } }));
                }
            } else {
                const error = await res.json().catch(() => null);
                toast.error(error?.error || "Erro ao salvar.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro de conexão.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirm("Tem certeza que deseja excluir esta consulta definitivamente?")) {
            try {
                const res = await fetchClient(`/appointments/${id}`, {
                    method: 'DELETE',
                });
                if (res.ok) {
                    toast.success("Consulta apagada!");
                    navigate('/admin/consultas');
                } else {
                    toast.error("Falha ao apagar.");
                }
            } catch (err) {
                toast.error("Erro de rede.");
            }
        }
    };

    const updateField = (field: keyof AppointmentData, value: AppointmentData[keyof AppointmentData]) => {
        if (readOnly) return;
        setData(prev => ({ ...prev, [field]: value }));
    };

    const navigateFlow = (step: AttendanceFlowStep) => {
        setFlowStep(step);
        if (step === "evolution") {
            setActiveTab("evolution");
            return;
        }

        setActiveTab("current");
        window.requestAnimationFrame(() => {
            document.getElementById(`attendance-step-${step}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };

    if (isLoading) {
        return (
            <AdminLayout title="Carregando Detalhes...">
                <AttendanceWorkspace active="consultas"><div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-600">Carregando detalhes…</div></AttendanceWorkspace>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={id === 'new' ? "Registrar Novo Atendimento" : `Evolução Clínica #${id}`}>
            <AttendanceWorkspace active="consultas">
            <div className="attendance-actionbar justify-between">
                <Button variant="outline" onClick={() => navigate(-1)} className="gap-2 shrink-0 border-slate-200">
                    <ChevronLeft size={16} /> Voltar à Lista
                </Button>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {id !== 'new' && !readOnly && (
                        <Button
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={handleDelete}
                        >
                            <Trash2 size={16} className="mr-2" /> Excluir
                        </Button>
                    )}
                    {!readOnly && (
                        <Button
                            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 w-full md:w-auto"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <Save size={16} className="mr-2" />
                            {isSaving ? "Salvando..." : (id === 'new' ? "Registrar Atendimento" : "Salvar Alterações")}
                        </Button>
                    )}
                </div>
            </div>

            <nav aria-label="Etapas do atendimento" className="attendance-flow-nav no-print">
                <span className="attendance-flow-label">Fluxo do atendimento</span>
                <div className="attendance-flow-steps">
                    {ATTENDANCE_FLOW_STEPS.map((step, index) => (
                        <React.Fragment key={step.id}>
                            {index > 0 && <span className="attendance-flow-divider" aria-hidden="true">›</span>}
                            <button
                                type="button"
                                aria-current={flowStep === step.id ? "step" : undefined}
                                className="attendance-flow-step"
                                onClick={() => navigateFlow(step.id)}
                            >
                                <span className="attendance-flow-index" aria-hidden="true">{index + 1}</span>
                                <span>{step.label}</span>
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            </nav>

            <div className="attendance-detail-page space-y-3 pb-12">
                <Tabs value={activeTab} onValueChange={(value) => {
                    const nextTab = value as "current" | "evolution";
                    setActiveTab(nextTab);
                    if (nextTab === "evolution") setFlowStep("evolution");
                }} className="w-full">
                    <div className="flex justify-center mb-3">
                        <TabsList className="grid min-h-12 w-full max-w-md grid-cols-2 bg-slate-100 p-1">
                            <TabsTrigger value="current" className="font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                Sessão Atual
                            </TabsTrigger>
                            <TabsTrigger value="evolution" className="font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex gap-2">
                                <Clock size={16} /> Evolução Temporal
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="current" className="space-y-6 md:space-y-8 outline-none">
                        {/* Basic Info Section */}
                        <Card id="attendance-step-summary" className="attendance-editor-card scroll-mt-24 border-slate-200 shadow-sm overflow-visible">
                            <CardContent className="p-3 sm:p-4">
                                <div className="grid items-start grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
                                    <div className="space-y-1.5 lg:col-span-2">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <User size={12} /> Paciente e CPF
                                        </Label>
                                        {!readOnly && (
                                            <div className="space-y-2">
                                                <PatientPicker
                                                    selectedPatient={data.patientId ? {
                                                        id: data.patientId,
                                                        name: data.patientName,
                                                        cpf: data.cpf,
                                                        phone: data.phone,
                                                        birthDate: data.birthDate,
                                                        sex: data.sex,
                                                        weight: data.patientWeight,
                                                    } : null}
                                                    onSelect={(p) => {
                                                        updateField('patientName', p.name);
                                                        updateField('cpf', p.cpf);
                                                        updateField('phone', p.phone || '');
                                                        updateField('birthDate', p.birthDate || null);
                                                        updateField('sex', p.sex ?? null);
                                                        updateField('patientWeight', p.weight ?? null);
                                                        updateField('patientId', p.id);
                                                    }}
                                                />
                                                {id !== 'new' && data.patientId && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-9 text-xs"
                                                        onClick={() => navigate(`/admin/pacientes?edit=${data.patientId}`)}
                                                    >
                                                        Editar cadastro do paciente
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                        <p className="mt-2 text-sm text-slate-600">Peso cadastral: {data.patientWeight ? `${data.patientWeight.replace('.', ',')} kg` : 'Não informado'}</p>
                                        {data.weight && <p className="text-xs text-slate-500">Peso registrado neste atendimento: {data.weight} (histórico)</p>}
                                        {id === 'new' ? (
                                            <>
                                                <div className="grid grid-cols-2 gap-3 pt-2">
                                                    <Input
                                                        value={data.patientName}
                                                        onChange={(e) => updateField('patientName', e.target.value)}
                                                        placeholder="Nome Completo"
                                                        className="h-10 font-bold bg-slate-50 border-slate-100 placeholder:font-normal"
                                                    />
                                                    <Input
                                                        value={data.cpf}
                                                        onChange={(e) => updateField('cpf', e.target.value)}
                                                        placeholder="CPF"
                                                        className="h-10 font-mono font-bold bg-slate-50 border-slate-100 placeholder:font-normal"
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col gap-1 mt-2">
                                                <h3 className="text-sm font-medium text-slate-700">{data.patientName}</h3>
                                                <span className="text-sm font-mono text-slate-500">{data.cpf}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Activity size={12} /> Procedimento Principal
                                        </Label>
                                        <Input
                                            value={data.procedure}
                                            onChange={(e) => updateField('procedure', e.target.value)}
                                            placeholder="Ex: Harmonização Global"
                                            className="h-10 font-bold text-primary bg-primary/5 border-primary/20"
                                            disabled={readOnly}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Stethoscope size={12} /> Tipo
                                        </Label>
                                        <Select
                                            value={data.appointmentType}
                                            onValueChange={(val) => updateField('appointmentType', val)}
                                            disabled={readOnly}
                                        >
                                            <SelectTrigger className="h-10 font-bold bg-slate-50 border-slate-100">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="odontologia">Odontologia</SelectItem>
                                                <SelectItem value="harmonizacao">Harmonização Facial</SelectItem>
                                                <SelectItem value="ambos">Ambos</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Clock size={12} /> Agendado para
                                        </Label>
                                        <Input
                                            type="datetime-local"
                                            value={formatDateTimeInput(data.scheduledAt)}
                                            onChange={(e) => updateField('scheduledAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
                                            className="h-10 font-bold bg-slate-50 border-slate-100"
                                            disabled={readOnly}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Calendar size={12} /> Retorno Desejado
                                        </Label>
                                        <Input
                                            type="datetime-local"
                                            value={formatDateTimeInput(data.returnDate)}
                                            onChange={(e) => updateField('returnDate', e.target.value ? new Date(e.target.value).toISOString() : "")}
                                            className="h-10 font-bold bg-slate-50 border-slate-100"
                                            disabled={readOnly}
                                        />
                                        {data.returnAppointment ? (
                                            <p className={
                                                `flex items-start gap-1.5 text-xs leading-5 ${
                                                    data.returnAppointment.status === "cancelled" ? "text-slate-500" : "text-emerald-700"
                                                }`
                                            }>
                                                <CalendarCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                                <span>
                                                    {data.returnAppointment.status === "cancelled"
                                                        ? "Retorno vinculado cancelado."
                                                        : `Retorno #${data.returnAppointment.id} incluído na agenda para ${formatDateTimeLabel(data.returnAppointment.scheduledAt)}.`}
                                                </span>
                                            </p>
                                        ) : data.returnDate ? (
                                            <p className="text-xs leading-5 text-slate-500">
                                                Ao salvar, este retorno será incluído na agenda futura.
                                            </p>
                                        ) : null}
                                    </div>

                                    {id !== 'new' && (
                                        <div className="space-y-1.5 lg:col-span-5">
                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Clock size={12} /> Criado em
                                            </Label>
                                            <p className="text-sm font-medium text-slate-600 pt-2">
                                                {formatDateTimeLabel(data.createdAt)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Secondary Clinical Indicators */}
                        <div id="attendance-step-regions" className="scroll-mt-24 space-y-3">
                            <div className="attendance-step-heading">
                                <p className="attendance-step-kicker">Etapa 2</p>
                                <h2>Regiões clínicas</h2>
                                <p>Registre anotações por região sem perder o contexto do atendimento.</p>
                            </div>
                        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                            <AttendanceSection className="lg:col-span-2" title="Diário clínico" summary={data.notes || data.complications ? "Informações preenchidas" : "Anamnese e intercorrências"} defaultOpen>
                                <Card className="border-0 shadow-none"><CardContent className="space-y-4 p-0">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-600">Descrição do Caso (Anamnese/Evolução)</Label>
                                        <Textarea
                                            value={data.notes}
                                            onChange={(e) => updateField('notes', e.target.value)}
                                            placeholder="O que foi feito..."
                                            className="min-h-[120px] bg-slate-50 border-slate-100"
                                            disabled={readOnly}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-red-500">Avisos / Intercorrências</Label>
                                        <Textarea
                                            value={data.complications}
                                            onChange={(e) => updateField('complications', e.target.value)}
                                            placeholder="Alergias, intercorrências..."
                                            className="min-h-[80px] bg-red-50/50 border-red-100"
                                            disabled={readOnly}
                                        />
                                    </div>
                                </CardContent></Card>
                            </AttendanceSection>

                            <AttendanceSection title="Materiais complementares" summary={data.materials ? "Anotações registradas" : "Insumos não registrados no mapa"}>
                                <div className="space-y-2">
                                    <Label htmlFor="attendance-materials" className="text-xs font-bold text-slate-600">Outros materiais e observações</Label>
                                    <Textarea id="attendance-materials" value={data.materials}
                                        onChange={e => updateField('materials', e.target.value)}
                                        placeholder="Seringas, gazes e outros insumos..."
                                        className="min-h-[100px] bg-slate-50 border-slate-100" disabled={readOnly} />
                                    <p className="text-xs text-slate-500">Registre aqui apenas os insumos complementares. Produto e dose de cada aplicação ficam no histórico do facemap.</p>
                                </div>
                            </AttendanceSection>

                            <AttendanceSection title="Faturamento" summary={data.price ? `R$ ${data.price}` : "Valor e status no caixa"}>
                                <Card className="border-0 shadow-none"><CardContent className="space-y-4 p-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-600">Valor Cobrado (R$)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={data.price}
                                                onChange={(e) => updateField('price', e.target.value)}
                                                placeholder="0.00"
                                                className="h-10 text-lg font-bold text-emerald-700 bg-emerald-50 border-emerald-100 placeholder:text-emerald-300"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-600">Status no Caixa</Label>
                                            <Select 
                                                value={data.paymentStatus} 
                                                onValueChange={(val) => updateField('paymentStatus', val)}
                                                disabled={readOnly}
                                            >
                                                <SelectTrigger className="h-10 font-bold bg-slate-50 border-slate-100">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="received" className="text-emerald-600 font-bold">Recebido — entra no caixa</SelectItem>
                                                    <SelectItem value="pending" className="text-orange-600 font-bold">A Receber — pendente de cobrança</SelectItem>
                                                    <SelectItem value="courtesy">Cortesia / Retorno (R$ 0)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic mt-2">
                                        * Se preenchido acima de R$ 0,00, finalizar este atendimento gerará automaticamente uma transação no seu módulo Financeiro com os dados deste paciente.
                                    </p>
                                </CardContent></Card>
                            </AttendanceSection>
                        </div>

                        {/* Specific Regions - Odontogram */}
                        {(data.appointmentType === 'odontologia' || data.appointmentType === 'ambos') && (
                            <Odontogram
                                data={data.dentalNotes}
                                onChange={(notes) => updateField('dentalNotes', notes)}
                                readOnly={readOnly}
                                birthDate={data.birthDate}
                            />
                        )}

                        {/* Specific Regions - Face Map */}
                        {(data.appointmentType === 'harmonizacao' || data.appointmentType === 'ambos') && (
                            <FacialHarmonizationWorkspace
                                value={data.facialNotes}
                                sex={data.sex}
                                onChange={(notes) => updateField('facialNotes', notes)}
                                readOnly={readOnly}
                                onSave={handleSave}
                            />
                        )}
                        </div>

                        {/* Evolution Gallery & Links */}
                        <div id="attendance-step-records" className="scroll-mt-24 space-y-3">
                            <div className="attendance-step-heading">
                                <p className="attendance-step-kicker">Etapa 3</p>
                                <h2>Registros do atendimento</h2>
                                <p>Adicione fotos e links para acompanhar o resultado.</p>
                            </div>
                            <PhotoGallery
                                photos={data.photos}
                                externalLinks={data.externalLinks}
                                onChange={(photos) => updateField('photos', photos)}
                                onLinksChange={(links) => updateField('externalLinks', links)}
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Bottom Save Reminder */}
                        {!readOnly && (
                            <div className="flex justify-end pt-4">
                                <Button
                                    className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-bold shadow-lg shadow-primary/20 text-lg"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    <Save size={20} className="mr-3" />
                                    {id === 'new' ? "Finalizar Atendimento" : "Salvar Prontuário Atualizado"}
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="evolution" className="outline-none">
                        <EvolutionTimeline 
                            patientId={data.patientId} 
                            currentAppointmentId={id === 'new' ? undefined : id} 
                        />
                    </TabsContent>
                </Tabs>
            </div>
            </AttendanceWorkspace>
        </AdminLayout>
    );
};

export default AdminAttendanceDetail;
