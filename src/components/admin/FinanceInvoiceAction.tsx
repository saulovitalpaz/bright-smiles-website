import { useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchClient } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { hasInvoiceDocument } from "@/lib/financeInvoices";
import { toast } from "sonner";

interface Props {
    transaction: { id: number; type: string; paymentStatus?: string | null; nfeUrl?: string | null };
    onSaved: (id: number, reference: string) => void;
}

export function FinanceInvoiceAction({ transaction, onSaved }: Props) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const attached = hasInvoiceDocument(transaction.nfeUrl);

    const changeOpen = (value: boolean) => {
        if (busy) return;
        setOpen(value);
        setFile(null);
        setError("");
    };

    const save = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!file || busy) return;
        if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 25 * 1024 * 1024 || file.size === 0) {
            setError("Selecione um PDF ou imagem JPEG, PNG ou WebP de até 25 MB.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const body = new FormData();
            body.append("transactionId", String(transaction.id));
            body.append("file", file);
            const response = await fetchClient("/finance/nfe", { method: "POST", body });
            const result = await response.json().catch(() => null);
            if (!response.ok) {
                setError(response.status === 400 || response.status === 404 || response.status === 409
                    ? result?.error || "Não foi possível anexar a nota. Confira o arquivo e tente novamente."
                    : "Não foi possível anexar a nota fiscal. Tente novamente.");
                return;
            }
            if (!hasInvoiceDocument(result?.nfeUrl)) throw new Error("Invalid document response");
            onSaved(transaction.id, result.nfeUrl);
            setOpen(false);
            setFile(null);
            toast.success("Nota fiscal anexada à receita.");
        } catch {
            setError("Não foi possível enviar a nota fiscal. Verifique a conexão e tente novamente.");
        } finally {
            setBusy(false);
        }
    };

    if (transaction.type !== "income" || transaction.paymentStatus === "voided") return null;

    return <div className="no-print flex flex-wrap items-center gap-2 normal-case tracking-normal">
        {attached && <a href={mediaUrl(transaction.nfeUrl) || undefined} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"><FileText size={14} /> Ver nota</a>}
        <Button type="button" variant="ghost" size="sm" className="h-11 px-2 text-xs font-semibold" onClick={() => changeOpen(true)}><Upload size={14} className="mr-1" />{attached ? "Substituir nota" : "Anexar nota"}</Button>
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl">
                <DialogHeader>
                    <DialogTitle>{attached ? "Substituir nota fiscal" : "Anexar nota fiscal"}</DialogTitle>
                    <DialogDescription>Vincule a esta receita uma nota já emitida. O anexo não emite nem valida a nota junto ao órgão fiscal.</DialogDescription>
                </DialogHeader>
                <form onSubmit={save} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={`invoice-file-${transaction.id}`}>Documento da nota fiscal</Label>
                        <Input id={`invoice-file-${transaction.id}`} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => { setFile(event.target.files?.[0] || null); setError(""); }} />
                        <p className="text-xs text-muted-foreground">PDF, JPEG, PNG ou WebP · até 25 MB. Acesso restrito à equipe financeira.</p>
                    </div>
                    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="outline" disabled={busy} onClick={() => changeOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={!file || busy}>{busy && <Loader2 size={16} className="mr-2 animate-spin" />}{busy ? "Enviando…" : "Salvar nota"}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    </div>;
}
