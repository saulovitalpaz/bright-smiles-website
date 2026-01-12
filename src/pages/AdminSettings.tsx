import { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Loader2, Save, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import { API_URL } from "@/lib/api";

const AdminSettings = () => {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${API_URL}/settings`);
            setSettings(res.data);
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Erro ao carregar configurações");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            // For simplicity, we save each setting in parallel
            const promises = Object.entries(settings).map(([key, value]) =>
                axios.post(`${API_URL}/settings`, { key, value })
            );
            await Promise.all(promises);
            toast.success("Configurações salvas!");
        } catch (error) {
            toast.error("Erro ao salvar configurações");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append("file", e.target.files[0]);

            try {
                const res = await axios.post(`${API_URL}/upload`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                handleUpdate("site_logo", res.data.url);
                toast.success("Logo enviada!");
            } catch (error) {
                toast.error("Erro ao fazer upload da logo");
            } finally {
                setIsUploading(false);
            }
        }
    };

    if (isLoading) {
        return (
            <AdminLayout title="Configurações">
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin text-primary w-8 h-8" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Configurações do Site">
            <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Identidade Visual</CardTitle>
                        <CardDescription>
                            Gerencie a logo e o nome oficial da clínica que aparece em todo o site.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Logo do Site</Label>
                            <div className="flex items-start gap-6">
                                <div className="w-32 h-32 bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                                    {settings.site_logo ? (
                                        <img src={settings.site_logo} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <ImageIcon className="text-slate-300 w-10 h-10" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex gap-2">
                                        <Input
                                            value={settings.site_logo || ""}
                                            onChange={(e) => handleUpdate("site_logo", e.target.value)}
                                            placeholder="URL da logo ou faça upload"
                                        />
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="gap-2"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                        >
                                            {isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
                                            Upload
                                        </Button>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Recomendado: PNG transparente, mínimo 200x200px.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Nome da Clínica</Label>
                            <Input
                                value={settings.clinic_name || "Núcleo Odontológico"}
                                onChange={(e) => handleUpdate("clinic_name", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Subtítulo/Slogan</Label>
                            <Input
                                value={settings.clinic_slogan || "Especializado & Harmonização"}
                                onChange={(e) => handleUpdate("clinic_slogan", e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Redes Sociais & Contatos</CardTitle>
                        <CardDescription>
                            Essas informações são usadas nos botões de contato e rodapé.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>WhatsApp (apenas números)</Label>
                                <Input
                                    value={settings.contact_whatsapp || ""}
                                    onChange={(e) => handleUpdate("contact_whatsapp", e.target.value)}
                                    placeholder="Ex: 5531999999999"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Instagram (username)</Label>
                                <Input
                                    value={settings.contact_instagram || ""}
                                    onChange={(e) => handleUpdate("contact_instagram", e.target.value)}
                                    placeholder="Ex: clinica.nucleo"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 sticky bottom-0 bg-slate-50/80 backdrop-blur-sm p-4 border-t">
                    <Button
                        variant="default"
                        size="lg"
                        className="gap-2 px-8"
                        onClick={saveSettings}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                        Salvar Todas as Configurações
                    </Button>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSettings;
