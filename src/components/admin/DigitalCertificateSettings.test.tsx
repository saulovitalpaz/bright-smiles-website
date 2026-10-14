import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DigitalCertificateSettings from './DigitalCertificateSettings';
import { digitalRequest, DigitalRequestError } from '@/lib/digital-prescriptions';
const active = { available: true, certificate: { subjectName: 'Profissional', cpfMasked: '***.***.***-00', issuer: 'Emissor', validFrom: '2020-01-01', validUntil: '2099-01-01', fingerprint: 'public-fingerprint', checkedAt: '2026-10-13T12:00:00Z', ready: true, status: 'ACTIVE' } };
vi.mock('@/lib/digital-prescriptions', async () => ({ ...(await vi.importActual<typeof import('@/lib/digital-prescriptions')>('@/lib/digital-prescriptions')), digitalRequest: vi.fn() }));
describe('certificate error focus', () => {
  beforeEach(() => vi.mocked(digitalRequest).mockReset());
  it('preserves focus in another settings field when the background certificate lookup fails', async () => {
    let reject!: (reason: Error) => void;
    vi.mocked(digitalRequest).mockImplementationOnce(() => new Promise((_, rejectPromise) => { reject = rejectPromise; }));
    render(<><label htmlFor="external-name">Nome profissional externo</label><input id="external-name" /><DigitalCertificateSettings /></>);
    const input = screen.getByLabelText('Nome profissional externo');
    await userEvent.click(input);
    await act(async () => { reject(new Error('network')); });
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível consultar o certificado.');
    expect(input).toHaveFocus();
    await userEvent.keyboard('Profissional completo');
    expect(input).toHaveValue('Profissional completo');
  });
  it('focuses the summary when the user submits missing required fields', async () => {
    vi.mocked(digitalRequest).mockResolvedValueOnce({ available: true, certificate: null });
    render(<DigitalCertificateSettings />);
    await screen.findByText('Cadastre um certificado válido para emitir.');
    await userEvent.click(screen.getByRole('button', { name: 'Verificar e ativar certificado' }));
    expect(screen.getByRole('alert')).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent('Preencha os campos obrigatórios.');
  });
  it('keeps a persisted active certificate summary without password fields until replacement is chosen', async () => {
    vi.mocked(digitalRequest).mockResolvedValue(active);
    render(<DigitalCertificateSettings />);
    await screen.findByText('Verificado e ativo');
    expect(screen.getByText('Última verificação')).toBeInTheDocument();
    expect(screen.queryByLabelText('Senha do certificado')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Substituir certificado' }));
    expect(screen.getByLabelText('Senha do certificado')).toBeInTheDocument();
  });
  it('verifies and activates the uploaded certificate automatically and clears credentials', async () => {
    vi.mocked(digitalRequest).mockResolvedValueOnce({ available: true, certificate: null }).mockResolvedValueOnce(active);
    render(<DigitalCertificateSettings />);
    await screen.findByText('Cadastre um certificado válido para emitir.');
    await userEvent.upload(screen.getByLabelText('Arquivo do certificado (.pfx ou .p12)'), new File(['test'], 'certificate.pfx'));
    expect(screen.queryByLabelText('CPF do titular do certificado')).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Senha do certificado'), 'example-cert-password');
    await userEvent.type(screen.getByLabelText('Senha de acesso ao sistema'), 'example-account-password');
    await userEvent.click(screen.getByRole('button', { name: 'Verificar e ativar certificado' }));
    await screen.findByText('Verificado e ativo');
    expect(vi.mocked(digitalRequest).mock.calls[1][1]?.method).toBe('POST');
    await userEvent.click(screen.getByRole('button', { name: 'Substituir certificado' }));
    expect(screen.getByLabelText('Senha do certificado')).toHaveValue('');
    expect(screen.getByLabelText('Arquivo do certificado (.pfx ou .p12)')).toHaveValue('');
    const body = vi.mocked(digitalRequest).mock.calls[1][1]?.body as FormData;
    expect(body.has('cpf')).toBe(false);
  });
  it('refreshes suspension on window focus and offers replacement without moving focus', async () => {
    vi.mocked(digitalRequest).mockResolvedValueOnce(active).mockResolvedValueOnce({ ...active, certificate: { ...active.certificate, status: 'SUSPENDED', ready: false } });
    render(<><input aria-label="Other field" /><DigitalCertificateSettings /></>);
    await screen.findByText('Verificado e ativo');
    await userEvent.click(screen.getByLabelText('Other field'));
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    await screen.findByText('Certificado suspenso. Substitua o certificado para voltar a assinar.');
    expect(screen.getByLabelText('Other field')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Substituir certificado' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Senha do certificado')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Suspender certificado' })).not.toBeInTheDocument();
  });
  it('requires confirmation and account password to suspend', async () => {
    vi.mocked(digitalRequest).mockResolvedValueOnce(active).mockResolvedValueOnce({ ...active, certificate: { ...active.certificate, status: 'SUSPENDED', ready: false } });
    render(<DigitalCertificateSettings />);
    await screen.findByText('Verificado e ativo');
    await userEvent.click(screen.getByRole('button', { name: 'Suspender certificado' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(digitalRequest).toHaveBeenCalledTimes(1);
    await userEvent.type(screen.getByLabelText('Senha de acesso ao sistema'), 'example-password');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar suspensão' }));
    await waitFor(() => expect(digitalRequest).toHaveBeenCalledWith('/digital-signatures/certificate/suspend', { method: 'POST', body: JSON.stringify({ accountPassword: 'example-password' }) }));
    await screen.findByText('Certificado suspenso. Substitua o certificado para voltar a assinar.');
  });
  it('rechecks a saved certificate after temporary verification failure without requesting the file or password', async () => {
    let resolve!: (value: unknown) => void;
    vi.mocked(digitalRequest).mockResolvedValueOnce({ ...active, certificate: { ...active.certificate, status: 'VERIFICATION_UNAVAILABLE', ready: false } }).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    render(<DigitalCertificateSettings />);
    await screen.findByText('Verificação temporariamente indisponível. Tente novamente em instantes.');
    expect(screen.queryByLabelText('Senha do certificado')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Suspender certificado' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Verificar novamente' }));
    expect(screen.getByRole('button', { name: 'Verificando…' })).toBeDisabled();
    expect(digitalRequest).toHaveBeenCalledWith('/digital-signatures/certificate/verify', { method: 'POST', body: '{}' });
    await act(async () => { resolve(active); });
    await screen.findByText('Verificado e ativo');
  });
  it('keeps recovery available and focuses explicit retry errors without claiming revocation', async () => {
    vi.mocked(digitalRequest).mockResolvedValueOnce({ ...active, certificate: { ...active.certificate, status: 'VERIFICATION_UNAVAILABLE', ready: false } }).mockRejectedValueOnce(new Error('network'));
    render(<DigitalCertificateSettings />);
    await screen.findByText('Verificação temporariamente indisponível. Tente novamente em instantes.');
    await userEvent.click(screen.getByRole('button', { name: 'Verificar novamente' }));
    expect(await screen.findByRole('alert')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Verificar novamente' })).toBeEnabled();
    expect(screen.queryByText(/Certificado revogado/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Substituir certificado' }));
    expect(screen.getByLabelText('Senha do certificado')).toBeInTheDocument();
  });

  it('retains the selected file and explicit error across focus refresh but clears both passwords', async () => {
    const initial = { available: true, certificate: null, professional: { name: 'Profissional', cro: 'CRO fixture', username: 'fixture' } };
    vi.mocked(digitalRequest).mockResolvedValueOnce(initial).mockRejectedValueOnce(new DigitalRequestError('Certificado ou senha inválidos. Confira o arquivo A1 e sua senha.')).mockResolvedValue(initial);
    render(<DigitalCertificateSettings />);
    await screen.findByText('Cadastre um certificado válido para emitir.');
    const input = screen.getByLabelText('Arquivo do certificado (.pfx ou .p12)') as HTMLInputElement;
    const certificate = new File(['fixture'], 'certificate.pfx');
    await userEvent.upload(input, certificate);
    await userEvent.type(screen.getByLabelText('Senha do certificado'), 'synthetic-cert');
    await userEvent.type(screen.getByLabelText('Senha de acesso ao sistema'), 'synthetic-account');
    await userEvent.click(screen.getByRole('button', { name: 'Verificar e ativar certificado' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Certificado ou senha inválidos.');
    expect(input.files?.[0]).toBe(certificate);
    expect(screen.getByLabelText('Senha do certificado')).toHaveValue('');
    expect(screen.getByLabelText('Senha de acesso ao sistema')).toHaveValue('');
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    expect(screen.getByRole('alert')).toHaveTextContent('Certificado ou senha inválidos.');
    expect(screen.getByLabelText('Usuário conectado')).toHaveValue('fixture');
    await userEvent.click(screen.getByRole('button', { name: 'Limpar campos' }));
    expect(input.files).toHaveLength(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('requests saving edited professional identity before certificate upload', async () => {
    vi.mocked(digitalRequest).mockResolvedValueOnce({ available: true, certificate: null, professional: { name: 'Old name', cro: 'CRO fixture', username: 'fixture' } });
    render(<DigitalCertificateSettings professionalDraft={{ name: 'New name', cro: 'CRO fixture' }} />);
    await screen.findByText('Cadastre um certificado válido para emitir.');
    await userEvent.click(screen.getByRole('button', { name: 'Verificar e ativar certificado' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Salve os dados profissionais acima antes de cadastrar o certificado.');
    expect(digitalRequest).toHaveBeenCalledTimes(1);
  });

  it('offers lookup recovery when focus refresh fails after an explicit form error', async () => {
    vi.mocked(digitalRequest).mockResolvedValueOnce({ available: true, certificate: null }).mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ available: true, certificate: null });
    render(<DigitalCertificateSettings />);
    await screen.findByText('Cadastre um certificado válido para emitir.');
    await userEvent.click(screen.getByRole('button', { name: 'Verificar e ativar certificado' }));
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    expect(screen.getByRole('alert')).toHaveTextContent('Preencha os campos obrigatórios.');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar consultar novamente' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Verificar e ativar certificado' })).toBeEnabled());
    expect(screen.getByRole('alert')).toHaveTextContent('Preencha os campos obrigatórios.');
  });
});
