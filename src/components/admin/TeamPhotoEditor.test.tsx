import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { fetchClient } from '@/lib/api';
import TeamPhotoEditor from './TeamPhotoEditor';

vi.mock('@/lib/api', () => ({ API_URL: 'https://api.example.test', fetchClient: vi.fn() }));

it('uploads only the file to the current-user endpoint and confirms publication', async () => {
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: vi.fn() }));
    vi.mocked(fetchClient).mockImplementation(async (_path, options) => ({ ok: true, status: 200, json: async () => ({ member: 'ana-karolina', photo: options?.method === 'PUT' ? 'bucket://public/test/new.png' : null }) }) as Response);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><TeamPhotoEditor /></QueryClientProvider>);
    const input = await screen.findByLabelText('Escolher nova foto');
    await userEvent.upload(input, new File(['test image'], 'portrait.png', { type: 'image/png' }));
    await userEvent.click(screen.getByRole('button', { name: 'Publicar minha foto' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Foto publicada');
    const call = vi.mocked(fetchClient).mock.calls.find(([, options]) => options?.method === 'PUT')!;
    expect(call[0]).toBe('/team/photo/me');
    expect(Array.from((call[1]!.body as FormData).keys())).toEqual(['file']);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Publicar minha foto' })).toBeDisabled());
    client.clear(); vi.unstubAllGlobals();
});
