import React, { useState, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ProfessionalSignature } from "@/components/admin/ProfessionalSignature";
import {
    FileText,
    Download,
    Printer,
    Upload,
    Save,
    Trash2,
    ChevronRight,
    Plus,
    History,
    Info,
    FileCheck
} from "lucide-react";
import { toast } from "sonner";
import { fetchClient } from "@/lib/api";
import { PatientPicker } from "@/components/admin/PatientPicker";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { printDocumentClass } from "@/lib/print-layout";
import { mediaUrl } from "@/lib/media";
import {
    hasCompleteProfessionalIdentity,
    hasUsableProfessionalSignature,
    readStoredProfessionalIdentity,
} from "@/lib/professional-signature";

type DocumentTemplate = {
    id: number;
    title: string;
    content: string;
};

type PatientDocumentRecord = {
    id: number;
    title: string;
    date: string;
    fileUrl?: string | null;
    pdfUrl?: string | null;
};

const AdminDocuments = () => {
    const [patientData, setPatientData] = useState({
        id: null as number | null,
        name: "",
        cpf: "",
        procedure: "",
        date: new Date().toLocaleDateString('pt-BR')
    });

    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
    const [documentContent, setDocumentContent] = useState("");

    // History & Upload State
    const [history, setHistory] = useState<PatientDocumentRecord[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Template Management State
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ title: "", content: "" });

    const currentUser = readStoredProfessionalIdentity();
    const canIssueDocument = hasCompleteProfessionalIdentity(currentUser);
    const canInsertSignature = hasUsableProfessionalSignature(currentUser);
    const [includeProfessionalSignature, setIncludeProfessionalSignature] = useState(
        () => canInsertSignature,
    );

    // Load Templates
    const loadTemplates = () => {
        fetchClient(`/document-templates`)
            .then(res => res.json())
            .then(data => setTemplates(data))
            .catch(console.error);
    };

    React.useEffect(() => {
        loadTemplates();
    }, []);

    // Load History when patient changes
    React.useEffect(() => {
        if (patientData.id) {
            fetchClient(`/patient-documents/${patientData.id}`)
                .then(res => res.json())
                .then(setHistory)
                .catch(console.error);
        }
    }, [patientData.id]);

    const handleCreateTemplate = async () => {
        if (!newTemplate.title || !newTemplate.content) return toast.error("Preencha título e conteúdo");
        try {
            const res = await fetchClient(`/document-templates`, {
                method: "POST",
                body: JSON.stringify(newTemplate)
            });
            if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Erro ao criar modelo");
            toast.success("Modelo criado!");
            setNewTemplate({ title: "", content: "" });
            loadTemplates();
            setIsManageOpen(false);
        } catch (e) {
            toast.error("Erro ao criar modelo");
        }
    };

    const handleDeleteTemplate = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir este modelo?")) return;
        try {
            const res = await fetchClient(`/document-templates/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Erro ao excluir");
            toast.success("Modelo excluído!");
            loadTemplates();
            if (selectedTemplate?.id === id) {
                setSelectedTemplate(null);
                setDocumentContent("");
            }
        } catch (e) {
            toast.error("Erro ao excluir");
        }
    };

    const applyTemplate = (template: DocumentTemplate) => {
        const processed = template.content
            .replace(/#NOME/g, patientData.name || "_________________")
            .replace(/#CPF/g, patientData.cpf || "_________________")
            .replace(/#PROCEDIMENTO/g, patientData.procedure || "_________________")
            .replace(/#DATA/g, patientData.date)
            .replace(/#PROFISSIONAL/g, `${currentUser.name} - ${currentUser.cro}`);

        setDocumentContent(processed);
        setSelectedTemplate(template);
    };

    const handleSaveHistory = async () => {
        if (!patientData.id || !documentContent) return toast.error("Selecione um paciente e gere um documento.");
        try {
            const res = await fetchClient(`/patient-documents`, {
                method: "POST",
                body: JSON.stringify({
                    title: selectedTemplate?.title || "Documento Avulso",
                    content: documentContent,
                    patientId: patientData.id
                })
            });
            if (res.ok) {
                toast.success("Salvo no histórico!");
                const saved = await res.json();
                setHistory([saved, ...history]);
            } else {
                const error = await res.json().catch(() => null);
                toast.error(error?.error || "Erro ao salvar.");
            }
        } catch (e) {
            toast.error("Erro ao salvar.");
        }
    };

    const handleDeleteHistory = async (id: number) => {
        if (!window.confirm("Excluir este documento do histórico?")) return;
        try {
            const res = await fetchClient(`/patient-documents/${id}`, { method: "DELETE" });
            if (res.ok) {
                setHistory(prev => prev.filter(h => h.id !== id));
                toast.success("Documento excluído!");
            }
        } catch (e) {
            toast.error("Erro ao excluir");
        }
    };

    const handleUploadSigned = async (docId: number, file: File) => {
        if (file.type !== 'application/pdf') {
            toast.error("Apenas arquivos PDF são aceitos.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            // Upload to the private Railway Bucket through the backend.
            const uploadRes = await fetchClient(`/patient-documents/${docId}/file`, {
                method: "POST",
                body: formData
            });
            if (!uploadRes.ok) throw new Error((await uploadRes.json().catch(() => null))?.error || "Erro no upload");
            const { url } = await uploadRes.json();

            toast.success("PDF Anexado com sucesso!");
            // Refresh history locally
            setHistory(history.map(h => h.id === docId ? { ...h, fileUrl: url } : h));
        } catch (e) {
            console.error(e);
            toast.error(e instanceof Error ? e.message : "Erro ao fazer upload.");
        }
    };

    const handlePrint = () => {
        if (!documentContent.trim()) {
            return toast.error("Escreva o conteúdo do documento antes de imprimir.");
        }
        if (!canIssueDocument) {
            return toast.error("Configure o nome profissional e o CRO antes de imprimir.");
        }
        window.print();
    };

    return (
        <AdminLayout title="Termos & Documentos">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 mb-20">
                {/* Left Sidebar */}
                <div className="lg:col-span-1 space-y-6 no-print">

                    {/* Patient Selector */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-serif">Dados do Paciente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Buscar</Label>
                                <PatientPicker
                                    onSelect={(p) => setPatientData(prev => ({ ...prev, id: p.id, name: p.name, cpf: p.cpf }))}
                                />
                            </div>
                            <Label className="text-[10px] font-black uppercase text-slate-400">Campos Dinâmicos</Label>
                            <Input placeholder="Nome" value={patientData.name} onChange={e => setPatientData({ ...patientData, name: e.target.value })} />
                            <Input placeholder="CPF" value={patientData.cpf} onChange={e => setPatientData({ ...patientData, cpf: e.target.value })} />
                            <Input placeholder="Procedimento" value={patientData.procedure} onChange={e => setPatientData({ ...patientData, procedure: e.target.value })} />
                        </CardContent>
                    </Card>

                    {/* Template List */}
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 py-4 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-sm font-black uppercase text-slate-600">Modelos</CardTitle>
                                <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="h-6 w-6 p-0"><Plus size={14} /></Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Criar Novo Modelo</DialogTitle>
                                            <DialogDescription>Use tags como #NOME, #CPF, #DATA, #PROFISSIONAL para auto-preenchimento.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Título do Modelo</Label>
                                                <Input
                                                    value={newTemplate.title}
                                                    onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                                                    placeholder="Ex: Termo de Consentimento - Botox"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Conteúdo do Documento</Label>
                                                <RichTextEditor
                                                    content={newTemplate.content}
                                                    onChange={(content) => setNewTemplate({ ...newTemplate, content })}
                                                    placeholder="Use #NOME, #CPF, #PROCEDIMENTO, #DATA e #PROFISSIONAL como variáveis."
                                                />
                                            </div>
                                            <div className="w-full text-xs space-y-2 text-slate-500 bg-slate-50 p-3 rounded h-fit">
                                                <p className="font-bold text-slate-700">Legenda de Tags:</p>
                                                <p><code className="bg-white px-1 border rounded">#NOME</code> - Nome Paciente | <code className="bg-white px-1 border rounded">#CPF</code> - CPF Paciente | <code className="bg-white px-1 border rounded">#DATA</code> - Data Atual | <code className="bg-white px-1 border rounded">#PROCEDIMENTO</code> - Procedimento | <code className="bg-white px-1 border rounded">#PROFISSIONAL</code> - Seu Nome/CRO</p>
                                            </div>
                                            <Button onClick={handleCreateTemplate} className="w-full">Salvar Modelo</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                                {templates.map(t => (
                                    <div key={t.id} className={`flex items-center justify-between p-3 hover:bg-slate-50 ${selectedTemplate?.id === t.id ? 'bg-primary/5' : ''}`}>
                                        <button onClick={() => applyTemplate(t)} className="flex-1 text-left flex items-center gap-2">
                                            <FileText size={14} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-700 truncate w-32">{t.title}</span>
                                        </button>
                                        <button onClick={() => handleDeleteTemplate(t.id)} className="text-slate-300 hover:text-red-500">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {templates.length === 0 && <p className="text-xs text-center text-slate-400 p-4">Nenhum modelo criado.</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Patient History */}
                    {patientData.id && (
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="py-4">
                                <CardTitle className="text-sm font-black uppercase text-slate-600 flex items-center gap-2">
                                    <History size={14} /> Histórico do Paciente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                                {history.map(doc => (
                                    <div key={doc.id} className="p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-slate-800">{doc.title}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(doc.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex gap-2">
                                                {mediaUrl(doc.fileUrl || doc.pdfUrl) ? (
                                                    <a href={mediaUrl(doc.fileUrl || doc.pdfUrl) || undefined} target="_blank" rel="noopener noreferrer" className="text-[10px] flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100">
                                                        <FileCheck size={12} /> Assinado
                                                    </a>
                                                ) : (
                                                    <label className="text-[10px] flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 cursor-pointer">
                                                        <Upload size={12} /> Anexar PDF
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="application/pdf"
                                                            onChange={(e) => e.target.files?.[0] && handleUploadSigned(doc.id, e.target.files[0])}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteHistory(doc.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Main Editor */}
                <div className="lg:col-span-3">
                    <Card className="min-w-0 border-slate-200 shadow-sm h-full min-h-[420px] sm:min-h-[600px] lg:min-h-[800px] flex flex-col no-print">
                        <div className="p-3 md:p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <FileText size={18} />
                                </div>
                                <span className="font-serif font-black text-slate-800 uppercase tracking-tighter">
                                    {selectedTemplate?.title || "Novo Documento"}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                <Button onClick={handleSaveHistory} variant="outline" className="flex-1 sm:flex-none gap-2 border-slate-200 text-slate-600">
                                    <Save size={18} /> <span className="sm:hidden">Salvar</span><span className="hidden sm:inline">Salvar no Histórico</span>
                                </Button>
                                <div className="no-print inline-flex min-h-10 items-center gap-2 rounded-lg border bg-background px-3">
                                    <Switch
                                        id="include-document-signature"
                                        checked={includeProfessionalSignature}
                                        onCheckedChange={setIncludeProfessionalSignature}
                                        disabled={!canInsertSignature}
                                    />
                                    <Label htmlFor="include-document-signature" className="cursor-pointer text-sm text-muted-foreground">
                                        Inserir assinatura
                                    </Label>
                                </div>
                                <Button onClick={handlePrint} className="flex-1 sm:flex-none bg-primary text-white hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20">
                                    <Printer size={18} /> <span className="sm:hidden">Imprimir</span><span className="hidden sm:inline">Apenas Imprimir</span>
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 p-4 md:p-8 bg-white overflow-auto">
                            <Textarea
                                value={documentContent}
                                onChange={(e) => setDocumentContent(e.target.value)}
                                className="w-full h-full min-h-[280px] sm:min-h-[420px] md:min-h-[600px] border-none shadow-none focus-visible:ring-0 font-serif text-base md:text-lg leading-relaxed text-slate-800 p-2 md:p-8"
                                placeholder="Selecione um modelo ou comece a digitar..."
                            />

                        </div>
                    </Card>

                </div>
            </div >

            {/* Keep the printable document outside the editing grid so print pagination is independent of screen layout. */}
            <div className={`hidden print-only ${printDocumentClass("clinic")} text-slate-900`}>
                <div className="print-section flex flex-col items-center mb-6 text-center border-b border-slate-100 pb-4">
                    <img src="/images/logo-oficial.png" alt="Logo" className="w-20 h-20 object-contain mb-2" />
                    <h1 className="text-xl font-serif font-black text-slate-900 tracking-widest uppercase">Núcleo Odontológico</h1>
                    <p className="text-slate-500 font-medium text-[9px] uppercase tracking-[0.2em] mt-1">Especializado & Harmonização</p>
                </div>

                <div className="print-flow-content whitespace-pre-wrap font-serif text-base leading-[1.6] text-justify text-slate-800 px-4">
                    {documentContent}
                </div>

                <div className="print-signature break-inside-avoid mt-20 pt-8 border-t border-slate-200 grid grid-cols-2 gap-12 text-center">
                    <div>
                        <div className="mx-auto w-64 border-b border-slate-900 mb-2"></div>
                        <p className="font-bold uppercase text-[10px]">Assinatura do Paciente</p>
                        <p className="text-[9px] text-slate-500 mt-1">{patientData.name} - {patientData.cpf}</p>
                    </div>
                    <ProfessionalSignature
                        professional={currentUser}
                        includeElectronic={includeProfessionalSignature}
                    />
                </div>

                <p className="mt-12 text-[10px] text-slate-400 uppercase tracking-widest text-center">
                    Governador Valadares, {patientData.date}
                </p>
            </div>

        </AdminLayout >
    );
};
export default AdminDocuments;
