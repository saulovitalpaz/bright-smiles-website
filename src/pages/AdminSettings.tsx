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
import { mediaUrl } from "@/lib/media";

const EDITABLE_SETTING_KEYS = [
    "site_logo",
    "clinic_name",
    "clinic_slogan",
    "contact_whatsapp",
    "contact_instagram"
] as const;

type ProfessionalProfile = {
    name: string;
    cro: string;
    signatureUrl: string;
};

const readProfessionalProfile = (): ProfessionalProfile => {
    try {
        const value = localStorage.getItem("admin_user");
        if (!value) return { name: "", cro: "", signatureUrl: "" };

        const parsed: unknown = JSON.parse(value);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return { name: "", cro: "", signatureUrl: "" };
        }

        const user = parsed as Record<string, unknown>;
        return {
            name: typeof user.name === "string" ? user.name : "",
            cro: typeof user.cro === "string" ? user.cro : "",
            signatureUrl: typeof user.signatureUrl === "string" ? user.signatureUrl : "",
        };
    } catch {
        return { name: "", cro: "", signatureUrl: "" };
    }
};

const AdminSettings = () => {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [professionalProfile, setProfessionalProfile] = useState(readProfessionalProfile);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isLogoUploading, setIsLogoUploading] = useState(false);
    const [isSignatureUploading, setIsSignatureUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const logoFileInputRef = useRef<HTMLInputElement>(null);
    const signatureFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${API_URL}/settings`, { withCredentials: true });
            setSettings(res.data);
        } catch (error) {
            console.error("Error fetching settings:", error);
            setErrorMessage("Não foi possível carregar as configurações. Tente novamente.");
            toast.error("Erro ao carregar configurações");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const saveSettings = async () => {
        if (!professionalProfile.name.trim() || !professionalProfile.cro.trim()) {
            setErrorMessage("Informe o nome profissional e o CRO antes de salvar.");
            toast.error("Nome profissional e CRO são obrigatórios");
            return;
        }
        setIsSaving(true);
        setErrorMessage("");
        try {
            const settingsRequests = Object.entries(settings)
                .filter(([key]) => EDITABLE_SETTING_KEYS.includes(key as typeof EDITABLE_SETTING_KEYS[number]))
                .map(([key, value]) =>
                axios.post(`${API_URL}/settings`, { key, value }, { withCredentials: true })
                );
            const profileRequest = axios.patch(
                `${API_URL}/users/me`,
                {
                    ...professionalProfile,
                    signatureUrl: professionalProfile.signatureUrl || null,
                },
                { withCredentials: true },
            ).then((response) => {
                localStorage.setItem("admin_user", JSON.stringify(response.data));
            });

            await Promise.all([profileRequest, ...settingsRequests]);
            toast.success("Configurações salvas!");
        } catch (error) {
            setErrorMessage("Não foi possível salvar as configurações. Tente novamente.");
            toast.error("Erro ao salvar configurações");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsLogoUploading(true);
            setErrorMessage("");
            const formData = new FormData();
            formData.append("file", e.target.files[0]);
            formData.append("scope", "public");

            try {
                const res = await axios.post(`${API_URL}/upload`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                    withCredentials: true
                });
                handleUpdate("site_logo", res.data.reference || res.data.url);
                e.target.value = "";
                toast.success("Logo enviada!");
            } catch (error: unknown) {
                const message = axios.isAxiosError<{ error?: string }>(error)
                    ? error.response?.data?.error || error.message
                    : error instanceof Error ? error.message : "Erro desconhecido.";
                setErrorMessage("Não foi possível enviar a logo. Tente novamente.");
                toast.error("Erro ao fazer upload da logo: " + message);
            } finally {
                setIsLogoUploading(false);
            }
        }
    };

    const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsSignatureUploading(true);
        setErrorMessage("");
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post(`${API_URL}/upload/signature`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true,
            });
            const signatureUrl = response.data.reference || response.data.url;
            if (!signatureUrl) throw new Error("O upload não retornou uma referência de imagem.");

            setProfessionalProfile((current) => ({ ...current, signatureUrl }));
            event.target.value = "";
            toast.success("Assinatura enviada. Salve para confirmar a alteração.");
        } catch (error: unknown) {
            const message = axios.isAxiosError<{ error?: string }>(error)
                ? error.response?.data?.error || error.message
                : error instanceof Error ? error.message : "Erro desconhecido.";
            setErrorMessage("Não foi possível enviar a assinatura. Tente novamente.");
            toast.error("Erro ao fazer upload da assinatura: " + message);
        } finally {
            setIsSignatureUploading(false);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout title="Configurações">
                <div
                    className="flex justify-center p-12"
                    role="status"
                    aria-label="Carregando configurações"
                >
                    <Loader2 className="animate-spin text-primary w-8 h-8" aria-hidden="true" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Configurações do Site">
            <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6">
                {errorMessage && (
                    <div
                        role="alert"
                        className="flex min-w-0 items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
                    >
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                        <p>{errorMessage}</p>
                    </div>
                )}

                <Card
                    className="min-w-0 max-w-full"
                    data-testid="professional-settings-card"
                >
                    <CardHeader>
                        <CardTitle>Identidade e Assinatura Profissional</CardTitle>
                        <CardDescription>
                            Estes dados identificam o profissional nos documentos clínicos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="min-w-0 space-y-6">
                        <div
                            className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"
                            data-testid="professional-settings-fields"
                        >
                            <div className="min-w-0 space-y-2">
                                <Label htmlFor="professional-name">Nome profissional</Label>
                                <Input
                                    id="professional-name"
                                    value={professionalProfile.name}
                                    onChange={(event) => setProfessionalProfile((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))}
                                    autoComplete="name"
                                    required
                                />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <Label htmlFor="professional-cro">CRO</Label>
                                <Input
                                    id="professional-cro"
                                    value={professionalProfile.cro}
                                    onChange={(event) => setProfessionalProfile((current) => ({
                                        ...current,
                                        cro: event.target.value,
                                    }))}
                                    autoComplete="off"
                                    required
                                />
                            </div>
                        </div>

                        <div className="min-w-0 space-y-2">
                            <Label htmlFor="professional-signature">Assinatura profissional</Label>
                            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                                <div className="flex h-32 w-full min-w-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 sm:w-64">
                                    {professionalProfile.signatureUrl ? (
                                        <img
                                            src={mediaUrl(professionalProfile.signatureUrl) || undefined}
                                            alt="Prévia da assinatura profissional"
                                            className="h-full w-full object-contain p-3"
                                        />
                                    ) : (
                                        <p className="px-4 text-center text-sm text-slate-500">
                                            Nenhuma assinatura enviada.
                                        </p>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1 space-y-3">
                                    <input
                                        id="professional-signature"
                                        type="file"
                                        ref={signatureFileInputRef}
                                        className="sr-only"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={handleSignatureUpload}
                                        disabled={isSignatureUploading}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="min-h-11 w-full gap-2 sm:w-auto"
                                        onClick={() => signatureFileInputRef.current?.click()}
                                        disabled={isSignatureUploading}
                                    >
                                        {isSignatureUploading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Upload className="h-4 w-4" />
                                        )}
                                        {isSignatureUploading ? "Enviando..." : "Carregar assinatura"}
                                    </Button>
                                    <p className="text-sm text-slate-500">
                                        PNG, JPEG ou WebP, até 5 MB. Confirme a alteração ao salvar.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Identidade Visual</CardTitle>
                        <CardDescription>
                            Gerencie a logo e o nome oficial da clínica que aparece em todo o site.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="site-logo">Logo do Site</Label>
                            <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:gap-6">
                                <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-100">
                                    {settings.site_logo ? (
                                        <img src={mediaUrl(settings.site_logo) || undefined} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <ImageIcon className="text-slate-300 w-10 h-10" />
                                    )}
                                </div>
                                <div className="w-full min-w-0 flex-1 space-y-4">
                                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                                        <Input
                                            id="site-logo"
                                            value={settings.site_logo || ""}
                                            onChange={(e) => handleUpdate("site_logo", e.target.value)}
                                            placeholder="URL da logo ou faça upload"
                                        />
                                        <input
                                            type="file"
                                            ref={logoFileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="min-h-11 w-full gap-2 sm:w-auto"
                                            onClick={() => logoFileInputRef.current?.click()}
                                            disabled={isLogoUploading}
                                        >
                                            {isLogoUploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
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
                            <Label htmlFor="clinic-name">Nome da Clínica</Label>
                            <Input
                                id="clinic-name"
                                value={settings.clinic_name || "Núcleo Odontológico"}
                                onChange={(e) => handleUpdate("clinic_name", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="clinic-slogan">Subtítulo/Slogan</Label>
                            <Input
                                id="clinic-slogan"
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
                                <Label htmlFor="contact-whatsapp">WhatsApp (apenas números)</Label>
                                <Input
                                    id="contact-whatsapp"
                                    value={settings.contact_whatsapp || ""}
                                    onChange={(e) => handleUpdate("contact_whatsapp", e.target.value)}
                                    placeholder="Ex: 5531999999999"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact-instagram">Instagram (username)</Label>
                                <Input
                                    id="contact-instagram"
                                    value={settings.contact_instagram || ""}
                                    onChange={(e) => handleUpdate("contact_instagram", e.target.value)}
                                    placeholder="Ex: clinica.nucleo"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:sticky sm:bottom-0 bg-slate-50/80 backdrop-blur-sm p-4 border-t">
                    <Button
                        variant="default"
                        size="lg"
                        className="w-full gap-2 px-8 sm:w-auto"
                        onClick={saveSettings}
                        disabled={isSaving || isLogoUploading || isSignatureUploading}
                    >
                        {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {isSaving ? "Salvando..." : "Salvar Todas as Configurações"}
                    </Button>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSettings;
