import React, { useState, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { replaceDocumentTokens } from "@/lib/document-template";
import { derivePatientAge } from "@/lib/patient-age";
import {
    hasCompleteProfessionalIdentity,
    hasUsableProfessionalSignature,
    readStoredProfessionalIdentity,
} from "@/lib/professional-signature";

type DocumentTemplate = {
    id: number;
    title: string;
    content: string;
    kind: "text" | "pdf";
};

type PatientDocumentRecord = {
    id: number;
    title: string;
    date: string;
    fileUrl?: string | null;
    pdfUrl?: string | null;
    status?: string;
    sourceKind?: "text" | "pdf";
    attachments?: Array<{ id: number; originalName: string; fileUrl?: string | null }>;
};

const AdminDocuments = () => {
    const [patientData, setPatientData] = useState({
        id: null as number | null,
        name: "",
        cpf: "",
        birthDate: null as string | null,
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
    const [newTemplate, setNewTemplate] = useState<{ title: string; content: string; file: File | null }>({ title: "", content: "", file: null });

    const currentUser = readStoredProfessionalIdentity();
    const canIssueDocument = hasCompleteProfessionalIdentity(currentUser);
    const canInsertSignature = hasUsableProfessionalSignature(currentUser);
    const [includeProfessionalSignature, setIncludeProfessionalSignature] = useState(
        () => canInsertSignature,
    );
    const [isPrintReady, setIsPrintReady] = useState(false);

    React.useEffect(() => {
        if (!isPrintReady) return;

        const clearPrintReady = () => setIsPrintReady(false);
        window.addEventListener("afterprint", clearPrintReady);
        const frame = window.requestAnimationFrame(() => window.print());

        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("afterprint", clearPrintReady);
        };
    }, [isPrintReady]);

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
        if (!newTemplate.title) return toast.error("Preencha o título");
        if (!newTemplate.file && !newTemplate.content.trim()) return toast.error("Adicione o texto ou um PDF");
        if (newTemplate.file && newTemplate.file.type !== "application/pdf") return toast.error("O modelo deve ser um PDF válido.");
        try {
            const body = newTemplate.file
                ? (() => {
                    const formData = new FormData();
                    formData.append("title", newTemplate.title);
                    formData.append("kind", "pdf");
                    formData.append("file", newTemplate.file);
                    return formData;
                })()
                : JSON.stringify({ title: newTemplate.title, content: newTemplate.content, kind: "text" });
            const res = await fetchClient(`/document-templates`, {
                method: "POST",
                body
            });
            if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Erro ao criar modelo");
            toast.success("Modelo criado!");
            setNewTemplate({ title: "", content: "", file: null });
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
        if (template.kind === "pdf") {
            setSelectedTemplate(template);
            setDocumentContent("");
            toast.info(patientData.id ? "Modelo PDF pronto para emissão." : "Selecione um paciente para emitir este modelo PDF.");
            return;
        }
        const derivedAge = derivePatientAge(patientData.birthDate);
        const formattedBirthDate = patientData.birthDate
            ? patientData.birthDate.slice(0, 10).split("-").reverse().join("/")
            : "_________________";
        const processed = replaceDocumentTokens(template.content, {
            "#NOME": patientData.name || "_________________",
            "#CPF": patientData.cpf || "_________________",
            "#PROCEDIMENTO": patientData.procedure || "_________________",
            "#DATA": patientData.date,
            "#PROFISSIONAL": `${currentUser.name} - ${currentUser.cro}`,
            "#NASCIMENTO": formattedBirthDate,
            "#IDADE": derivedAge.age === null ? "_________________" : `${derivedAge.age} anos`,
            "#FAIXA_ETARIA": derivedAge.ageGroup === "child" ? "criança" : derivedAge.ageGroup === "adolescent" ? "adolescente" : derivedAge.ageGroup === "adult" ? "adulto" : "_________________",
        });

        setDocumentContent(processed);
        setSelectedTemplate(template);
    };

    const handleSaveHistory = async () => {
        if (!patientData.id) return toast.error("Selecione um paciente.");
        if (selectedTemplate?.kind !== "pdf" && !documentContent.trim()) return toast.error("Gere ou escreva um documento.");
        if (selectedTemplate?.kind === "pdf" && !selectedTemplate.id) return toast.error("Selecione um modelo PDF.");
        try {
            const res = await fetchClient(`/patient-documents`, {
                method: "POST",
                body: JSON.stringify({
                    title: selectedTemplate?.title || "Documento Avulso",
                    content: documentContent,
                    patientId: patientData.id,
                    templateId: selectedTemplate?.id || null,
                    sourceKind: selectedTemplate?.kind || "text"
                })
            });
            if (res.ok) {
                toast.success("Salvo no histórico!");
                const saved = await res.json();
                setHistory(prev => [saved, ...prev]);
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

    const handleUploadSigned = async (docId: number, files: File[]) => {
        if (!files.length) return;
        if (files.some((file) => !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
            toast.error("Anexe apenas PDF ou imagens JPEG, PNG e WebP.");
            return;
        }

        const formData = new FormData();
        files.forEach(file => formData.append("files", file));

        try {
            // Upload to the private Railway Bucket through the backend.
            const uploadRes = await fetchClient(`/patient-documents/${docId}/attachments`, {
                method: "POST",
                body: formData
            });
            if (!uploadRes.ok) throw new Error((await uploadRes.json().catch(() => null))?.error || "Erro no upload");
            const attachments = await uploadRes.json();

            toast.success("Anexo(s) salvo(s) com sucesso!");
            // Refresh history locally
            setHistory(prev => prev.map(h => h.id === docId ? { ...h, status: "signed", attachments: [...(h.attachments || []), ...attachments] } : h));
        } catch (e) {
            console.error(e);
            toast.error(e instanceof Error ? e.message : "Erro ao fazer upload.");
        }
    };

    const handlePrint = () => {
        if (selectedTemplate?.kind === "pdf") {
            return toast.error("Modelos PDF devem ser emitidos e acessados pelo histórico.");
        }
        if (!documentContent.trim()) {
            return toast.error("Escreva o conteúdo do documento antes de imprimir.");
        }
        if (!canIssueDocument) {
            return toast.error("Configure o nome profissional e o CRO antes de imprimir.");
        }
        setIsPrintReady(true);
    };

    return (
        <AdminLayout title="Termos & Documentos">
            <div className="min-w-0 grid grid-cols-1 gap-6 md:gap-8 mb-20 lg:grid-cols-4">
                {/* Left Sidebar */}
                <div className="min-w-0 lg:col-span-1 space-y-6 no-print">

                    {/* Patient Selector */}
                    <Card className="admin-card">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-serif">Dados do Paciente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Buscar</Label>
                                <PatientPicker
                                    onSelect={(p) => setPatientData(prev => ({ ...prev, id: p.id, name: p.name, cpf: p.cpf, birthDate: p.birthDate || null }))}
                                />
                            </div>
                            <Label className="text-[10px] font-black uppercase text-slate-400">Campos Dinâmicos</Label>
                            <Input placeholder="Nome" value={patientData.name} onChange={e => setPatientData({ ...patientData, name: e.target.value })} />
                            <Input placeholder="CPF" value={patientData.cpf} onChange={e => setPatientData({ ...patientData, cpf: e.target.value })} />
                            <Input placeholder="Procedimento" value={patientData.procedure} onChange={e => setPatientData({ ...patientData, procedure: e.target.value })} />
                        </CardContent>
                    </Card>

                    {/* Template List */}
                    <Card className="admin-card overflow-hidden">
                        <CardHeader className="bg-slate-50/50 py-4 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-sm font-black uppercase text-slate-600">Modelos</CardTitle>
                                <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                                    <DialogTrigger asChild>
                                         <Button size="sm" variant="outline" className="min-h-11 min-w-11 shrink-0 p-0" aria-label="Criar novo modelo"><Plus size={14} /></Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Criar Novo Modelo</DialogTitle>
                                        <DialogDescription>Use tags como #NOME, #CPF, #DATA, #NASCIMENTO, #IDADE e #FAIXA_ETARIA no texto, ou envie um PDF para emitir sem tags.</DialogDescription>
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
                                                    placeholder="Use #NOME, #CPF, #NASCIMENTO, #IDADE, #FAIXA_ETARIA e outras tags como variáveis."
                                                />
                                                <p className="text-center text-xs text-slate-400">— ou —</p>
                                                <Input
                                                    type="file"
                                                    accept="application/pdf"
                                                    onChange={(event) => setNewTemplate({ ...newTemplate, file: event.target.files?.[0] || null })}
                                                />
                                                {newTemplate.file ? <p className="text-xs text-emerald-600">PDF selecionado: {newTemplate.file.name}</p> : null}
                                            </div>
                                            <div className="w-full text-xs space-y-2 text-slate-500 bg-slate-50 p-3 rounded h-fit">
                                                <p className="font-bold text-slate-700">Legenda de Tags:</p>
                                                    <p><code className="bg-white px-1 border rounded">#NOME</code> - Nome | <code className="bg-white px-1 border rounded">#CPF</code> - CPF | <code className="bg-white px-1 border rounded">#DATA</code> - Data | <code className="bg-white px-1 border rounded">#NASCIMENTO</code> - Nascimento | <code className="bg-white px-1 border rounded">#IDADE</code> - Idade calculada | <code className="bg-white px-1 border rounded">#FAIXA_ETARIA</code> - Classificação | <code className="bg-white px-1 border rounded">#PROCEDIMENTO</code> - Procedimento | <code className="bg-white px-1 border rounded">#PROFISSIONAL</code> - Profissional</p>
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
                                         <button onClick={() => handleDeleteTemplate(t.id)} className="min-h-11 min-w-11 shrink-0 p-2 text-slate-300 hover:text-red-500" aria-label={`Excluir modelo ${t.title}`}>
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
                        <Card className="admin-card">
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
                                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex flex-wrap gap-2">
                                                {mediaUrl(doc.fileUrl || doc.pdfUrl) ? (
                                                    <a href={mediaUrl(doc.fileUrl || doc.pdfUrl) || undefined} target="_blank" rel="noopener noreferrer" className="text-[10px] flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200">
                                                        <FileText size={12} /> Ver documento emitido
                                                    </a>
                                                ) : null}
                                                {(doc.attachments || []).map((attachment) => {
                                                    const attachmentUrl = mediaUrl(attachment.fileUrl);
                                                    return attachmentUrl ? (
                                                        <a key={attachment.id} href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] flex max-w-[180px] items-center gap-1 truncate text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100" title={attachment.originalName}>
                                                            <FileCheck size={12} /> {attachment.originalName}
                                                        </a>
                                                    ) : null;
                                                })}
                                                <label className="text-[10px] flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 cursor-pointer">
                                                    <Upload size={12} /> Anexar assinatura
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="application/pdf,image/jpeg,image/png,image/webp"
                                                        multiple
                                                        onChange={(e) => handleUploadSigned(doc.id, Array.from(e.target.files || []))}
                                                    />
                                                </label>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase ${doc.status === "signed" ? "text-emerald-600" : "text-slate-400"}`}>
                                                {doc.status === "signed" ? "Assinado" : "Emitido"}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteHistory(doc.id)}
                                             className="min-h-11 min-w-11 p-2 text-slate-300 opacity-100 sm:opacity-0 transition-all hover:text-red-500 sm:group-hover:opacity-100"
                                             aria-label={`Excluir documento ${doc.title}`}
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
                <div className="min-w-0 lg:col-span-3">
                    <Card className="admin-card flex min-h-[420px] min-w-0 flex-col no-print sm:min-h-[600px] lg:min-h-[800px]">
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
                            {selectedTemplate?.kind === "pdf" ? (
                                <div className="flex min-h-[420px] flex-1 items-center justify-center bg-slate-50 p-8 text-center text-sm text-slate-500">
                                    Este modelo é um PDF. Selecione um paciente e salve no histórico para registrar a emissão.
                                </div>
                            ) : (
                                <RichTextEditor
                                    content={documentContent}
                                    onChange={setDocumentContent}
                                    className="h-full min-h-[420px] rounded-none border-none shadow-none"
                                    placeholder="Selecione um modelo ou comece a digitar..."
                                />
                            )}

                        </div>
                    </Card>

                </div>
            </div >

            {/* Keep the printable document outside the editing grid so print pagination is independent of screen layout. */}
            {isPrintReady && (
                <div className={`hidden print-only print-root ${printDocumentClass("clinic")} text-slate-900`} data-print-target="document">
                    <div className="print-section mb-6 flex flex-col items-center border-b border-slate-100 pb-4 text-center">
                        <img src="/images/logo-oficial.png" alt="Logo" className="mb-2 h-20 w-20 object-contain" />
                        <h1 className="text-xl font-serif font-black uppercase tracking-widest text-slate-900">Núcleo Odontológico</h1>
                        <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500">Especializado & Harmonização</p>
                    </div>

                    <div className="print-flow-content whitespace-pre-wrap px-4 text-justify font-serif text-base leading-[1.6] text-slate-800">
                        <div dangerouslySetInnerHTML={{ __html: documentContent }} />
                    </div>

                    <div className="print-signature mt-20 grid grid-cols-2 gap-12 border-t border-slate-200 pt-8 text-center">
                        <div>
                            <div className="mx-auto mb-2 w-64 border-b border-slate-900"></div>
                            <p className="text-[10px] font-bold uppercase">Assinatura do Paciente</p>
                            <p className="mt-1 text-[9px] text-slate-500">{patientData.name} - {patientData.cpf}</p>
                        </div>
                        <ProfessionalSignature
                            professional={currentUser}
                            includeElectronic={includeProfessionalSignature}
                        />
                    </div>

                    <p className="mt-12 text-center text-[10px] uppercase tracking-widest text-slate-400">
                        Governador Valadares, {patientData.date}
                    </p>
                </div>
            )}

        </AdminLayout >
    );
};
export default AdminDocuments;
