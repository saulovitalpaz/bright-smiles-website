import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { fetchClient } from '@/lib/api';

interface ConsentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientName: string;
    patientCpf: string;
    onConsentSigned: () => void;
}

export const ConsentDialog = ({ open, onOpenChange, patientName, patientCpf, onConsentSigned }: ConsentDialogProps) => {
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSign = async () => {
        if (!accepted) return;
        setLoading(true);
        try {
            const res = await fetchClient(`/patients/${patientCpf}/consent`, {
                method: 'POST'
            });

            if (res.ok) {
                toast.success("Termo de consentimento registrado!");
                onConsentSigned();
                onOpenChange(false);
            } else {
                toast.error("Erro ao registrar consentimento.");
            }
        } catch (error) {
            toast.error("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Termo de Consentimento (LGPD)</DialogTitle>
                    <DialogDescription>
                        Para prosseguir com o tratamento de <strong>{patientName}</strong>, é necessário registrar o consentimento para uso de dados sensíveis.
                    </DialogDescription>
                </DialogHeader>

                <div className="h-40 overflow-y-auto border p-3 rounded-md text-xs text-slate-600 bg-slate-50 mb-4">
                    <p className="font-bold mb-2">TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS PESSOAIS</p>
                    <p className="mb-2">
                        Autorizo a clínica a realizar o tratamento dos meus dados pessoais e dados sensíveis de saúde para fins exclusivos de prestação de serviços odontológicos, agendamentos e contato via WhatsApp.
                    </p>
                    <p>
                        Estou ciente de que meus dados serão armazenados de forma segura e criptografada, e que posso revogar este consentimento a qualquer momento.
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox id="terms" checked={accepted} onCheckedChange={(c) => setAccepted(!!c)} />
                    <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        O paciente leu e aceitou os termos.
                    </label>
                </div>

                <DialogFooter className="sm:justify-end">
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="button" onClick={handleSign} disabled={!accepted || loading}>
                        {loading ? "Registrando..." : "Registrar Consentimento"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
