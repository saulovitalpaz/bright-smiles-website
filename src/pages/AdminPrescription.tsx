import React, { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { API_URL, fetchClient } from "@/lib/api";
import Odontogram from "@/components/admin/attendance/Odontogram";
import { normalizeOdontogram, type OdontogramData } from "@/components/admin/attendance/odontogram/odontogramModel";
import { DownloadPrescriptionButton } from "@/components/PrescriptionGenerator";
import { ProfessionalSignature } from "@/components/admin/ProfessionalSignature";
import { ConsentDialog } from "@/components/ConsentDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Printer,
    User,
    MapPin,
    CreditCard,
    Type,
    Save,
    QrCode,
    ExternalLink,
    Search,
    Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";
import { PatientPicker } from "@/components/admin/PatientPicker";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { printDocumentClass } from "@/lib/print-layout";
import {
    hasCompleteProfessionalIdentity,
    hasUsableProfessionalSignature,
    readStoredProfessionalIdentity,
} from "@/lib/professional-signature";

type PrescriptionHistoryItem = {
    id: number;
    patient: string;
    date: string;
    preview: string;
    content: string;
};

type StoredPrescription = {
    id: number;
    date: string;
    content: string;
};

type PrintTarget = "prescription" | "odontogram";

const AdminPrescription = () => {
    const [searchParams] = useSearchParams();
    const urlCpf = searchParams.get("cpf");

    const [patientData, setPatientData] = useState({
        id: null as number | null,
        name: "",
        cpf: "",
        address: "",
        phone: "",
        birthDate: null as string | null,
        odontogram: {} as OdontogramData,
        odontogramSourceAppointmentId: null as number | null,
    });

    const [prescriptionHistory, setPrescriptionHistory] = useState<PrescriptionHistoryItem[]>([]);
    const [prescriptionContent, setPrescriptionContent] = useState("");
    const [showConsentDialog, setShowConsentDialog] = useState(false);
    const [patientConsent, setPatientConsent] = useState(false);
    const [includeOdontogram, setIncludeOdontogram] = useState(false);
    const [printTarget, setPrintTarget] = useState<PrintTarget | null>(null);

    const editorRef = useRef<HTMLDivElement>(null);

    const currentUser = readStoredProfessionalIdentity();
    const canIssueDocument = hasCompleteProfessionalIdentity(currentUser);
    const canInsertSignature = hasUsableProfessionalSignature(currentUser);
    const [includeProfessionalSignature, setIncludeProfessionalSignature] = useState(
        () => canInsertSignature,
    );

    const normalizedOdontogram = normalizeOdontogram(patientData.odontogram);
    const isPrescriptionPrint = printTarget === "prescription";

    useEffect(() => {
        if (!printTarget) return;

        const clearPrintTarget = () => setPrintTarget(null);
        window.addEventListener("afterprint", clearPrintTarget);
        const frame = window.requestAnimationFrame(() => window.print());

        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("afterprint", clearPrintTarget);
        };
    }, [printTarget]);

    useEffect(() => {
        if (urlCpf) {
            fetchPatient(urlCpf);
        }
    }, [urlCpf]);

    const fetchPatient = async (cpf: string) => {
        try {
            const res = await fetchClient(`/patients/${cpf}`);
            if (res.ok) {
                const data = await res.json();
                setPatientData({
                    id: data.id,
                    name: data.name,
                    cpf: data.cpf,
                    address: data.address || "",
                    phone: data.phone || "",
                    birthDate: data.birthDate || null,
                    odontogram: data.odontogram || {},
                    odontogramSourceAppointmentId: null,
                });

                const latestOdontogramAppointment = Array.isArray(data.appointments)
                    ? [...data.appointments]
                        .filter((appointment) => appointment?.dentalNotes && typeof appointment.dentalNotes === "object")
                        .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())[0]
                    : null;
                if (latestOdontogramAppointment?.dentalNotes) {
                    setPatientData((previous) => ({
                        ...previous,
                        odontogram: latestOdontogramAppointment.dentalNotes,
                        odontogramSourceAppointmentId: latestOdontogramAppointment.id || null,
                    }));
                }

                setPatientConsent(!!data.consent);
                if (!data.consent) {
                    // Suggest consent signature if not present
                    // setShowConsentDialog(true); // Optional: auto-open
                }

                toast.success("Paciente encontrado!");
                // Load history if needed
                if (data.prescriptions) {
                    setPrescriptionHistory(data.prescriptions.map((p: StoredPrescription) => ({
                        id: p.id,
                        patient: data.name,
                        date: new Date(p.date).toLocaleDateString(),
                        preview: "Receita registrada",
                        content: p.content
                    })));
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadPrescription = (content: string) => {
        if (window.confirm("Carregar esta receita substituirá o conteúdo atual. Continuar?")) {
            setPrescriptionContent(content);
            if (editorRef.current) {
                editorRef.current.innerHTML = content;
            }
            toast.success("Receita carregada!");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Excluir esta receita do histórico?")) return;
        try {
            const res = await fetchClient(`/prescriptions/${id}`, { method: "DELETE" });
            if (res.ok) {
                setPrescriptionHistory(prev => prev.filter(p => p.id !== id));
                toast.success("Receita excluída!");
            }
        } catch (e) {
            toast.error("Erro ao excluir");
        }
    };

    // handleFormat is no longer needed as RichTextEditor handles formatting internally
    // const handleFormat = (command: string, value: string = "") => {
    //     document.execCommand(command, false, value);
    // };

    const handleCpfChange = (val: string) => {
        setPatientData(prev => ({ ...prev, cpf: val }));
        if (val.length >= 11) { // Simple debounce/trigger
            fetchPatient(val);
        }
    };

    const handleSave = async () => {
        if (!patientData.name || !patientData.cpf) return toast.error("Preencha nome e CPF");

        try {
            // 1. Upsert Patient (with Odontogram)
            const patientRes = await fetchClient(`/patients`, {
                method: "POST",
                body: JSON.stringify({
                    name: patientData.name,
                    cpf: patientData.cpf,
                    address: patientData.address,
                    phone: patientData.phone,
                    ...(patientData.birthDate ? { birthDate: patientData.birthDate } : {}),
                    odontogram: patientData.odontogram,
                })
            });

            if (!patientRes.ok) throw new Error("Falha ao salvar paciente");
            const savedPatient = await patientRes.json();
            setPatientData(prev => ({ ...prev, id: savedPatient.id }));

            // 2. Save Prescription (only if content exists)
            if (prescriptionContent.trim()) {
                const presRes = await fetchClient(`/prescriptions`, {
                    method: "POST",
                    body: JSON.stringify({
                        content: prescriptionContent,
                        patientId: savedPatient.id,
                        includeOdontogram,
                        odontogramSnapshot: includeOdontogram ? patientData.odontogram : null,
                        odontogramSourceAppointmentId: includeOdontogram ? patientData.odontogramSourceAppointmentId : null,
                    })
                });

                if (!presRes.ok) {
                    const errorBody = await presRes.json().catch(() => null);
                    throw new Error(errorBody?.error || "Falha ao salvar prescrição");
                }
                const savedPres = await presRes.json();
                setPrescriptionHistory((previous) => [
                    {
                        id: savedPres.id,
                        patient: savedPatient.name,
                        date: new Date().toLocaleDateString(),
                        preview: "Nova receita salva",
                        content: prescriptionContent
                    },
                    ...previous
                ]);
                toast.success("Receita salva!");
            } else {
                toast.success("Dados do paciente atualizados!");
            }

        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Erro ao salvar prescrição");
        }
    };

    const handlePrint = () => {
        if (!prescriptionContent) {
            return toast.error("Escreva o conteúdo da receita antes de imprimir.");
        }
        if (!canIssueDocument) {
            return toast.error("Configure o nome profissional e o CRO antes de imprimir.");
        }
        setPrintTarget("prescription");
    };

    const handlePrintOdontogram = () => {
        if (!Object.keys(normalizedOdontogram.teeth).length) {
            return toast.error("Nenhum odontograma registrado para este paciente.");
        }
        if (!canIssueDocument) {
            return toast.error("Configure o nome profissional e o CRO antes de imprimir.");
        }
        setPrintTarget("odontogram");
    };

    return (
        <AdminLayout title="Prescrição Clínica">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-20 no-print">
                {/* Patient Info Form */}
                <div className="min-w-0 lg:col-span-1 space-y-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl font-serif">Dados do Paciente</CardTitle>
                            <CardDescription>Busque pelo nome ou CPF para preencher.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                                    <Search size={14} /> Buscar Paciente
                                </Label>
                                <PatientPicker
                                    onSelect={(p) => {
                                        setPatientData({
                                            id: p.id,
                                            name: p.name,
                                            cpf: p.cpf,
                                            address: p.address || "",
                                            phone: p.phone || "",
                                            birthDate: p.birthDate || null,
                                            odontogram: {},
                                            odontogramSourceAppointmentId: null,
                                        });
                                        fetchPatient(p.cpf); // Load history
                                    }}
                                />
                            </div>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-muted-foreground">Ou edite manualmente</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                                    <User size={14} /> Nome Completo
                                </Label>
                                <Input
                                    placeholder="Ex: João da Silva"
                                    value={patientData.name}
                                    onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                                    <CreditCard size={14} /> CPF
                                </Label>
                                <Input
                                    placeholder="000.000.000-00"
                                    value={patientData.cpf}
                                    onChange={(e) => handleCpfChange(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                                    <MapPin size={14} /> Endereço
                                </Label>
                                <Input
                                    placeholder="Rua, Número, Bairro, Cidade"
                                    value={patientData.address}
                                    onChange={(e) => setPatientData({ ...patientData, address: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                                    <Type size={14} /> Telefone
                                </Label>
                                <Input
                                    placeholder="(00) 00000-0000"
                                    value={patientData.phone}
                                    onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 py-4">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-600">Histórico Recente</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 max-h-[250px] overflow-y-auto">
                                {prescriptionHistory.length > 0 ? (
                                    prescriptionHistory.map(item => (
                                        <div
                                            key={item.id}
                                            className="p-3 hover:bg-slate-50 transition-colors cursor-pointer group flex justify-between items-center"
                                        >
                                            <div className="flex-1" onClick={() => loadPrescription(item.content)}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="font-bold text-xs text-slate-900 group-hover:text-primary transition-colors">{item.patient}</p>
                                                    <span className="text-[10px] text-slate-400">{item.date}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 line-clamp-1">Clique para carregar</p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-xs text-slate-400 italic">Nenhum histórico encontrado</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20 border-dashed shadow-none">
                        <CardContent className="p-6">
                            <h4 className="font-bold text-primary flex items-center gap-2 mb-2">
                                <QrCode size={18} /> Receita Digital (CRO)
                            </h4>
                            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                                Para emitir receitas com validade para farmácias via assinatura digital (ICP-Brasil), utilize o guia oficial.
                            </p>
                            <Link to="/admin/consultas">
                                <Button variant="outline" size="sm" className="w-full border-primary/30 text-primary hover:bg-primary/10 gap-2">
                                    <ExternalLink size={14} /> Ver Passo-a-Passo
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Editor Area */}
                <div className="min-w-0 lg:col-span-2 space-y-4">
                    <Card className="min-w-0 border-slate-200 shadow-sm flex flex-col min-h-[420px] sm:min-h-[500px] md:min-h-[600px]">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between no-print">
                            <p className="text-xs font-bold uppercase text-slate-500">Prescrição Clínica</p>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                <Button onClick={handleSave} variant="outline" size="sm" className="gap-2 border-slate-200 text-slate-600">
                                    <Save size={16} /> Salvar Tudo
                                </Button>
                                <Button onClick={handlePrint} size="sm" variant="ghost" className="gap-2">
                                    <Printer size={16} /> Print Rápido
                                </Button>
                                <div className="no-print inline-flex min-h-10 items-center gap-2 rounded-lg border bg-background px-3">
                                    <Switch
                                        id="include-professional-signature"
                                        checked={includeProfessionalSignature}
                                        onCheckedChange={setIncludeProfessionalSignature}
                                        disabled={!canInsertSignature}
                                    />
                                    <Label htmlFor="include-professional-signature" className="cursor-pointer text-sm text-muted-foreground">
                                        Inserir assinatura
                                    </Label>
                                </div>
                                {(patientData.name && prescriptionContent) && (
                                    <>
                                        {!canIssueDocument ? (
                                            <Button asChild size="sm" variant="outline">
                                                <Link to="/admin/settings">Configure nome e CRO</Link>
                                            </Button>
                                        ) : !patientConsent ? (
                                            <Button size="sm" onClick={() => setShowConsentDialog(true)} className="gap-2 bg-amber-500 text-white hover:bg-amber-600">
                                                <QrCode size={16} /> Assinar Termo LGPD
                                            </Button>
                                        ) : (
                                            <Button asChild size="sm" className="gap-2 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20">
                                                <DownloadPrescriptionButton
                                                    data={{
                                                        name: patientData.name,
                                                        cpf: patientData.cpf,
                                                        professionalName: currentUser.name,
                                                        professionalCro: currentUser.cro,
                                                        signatureUrl: currentUser.signatureUrl,
                                                    }}
                                                    content={prescriptionContent}
                                                    mode="clinic"
                                                    includeElectronicSignature={includeProfessionalSignature}
                                                    includeOdontogram={includeOdontogram}
                                                    odontogram={patientData.odontogram || {}}
                                                />
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <RichTextEditor
                                content={prescriptionContent}
                                onChange={(content) => setPrescriptionContent(content)}
                                placeholder="Escreva a prescrição aqui..."
                                className="border-none shadow-none rounded-none w-full h-full absolute inset-0"
                            />
                        </div>
                    </Card>

                    {/* Optional Odontogram Toggle */}
                    <Card className="admin-card overflow-hidden">
                        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <Switch
                                    id="include-odontogram"
                                    checked={includeOdontogram}
                                    onCheckedChange={setIncludeOdontogram}
                                />
                                <Label htmlFor="include-odontogram" className="text-sm font-bold text-slate-700 cursor-pointer">
                                    Incluir Odontograma na Receita
                                </Label>
                            </div>
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                                <span className="text-[10px] uppercase tracking-wider text-slate-400">
                                    {includeOdontogram ? 'Visível na impressão' : 'Opcional'}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="min-h-11 w-full gap-2 sm:w-auto"
                                    onClick={handlePrintOdontogram}
                                >
                                    <Printer size={16} /> Imprimir odontograma
                                </Button>
                            </div>
                        </div>
                        {includeOdontogram && (
                            <CardContent className="p-4">
                                <Odontogram
                                    data={patientData.odontogram || {}}
                                    onChange={(newData) => setPatientData(prev => ({ ...prev, odontogram: newData }))}
                                    birthDate={patientData.birthDate}
                                />
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>

            {/* PRINTABLE PREVIEW (Hidden in UI, visible in print) */}
            {printTarget && (
                <div className={`hidden print-only print-root ${printDocumentClass("clinic")} text-slate-900`} data-print-target={printTarget} id="printable-recipe">
                    {printTarget === "odontogram" ? (
                        <>
                            <div className="print-section mb-5 flex items-center gap-4 border-b border-slate-200 pb-4">
                                <img src="/images/logo-oficial.png" alt="Logo" className="h-14 w-14 object-contain" />
                                <div>
                                    <h1 className="text-lg font-serif font-black uppercase leading-tight tracking-wider text-slate-900">Núcleo Odontológico</h1>
                                    <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-slate-400">Especializado & Harmonização</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Odontograma emitido em</p>
                                    <p className="text-xs font-bold text-slate-700">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                            <div className="print-patient-block mb-5 rounded-lg border border-slate-100 bg-slate-50 p-3">
                                <p className="text-[7px] font-black uppercase tracking-[0.15em] text-primary">Paciente</p>
                                <p className="font-serif text-sm font-bold text-slate-900">{patientData.name || "________________________________"}</p>
                                <p className="mt-1 font-mono text-[11px] font-bold text-slate-700">CPF: {patientData.cpf || "___.___.___-__"}</p>
                            </div>
                            <div className="print-odontogram">
                                <p className="mb-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Mapeamento Dentário</p>
                                <Odontogram
                                    data={patientData.odontogram}
                                    onChange={() => {}}
                                    readOnly
                                    printable
                                    birthDate={patientData.birthDate}
                                />
                            </div>
                        </>
                    ) : isPrescriptionPrint ? (
                        <>
                            {/* The odontogram is an independent print page; prescription starts on the next page. */}
                            {includeOdontogram && Object.keys(normalizedOdontogram.teeth).length > 0 && (
                                <div className="print-section print-page-odontogram print-odontogram">
                                    <p className="mb-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Mapeamento Dentário</p>
                                    <div className="min-w-0 max-w-full">
                                        <Odontogram
                                            data={patientData.odontogram}
                                            onChange={() => {}}
                                            readOnly
                                            printable
                                            birthDate={patientData.birthDate}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="print-section mb-5 flex items-center gap-4 border-b border-slate-200 pb-4">
                                <img src="/images/logo-oficial.png" alt="Logo" className="h-14 w-14 object-contain" />
                                <div>
                                    <h1 className="text-lg font-serif font-black uppercase leading-tight tracking-wider text-slate-900">Núcleo Odontológico</h1>
                                    <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-slate-400">Especializado & Harmonização</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Prescrição emitida em</p>
                                    <p className="text-xs font-bold text-slate-700">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>

                            <div className="print-patient-block mb-5 rounded-lg border border-slate-100 bg-slate-50 p-3">
                                <div className="grid grid-cols-12 gap-x-4 gap-y-2">
                                    <div className="col-span-7">
                                        <p className="mb-0.5 text-[7px] font-black uppercase tracking-[0.15em] text-primary">Paciente</p>
                                        <p className="font-serif text-sm font-bold text-slate-900">{patientData.name || "________________________________"}</p>
                                    </div>
                                    <div className="col-span-3">
                                        <p className="mb-0.5 text-[7px] font-black uppercase tracking-[0.15em] text-primary">CPF</p>
                                        <p className="font-mono text-[11px] font-bold text-slate-700">{patientData.cpf || "___.___.___-__"}</p>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <p className="mb-0.5 text-[7px] font-black uppercase tracking-[0.15em] text-primary">Telefone</p>
                                        <p className="font-mono text-[10px] text-slate-600">{patientData.phone || "—"}</p>
                                    </div>
                                    {patientData.address && (
                                        <div className="col-span-12 border-t border-slate-200/60 pt-1.5">
                                            <p className="mb-0.5 text-[7px] font-black uppercase tracking-[0.15em] text-primary">Endereço</p>
                                            <p className="text-[10px] italic text-slate-600">{patientData.address}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="print-flow-content mb-6 rounded-xl border border-dotted border-slate-200 px-5 py-3 font-serif text-base leading-relaxed text-slate-800">
                                <div dangerouslySetInnerHTML={{ __html: prescriptionContent || editorRef.current?.innerHTML || "" }}></div>
                            </div>

                            <div className="print-signature pt-6">
                                <div className="mb-5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                                <div className="flex items-end justify-between">
                                    <div className="space-y-0.5 text-[8px] text-slate-500">
                                        <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-slate-800">Unidade de Atendimento</p>
                                        <p className="font-semibold text-slate-600">Governador Valadares - MG</p>
                                        <p>Rua Barão do Rio Branco, 461 - Sala 206 - Centro</p>
                                        <p>CNPJ: 00.000.000/0001-00 | Razão Social: Karol Paz Me.</p>
                                    </div>
                                    <ProfessionalSignature
                                        professional={currentUser}
                                        includeElectronic={includeProfessionalSignature}
                                        className="w-64"
                                    />
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3 text-[6px] font-bold uppercase tracking-[0.25em] text-slate-300">
                                    <p>Documento Oficial NOEH</p>
                                    <p>{new Date().toLocaleDateString('pt-BR')} • {new Date().toLocaleTimeString('pt-BR')}</p>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            )}

            {/* Consent Dialog */}
            {patientData.cpf && (
                <ConsentDialog
                    open={showConsentDialog}
                    onOpenChange={setShowConsentDialog}
                    patientName={patientData.name}
                    patientCpf={patientData.cpf}
                    onConsentSigned={() => {
                        setPatientConsent(true);
                    }}
                />
            )}

            <style>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #94a3b8;
                }
            `}</style>
        </AdminLayout>
    );
};

export default AdminPrescription;
