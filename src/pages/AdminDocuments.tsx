import React, { useState, useRef } from "react";
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
import { API_URL } from "@/lib/api";
import { PatientPicker } from "@/components/admin/PatientPicker";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const AdminDocuments = () => {
    const [patientData, setPatientData] = useState({
        id: null as number | null,
        name: "",
        cpf: "",
        procedure: "",
        date: new Date().toLocaleDateString('pt-BR')
    });

    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [documentContent, setDocumentContent] = useState("");

    // History & Upload State
    const [history, setHistory] = useState<any[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Template Management State
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ title: "", content: "" });

    // Load Templates
    const loadTemplates = () => {
        fetch(`${API_URL}/document-templates`)
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
            fetch(`${API_URL}/patient-documents/${patientData.id}`)
                .then(res => res.json())
                .then(setHistory)
                .catch(console.error);
        }
    }, [patientData.id]);

    const handleCreateTemplate = async () => {
        if (!newTemplate.title || !newTemplate.content) return toast.error("Preencha título e conteúdo");
        try {
            await fetch(`${API_URL}/document-templates`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTemplate)
            });
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
            await fetch(`${API_URL}/document-templates/${id}`, { method: "DELETE" });
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

    const applyTemplate = (template: any) => {
        let processed = template.content
            .replace(/#NOME/g, patientData.name || "_________________")
            .replace(/#CPF/g, patientData.cpf || "_________________")
            .replace(/#PROCEDIMENTO/g, patientData.procedure || "_________________")
            .replace(/#DATA/g, patientData.date)
            .replace(/#PROFISSIONAL/g, "Dra. Ana Karolina - CRO/MG 53738");

        setDocumentContent(processed);
        setSelectedTemplate(template);
    };

    const handleSaveHistory = async () => {
        if (!patientData.id || !documentContent) return toast.error("Selecione um paciente e gere um documento.");
        try {
            const res = await fetch(`${API_URL}/patient-documents`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: selectedTemplate?.title || "Documento Avulso",
                    content: documentContent,
                    patientId: patientData.id
                })
            });
            if (res.ok) {
                toast.success("Salvo no histórico! Agora imprima e colete a assinatura.");
                // Refresh history
                const saved = await res.json();
                setHistory([saved, ...history]);
            }
        } catch (e) {
            toast.error("Erro ao salvar.");
        }
    };

    const handleUploadSigned = async (docId: number, file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
            // 1. Upload to Cloudinary
            const uploadRes = await fetch(`${API_URL}/upload`, {
                method: "POST",
                body: formData
            });
            const { url } = await uploadRes.json();

            // 2. Update Document record
            await fetch(`${API_URL}/patient-documents/${docId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pdfUrl: url })
            });

            toast.success("PDF Anexado com sucesso!");
            // Refresh history locally
            setHistory(history.map(h => h.id === docId ? { ...h, pdfUrl: url } : h));
        } catch (e) {
            console.error(e);
            toast.error("Erro ao fazer upload.");
        }
    };

    return (
        <AdminLayout title="Termos & Documentos">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20">
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
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Criar Novo Modelo</DialogTitle>
                                            <DialogDescription>Use tags como #NOME, #CPF, #DATA, #PROFISSIONAL para auto-preenchimento.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <Input
                                                placeholder="Título do Modelo (ex: Contrato Botox)"
                                                value={newTemplate.title}
                                                onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })}
                                            />
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <Textarea
                                                        placeholder="Conteúdo do contrato..."
                                                        className="h-[300px] font-mono text-sm"
                                                        value={newTemplate.content}
                                                        onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })}
                                                    />
                                                </div>
                                                <div className="w-48 text-xs space-y-2 text-slate-500 bg-slate-50 p-3 rounded h-fit">
                                                    <p className="font-bold text-slate-700">Legenda de Tags:</p>
                                                    <p><code className="bg-white px-1 border rounded">#NOME</code> - Nome Paciente</p>
                                                    <p><code className="bg-white px-1 border rounded">#CPF</code> - CPF Paciente</p>
                                                    <p><code className="bg-white px-1 border rounded">#DATA</code> - Data Atual</p>
                                                    <p><code className="bg-white px-1 border rounded">#PROCEDIMENTO</code> - Procedimento</p>
                                                    <p><code className="bg-white px-1 border rounded">#PROFISSIONAL</code> - Seu Nome/CRO</p>
                                                </div>
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
                                    <div key={doc.id} className="p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-slate-800">{doc.title}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(doc.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            {doc.pdfUrl ? (
                                                <a href={doc.pdfUrl} target="_blank" className="text-[10px] flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100">
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
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Main Editor */}
                <div className="lg:col-span-3">
                    <Card className="border-slate-200 shadow-sm h-full min-h-[800px] flex flex-col no-print">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <FileText size={18} />
                                </div>
                                <span className="font-serif font-black text-slate-800 uppercase tracking-tighter">
                                    {selectedTemplate?.title || "Novo Documento"}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleSaveHistory} variant="outline" className="gap-2 border-slate-200 text-slate-600">
                                    <Save size={18} /> Salvar (Pré-Impressão)
                                </Button>
                                <Button onClick={() => window.print()} className="bg-primary text-white hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20">
                                    <Printer size={18} /> Imprimir / PDF
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 p-8 bg-white overflow-auto">
                            <Textarea
                                value={documentContent}
                                onChange={(e) => setDocumentContent(e.target.value)}
                                className="w-full h-full min-h-[600px] border-none shadow-none focus-visible:ring-0 font-serif text-lg leading-relaxed text-slate-800 p-8"
                                placeholder="Selecione um modelo ou comece a digitar..."
                            />
                        </div>
                    </Card>

                    {/* Print Preview (Hidden normally, Visible on Print) */}
                    <div className="print-only bg-white p-12 text-slate-900 fixed top-0 left-0 w-full h-full z-[9999]">
                        <div className="flex flex-col items-center mb-12 text-center border-b border-slate-200 pb-8">
                            <img src="/images/logo oficial.png" alt="Logo" className="w-32 h-32 object-contain mb-4" />
                            <h1 className="text-2xl font-serif font-black text-slate-900 tracking-widest uppercase">Núcleo Odontológico</h1>
                            <p className="text-slate-500 font-medium text-xs uppercase tracking-[0.2em] mt-2">Dra. Ana Karolina - CRO/MG 53738</p>
                        </div>

                        <div className="whitespace-pre-wrap font-serif text-lg leading-[2] text-justify text-slate-800 px-8">
                            {documentContent}
                        </div>

                        <div className="mt-32 pt-8 border-t border-slate-300 text-center">
                            <div className="w-64 mx-auto border-b border-slate-900 mb-2"></div>
                            <p className="font-bold uppercase text-sm">Assinatura do Paciente</p>
                            <p className="text-xs text-slate-500 mt-1">{patientData.name} - {patientData.cpf}</p>

                            <p className="mt-12 text-[10px] text-slate-400 uppercase tracking-widest">
                                Governador Valadares, {patientData.date}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: white; }
                    body { background: white !important; overflow: visible !important; }
                    #root { overflow: visible !important; }
                }
                .print-only { display: none; }
            `}</style>
        </AdminLayout>
    );
};
export default AdminDocuments;
