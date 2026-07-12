import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { API_URL, fetchClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Save, Trash2, Calendar, User, Clock, Stethoscope, CreditCard, Activity } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PatientPicker } from "@/components/admin/PatientPicker";
import PhotoGallery from "@/components/admin/attendance/PhotoGallery";
import Odontogram, { ToothData } from "@/components/admin/attendance/Odontogram";
import FaceMap, { FaceRegionData } from "@/components/admin/attendance/FaceMap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EvolutionTimeline from "@/components/admin/attendance/EvolutionTimeline";

// Interfaces
interface AppointmentData {
    id: number | 'new';
    patientName: string;
    cpf: string;
    phone: string;
    patientId: number | null;
    date: string;
    procedure: string;
    professional: string;
    notes: string;
    weight: string;
    materials: string;
    complications: string;
    returnDate: string;
    photos: string[];
    externalLinks: string[];
    appointmentType: string;
    price: string;
    paymentStatus: string;
    dentalNotes: Record<string, ToothData>;
    facialNotes: Record<string, FaceRegionData>;
}

const DEFAULT_APPOINTMENT: AppointmentData = {
    id: 'new',
    patientName: "",
    cpf: "",
    phone: "",
    patientId: null,
    date: new Date().toISOString(),
    procedure: "",
    professional: "",
    notes: "",
    weight: "",
    materials: "",
    complications: "",
    returnDate: "",
    photos: [],
    externalLinks: [],
    appointmentType: "odontologia",
    price: "",
    paymentStatus: "paid",
    dentalNotes: {},
    facialNotes: {}
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

    const userStr = localStorage.getItem("admin_user");
    const currentUser = userStr ? JSON.parse(userStr) : { name: "Profissional", role: 'admin' };
    const readOnly = currentUser.role === 'manager';

    useEffect(() => {
        if (id === 'new') {
            const parsedPatientId = patientIdParam ? Number.parseInt(patientIdParam, 10) : NaN;
            const draft = {
                ...DEFAULT_APPOINTMENT,
                patientId: Number.isFinite(parsedPatientId) ? parsedPatientId : null,
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
    }, [id, leadId, patientIdParam]);

    const fetchLead = async (leadIdStr: string, draft: AppointmentData) => {
        try {
            const res = await fetch(`${API_URL}/leads`);
            if (res.ok) {
                const leads = await res.json();
                const lead = leads.find((l: any) => l.id === parseInt(leadIdStr));
                if (lead) {
                    const patientId = await resolveLeadPatient(lead);
                    setData({
                        ...draft,
                        patientId,
                        patientName: lead.name || "",
                        cpf: lead.cpf || "",
                        phone: lead.phone || "",
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

    const resolveLeadPatient = async (lead: any): Promise<number | null> => {
        const findPatient = async (endpoint: string): Promise<number | null> => {
            try {
                const patientRes = await fetchClient(endpoint);
                if (!patientRes.ok) return null;
                const patients = await patientRes.json();
                if (Array.isArray(patients) && patients.length > 0 && Number.isFinite(patients[0]?.id)) {
                    return patients[0].id;
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
            const res = await fetch(`${API_URL}/appointments/${appId}`);
            if (res.ok) {
                const fetched = await res.json();

                // Parse date strings for inputs
                const returnDateStr = fetched.returnDate ? new Date(fetched.returnDate).toISOString().split('T')[0] : '';

                setData({
                    ...fetched,
                    patientId: fetched.patientId ?? fetched.patient?.id ?? null,
                    patientName: fetched.patientName || fetched.patient?.name || "",
                    cpf: fetched.cpf || fetched.patient?.cpf || "",
                    phone: fetched.phone || fetched.patient?.phone || "",
                    returnDate: returnDateStr,
                    photos: fetched.photos || [],
                    externalLinks: fetched.externalLinks || [],
                    appointmentType: fetched.appointmentType || "odontologia",
                    price: fetched.price !== undefined ? fetched.price.toString() : "",
                    paymentStatus: fetched.paymentStatus || "paid",
                    dentalNotes: fetched.dentalNotes || {},
                    facialNotes: fetched.facialNotes || {},
                    weight: fetched.weight || "",
                    materials: fetched.materials || "",
                    complications: fetched.complications || "",
                    notes: fetched.notes || ""
                });
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
            if (isNew && !finalPatientId && data.patientName && data.cpf) {
                const pRes = await fetchClient(`/patients`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: data.patientName, cpf: data.cpf, phone: data.phone || undefined })
                });
                if (pRes.ok) {
                    const newPatient = await pRes.json();
                    finalPatientId = newPatient.id;
                }
            }

            if (isNew && leadId && !finalPatientId) {
                toast.error("Selecione um paciente existente ou informe o CPF para cadastrá-lo antes de finalizar.");
                return;
            }

            const payload = {
                ...data,
                patientId: finalPatientId,
                returnDate: data.returnDate ? new Date(data.returnDate).toISOString() : null
            };
            if (!isNew) {
                delete (payload as any).id; // don't send ID in body explicitly if PUT usually ignores, just safe
                delete (payload as any).patient;
                delete (payload as any).createdAt;
                delete (payload as any).updatedAt;
            }

            const res = await fetchClient(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
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

    const updateField = (field: keyof AppointmentData, value: any) => {
        if (readOnly) return;
        setData(prev => ({ ...prev, [field]: value }));
    };

    if (isLoading) {
        return (
            <AdminLayout title="Carregando Detalhes...">
                <div className="flex h-[50vh] items-center justify-center">Carregando...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={id === 'new' ? "Registrar Novo Atendimento" : `Evolução Clínica #${id}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
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

            <div className="space-y-6 md:space-y-8 pb-12">
                <Tabs defaultValue="current" className="w-full">
                    <div className="flex justify-center mb-6">
                        <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 p-1">
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
                        <Card className="border-slate-200 shadow-sm overflow-visible">
                            <CardContent className="p-6 md:p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                                    <div className="space-y-1.5 lg:col-span-2">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <User size={12} /> Paciente e CPF
                                        </Label>
                                        {id === 'new' ? (
                                            <>
                                                <PatientPicker
                                                    onSelect={(p) => {
                                                        updateField('patientName', p.name);
                                                        updateField('cpf', p.cpf);
                                                        updateField('phone', p.phone || '');
                                                        updateField('patientId', p.id);
                                                    }}
                                                />
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
                                                <h3 className="text-xl font-bold font-serif text-slate-900">{data.patientName}</h3>
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
                                            <Calendar size={12} /> Retorno Desejado
                                        </Label>
                                        <Input
                                            type="date"
                                            value={data.returnDate}
                                            onChange={(e) => updateField('returnDate', e.target.value)}
                                            className="h-10 font-bold bg-slate-50 border-slate-100"
                                            disabled={readOnly}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Secondary Clinical Indicators */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border-slate-200 shadow-sm">
                                <CardContent className="p-6 space-y-4">
                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                        <Stethoscope size={16} /> Diário Clínico Geral
                                    </h4>
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
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 shadow-sm">
                                <CardContent className="p-6 space-y-4">
                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                        <CreditCard size={16} /> Resumo de Protocolo Geral
                                    </h4>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-600">Peso do Paciente (kg)</Label>
                                        <Input
                                            value={data.weight}
                                            onChange={(e) => updateField('weight', e.target.value)}
                                            placeholder="75kg"
                                            className="h-10 bg-slate-50 border-slate-100"
                                            disabled={readOnly}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-600">Lote Global / Materiais Diversos</Label>
                                        <Textarea
                                            value={data.materials}
                                            onChange={(e) => updateField('materials', e.target.value)}
                                            placeholder="Seringas, gazes, lotes não mapeados nas regiões..."
                                            className="min-h-[145px] bg-slate-50 border-slate-100"
                                            disabled={readOnly}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="border-slate-200 shadow-sm lg:col-span-2">
                                <CardContent className="p-6 space-y-4">
                                    <h4 className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 mb-4">
                                        <CreditCard size={16} /> Faturamento Automático
                                    </h4>
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
                                                    <SelectItem value="paid" className="text-emerald-600 font-bold">Recebido (Cai no Caixa)</SelectItem>
                                                    <SelectItem value="pending" className="text-orange-600 font-bold">A Receber (Recepção Cobra)</SelectItem>
                                                    <SelectItem value="courtesy">Cortesia / Retorno (R$ 0)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic mt-2">
                                        * Se preenchido acima de R$ 0,00, finalizar este atendimento gerará automaticamente uma transação no seu módulo Financeiro com os dados deste paciente.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Specific Regions - Odontogram */}
                        {(data.appointmentType === 'odontologia' || data.appointmentType === 'ambos') && (
                            <Odontogram
                                data={data.dentalNotes}
                                onChange={(notes) => updateField('dentalNotes', notes)}
                                readOnly={readOnly}
                            />
                        )}

                        {/* Specific Regions - Face Map */}
                        {(data.appointmentType === 'harmonizacao' || data.appointmentType === 'ambos') && (
                            <FaceMap
                                data={data.facialNotes}
                                onChange={(notes) => updateField('facialNotes', notes)}
                                readOnly={readOnly}
                            />
                        )}

                        {/* Evolution Gallery & Links */}
                        <PhotoGallery
                            photos={data.photos}
                            externalLinks={data.externalLinks}
                            onChange={(photos) => updateField('photos', photos)}
                            onLinksChange={(links) => updateField('externalLinks', links)}
                            readOnly={readOnly}
                        />

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
        </AdminLayout>
    );
};

export default AdminAttendanceDetail;
