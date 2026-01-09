import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    FileText,
    Download,
    Printer,
    User,
    CreditCard,
    Calendar,
    Stamp,
    ChevronRight,
    Search,
    Plus,
    History
} from "lucide-react";
import { toast } from "sonner";

const AdminDocuments = () => {
    const [patientData, setPatientData] = useState({
        name: "",
        cpf: "",
        procedure: "",
        date: new Date().toLocaleDateString('pt-BR')
    });

    const [selectedTemplate, setSelectedTemplate] = useState("Contrato de Prestação de Serviços");
    const [documentContent, setDocumentContent] = useState("");

    const templates = [
        {
            title: "Contrato de Prestação de Serviços",
            content: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS ODONTOLÓGICOS\n\nCONTRATADA: NOEH - NÚCLEO ODONTOLÓGICO ESPECIALIZADO & HARMONIZAÇÃO\nCONTRATANTE: #NOME, portador do CPF #CPF.\n\nCláusula 1ª. O objeto deste contrato é a realização do procedimento de #PROCEDIMENTO na data de #DATA.\n\nCláusula 2ª. O CONTRATANTE declara estar ciente de todos os riscos e cuidados pós-operatórios...\n\nAssinatura: ___________________________"
        },
        {
            title: "Termo de Consentimento Livre e Esclarecido (TCLE)",
            content: "TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO\n\nEu, #NOME, autorizo a realização do procedimento de #PROCEDIMENTO...\n\nData: #DATA\nAssinatura: ___________________________"
        }
    ];

    const applyTemplate = (templateTitle: string) => {
        const template = templates.find(t => t.title === templateTitle);
        if (template) {
            let processed = template.content
                .replace(/#NOME/g, patientData.name || "[NOME]")
                .replace(/#CPF/g, patientData.cpf || "[CPF]")
                .replace(/#PROCEDIMENTO/g, patientData.procedure || "[PROCEDIMENTO]")
                .replace(/#DATA/g, patientData.date);
            setDocumentContent(processed);
            setSelectedTemplate(templateTitle);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AdminLayout title="Termos & Documentos">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20">
                {/* Templates & Data Sidebar */}
                <div className="lg:col-span-1 space-y-6 no-print">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-serif">Dados do Documento</CardTitle>
                            <CardDescription>Preencha para autocompletar o texto.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">CPF do Paciente</Label>
                                <Input
                                    placeholder="000.000.000-00"
                                    value={patientData.cpf}
                                    onChange={(e) => setPatientData({ ...patientData, cpf: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Nome Completo</Label>
                                <Input
                                    placeholder="Nome do cliente"
                                    value={patientData.name}
                                    onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Procedimento</Label>
                                <Input
                                    placeholder="Ex: Botox"
                                    value={patientData.procedure}
                                    onChange={(e) => setPatientData({ ...patientData, procedure: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 py-4">
                            <CardTitle className="text-sm font-black uppercase text-slate-600">Modelos Oficiais</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {templates.map(t => (
                                    <button
                                        key={t.title}
                                        onClick={() => applyTemplate(t.title)}
                                        className={`w-full text-left p-4 hover:bg-slate-50 transition-all flex items-center justify-between group ${selectedTemplate === t.title ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText size={16} className={selectedTemplate === t.title ? 'text-primary' : 'text-slate-400'} />
                                            <span className={`text-xs font-bold leading-tight ${selectedTemplate === t.title ? 'text-slate-900' : 'text-slate-500'}`}>{t.title}</span>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Editor / Preview Area */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="border-slate-200 shadow-sm h-full min-h-[700px] flex flex-col no-print">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Stamp size={18} />
                                </div>
                                <span className="font-serif font-black text-slate-800 uppercase tracking-tighter">{selectedTemplate}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handlePrint} className="bg-primary text-white hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20">
                                    <Printer size={18} /> Gerar PDF / Imprimir
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 p-10 bg-white">
                            <Textarea
                                value={documentContent}
                                onChange={(e) => setDocumentContent(e.target.value)}
                                className="w-full h-full min-h-[500px] border-none shadow-none focus-visible:ring-0 font-serif text-lg leading-relaxed text-slate-800 p-0"
                                placeholder="Selecione um modelo ou comece a escrever..."
                            />
                        </div>
                    </Card>

                    {/* Printable Version */}
                    <div className="print-only bg-white p-20 text-slate-900 absolute top-0 left-0 w-full min-h-screen">
                        <div className="flex flex-col items-center mb-16 text-center">
                            <img src="/images/logo oficial.png" alt="Logo" className="w-32 h-32 object-contain mb-6" />
                            <h1 className="text-4xl font-serif font-black text-slate-900 tracking-widest uppercase">NOEH</h1>
                            <p className="text-primary font-black tracking-[0.4em] uppercase text-xs mt-2">Swiss Dental Clinic</p>
                        </div>

                        <div className="whitespace-pre-wrap font-serif text-xl leading-[2] text-justify text-slate-800">
                            {documentContent}
                        </div>

                        <div className="mt-32 pt-16 border-t border-slate-100 text-[10px] text-slate-400 text-center font-bold uppercase tracking-[0.3em]">
                            <p>Governador Valadares, {patientData.date}</p>
                            <p className="mt-2 text-slate-300">Documento Gerado Eletronicamente via NOEH Cloud Systems</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white !important; }
                    main { margin-left: 0 !important; padding: 0 !important; width: 100% !important; }
                }
                .print-only { display: none; }
            `}</style>
        </AdminLayout>
    );
};

export default AdminDocuments;
