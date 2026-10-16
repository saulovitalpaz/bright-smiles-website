import React, { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useDigitalPrescription } from '@/hooks/useDigitalPrescription';
import { certificateReady, digitalRequest, downloadSignedPdf, signedPdfBlob, type CertificateStatus, type DigitalDocument } from '@/lib/digital-prescriptions';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AttendanceSection, AttendanceWorkspace } from "@/components/admin/attendance/AttendanceWorkspace";
import { API_URL, fetchClient } from "@/lib/api";
import Odontogram from "@/components/admin/attendance/Odontogram";
import { normalizeOdontogram, type OdontogramData } from "@/components/admin/attendance/odontogram/odontogramModel";
import { DownloadPrescriptionButton } from "@/components/PrescriptionGenerator";
import { ProfessionalSignature } from "@/components/admin/ProfessionalSignature";
import { PrintPatientCard } from "@/components/admin/PrintPatientCard";
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
    Search,
    Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";
import { PatientPicker } from "@/components/admin/PatientPicker";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { printDocumentClass, printWhenReady } from "@/lib/print-layout";
import {
    hasCompleteProfessionalIdentity,
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

type PrintTarget = "prescription";

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
        weight: null as string | null,
        odontogram: {} as OdontogramData,
        odontogramSourceAppointmentId: null as number | null,
    });

    const [prescriptionHistory, setPrescriptionHistory] = useState<PrescriptionHistoryItem[]>([]);
    const [prescriptionContent, setPrescriptionContent] = useState("");
    const [showConsentDialog, setShowConsentDialog] = useState(false);
    const [patientConsent, setPatientConsent] = useState(false);
    const includeOdontogram = false;
    const [printTarget, setPrintTarget] = useState<PrintTarget | null>(null);

    const editorRef = useRef<HTMLDivElement>(null);

    const currentUser = readStoredProfessionalIdentity();
    const canIssueDocument = hasCompleteProfessionalIdentity(currentUser);
    const [includeProfessionalSignature, setIncludeProfessionalSignature] = useState(false);
    const digital = useDigitalPrescription(patientData.id, prescriptionContent, JSON.stringify([patientData.name, patientData.cpf, patientData.address]), { name: patientData.name, cpf: patientData.cpf });
    const [certificate, setCertificate] = useState<CertificateStatus | null>(null);
    const [signedPrintUrl, setSignedPrintUrl] = useState<string | null>(null);
    const [accountPassword, setAccountPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const digitalErrorRef = useRef<HTMLParagraphElement>(null);
    useEffect(() => { if (digital.error) digitalErrorRef.current?.focus(); }, [digital.error]);
    useEffect(() => { setAccountPassword(''); setPasswordVisible(false); }, [includeProfessionalSignature, patientData.id, prescriptionContent]);
    const [digitalHistory, setDigitalHistory] = useState<DigitalDocument[]>([]);
    useEffect(() => {
        let active = true;
        const refreshCertificate = () => {
            digitalRequest<CertificateStatus>('/digital-signatures/certificate')
                .then(status => { if (active) setCertificate(status); })
                .catch(() => { if (active) setCertificate(null); });
        };
        refreshCertificate();
        window.addEventListener('focus', refreshCertificate);
        window.addEventListener('digital-certificate-updated', refreshCertificate);
        return () => {
            active = false;
            window.removeEventListener('focus', refreshCertificate);
            window.removeEventListener('digital-certificate-updated', refreshCertificate);
        };
    }, []);
    useEffect(() => {
        setDigitalHistory([]);
        if (!patientData.id) return;
        let active = true;
        digitalRequest<DigitalDocument[]>(`/prescriptions/digital-documents/patient/${patientData.id}`).then(items => { if (active) setDigitalHistory(items); }).catch(() => {});
        return () => { active = false; };
    }, [patientData.id]);
    useEffect(() => () => { if (signedPrintUrl) URL.revokeObjectURL(signedPrintUrl); }, [signedPrintUrl]);
    const handleDigitalAction = async (action: 'save' | 'download' | 'print') => {
        if (!patientConsent) { setShowConsentDialog(true); return; }
        if (!canIssueDocument) { toast.error('Configure o nome profissional e o CRO.'); return; }
        if (!prescriptionContent.trim()) { toast.error('Escreva o conteúdo da receita.'); return; }
        if (!certificateReady(certificate)) { toast.error('Cadastre um certificado válido nas configurações.'); return; }
        try {
            const issued = await digital.issue(accountPassword);
            setDigitalHistory(previous => [issued.document, ...previous.filter(item => item.id !== issued.document.id)]);
            if (action === 'download') await downloadSignedPdf(issued.document.id);
            else if (action === 'print') setSignedPrintUrl(URL.createObjectURL(await signedPdfBlob(issued.document.id)));
            else toast.success('Receita assinada, validada e registrada.');
        } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível emitir.'); }
        finally { setAccountPassword(''); setPasswordVisible(false); }
    };

    const normalizedOdontogram = normalizeOdontogram(patientData.odontogram);
    const isPrescriptionPrint = printTarget === "prescription";

    useEffect(() => {
        if (!printTarget) return;

        const clearPrintTarget = () => setPrintTarget(null);
        window.addEventListener("afterprint", clearPrintTarget);
        const controller = new AbortController();
        const frame = window.requestAnimationFrame(() => {
            void printWhenReady(document, '[data-print-target="prescription"]', () => window.print(), controller.signal)
                .then((printed) => {
                    if (!printed && !controller.signal.aborted) clearPrintTarget();
                });
        });

        return () => {
            controller.abort();
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
                    weight: data.weight ?? null,
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
        if (includeProfessionalSignature) { await handleDigitalAction('save'); return; }
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
        if (includeProfessionalSignature) { void handleDigitalAction('print'); return; }
        if (!prescriptionContent) {
            return toast.error("Escreva o conteúdo da receita antes de imprimir.");
        }
        if (!canIssueDocument) {
            return toast.error("Configure o nome profissional e o CRO antes de imprimir.");
        }
        setPrintTarget("prescription");
    };

    return (
        <AdminLayout title="Prescrição Clínica">
            <AttendanceWorkspace active="prescricao">
            <div className="attendance-editor-layout no-print">
<Card className="admin-card attendance-patient">
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
                                    selectedPatient={patientData.id ? { id: patientData.id, name: patientData.name, cpf: patientData.cpf } : null}
                                    onSelect={(p) => {
                                        setPatientData({
                                            id: p.id,
                                            name: p.name,
                                            cpf: p.cpf,
                                            address: p.address || "",
                                            phone: p.phone || "",
                                            birthDate: p.birthDate || null,
                                            weight: p.weight ?? null,
                                            odontogram: {},
                                            odontogramSourceAppointmentId: null,
                                        });
                                        fetchPatient(p.cpf); // Load history
                                    }}
                                />
                            </div>

                            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600"><p>Peso cadastral: {patientData.weight ? `${patientData.weight.replace('.', ',')} kg` : "Não informado"}</p>{patientData.id && <Link className="mt-1 inline-flex min-h-11 items-center text-primary underline" to={`/admin/pacientes?edit=${patientData.id}`}>Atualizar dados do paciente</Link>}</div>
                            <AttendanceSection title="Dados cadastrais" summary={patientData.name || "Preencher ou editar nome e contato"}>
<div className="space-y-1.5">
                                <Label htmlFor="prescription-patient-name" className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                                    <User size={14} /> Nome Completo
                                </Label>
                                <Input
                                    id="prescription-patient-name" placeholder="Ex: João da Silva"
                                    value={patientData.name}
                                    onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="prescription-patient-cpf" className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                                    <CreditCard size={14} /> CPF
                                </Label>
                                <Input
                                    id="prescription-patient-cpf" placeholder="000.000.000-00"
                                    value={patientData.cpf}
                                    onChange={(e) => handleCpfChange(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="prescription-patient-address" className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                                    <MapPin size={14} /> Endereço
                                </Label>
                                <Input
                                    id="prescription-patient-address" placeholder="Rua, Número, Bairro, Cidade"
                                    value={patientData.address}
                                    onChange={(e) => setPatientData({ ...patientData, address: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="prescription-patient-phone" className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                                    <Type size={14} /> Telefone
                                </Label>
                                <Input
                                    id="prescription-patient-phone" placeholder="(00) 00000-0000"
                                    value={patientData.phone}
                                    onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                                />
                            </div>
                        </AttendanceSection>
</CardContent>
                    </Card>
<div className="attendance-primary space-y-3">
                    <Card className="admin-card attendance-editor-card">
                        <div className="attendance-editor-toolbar no-print">
                            <p className="text-xs font-bold uppercase text-slate-500">Prescrição Clínica</p>
                            <div className="attendance-editor-actions">
                                <Button disabled={digital.pending} onClick={handleSave} variant="outline" size="sm" className="min-h-11 gap-2 border-slate-200 text-slate-600">
                                    <Save size={16} /> Salvar receita
                                </Button>
                                <Button disabled={digital.pending} onClick={handlePrint} size="sm" variant="ghost" className="min-h-11 gap-2">
                                    <Printer size={16} /> Imprimir
                                </Button>
                                <div className="no-print inline-flex min-h-11 items-center gap-2 rounded-lg border bg-background px-3">
                                    <Switch
                                        id="include-professional-signature"
                                        checked={includeProfessionalSignature}
                                        onCheckedChange={setIncludeProfessionalSignature}
                                        disabled={digital.pending}
                                    />
                                    <Label htmlFor="include-professional-signature" className="inline-flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground">
                                        Incluir assinatura
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
                                        ) : includeProfessionalSignature ? (
                                            <Button className="min-h-11" disabled={digital.pending} onClick={() => void handleDigitalAction('download')}>Baixar PDF assinado</Button>
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
                                                    includeElectronicSignature={false}
                                                    includeOdontogram={includeOdontogram}
                                                    odontogram={patientData.odontogram || {}}
                                                />
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="px-4 py-3 space-y-2 text-sm">
                            <p className="font-medium">Receita simples</p><p className="text-muted-foreground">Sem assinatura: PDF local. Com assinatura: PDF validado, registro online e token de verificação. Este fluxo não emite receitas controladas.</p>
                            {includeProfessionalSignature && !certificateReady(certificate) && <p role="status">{certificate && !certificate.available ? 'Assinatura digital indisponível neste ambiente. ' : 'Certificado digital não está pronto. '}<Link className="inline-flex min-h-11 items-center underline" to="/admin/settings">Configurar certificado A1</Link></p>}
                            <p role="status" aria-live="polite">{digital.pending ? 'Emitindo e validando assinatura…' : digital.result ? 'Assinatura válida. O mesmo PDF será usado para baixar e imprimir.' : ''}</p>
                            {digital.result && <div className="space-y-2 rounded-lg border p-3"><Label htmlFor="issued-token">Token de verificação</Label><Input id="issued-token" readOnly value={digital.result.document.token} /><Link className="inline-flex min-h-11 items-center underline" to={`/validar-receita#token=${encodeURIComponent(digital.result.document.token)}`}>Consultar autenticidade</Link><p className="text-muted-foreground">Desmarcar a assinatura mantém os documentos já emitidos no histórico.</p></div>}
                            {digital.error && <div><p id="digital-issue-error" ref={digitalErrorRef} tabIndex={-1} role="alert" className="rounded-md text-destructive focus-visible:outline focus-visible:outline-2">{digital.error}</p>{patientData.id && <Link className="inline-flex min-h-11 items-center underline" to={`/admin/pacientes?edit=${patientData.id}`}>Atualizar cadastro e revisar dados do paciente</Link>}</div>}
                            {digital.reauthRequired && <div className="space-y-2"><Label htmlFor="sign-account-password">Confirme sua senha de acesso ao sistema</Label><Input id="sign-account-password" name="accountPassword" aria-describedby={digital.error ? "digital-issue-error" : undefined} aria-invalid={digital.reauthRequired} type={passwordVisible ? 'text' : 'password'} autoComplete="current-password" value={accountPassword} onChange={e => setAccountPassword(e.target.value)} /><Button variant="outline" className="min-h-11" aria-pressed={passwordVisible} onClick={() => setPasswordVisible(!passwordVisible)}>{passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}</Button><p>Tente novamente a ação após preencher.</p></div>}
                        </div>
                        <div className="min-w-0 flex-1">
                            <RichTextEditor
                                content={prescriptionContent}
                                onChange={(content) => setPrescriptionContent(content)}
                                placeholder="Escreva a prescrição aqui..."
                                className="min-w-0 w-full rounded-none border-none shadow-none"
                            />
                        </div>
                    </Card>

                </div>
<div className="attendance-secondary space-y-3">
<AttendanceSection title="Documentos digitais emitidos" summary={`${digitalHistory.length} documentos`}>
    <div className="space-y-3">{digitalHistory.map(item => <div className="rounded-lg border p-3 text-sm" key={item.id}><p>{item.signatureStatus === 'VALID' ? 'Assinada na emissão' : 'Assinatura não confirmada'} · {new Date(item.signedAt).toLocaleDateString('pt-BR')}</p><Button className="min-h-11" variant="outline" onClick={() => void downloadSignedPdf(item.id).catch(() => toast.error('Não foi possível baixar o documento.'))}>Baixar PDF assinado</Button></div>)}</div>
</AttendanceSection>
<AttendanceSection title="Histórico de prescrições" summary={prescriptionHistory.length + " receitas disponíveis"}>

                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 max-h-[250px] overflow-y-auto">
                                {prescriptionHistory.length > 0 ? (
                                    prescriptionHistory.map(item => (
                                        <div
                                            key={item.id}
                                            className="p-3 hover:bg-slate-50 transition-colors cursor-pointer group flex justify-between items-center"
                                        >
                                            <button type="button" className="min-h-11 min-w-0 flex-1 text-left" onClick={() => loadPrescription(item.content)}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="font-bold text-xs text-slate-900 group-hover:text-primary transition-colors">{item.patient}</p>
                                                    <span className="text-xs text-slate-400">{item.date}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-1">Clique para carregar</p>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                className="min-h-11 min-w-11 p-2 text-slate-500 opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100 hover:text-red-700"
                                                aria-label={`Excluir receita de ${item.patient}`}
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
             </AttendanceSection>
             </div>
             </div>

             </AttendanceWorkspace>

             {/* PRINTABLE PREVIEW (Hidden in UI, visible in print) */}
            {printTarget && (
                <div className={`hidden print-only print-root ${printDocumentClass("clinic")} text-slate-900`} data-print-target={printTarget} id="printable-recipe">
                    {isPrescriptionPrint ? (
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
                                <img src="/images/logo-oficial.png" alt="Logo" className="h-20 w-20 object-contain" />
                                <div>
                                    <h1 className="text-xl font-serif font-bold leading-tight text-slate-900">Núcleo de Odontologia<br />Especializada &amp; Harmonização</h1>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Prescrição emitida em</p>
                                    <p className="text-xs font-bold text-slate-700">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>

                            <h2 className="print-section mb-3 text-sm font-bold uppercase tracking-wide">Receituário</h2>
                            <PrintPatientCard patient={patientData} compact />

                            <div className="print-flow-content mb-6 py-1 font-serif text-base leading-relaxed text-slate-800">
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
                                        includeElectronic={false}
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

            <Dialog open={!!signedPrintUrl} onOpenChange={open => { if (!open) setSignedPrintUrl(null); }}><DialogContent className="max-w-4xl"><DialogTitle>PDF assinado</DialogTitle><DialogDescription>Imprima o documento original pelo visualizador de PDF.</DialogDescription>{signedPrintUrl && <iframe title="Receita digital assinada" src={signedPrintUrl} className="h-[70vh] w-full" />}</DialogContent></Dialog>
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
