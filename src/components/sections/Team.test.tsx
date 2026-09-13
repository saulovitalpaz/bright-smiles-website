import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import Team from './Team';
import { fetchClient } from '@/lib/api';

vi.mock('@/lib/api', () => ({ API_URL: 'https://api.example.test', fetchClient: vi.fn() }));

it('displays the uploaded portrait and opens an accessible zoom dialog', async () => {
    vi.mocked(fetchClient).mockResolvedValue({ ok: true, json: async () => ({ 'ana-karolina': 'bucket://public/test/portrait.png' }) } as Response);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><Team /></QueryClientProvider>);
    const portrait = await screen.findByRole('img', { name: 'Dra. Ana Karolina Vital da Paz' });
    await vi.waitFor(() => expect(portrait.getAttribute('src')).toContain('portrait.png'));
    expect(portrait).toHaveClass('object-contain');
    expect(screen.getByRole('img', { name: 'Dra. Clara Lima de Souza' })).toHaveAttribute('src', '/images/profissionais/Clara Lima.jpg');
    await userEvent.click(screen.getByRole('button', { name: /Ampliar foto de Dra. Ana/ }));
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Dra. Ana Karolina Vital da Paz');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    client.clear();
});
