import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    const [message, setMessage] = useState(defaultMessage);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Save to DB
            const res = await fetch(`${API_URL}/leads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phone, message })
            });

            if (!res.ok) throw new Error("Falha ao salvar lead");

            // 2. Redirect to WA
            const whatsappNumber = "5533991219695"; // Configured number
            const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                `*Nova Solicitação pelo Site*\n\n*Nome:* ${name}\n*Telefone:* ${phone}\n*Mensagem:* ${message}`
            )}`;

            window.open(url, '_blank');
            toast.success("Solicitação enviada!");
            onOpenChange(false);
            setName("");
            setPhone("");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao processar solicitação. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Falar no WhatsApp</DialogTitle>
                    <DialogDescription>
                        Preencha seus dados para iniciarmos o atendimento com agilidade.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input id="name" required value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefone / WhatsApp</Label>
                        <Input id="phone" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="(33) 99999-9999" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">Mensagem (Opcional)</Label>
                        <Textarea id="message" value={message} onChange={e => setMessage(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <MessageCircle size={18} />}
                        Continuar para WhatsApp
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
