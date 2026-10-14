import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDigitalPrescription } from './useDigitalPrescription';
import { digitalRequest, ReauthenticationRequired } from '@/lib/digital-prescriptions';
vi.mock('@/lib/digital-prescriptions', async () => ({ ...(await vi.importActual<typeof import('@/lib/digital-prescriptions')>('@/lib/digital-prescriptions')), digitalRequest: vi.fn() }));
const issued = { prescription: { id: 1, date: '', content: 'teste', patientId: 1 }, document: { id: 'doc', hash: 'hash', signatureStatus: 'VALID' as const, signedAt: '', verificationUrl: '', token: '', fileUrl: '' } };
describe('digital issuance lifecycle', () => {
  beforeEach(() => vi.mocked(digitalRequest).mockReset());
  it('does not emit on mount and reuses the issued file for subsequent actions', async () => {
    vi.mocked(digitalRequest).mockResolvedValue(issued);
    const expectedPatient = { name: 'Paciente sintético', cpf: '00000000000' };
    const { result } = renderHook(() => useDigitalPrescription(1, 'teste', 'patient', expectedPatient));
    expect(digitalRequest).not.toHaveBeenCalled();
    await act(async () => { await result.current.issue(); });
    await act(async () => { await result.current.issue(); });
    expect(digitalRequest).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(vi.mocked(digitalRequest).mock.calls[0][1]?.body)).expectedPatient).toEqual(expectedPatient);
    expect(result.current.result?.document.id).toBe('doc');
  });
  it('guards concurrent clicks synchronously and retains requestId after an ambiguous failure', async () => {
    let reject!: (reason: Error) => void;
    vi.mocked(digitalRequest).mockImplementationOnce(() => new Promise((_, rejectPromise) => { reject = rejectPromise; }));
    const { result } = renderHook(() => useDigitalPrescription(1, 'teste', 'patient'));
    let first!: Promise<unknown>;
    act(() => { first = result.current.issue(); expect(result.current.issue()).toBe(first); });
    await act(async () => { reject(new Error('network')); await first.catch(() => {}); });
    const initial = JSON.parse(String(vi.mocked(digitalRequest).mock.calls[0][1]?.body));
    vi.mocked(digitalRequest).mockResolvedValueOnce(issued);
    await act(async () => { await result.current.issue(); });
    const retry = JSON.parse(String(vi.mocked(digitalRequest).mock.calls[1][1]?.body));
    expect(retry.requestId).toBe(initial.requestId);
  });
  it('invalidates result and requestId after edits and supports password confirmation', async () => {
    vi.mocked(digitalRequest).mockRejectedValueOnce(new ReauthenticationRequired('Confirmar senha'));
    const { result, rerender } = renderHook(({ content }) => useDigitalPrescription(1, content, 'patient'), { initialProps: { content: 'teste' } });
    await act(async () => { await result.current.issue().catch(() => {}); });
    expect(result.current.reauthRequired).toBe(true);
    const first = JSON.parse(String(vi.mocked(digitalRequest).mock.calls[0][1]?.body));
    vi.mocked(digitalRequest).mockResolvedValue(issued);
    await act(async () => { await result.current.issue('synthetic-password'); });
    expect(JSON.parse(String(vi.mocked(digitalRequest).mock.calls[1][1]?.body)).requestId).toBe(first.requestId);
    rerender({ content: 'edited' });
    expect(result.current.result).toBeNull();
    await act(async () => { await result.current.issue(); });
    expect(JSON.parse(String(vi.mocked(digitalRequest).mock.calls[2][1]?.body)).requestId).not.toBe(first.requestId);
  });
});
