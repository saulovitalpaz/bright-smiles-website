import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ValidatePrescription from './ValidatePrescription';

const token = 'synthetic-validation-token';
const valid = { status: 'VALID', professionalName: 'Profissional de teste', professionalCro: 'CRO teste', fileAvailable: true };
const start = () => { window.history.replaceState(null, '', '/validar-receita#token=' + token); return render(<MemoryRouter><ValidatePrescription /></MemoryRouter>); };
describe('public prescription validation', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/'); });
  it('removes the fragment before sending the token, omits credentials and clears the field', async () => {
    const fetch = vi.fn().mockImplementation(async () => {
      expect(window.location.hash).toBe('');
      return { ok: true, json: async () => valid };
    });
    vi.stubGlobal('fetch', fetch); start();
    expect(await screen.findByText('Emissão registrada')).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch.mock.calls[0][1]).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer', body: JSON.stringify({ token }) });
    expect(screen.getByLabelText('Token de verificação')).toHaveValue('');
  });
  it('opens the canonical PDF only on request and revokes its URL when the token changes', async () => {
    const create = vi.fn(() => 'blob:synthetic-pdf'); const revoke = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke }));
    const pdf = new Blob(['%PDF-synthetic'], { type: 'application/pdf' });
    const fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => valid }).mockResolvedValueOnce({ ok: true, headers: new Headers({ 'Content-Type': 'application/pdf' }), blob: async () => pdf });
    vi.stubGlobal('fetch', fetch); const view = start();
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir PDF assinado' }));
    expect(await screen.findByTitle('PDF assinado')).toHaveAttribute('src', 'blob:synthetic-pdf#view=FitH&navpanes=0');
    expect(fetch.mock.calls[1][0]).toEqual(expect.stringContaining('/prescription-validation/file'));
    expect(fetch.mock.calls[1][1]).toMatchObject({ method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', body: JSON.stringify({ token }) });
    expect(screen.getByRole('link', { name: 'Baixar PDF assinado' })).toHaveAttribute('download', 'receita-assinada.pdf');
    expect(create).toHaveBeenCalledWith(pdf);
    fireEvent.change(screen.getByLabelText('Token de verificação'), { target: { value: 'another-token' } });
    expect(screen.queryByTitle('PDF assinado')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Abrir PDF assinado' })).not.toBeInTheDocument();
    expect(revoke).toHaveBeenCalledWith('blob:synthetic-pdf');
    view.unmount();
  });
  it('does not offer document access for an invalid token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'INVALID' }) })); start();
    await screen.findByText('Documento inválido');
    expect(screen.queryByRole('button', { name: 'Abrir PDF assinado' })).not.toBeInTheDocument();
  });
  it('shows a retryable file error without displaying unverified content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, json: async () => valid }).mockResolvedValueOnce({ ok: false, status: 409 })); start();
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir PDF assinado' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível abrir o PDF assinado');
    expect(screen.queryByTitle('PDF assinado')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir PDF assinado' })).toBeEnabled();
  });
});
