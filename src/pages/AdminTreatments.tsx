import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Save, X, ImageIcon, Loader2, Sparkles, AlertCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axios from "axios";

// API Base URL (adjust if needed via env or direct)
import { API_URL } from "@/lib/api";

interface TreatmentResult {
    id: number;
    image: string;
    description: string;
}

interface Treatment {
    id: number;
    slug: string;
    title: string;
    description: string;
    category: "Odontologia" | "Harmonização";
    image: string;
    content: string;
    indications: string[];
    benefits: string[];
    duration: {
        procedure: string;
        recovery: string;
        longevity: string;
    };
    results: TreatmentResult[];
}

const AdminTreatments = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
    const [formData, setFormData] = useState<Partial<Treatment>>({
        category: "Odontologia",
        indications: [],
        benefits: [],
        duration: { procedure: "", recovery: "", longevity: "" },
        image: ""
    });

    // State for file uploading status
    const [isUploading, setIsUploading] = useState(false);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const resultInputRef = useRef<HTMLInputElement>(null);

    const queryClient = useQueryClient();

    // Fetch Treatments
    const { data: treatments, isLoading, error } = useQuery({
        queryKey: ['treatments'],
        queryFn: async () => {
            const response = await axios.get(`${API_URL}/treatments`);
            return response.data;
        }
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (newTreatment: any) => axios.post(`${API_URL}/treatments`, newTreatment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['treatments'] });
            toast.success("Tratamento criado com sucesso!");
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (err) => toast.error("Erro ao criar tratamento: " + (err as Error).message)
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => axios.put(`${API_URL}/treatments/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['treatments'] });
            toast.success("Tratamento atualizado com sucesso!");
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (err) => toast.error("Erro ao atualizar tratamento: " + (err as Error).message)
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => axios.delete(`${API_URL}/treatments/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['treatments'] });
            toast.success("Tratamento removido com sucesso!");
        },
        onError: (err) => toast.error("Erro ao remover tratamento: " + (err as Error).message)
    });

    // Result Mutations
    const addResultMutation = useMutation({
        mutationFn: ({ treatmentId, data }: { treatmentId: number, data: any }) => axios.post(`${API_URL}/treatments/${treatmentId}/results`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['treatments'] });
            toast.success("Resultado adicionado!");
        },
        onError: (err) => toast.error("Erro ao adicionar resultado: " + (err as Error).message)
    });

    const deleteResultMutation = useMutation({
        mutationFn: (resultId: number) => axios.delete(`${API_URL}/treatment-results/${resultId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['treatments'] });
            toast.success("Resultado removido!");
        },
        onError: (err) => toast.error("Erro ao remover resultado: " + (err as Error).message)
    });

    const resetForm = () => {
        setEditingTreatment(null);
        setFormData({
            category: "Odontologia",
            indications: [],
            benefits: [],
            duration: { procedure: "", recovery: "", longevity: "" },
            image: ""
        });
    };

    const handleEdit = (treatment: Treatment) => {
        setEditingTreatment(treatment);
        setFormData({
            ...treatment,
            indications: treatment.indications || [],
            benefits: treatment.benefits || []
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Generate slug from title if not present or changed
        const submissionData = { ...formData };
        if (!submissionData.slug && submissionData.title) {
            submissionData.slug = submissionData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        }

        if (editingTreatment) {
            updateMutation.mutate({ id: editingTreatment.id, data: submissionData });
        } else {
            createMutation.mutate(submissionData);
        }
    };

    const handleArrayInput = (field: 'indications' | 'benefits', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value.split('\n') }));
    };

    // File Upload Helper
    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            setIsUploading(true);
            const res = await axios.post(`${API_URL}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data.url;
        } catch (error) {
            toast.error("Erro ao fazer upload: " + (error as Error).message);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = await uploadFile(e.target.files[0]);
            if (url) {
                setFormData(prev => ({ ...prev, image: url }));
            }
        }
    };

    const [newResult, setNewResult] = useState({ image: '', description: '' });

    const handleResultImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = await uploadFile(e.target.files[0]);
            if (url) {
                setNewResult(prev => ({ ...prev, image: url }));
            }
        }
    };

    const handleAddResult = () => {
        if (!editingTreatment) return;
        if (!newResult.image || !newResult.description) {
            toast.error("Preencha imagem e descrição do resultado.");
            return;
        }
        addResultMutation.mutate({ treatmentId: editingTreatment.id, data: newResult });
        setNewResult({ image: '', description: '' });
    };

    return (
        <AdminLayout title="Gerenciar Tratamentos">
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Seus Tratamentos</h2>
                        <p className="text-slate-500 text-sm">Gerencie os procedimentos e seus resultados</p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-2 bg-primary hover:bg-primary/90">
                        <Plus size={18} /> Novo Tratamento
                    </Button>
                </div>

                {isLoading && <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>}

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>Não foi possível carregar os tratamentos. Verifique se o servidor está rodando.</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {treatments?.map((treatment: Treatment) => (
                        <Card key={treatment.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all group">
                            <div className="aspect-video relative bg-slate-100">
                                {treatment.image ? (
                                    <img src={treatment.image} alt={treatment.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400"><ImageIcon size={32} /></div>
                                )}
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => {
                                        if (confirm("Tem certeza que deseja excluir?")) deleteMutation.mutate(treatment.id);
                                    }}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-1">{treatment.category}</span>
                                        <CardTitle className="text-lg font-bold leading-tight">{treatment.title}</CardTitle>
                                    </div>
                                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEdit(treatment)}>
                                        <Pencil size={14} />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{treatment.description}</p>
                                <div className="flex justify-between items-center text-xs text-slate-400 border-t pt-2">
                                    <span>{treatment.results?.length || 0} Resultados</span>
                                    <span>{treatment.duration?.procedure}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingTreatment ? "Editar Tratamento" : "Novo Tratamento"}</DialogTitle>
                        </DialogHeader>

                        <form id="treatment-form" onSubmit={handleSubmit} className="space-y-6 py-4">
                            <Tabs defaultValue="info" className="w-full">
                                <TabsList>
                                    <TabsTrigger value="info">Informações Básicas</TabsTrigger>
                                    <TabsTrigger value="details">Detalhes & Benefícios</TabsTrigger>
                                    <TabsTrigger value="results" disabled={!editingTreatment}>Galeria de Resultados</TabsTrigger>
                                </TabsList>

                                <TabsContent value="info" className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Título</Label>
                                            <Input
                                                value={formData.title || ''}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Categoria</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                            >
                                                <option value="Odontologia">Odontologia</option>
                                                <option value="Harmonização">Harmonização</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Imagem de Capa</Label>
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                value={formData.image || ''}
                                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                                                placeholder="/images/example.jpg"
                                                className="flex-1"
                                            />
                                            <input
                                                type="file"
                                                ref={coverInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleCoverUpload}
                                            />
                                            <Button type="button" variant="outline" size="icon" onClick={() => coverInputRef.current?.click()} disabled={isUploading}>
                                                {isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Descrição Curta (Card)</Label>
                                        <Textarea
                                            value={formData.description || ''}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Conteúdo Completo</Label>
                                        <Textarea
                                            value={formData.content || ''}
                                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                                            rows={10}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="details" className="space-y-4 pt-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Tempo de Procedimento</Label>
                                            <Input
                                                value={formData.duration?.procedure || ''}
                                                onChange={e => setFormData({ ...formData, duration: { ...formData.duration!, procedure: e.target.value } })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Recuperação</Label>
                                            <Input
                                                value={formData.duration?.recovery || ''}
                                                onChange={e => setFormData({ ...formData, duration: { ...formData.duration!, recovery: e.target.value } })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Durabilidade</Label>
                                            <Input
                                                value={formData.duration?.longevity || ''}
                                                onChange={e => setFormData({ ...formData, duration: { ...formData.duration!, longevity: e.target.value } })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Indicações (uma por linha)</Label>
                                            <Textarea
                                                value={formData.indications?.join('\n') || ''}
                                                onChange={e => handleArrayInput('indications', e.target.value)}
                                                rows={8}
                                                placeholder="- Dentes amarelados&#10;- Manchas"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Diferenciais/Benefícios (um por linha)</Label>
                                            <Textarea
                                                value={formData.benefits?.join('\n') || ''}
                                                onChange={e => handleArrayInput('benefits', e.target.value)}
                                                rows={8}
                                                placeholder="- Resultado natural&#10;- Indolor"
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="results" className="space-y-4 pt-4">
                                    {!editingTreatment ? (
                                        <p className="text-center text-sm text-slate-500 py-4">Salve o tratamento primeiro para adicionar resultados.</p>
                                    ) : (
                                        <>
                                            <div className="bg-slate-50 p-4 rounded-lg border border-border">
                                                <h4 className="font-bold mb-4 text-sm uppercase">Novo Resultado</h4>
                                                <div className="grid grid-cols-[1fr,2fr,auto] gap-4 items-end">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Mídia (Img/Video)</Label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                value={newResult.image}
                                                                onChange={e => setNewResult({ ...newResult, image: e.target.value })}
                                                                placeholder="/images/result1.jpg"
                                                                className="flex-1"
                                                            />
                                                            <input
                                                                type="file"
                                                                ref={resultInputRef}
                                                                className="hidden"
                                                                accept="image/*,video/mp4"
                                                                onChange={handleResultImageUpload}
                                                            />
                                                            <Button type="button" variant="outline" size="icon" onClick={() => resultInputRef.current?.click()} disabled={isUploading}>
                                                                {isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Descrição do Caso</Label>
                                                        <Input
                                                            value={newResult.description}
                                                            onChange={e => setNewResult({ ...newResult, description: e.target.value })}
                                                            placeholder="Paciente jovem, buscando correção de..."
                                                        />
                                                    </div>
                                                    <Button type="button" onClick={handleAddResult} disabled={!newResult.image || isUploading}>
                                                        <Plus size={16} /> Adicionar
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm">Resultados Existentes</h4>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-[100px]">Mídia</TableHead>
                                                            <TableHead>Descrição</TableHead>
                                                            <TableHead className="w-[50px]"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {editingTreatment.results?.length === 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={3} className="text-center text-slate-500">Nenhum resultado cadastrado.</TableCell>
                                                            </TableRow>
                                                        )}
                                                        {editingTreatment.results?.map(result => (
                                                            <TableRow key={result.id}>
                                                                <TableCell>
                                                                    <div className="w-16 h-12 bg-slate-100 rounded overflow-hidden">
                                                                        <img src={result.image} className="w-full h-full object-cover" alt="Result" onError={(e) => (e.target as HTMLImageElement).src = '/placeholder.png'} />
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-xs">{result.description}</TableCell>
                                                                <TableCell>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                                        onClick={() => deleteResultMutation.mutate(result.id)}
                                                                    >
                                                                        <X size={14} />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </>
                                    )}
                                </TabsContent>
                            </Tabs>

                            <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t mt-4">
                                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Salvar Alterações
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
};

export default AdminTreatments;
