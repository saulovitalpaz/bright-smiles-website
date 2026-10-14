import { useRef, useState } from 'react';
import { digitalRequest } from '@/lib/digital-prescriptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
type Result = { status: 'VALID' | 'INVALID' | 'INDETERMINATE'; signers: { name: string; cpfMasked: string; issuer: string; status: string; reasons: string[] }[] };
export default function ValidatePrescriptionPdf() {
  const file = useRef<HTMLInputElement>(null);
  const guard = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  async function validate() {
    const pdf = file.current?.files?.[0];
    if (!pdf || guard.current) return;
    guard.current = true; setBusy(true); setError(''); setResult(null);
    try { const body = new FormData(); body.append('file', pdf); setResult(await digitalRequest<Result>('/prescription-validation/pdf', { method: 'POST', body })); }
    catch { setError('Não foi possível validar este arquivo PDF.'); }
    finally { if (file.current) file.current.value = ''; guard.current = false; setBusy(false); }
  }
  return <section className="space-y-3 rounded-lg border p-4"><h3 className="font-semibold">Validar assinatura de um PDF</h3><Label htmlFor="validate-pdf">Documento PDF</Label><Input className="min-h-11" id="validate-pdf" name="file" type="file" accept="application/pdf,.pdf" ref={file} disabled={busy} /><Button className="min-h-11" disabled={busy} onClick={() => void validate()}>{busy ? 'Validando…' : 'Validar PDF'}</Button>{error && <p role="alert" className="text-destructive">{error}</p>}<div role="status" aria-live="polite">{result && <><p>{result.status === 'VALID' ? 'Assinatura válida' : result.status === 'INVALID' ? 'Assinatura inválida' : 'Validação indeterminada'}</p>{result.signers.map((signer, i) => <div key={i} className="mt-2 text-sm"><p>{signer.name} · {signer.cpfMasked} · {signer.issuer}</p><p>{signer.status}</p>{signer.reasons?.map((reason, j) => <p key={j}>{reason}</p>)}</div>)}</>}</div></section>;
}
