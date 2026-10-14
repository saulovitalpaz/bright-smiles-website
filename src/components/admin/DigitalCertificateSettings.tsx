import { useEffect, useRef, useState } from 'react';
import { certificateReady, digitalRequest, DigitalRequestError, type CertificateStatus } from '@/lib/digital-prescriptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const date = (value: string, time = false) => new Date(value).toLocaleString('pt-BR', time ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' });
function statusMessage(status: CertificateStatus | null) {
  if (!status) return 'Consultando disponibilidade…';
  const certificate = status.certificate;
  if (certificate?.status === 'SUSPENDED') return 'Certificado suspenso. Substitua o certificado para voltar a assinar.';
  if (certificate?.status === 'REVOKED') return 'Certificado revogado. Substitua por um certificado válido.';
  if (certificate?.status === 'EXPIRED' || (certificate && Date.parse(certificate.validUntil) <= Date.now())) return 'Certificado vencido. Substitua por um certificado válido.';
  if (certificate?.status === 'VERIFICATION_UNAVAILABLE') return 'Verificação temporariamente indisponível. Tente novamente em instantes.';
  if (!status.available) return 'Assinatura digital indisponível neste ambiente.';
  return certificateReady(status) ? 'Verificado e ativo' : 'Cadastre um certificado válido para emitir.';
}
export default function DigitalCertificateSettings({ professionalDraft }: { professionalDraft?: { name: string; cro: string } }) {
  const [status, setStatus] = useState<CertificateStatus | null>(null);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [error, setError] = useState('');
  const [errorOrigin, setErrorOrigin] = useState<'background' | 'submit'>('background');
  const [errorAttempt, setErrorAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [password, setPassword] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const guard = useRef(false);
  const generation = useRef(0);
  const submittedError = useRef(false);
  const errorSummary = useRef<HTMLParagraphElement>(null);
  const dialogError = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (error && errorOrigin === 'submit') (suspending ? dialogError : errorSummary).current?.focus(); }, [error, errorOrigin, errorAttempt, suspending]);
  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      if (guard.current) return;
      const attempt = ++generation.current;
      try {
        const current = await digitalRequest<CertificateStatus>('/digital-signatures/certificate');
        if (mounted && attempt === generation.current) { setStatus(current); setLookupFailed(false); if (!submittedError.current) { setErrorOrigin('background'); setError(''); } }
      } catch {
        if (mounted && attempt === generation.current) { setStatus(null); setLookupFailed(true); if (!submittedError.current) { setErrorOrigin('background'); setError('Não foi possível consultar o certificado.'); } }
      }
    };
    void refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('digital-certificate-updated', refresh);
    return () => { mounted = false; window.removeEventListener('focus', refresh); window.removeEventListener('digital-certificate-updated', refresh); };
  }, []);
  const submitError = (message: string) => { submittedError.current = true; setErrorOrigin('submit'); setErrorAttempt(previous => previous + 1); setError(message); };
  const clearPasswords = () => { setPassword(''); setAccountPassword(''); setVisible(false); };
  const clear = () => { clearPasswords(); if (file.current) file.current.value = ''; submittedError.current = false; setError(''); };
  async function submit(suspend = false) {
    if (guard.current) return;
    if (!suspend && status?.professional && professionalDraft && (professionalDraft.name.trim() !== status.professional.name || professionalDraft.cro.trim() !== status.professional.cro)) { submitError('Salve os dados profissionais acima antes de cadastrar o certificado.'); return; }
    if (!suspend && status?.professional && !status.professional.cro.trim()) { submitError('Preencha e salve o CRO nos dados profissionais acima antes de cadastrar o certificado.'); return; }
    if (!accountPassword || (!suspend && (!file.current?.files?.[0] || !password))) { submitError('Preencha os campos obrigatórios.'); return; }
    const selected = file.current?.files?.[0];
    if (!suspend && (!selected || !/\.(pfx|p12)$/i.test(selected.name) || selected.size === 0 || selected.size > 1024 * 1024)) { submitError('Selecione um arquivo .pfx ou .p12 válido de até 1 MiB.'); return; }
    guard.current = true; ++generation.current; submittedError.current = false; setBusy(true); setError('');
    try {
      const body = new FormData();
      if (!suspend) { body.append('certificate', selected!); body.append('password', password); body.append('accountPassword', accountPassword); }
      const next = await digitalRequest<CertificateStatus>(`/digital-signatures/certificate${suspend ? '/suspend' : ''}`, { method: 'POST', body: suspend ? JSON.stringify({ accountPassword }) : body });
      setStatus(next); setReplacing(false); setSuspending(false);
      clear();
      window.dispatchEvent(new Event('digital-certificate-updated'));
    } catch (cause) { submitError(cause instanceof DigitalRequestError ? cause.message : 'Não foi possível atualizar o certificado. Confira o arquivo e as senhas e tente novamente.'); }
    finally { clearPasswords(); guard.current = false; setBusy(false); }
  }
  async function verifySaved() {
    if (guard.current) return;
    guard.current = true; ++generation.current; submittedError.current = false; setBusy(true); setError('');
    try {
      const next = await digitalRequest<CertificateStatus>('/digital-signatures/certificate/verify', { method: 'POST', body: '{}' });
      setStatus(next);
      window.dispatchEvent(new Event('digital-certificate-updated'));
    } catch (cause) { submitError(cause instanceof DigitalRequestError ? cause.message : 'A verificação do certificado está temporariamente indisponível. Tente novamente em instantes.'); }
    finally { clearPasswords(); guard.current = false; setBusy(false); }
  }
  const uploadVisible = !status?.certificate || replacing;
  const errorElement = (inDialog = false) => error && <p id={inDialog ? 'a1-dialog-error' : 'a1-error'} ref={inDialog ? dialogError : errorSummary} tabIndex={-1} role="alert" className="rounded-md text-sm text-destructive focus-visible:outline focus-visible:outline-2">{error}</p>;
  const accountField = (inDialog = false) => <div className="space-y-2"><Label htmlFor={inDialog ? 'a1-suspend-password' : 'a1-account-password'}>Senha de acesso ao sistema</Label><Input className="min-h-11" id={inDialog ? 'a1-suspend-password' : 'a1-account-password'} name="accountPassword" type={visible ? 'text' : 'password'} value={accountPassword} onChange={e => setAccountPassword(e.target.value)} autoComplete="current-password" disabled={busy} aria-invalid={!!error} aria-describedby={`${inDialog ? 'a1-suspend-help' : 'a1-account-help'}${error ? ` ${inDialog ? 'a1-dialog-error' : 'a1-error'}` : ''}`} /><p id={inDialog ? 'a1-suspend-help' : 'a1-account-help'} className="text-sm text-muted-foreground">Use a senha com que você entra neste painel{status?.professional?.username ? ` como ${status.professional.username}` : ''}.</p></div>;
  return <section className="space-y-4 rounded-lg border p-4" aria-labelledby="a1-heading">
    <h3 id="a1-heading" className="font-semibold">Certificado digital eCPF A1</h3>
    <p className="text-sm text-muted-foreground">Envie seu A1 para verificar a identidade, validade e confiança do certificado e ativar a assinatura digital de receitas simples.</p>
    <p className="text-sm text-muted-foreground">Certificado e senha ficam criptografados no servidor para futuras assinaturas. O certificado pode ser usado enquanto estiver ativo e válido, até ser suspenso ou substituído.</p>
    <p role="status" className="text-sm font-medium">{lookupFailed ? 'Não foi possível consultar a disponibilidade. Tente consultar novamente.' : statusMessage(status)}</p>
    {status?.certificate && <dl className="grid gap-2 break-words text-sm sm:grid-cols-2">
      <div><dt className="text-muted-foreground">Titular / CPF</dt><dd>{status.certificate.subjectName} · {status.certificate.cpfMasked}</dd></div>
      <div><dt className="text-muted-foreground">Emissor</dt><dd>{status.certificate.issuer}</dd></div>
      <div><dt className="text-muted-foreground">Validade</dt><dd>{date(status.certificate.validFrom)} a {date(status.certificate.validUntil)}</dd></div>
      <div><dt className="text-muted-foreground">Última verificação</dt><dd>{date(status.certificate.checkedAt, true)}</dd></div>
    </dl>}
    {!suspending && errorElement()}
    {lookupFailed && <Button variant="outline" className="min-h-11" disabled={busy} onClick={() => window.dispatchEvent(new Event('digital-certificate-updated'))}>Tentar consultar novamente</Button>}
    {uploadVisible && !suspending && <form className="space-y-4" onSubmit={event => { event.preventDefault(); void submit(); }}>
      <p className="text-sm text-muted-foreground">Arquivo .pfx ou .p12 de até 1 MiB. O CPF é lido e validado diretamente do certificado, sem preenchimento manual.</p>
      {status?.professional && <div className="space-y-2 rounded-md bg-muted p-3 text-sm">
        <p className="break-words">Profissional salvo: <strong>{status.professional.name || 'Nome não informado'}</strong> · {status.professional.cro || 'CRO não informado'}</p>
        <p>O certificado deve pertencer a esse profissional. Use o nome completo do titular nos dados profissionais acima.</p>
        <div className="space-y-1"><Label htmlFor="a1-username">Usuário conectado</Label><Input id="a1-username" name="username" autoComplete="username" value={status.professional.username} readOnly className="min-h-11" /></div>
      </div>}
      <div className="space-y-2"><Label htmlFor="a1-file">Arquivo do certificado (.pfx ou .p12)</Label><Input className="min-h-11" id="a1-file" name="certificate" type="file" accept=".pfx,.p12" ref={file} disabled={busy} aria-invalid={!!error} aria-describedby={error ? 'a1-error' : undefined} /></div>
      <div className="space-y-2"><Label htmlFor="a1-password">Senha do certificado</Label><Input className="min-h-11" id="a1-password" name="certificatePassword" type={visible ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="off" disabled={busy} aria-invalid={!!error} aria-describedby={`a1-certificate-help${error ? ' a1-error' : ''}`} /><p id="a1-certificate-help" className="text-sm text-muted-foreground">Informe a senha que protege o arquivo .pfx/.p12, definida na emissão ou exportação do certificado.</p></div>
      {accountField()}
      <div className="flex flex-wrap gap-2"><Button type="button" className="min-h-11" variant="outline" onClick={() => setVisible(!visible)} aria-pressed={visible} disabled={busy}>{visible ? 'Ocultar senhas' : 'Mostrar senhas'}</Button><Button type="submit" className="min-h-11" disabled={busy || !status?.available}>{busy ? 'Verificando…' : 'Verificar e ativar certificado'}</Button><Button type="button" className="min-h-11" variant="outline" onClick={clear} disabled={busy}>Limpar campos</Button>{replacing && <Button type="button" variant="outline" className="min-h-11" disabled={busy} onClick={() => { clear(); setReplacing(false); setError(''); }}>Cancelar substituição</Button>}</div>
    </form>}
    {status?.certificate && !replacing && <div className="flex flex-wrap gap-2">
      {status.certificate.status === 'VERIFICATION_UNAVAILABLE' && <Button className="min-h-11" disabled={busy} onClick={() => void verifySaved()}>{busy ? 'Verificando…' : 'Verificar novamente'}</Button>}
      <Button className="min-h-11" variant="outline" disabled={busy} onClick={() => { clear(); setReplacing(true); setError(''); }}>Substituir certificado</Button>
      {status.certificate.status !== 'SUSPENDED' && <Button className="min-h-11" variant="destructive" disabled={busy} onClick={() => { clear(); setError(''); setSuspending(true); }}>Suspender certificado</Button>}
    </div>}
    <Dialog open={suspending} onOpenChange={open => { if (!busy) { setSuspending(open); clear(); setError(''); } }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto overscroll-contain"><DialogTitle>Suspender certificado</DialogTitle><DialogDescription>Novas assinaturas ficarão bloqueadas. O certificado permanece protegido no servidor; receitas já assinadas continuam disponíveis. Confirme sua senha de acesso para suspender.</DialogDescription>
        <form className="space-y-4" onSubmit={event => { event.preventDefault(); void submit(true); }}>{errorElement(true)}{accountField(true)}<div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="min-h-11" disabled={busy} onClick={() => { setSuspending(false); clear(); setError(''); }}>Cancelar</Button><Button type="submit" variant="destructive" className="min-h-11" disabled={busy}>{busy ? 'Suspendendo…' : 'Confirmar suspensão'}</Button></div></form>
      </DialogContent>
    </Dialog>
  </section>;
}
