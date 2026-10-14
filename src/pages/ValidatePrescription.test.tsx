import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ValidatePrescription from './ValidatePrescription';
describe('public prescription validation', () => {
  afterEach(() => { vi.unstubAllGlobals(); window.history.replaceState(null, '', '/'); });
  it('removes the fragment before sending the token, omits session credentials and clears the field', async () => {
    window.history.replaceState(null, '', '/validar-receita#token=synthetic-validation-token');
    const fetch = vi.fn().mockImplementation(async () => {
      expect(window.location.hash).toBe('');
      return { ok: true, json: async () => ({ status: 'VALID', professionalName: 'Profissional de teste', professionalCro: 'CRO teste' }) };
    });
    vi.stubGlobal('fetch', fetch);
    render(<MemoryRouter><ValidatePrescription /></MemoryRouter>);
    expect(await screen.findByText('Emissão registrada')).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch.mock.calls[0][1]).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer', body: JSON.stringify({ token: 'synthetic-validation-token' }) });
    expect(screen.getByLabelText('Token de verificação')).toHaveValue('');
  });
});
