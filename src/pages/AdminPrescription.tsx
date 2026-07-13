import React, { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { API_URL, fetchClient } from "@/lib/api";
import Odontogram from "@/components/admin/attendance/Odontogram";
import type { ToothData } from "@/components/admin/attendance/Odontogram";
import { DownloadPrescriptionButton } from "@/components/PrescriptionGenerator";
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
import { printDocumentClass, type PrintMode } from "@/lib/print-layout";

const AdminPrescription = () => {
    const [searchParams] = useSearchParams();
    const urlCpf = searchParams.get("cpf");

    const [patientData, setPatientData] = useState({
        id: null as number | null,
        name: "",
        cpf: "",
        address: "",
        phone: "",
        odontogram: {} as Record<string, ToothData>
    });

    const [prescriptionHistory, setPrescriptionHistory] = useState<any[]>([]);
    const [prescriptionContent, setPrescriptionContent] = useState("");
    const [printMode, setPrintMode] = useState<PrintMode>("clinic");
    const [showConsentDialog, setShowConsentDialog] = useState(false);
    const [patientConsent, setPatientConsent] = useState(false);
    const [includeOdontogram, setIncludeOdontogram] = useState(false);

    const editorRef = useRef<HTMLDivElement>(null);

    const userStr = localStorage.getItem("admin_user");
    const currentUser = userStr ? JSON.parse(userStr) : { name: "Profissional", cro: "", username: "admin" };

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
                    odontogram: data.odontogram || {}
                });

                setPatientConsent(!!data.consent);
                if (!data.consent) {
                    // Suggest consent signature if not present
                    // setShowConsentDialog(true); // Optional: auto-open
                }

                toast.success("Paciente encontrado!");
                // Load history if needed
                if (data.prescriptions) {
                    setPrescriptionHistory(data.prescriptions.map((p: any) => ({
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
                    odontogram: patientData.odontogram
                })
            });

            if (!patientRes.ok) throw new Error("Falha ao salvar paciente");
            const savedPatient = await patientRes.json();
            setPatientData(prev => ({ ...prev, id: savedPatient.id }));

            // 2. Save Prescription (only if content exists)
            if (prescriptionContent) {
                const presRes = await fetchClient(`/prescriptions`, {
                    method: "POST",
                    body: JSON.stringify({
                        content: prescriptionContent,
                        patientId: savedPatient.id
                    })
                });

                if (presRes.ok) {
                    const savedPres = await presRes.json();
                    setPrescriptionHistory([
                        {
                            id: savedPres.id,
                            patient: savedPatient.name,
                            date: new Date().toLocaleDateString(),
                            preview: "Nova receita salva",
                            content: prescriptionContent
                        },
                        ...prescriptionHistory
                    ]);
                    toast.success("Receita salva!");
                }
            } else {
                toast.success("Dados do paciente atualizados!");
            }

        } catch (error) {
            console.error(error);
            toast.error("Erro de conexão");
        }
    };

    const handlePrint = () => {
        // Check prescriptionContent state directly
        if (!prescriptionContent) {
            return toast.error("Escreva o conteúdo da receita antes de imprimir.");
        }
        window.print();
    };

    return (
        <AdminLayout title="Prescrição Clínica">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-20 no-print">
                {/* Patient Info Form */}
                <div className="lg:col-span-1 space-y-6">
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
                                            odontogram: {}
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
                            <Link to="/admin/digital-guide">
                                <Button variant="outline" size="sm" className="w-full border-primary/30 text-primary hover:bg-primary/10 gap-2">
                                    <ExternalLink size={14} /> Ver Passo-a-Passo
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Editor Area */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="border-slate-200 shadow-sm flex flex-col min-h-[500px] md:min-h-[600px]">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between no-print">
                            <p className="text-xs font-bold uppercase text-slate-500">Prescrição Clínica</p>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                <Button onClick={handleSave} variant="outline" size="sm" className="gap-2 border-slate-200 text-slate-600">
                                    <Save size={16} /> Salvar Tudo
                                </Button>
                                <Button onClick={handlePrint} size="sm" variant="ghost" className="gap-2">
                                    <Printer size={16} /> Print Rápido
                                </Button>
                                <label className="no-print inline-flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>Formato</span>
                                    <select value={printMode} onChange={(e) => setPrintMode(e.target.value as PrintMode)} className="h-10 rounded-lg border bg-background px-3">
                                        <option value="clinic">A4 clínico</option>
                                        <option value="compact">A4 compacto</option>
                                    </select>
                                </label>
                                {(patientData.name && prescriptionContent) && (
                                    <>
                                        {!patientConsent ? (
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
                                                        professionalCro: currentUser.cro
                                                    }}
                                                    content={prescriptionContent}
                                                    mode={printMode}
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
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 flex items-center justify-between bg-slate-50/50 border-b border-slate-100">
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
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                {includeOdontogram ? 'Visível na impressão' : 'Opcional'}
                            </span>
                        </div>
                        {includeOdontogram && (
                            <CardContent className="p-4">
                                <Odontogram
                                    data={patientData.odontogram || {}}
                                    onChange={(newData) => setPatientData(prev => ({ ...prev, odontogram: newData }))}
                                />
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>

            {/* PRINTABLE PREVIEW (Hidden in UI, visible in print) */}
            <div className={`hidden print-only ${printDocumentClass(printMode)} flex min-h-screen flex-col text-slate-900`} id="printable-recipe">
                {/* Header: compact, single row */}
                <div className="print-section flex items-center gap-4 border-b border-slate-200 pb-4 mb-5">
                    <img src="/images/logo-oficial.png" alt="Logo" className="w-14 h-14 object-contain" />
                    <div>
                        <h1 className="text-lg font-serif font-black text-slate-900 tracking-wider uppercase leading-tight">Núcleo Odontológico</h1>
                        <p className="text-slate-400 font-medium text-[8px] uppercase tracking-[0.2em]">Especializado & Harmonização</p>
                    </div>
                    <div className="ml-auto text-right">
                        <p className="text-[7px] uppercase font-bold text-slate-400 tracking-wider">Prescrição emitida em</p>
                        <p className="text-xs font-bold text-slate-700">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>

                {/* Patient Info Block: clean grid */}
                <div className="print-patient-block bg-slate-50 p-3 rounded-lg mb-5 border border-slate-100">
                    <div className="grid grid-cols-12 gap-x-4 gap-y-2">
                        <div className="col-span-7">
                            <p className="text-[7px] uppercase font-black text-primary tracking-[0.15em] mb-0.5">Paciente</p>
                            <p className="text-sm font-serif font-bold text-slate-900">{patientData.name || "________________________________"}</p>
                        </div>
                        <div className="col-span-3">
                            <p className="text-[7px] uppercase font-black text-primary tracking-[0.15em] mb-0.5">CPF</p>
                            <p className="text-[11px] font-mono font-bold text-slate-700">{patientData.cpf || "___.___.___-__"}</p>
                        </div>
                        <div className="col-span-2 text-right">
                            <p className="text-[7px] uppercase font-black text-primary tracking-[0.15em] mb-0.5">Telefone</p>
                            <p className="text-[10px] font-mono text-slate-600">{patientData.phone || "—"}</p>
                        </div>
                        {patientData.address && (
                            <div className="col-span-12 border-t border-slate-200/60 pt-1.5">
                                <p className="text-[7px] uppercase font-black text-primary tracking-[0.15em] mb-0.5">Endereço</p>
                                <p className="text-[10px] text-slate-600 italic">{patientData.address}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Optional Odontogram in print */}
                {includeOdontogram && Object.keys(patientData.odontogram || {}).length > 0 && (
                    <div className="print-section mb-5 print-odontogram">
                        <p className="text-[8px] uppercase font-black text-slate-400 tracking-widest mb-2">Mapeamento Dentário</p>
                        <div className="transform scale-[0.65] origin-top-left -mb-20">
                            <Odontogram
                                data={patientData.odontogram || {}}
                                onChange={() => {}}
                                readOnly
                            />
                        </div>
                    </div>
                )}

                {/* Prescription Body */}
                <div className="print-section flex-1 py-3 px-5 rounded-xl border border-dotted border-slate-200 mb-6 font-serif text-base leading-relaxed text-slate-800">
                    <div dangerouslySetInnerHTML={{ __html: prescriptionContent || editorRef.current?.innerHTML || "" }}></div>
                </div>

                {/* Footer: pushed to bottom, NO position:fixed */}
                <div className="print-signature mt-auto pt-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-5"></div>

                    <div className="flex justify-between items-end">
                        <div className="text-[8px] text-slate-500 space-y-0.5">
                            <p className="font-black text-slate-800 uppercase tracking-wider text-[9px] mb-1">Unidade de Atendimento</p>
                            <p className="font-semibold text-slate-600">Governador Valadares - MG</p>
                            <p>Rua Barão do Rio Branco, 461 - Sala 206 - Centro</p>
                            <p>CNPJ: 00.000.000/0001-00 | Razão Social: Karol Paz Me.</p>
                        </div>
                        <div className="text-center">
                            <div className="flex flex-col items-center">
                                <div className="w-56 border-b border-slate-300 mb-2"></div>
                                <p className="font-bold text-slate-900 text-xs">{currentUser.name}</p>
                                <p className="text-[8px] uppercase font-black text-primary tracking-[0.15em] mt-0.5">{currentUser.cro}</p>
                                <p className="text-[6px] font-bold text-slate-300 uppercase mt-1.5 tracking-widest">Assinatura / Carimbo</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center text-[6px] text-slate-300 font-bold uppercase tracking-[0.25em] pt-3 border-t border-slate-50">
                        <p>Documento Oficial NOEH</p>
                        <p>{new Date().toLocaleDateString('pt-BR')} • {new Date().toLocaleTimeString('pt-BR')}</p>
                    </div>
                </div>
            </div>

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
