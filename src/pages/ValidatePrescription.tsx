import { useEffect, useRef, useState } from 'react';
import { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

type Validation = { status: 'VALID' | 'INVALID' | 'INDETERMINATE'; fileAvailable?: boolean; professionalName?: string; professionalCro?: string; signedAt?: string; hash?: string };
export default function ValidatePrescription() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<Validation | null>(null);
  const [busy, setBusy] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [error, setError] = useState('');
  const guard = useRef(false);
  const initial = useRef(false);
  const verifiedToken = useRef('');
  const objectUrl = useRef('');
  const fileRequest = useRef<AbortController | null>(null);

  function clearDocument() {
    verifiedToken.current = '';
    fileRequest.current?.abort();
    fileRequest.current = null;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = ''; setFileUrl(''); setFileBusy(false);
  }
  async function validate(value: string) {
    if (guard.current || !value.trim()) return;
    guard.current = true; clearDocument(); setBusy(true); setError(''); setResult(null);
    try {
      const response = await fetch(API_URL + '/prescription-validation/token', { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: value.trim() }), referrerPolicy: 'no-referrer', cache: 'no-store' });
      if (!response.ok) throw new Error();
      const validation: Validation = await response.json();
      if (validation.status === 'VALID' && validation.fileAvailable) verifiedToken.current = value.trim();
      setResult(validation);
    } catch { setError('Não foi possível verificar. Confira o token e tente novamente.'); }
    finally { setToken(''); setBusy(false); guard.current = false; }
  }
  async function openDocument() {
    if (!verifiedToken.current || fileRequest.current || objectUrl.current) return;
    const controller = new AbortController(); fileRequest.current = controller;
    setFileBusy(true); setError('');
    try {
      const response = await fetch(API_URL + '/prescription-validation/file', { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: verifiedToken.current }), referrerPolicy: 'no-referrer', cache: 'no-store', signal: controller.signal });
      if (!response.ok || response.headers.get('content-type')?.split(';')[0] !== 'application/pdf') throw new Error();
      const pdf = await response.blob();
      if (controller.signal.aborted) return;
      objectUrl.current = URL.createObjectURL(pdf); setFileUrl(objectUrl.current);
    } catch {
      if (!controller.signal.aborted) setError('Não foi possível abrir o PDF assinado. Tente novamente; se o problema persistir, contate o profissional emissor.');
    } finally {
      if (fileRequest.current === controller) { fileRequest.current = null; setFileBusy(false); }
    }
  }
  useEffect(() => {
    if (initial.current) return;
    initial.current = true;
    const value = new URLSearchParams(window.location.hash.slice(1)).get('token');
    window.history.replaceState(null, '', window.location.pathname);
    if (value) void validate(value);
  }, []);
  useEffect(() => () => {
    fileRequest.current?.abort();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  return <main className="mx-auto max-w-3xl space-y-5 px-5 py-12">
    <h1 className="text-2xl font-semibold">Validar receita digital</h1>
    <p className="text-muted-foreground">Informe o token para consultar a emissão e acessar o PDF assinado. O documento contém dados do paciente; compartilhe o token apenas com quem deve recebê-lo.</p>
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); void validate(token); }}>
      <Label htmlFor="validation-token">Token de verificação</Label>
      <Input id="validation-token" name="token" className="min-h-11" autoComplete="off" spellCheck={false} value={token} onChange={e => { clearDocument(); setResult(null); setError(''); setToken(e.target.value); }} disabled={busy} />
      <Button className="min-h-11" disabled={busy || !token.trim()}>{busy ? 'Validando…' : 'Validar token'}</Button>
    </form>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div role="status" aria-live="polite" aria-busy={busy || fileBusy}>
      {busy && 'Consultando autenticidade…'}
      {result && <div className="space-y-3 rounded-lg border p-4">
        <p className="font-semibold">{result.status === 'VALID' ? 'Emissão registrada' : result.status === 'INVALID' ? 'Documento inválido' : 'Validação indeterminada'}</p>
        {result.status === 'VALID' && <p className="text-sm text-muted-foreground">Esta consulta confirma o registro de emissão. O PDF disponibilizado é o original assinado, com integridade conferida ao abrir. A consulta por token não verifica a assinatura de outros arquivos recebidos.</p>}
        {result.professionalName && <p>Profissional: {result.professionalName}</p>}
        {result.professionalCro && <p>CRO: {result.professionalCro}</p>}
        {result.signedAt && <p>Assinado em: {new Date(result.signedAt).toLocaleString('pt-BR')}</p>}
        {result.hash && <p className="break-all text-sm">Resumo do documento (SHA-256): {result.hash}</p>}
        {result.status === 'VALID' && result.fileAvailable && !fileUrl && <Button type="button" className="min-h-11" disabled={fileBusy} onClick={() => void openDocument()}>{fileBusy ? 'Abrindo PDF…' : 'Abrir PDF assinado'}</Button>}
      </div>}
    </div>
    {fileUrl && <section className="space-y-3" aria-label="Documento assinado">
      <div className="flex flex-wrap gap-3">
        <Button asChild className="min-h-11"><a href={fileUrl} download="receita-assinada.pdf">Baixar PDF assinado</a></Button>
        <Button asChild variant="outline" className="min-h-11"><a href={fileUrl} target="_blank" rel="noopener noreferrer">Abrir em nova aba</a></Button>
      </div>
      <iframe title="PDF assinado" src={fileUrl + '#view=FitH&navpanes=0'} className="h-[70vh] min-h-96 w-full rounded-lg border" referrerPolicy="no-referrer" />
      <p className="text-sm text-muted-foreground">Se a visualização não aparecer no seu dispositivo, use “Baixar PDF assinado”. Para preservar a assinatura digital, compartilhe o arquivo baixado; salvar por impressão pode remover a assinatura.</p>
    </section>}
    <Link className="inline-flex min-h-11 items-center underline" to="/admin/settings">Validar um PDF com acesso profissional</Link>
  </main>;
}
