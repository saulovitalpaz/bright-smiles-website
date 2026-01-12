import React, { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { API_URL } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    FileText,
    Printer,
    User,
    MapPin,
    CreditCard,
    Bold,
    Italic,
    List,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Type,
    Save,
    QrCode,
    ExternalLink,
    Search
} from "lucide-react";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";

const AdminPrescription = () => {
    const [searchParams] = useSearchParams();
    const urlCpf = searchParams.get("cpf");

    const [patientData, setPatientData] = useState({
        id: null as number | null,
        name: "",
        cpf: "",
        address: "",
        phone: ""
    });

    const [prescriptionHistory, setPrescriptionHistory] = useState<any[]>([]);
    const [prescriptionContent, setPrescriptionContent] = useState("");
    const editorRef = useRef<HTMLDivElement>(null);

    const userStr = localStorage.getItem("admin_user");
    const currentUser = userStr ? JSON.parse(userStr) : { name: "Dra. Karol Paz", cro: "CRO/MG 60.369" };

    useEffect(() => {
        if (urlCpf) {
            fetchPatient(urlCpf);
        }
    }, [urlCpf]);

    const fetchPatient = async (cpf: string) => {
        try {
            const res = await fetch(`${API_URL}/patients/${cpf}`);
            if (res.ok) {
                const data = await res.json();
                setPatientData({
                    id: data.id,
                    name: data.name,
                    cpf: data.cpf,
                    address: data.address || "",
                    phone: data.phone || ""
                });
                toast.success("Paciente encontrado!");
                // Load history if needed
                if (data.prescriptions) {
                    setPrescriptionHistory(data.prescriptions.map((p: any) => ({
                        id: p.id,
                        patient: data.name,
                        date: new Date(p.date).toLocaleDateString(),
                        preview: "Receita registrada" // Simplified preview
                    })));
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleFormat = (command: string, value: string = "") => {
        document.execCommand(command, false, value);
    };

    const handleCpfChange = (val: string) => {
        setPatientData(prev => ({ ...prev, cpf: val }));
        if (val.length >= 11) { // Simple debounce/trigger
            fetchPatient(val);
        }
    };

    const handleSave = async () => {
        if (!patientData.name || !patientData.cpf) return toast.error("Preencha nome e CPF");

        try {
            // 1. Upsert Patient
            const patientRes = await fetch(`${API_URL}/patients`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: patientData.name,
                    cpf: patientData.cpf,
                    address: patientData.address,
                    phone: patientData.phone
                })
            });

            if (!patientRes.ok) throw new Error("Falha ao salvar paciente");
            const savedPatient = await patientRes.json();
            setPatientData(prev => ({ ...prev, id: savedPatient.id }));

            // 2. Save Prescription
            const content = editorRef.current?.innerHTML || "";
            const presRes = await fetch(`${API_URL}/prescriptions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content,
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
                        preview: "Nova receita salva"
                    },
                    ...prescriptionHistory
                ]);
                toast.success("Receita salva no banco de dados!");
            } else {
                toast.error("Erro ao salvar receita");
            }

        } catch (error) {
            console.error(error);
            toast.error("Erro de conexão");
        }
    };

    const handlePrint = async () => {
        await handleSave();
        setTimeout(() => window.print(), 500);
    };

    return (
        <AdminLayout title="Prescrição Clínica">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20 no-print">
                {/* Patient Info Form */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl font-serif">Dados do Paciente</CardTitle>
                            <CardDescription>Informações obrigatórias para o receituário.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                                    <CreditCard size={14} /> CPF (Auto-busca)
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="000.000.000-00"
                                        value={patientData.cpf}
                                        onChange={(e) => handleCpfChange(e.target.value)}
                                        className="border-primary/20 focus:border-primary shadow-sm"
                                    />
                                    <Button size="icon" variant="outline" onClick={() => fetchPatient(patientData.cpf)}>
                                        <Search size={14} />
                                    </Button>
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
                                        <div key={item.id} className="p-3 hover:bg-slate-50 transition-colors cursor-pointer group">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-bold text-xs text-slate-900 group-hover:text-primary transition-colors">{item.patient}</p>
                                                <span className="text-[10px] text-slate-400">{item.date}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 line-clamp-1">{item.preview}</p>
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
                <div className="lg:col-span-2">
                    <Card className="border-slate-200 shadow-sm flex flex-col h-full min-h-[600px]">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-1 overflow-x-auto">
                            <Button variant="ghost" size="sm" onClick={() => handleFormat('bold')} title="Negrito"><Bold size={16} /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleFormat('italic')} title="Itálico"><Italic size={16} /></Button>
                            <Separator orientation="vertical" className="mx-1 h-6" />
                            <Button variant="ghost" size="sm" onClick={() => handleFormat('justifyLeft')} title="Alinhar Esquerda"><AlignLeft size={16} /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleFormat('justifyCenter')} title="Centralizar"><AlignCenter size={16} /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleFormat('justifyRight')} title="Alinhar Direita"><AlignRight size={16} /></Button>
                            <Separator orientation="vertical" className="mx-1 h-6" />
                            <Button variant="ghost" size="sm" onClick={() => handleFormat('insertUnorderedList')} title="Lista"><List size={16} /></Button>
                            <Separator orientation="vertical" className="mx-1 h-6" />
                            <Button variant="ghost" size="sm" onClick={() => handleFormat('fontSize', '4')} title="Aumentar Fonte"><Type size={16} /></Button>
                            <div className="ml-auto flex gap-2">
                                <Button onClick={handleSave} variant="outline" className="gap-2 border-slate-200 text-slate-600">
                                    <Save size={18} /> Salvar no Histórico
                                </Button>
                                <Button onClick={handlePrint} className="gap-2 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20">
                                    <Printer size={18} /> Salvar & Imprimir
                                </Button>
                            </div>
                        </div>
                        <div className="p-8 flex-1 bg-white">
                            <div
                                ref={editorRef}
                                contentEditable
                                className="w-full h-full min-h-[400px] outline-none prose prose-slate max-w-none text-xl leading-relaxed text-slate-800"
                                onInput={(e) => setPrescriptionContent(e.currentTarget.innerHTML)}
                                data-placeholder="Escreva a prescrição aqui..."
                            >
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* PRINTABLE PREVIEW (Hidden in UI, visible in print) */}
            <div className="print-only bg-white p-16 text-slate-900 absolute top-0 left-0 w-full min-h-screen flex flex-col" id="printable-recipe">
                {/* Header */}
                <div className="flex justify-between items-center pb-12 mb-8">
                    <div className="flex items-center gap-10">
                        <div className="relative">
                            <img src="/images/logo oficial.png" alt="Logo" className="w-56 h-56 object-contain relative z-10" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-serif font-black text-slate-900 tracking-tight leading-none uppercase">NOEH</h1>
                            <div className="text-primary font-bold uppercase tracking-[0.25em] text-xs mt-3 leading-relaxed">
                                <p>Núcleo Odontológico</p>
                                <p>Especializado & Harmonização</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Patient Info Block */}
                <div className="bg-slate-50/50 p-8 rounded-[2.5rem] mb-12 border border-slate-100 shadow-sm print:shadow-none print:border-slate-100">
                    <div className="grid grid-cols-3 gap-10">
                        <div className="col-span-2">
                            <p className="text-[9px] uppercase font-black text-primary tracking-widest mb-2">Paciente</p>
                            <p className="text-3xl font-serif font-bold text-slate-900">{patientData.name || "________________________________"}</p>
                        </div>
                        <div>
                            <p className="text-[9px] uppercase font-black text-primary tracking-widest mb-2">CPF</p>
                            <p className="text-2xl font-mono font-medium text-slate-600 tracking-tight">{patientData.cpf || "____.____.____-____"}</p>
                        </div>
                    </div>
                </div>

                {/* Prescription Body */}
                <div className="flex-1 min-h-[500px] p-10 rounded-[2.5rem] border border-slate-100/60 shadow-[0_0_50px_-12px_rgba(0,0,0,0.05)] mb-12 content-preview font-serif text-2xl leading-[1.8] text-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-[100%] -z-10"></div>
                    <div dangerouslySetInnerHTML={{ __html: prescriptionContent || editorRef.current?.innerHTML || "" }}></div>
                </div>

                {/* Footer Clinical Details */}
                <div className="mt-auto">
                    <div className="flex justify-between items-end pt-10 text-slate-500 relative">
                        {/* Decorative Line */}
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

                        <div className="text-[10px] space-y-1.5">
                            <p className="font-black text-slate-900 uppercase tracking-widest mb-3 text-xs">Unidade de Atendimento</p>
                            <p className="font-bold text-slate-600 text-[11px]">Governador Valadares - MG</p>
                            <p>Rua Barão do Rio Branco, 461 - Sala 206 - Centro</p>
                            <p>CNPJ: 00.000.000/0001-00 | Razão Social: Karol Paz Me.</p>
                        </div>
                        <div className="text-center pb-2">
                            <div className="mt-6 flex flex-col items-center">
                                <div className="w-80 border-b border-slate-900/10 mb-2"></div>
                                <p className="font-bold text-slate-900 text-lg leading-tight">{currentUser.name}</p>
                                <p className="text-[10px] uppercase font-black text-primary tracking-[0.2em] mt-1">{currentUser.cro}</p>
                                <p className="text-[8px] font-bold text-slate-300 uppercase mt-4 tracking-widest">Assinatura Digital / Carimbo</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex justify-between items-center text-[8px] text-slate-300 font-bold uppercase tracking-[0.3em] pt-4">
                        <p>Documento Oficial NOEH</p>
                        <p>{new Date().toLocaleDateString('pt-BR')} • {new Date().toLocaleTimeString('pt-BR')}</p>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white !important; }
                    main { margin-left: 0 !important; padding: 0 !important; }
                    .prose { max-width: none; }
                    /* Force background graphics */
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
                .print-only { display: none; }
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #94a3b8;
                }
            `}</style>
        </AdminLayout>
    );
};

export default AdminPrescription;
