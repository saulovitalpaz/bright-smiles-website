import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/api";
import { toast } from "sonner";

interface LeadCaptureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    triggerLabel?: string;
    defaultMessage?: string;
}

export function LeadCaptureDialog({ open, onOpenChange, defaultMessage = "Olá, gostaria de agendar uma consulta." }: LeadCaptureDialogProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [ageGroup, setAgeGroup] = useState("");
    const [treatment, setTreatment] = useState("");
    const [message, setMessage] = useState(defaultMessage);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Get source from URL if present
            const urlParams = new URLSearchParams(window.location.search);
            const source = urlParams.get('utm_source') || 'Direct/Website';

            // 1. Save to DB
            const res = await fetch(`${API_URL}/leads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    phone,
                    email,
                    ageGroup,
                    treatment,
                    message,
                    source
                })
            });

            if (!res.ok) throw new Error("Falha ao salvar lead");

            toast.success("Solicitação enviada com sucesso!");
            setSubmitted(true);

            // Auto close after 3 seconds
            setTimeout(() => {
                onOpenChange(false);
                // Reset after closing animation
                setTimeout(() => {
                    setSubmitted(false);
                    setName("");
                    setPhone("");
                    setEmail("");
                    setAgeGroup("");
                    setTreatment("");
                }, 300);
            }, 3000);

        } catch (error) {
            console.error(error);
            toast.error("Erro ao processar solicitação. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
                {!submitted ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Solicitar Agendamento</DialogTitle>
                            <DialogDescription>
                                Preencha seus dados para uma experiência personalizada.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome Completo *</Label>
                                    <Input id="name" required value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                                    <Input id="phone" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="(33) 99999-9999" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Faixa Etária</Label>
                                    <Select onValueChange={setAgeGroup} value={ageGroup}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="KIDS">Infantil (Kids)</SelectItem>
                                            <SelectItem value="TEEN">Adolescente</SelectItem>
                                            <SelectItem value="ADULT">Adulto</SelectItem>
                                            <SelectItem value="SENIOR">Melhor Idade</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tratamento de Interesse</Label>
                                    <Select onValueChange={setTreatment} value={treatment}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ODONTO_GERAL">Odontologia Geral</SelectItem>
                                            <SelectItem value="HARMONIZACAO">Harmonização Facial</SelectItem>
                                            <SelectItem value="ORTODONTIA">Aparelhos / Ortodontia</SelectItem>
                                            <SelectItem value="IMPLANTES">Implantes</SelectItem>
                                            <SelectItem value="ESTETICA">Estética Dental</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Mensagem ou Dúvida</Label>
                                <Textarea id="message" value={message} onChange={e => setMessage(e.target.value)} />
                            </div>
                            <Button type="submit" className="w-full gap-2 bg-primary hover:bg-primary/90 text-white h-12 text-lg font-bold" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : <MessageCircle size={18} />}
                                Solicitar Atendimento
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="py-12 flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <MessageCircle size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Solicitação Enviada!</h3>
                            <p className="text-slate-500 mt-2">Obrigado, {name.split(' ')[0]}.<br />Nossa equipe entrará em contato em breve.</p>
                        </div>
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
