import { afterEach, describe, expect, it, vi } from 'vitest';
import { certificateReady, digitalRequest, DigitalRequestError } from './digital-prescriptions';
import type { CertificateStatus } from './digital-prescriptions';
describe('safe signing feedback', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('uses actionable known error codes and never reflects arbitrary server text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 422, json: async () => ({ code: 'CPF_MISMATCH', error: 'untrusted response' }) }).mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'private diagnostic' }) }));
    await expect(digitalRequest('/digital-signatures/certificate')).rejects.toThrow('O CPF informado não corresponde ao titular do certificado.');
    await expect(digitalRequest('/digital-signatures/certificate')).rejects.toThrow(new DigitalRequestError('Não foi possível concluir. Verifique os dados e tente novamente.'));
  });
  it('requires available runtime, backend readiness and future expiry', () => {
    const status = { available: true, certificate: { status: 'ACTIVE', ready: true, validFrom: '2000-01-01', validUntil: new Date(Date.now() + 60000).toISOString() } } as CertificateStatus;
    expect(certificateReady(status)).toBe(true);
    expect(certificateReady({ ...status, available: false })).toBe(false);
    expect(certificateReady({ ...status, certificate: { ...status.certificate!, validUntil: '2000-01-01' } })).toBe(false);
    expect(certificateReady({ ...status, certificate: { ...status.certificate!, status: 'SUSPENDED' } })).toBe(false);
    expect(certificateReady({ ...status, certificate: { ...status.certificate!, validFrom: '2099-01-01' } })).toBe(false);
  });
  it('explains patient snapshot mismatch and account password rejection without logging out', async () => {
    const initialPath = window.location.pathname;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ code: 'PATIENT_CHANGED' }) }).mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ code: 'ACCESS_PASSWORD_INVALID' }) }));
    await expect(digitalRequest('/prescriptions/digital-issue')).rejects.toThrow('Os dados do paciente mudaram. Atualize o cadastro e revise a receita.');
    await expect(digitalRequest('/prescriptions/digital-issue')).rejects.toThrow('Senha de acesso inválida. Confira a senha de acesso ao sistema e tente novamente.');
    expect(window.location.pathname).toBe(initialPath);
  });
});
