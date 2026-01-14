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
    Search,
    Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";
import { PatientPicker } from "@/components/admin/PatientPicker";
import RichTextEditor from "@/components/admin/RichTextEditor";

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
    const currentUser = userStr ? JSON.parse(userStr) : { name: "Profissional", cro: "", username: "admin" };

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
            const res = await fetch(`${API_URL}/prescriptions/${id}`, { method: "DELETE" });
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
            // Use prescriptionContent state directly
            const content = prescriptionContent || "";
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
                        preview: "Nova receita salva",
                        content: content
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

    const handlePrint = () => {
        // Check prescriptionContent state directly
        if (!prescriptionContent) {
            return toast.error("Escreva o conteúdo da receita antes de imprimir.");
        }
        window.print();
    };

    return (
        <AdminLayout title="Prescrição Clínica">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20 no-print">
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
                                            phone: p.phone || ""
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
                <div className="lg:col-span-2">
                    <Card className="border-slate-200 shadow-sm flex flex-col h-full min-h-[600px]">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between no-print">
                            <p className="text-xs font-bold uppercase text-slate-500">Conteúdo da Prescrição</p>
                            <div className="flex gap-2">
                                <Button onClick={handleSave} variant="outline" size="sm" className="gap-2 border-slate-200 text-slate-600">
                                    <Save size={16} /> Salvar no Histórico
                                </Button>
                                <Button onClick={handlePrint} size="sm" className="gap-2 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20">
                                    <Printer size={16} /> Imprimir
                                </Button>
                            </div>
                        </div>
                        <RichTextEditor
                            content={prescriptionContent}
                            onChange={(content) => setPrescriptionContent(content)}
                            placeholder="Escreva a prescrição aqui..."
                            className="border-none shadow-none rounded-none flex-1"
                        />
                    </Card>
                </div>
            </div>

            {/* PRINTABLE PREVIEW (Hidden in UI, visible in print) */}
            <div className="print-only bg-white p-4 text-slate-900 absolute top-0 left-0 w-full min-h-screen flex flex-col" id="printable-recipe">
                {/* Header - Centered Style like Documents */}
                <div className="flex flex-col items-center mb-10 text-center border-b border-slate-100 pb-8">
                    <img src="/images/logo-oficial.png" alt="Logo" className="w-28 h-28 object-contain mb-4" />
                    <h1 className="text-2xl font-serif font-black text-slate-900 tracking-widest uppercase">Núcleo Odontológico</h1>
                    <p className="text-slate-500 font-medium text-[10px] uppercase tracking-[0.2em] mt-1">Especializado & Harmonização</p>
                </div>

                {/* Patient Info Block - Refined Proportions */}
                <div className="bg-slate-50/40 p-5 rounded-2xl mb-8 border border-slate-100/60 shadow-sm print:shadow-none">
                    <div className="grid grid-cols-12 gap-5">
                        <div className="col-span-8">
                            <p className="text-[7px] uppercase font-black text-primary tracking-[0.2em] mb-1 opacity-70">Nome do Paciente</p>
                            <p className="text-lg font-serif font-bold text-slate-900 tracking-tight">{patientData.name || "________________________________"}</p>
                        </div>
                        <div className="col-span-4">
                            <p className="text-[7px] uppercase font-black text-primary tracking-[0.2em] mb-1 opacity-70">Documento CPF</p>
                            <p className="text-sm font-mono font-bold text-slate-700">{patientData.cpf || "____.____.____-____"}</p>
                        </div>

                        {(patientData.address || patientData.phone) && (
                            <div className="col-span-12 grid grid-cols-12 gap-5 border-t border-slate-200/50 pt-4 mt-1">
                                <div className="col-span-9">
                                    <p className="text-[7px] uppercase font-black text-primary tracking-[0.2em] mb-1 opacity-70">Endereço Residencial</p>
                                    <p className="text-[10px] text-slate-600 font-medium leading-relaxed italic">{patientData.address || "Não informado"}</p>
                                </div>
                                <div className="col-span-3 text-right">
                                    <p className="text-[7px] uppercase font-black text-primary tracking-[0.2em] mb-1 opacity-70">Contato</p>
                                    <p className="text-[10px] text-slate-600 font-mono font-bold">{patientData.phone || "Não informado"}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Prescription Body */}
                <div className="flex-1 p-6 rounded-3xl border border-dotted border-slate-200 mb-6 font-serif text-xl leading-relaxed text-slate-800">
                    <div dangerouslySetInnerHTML={{ __html: prescriptionContent || editorRef.current?.innerHTML || "" }}></div>
                </div>

                {/* Footer Clinical Details - Fixed at bottom for every page */}
                <div className="mt-auto pdf-footer">
                    <div className="flex justify-between items-end pt-6 text-slate-500 relative">
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

                        <div className="text-[9px] space-y-1">
                            <p className="font-black text-slate-900 uppercase tracking-widest mb-2 text-[10px]">Unidade de Atendimento</p>
                            <p className="font-bold text-slate-600 text-[10px]">Governador Valadares - MG</p>
                            <p>Rua Barão do Rio Branco, 461 - Sala 206 - Centro</p>
                            <p>CNPJ: 00.000.000/0001-00 | Razão Social: Karol Paz Me.</p>
                        </div>
                        <div className="text-center">
                            <div className="flex flex-col items-center">
                                <div className="w-64 border-b border-slate-900/10 mb-2"></div>
                                <p className="font-bold text-slate-900 text-sm leading-tight">{currentUser.name}</p>
                                <p className="text-[9px] uppercase font-black text-primary tracking-[0.2em] mt-1">{currentUser.cro}</p>
                                <p className="text-[7px] font-bold text-slate-300 uppercase mt-2 tracking-widest">Assinatura Digital / Carimbo</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-between items-center text-[7px] text-slate-300 font-bold uppercase tracking-[0.3em] pt-4">
                        <p>Documento Oficial NOEH</p>
                        <p>{new Date().toLocaleDateString('pt-BR')} • {new Date().toLocaleTimeString('pt-BR')}</p>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { 
                        margin: 15mm 20mm; 
                        size: A4;
                    }
                    .no-print { display: none !important; }
                    .print-only { 
                        display: flex !important; 
                        flex-direction: column;
                        min-height: 100%;
                        background: white !important;
                    }
                    body { background: white !important; }
                    main { margin-left: 0 !important; padding: 0 !important; }
                    .prose { max-width: none; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
                .print-only { display: none; }
                .pdf-footer {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding-top: 20px;
                    background: white;
                }
                #printable-recipe {
                    padding-bottom: 120px;
                }
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #94a3b8;
                }
            `}</style>
        </AdminLayout>
    );
};

export default AdminPrescription;
