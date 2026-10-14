import { useEffect, useRef, useState } from 'react';
import { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

type Validation = { status: 'VALID' | 'INVALID' | 'INDETERMINATE'; professionalName?: string; professionalCro?: string; signedAt?: string; hash?: string };
export default function ValidatePrescription() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<Validation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const guard = useRef(false);
  const initial = useRef(false);
  async function validate(value: string) {
    if (guard.current || !value.trim()) return;
    guard.current = true; setBusy(true); setError(''); setResult(null);
    try {
      const response = await fetch(`${API_URL}/prescription-validation/token`, { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: value.trim() }), referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error();
      setResult(await response.json());
    } catch { setError('Não foi possível verificar. Confira o token e tente novamente.'); }
    finally { setToken(''); setBusy(false); guard.current = false; }
  }
  useEffect(() => {
    if (initial.current) return;
    initial.current = true;
    const value = new URLSearchParams(window.location.hash.slice(1)).get('token');
    window.history.replaceState(null, '', window.location.pathname);
    if (value) void validate(value);
  }, []);
  return <main className="mx-auto max-w-xl space-y-5 px-5 py-12"><h1 className="text-2xl font-semibold">Validar receita digital</h1><p className="text-muted-foreground">Informe o token do documento para consultar sua autenticidade. Dados do paciente e conteúdo da receita não são exibidos.</p><form className="space-y-3" onSubmit={e => { e.preventDefault(); void validate(token); }}><Label htmlFor="validation-token">Token de verificação</Label><Input id="validation-token" name="token" className="min-h-11" autoComplete="off" spellCheck={false} value={token} onChange={e => setToken(e.target.value)} disabled={busy} /><Button className="min-h-11" disabled={busy || !token.trim()}>{busy ? 'Validando…' : 'Validar token'}</Button></form>{error && <p role="alert" className="text-destructive">{error}</p>}<div role="status" aria-live="polite">{busy && 'Consultando autenticidade…'}{result && <div className="space-y-2 rounded-lg border p-4"><p className="text-sm text-muted-foreground">Esta consulta confirma o registro de emissão. Compare o resumo com o PDF ou valide o arquivo com acesso profissional para verificar sua assinatura.</p><p className="font-semibold">{result.status === 'VALID' ? 'Emissão registrada' : result.status === 'INVALID' ? 'Documento inválido' : 'Validação indeterminada'}</p>{result.professionalName && <p>Profissional: {result.professionalName}</p>}{result.professionalCro && <p>CRO: {result.professionalCro}</p>}{result.signedAt && <p>Assinado em: {new Date(result.signedAt).toLocaleString('pt-BR')}</p>}{result.hash && <p className="break-all text-sm">Resumo do documento: {result.hash}</p>}</div>}</div><Link className="inline-flex min-h-11 items-center underline" to="/admin/settings">Validar um PDF com acesso profissional</Link></main>;
}
