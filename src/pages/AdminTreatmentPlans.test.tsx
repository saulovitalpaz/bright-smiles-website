import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import AdminTreatmentPlans from './AdminTreatmentPlans';
import { fetchClient } from '@/lib/api';

vi.mock('@/components/admin/AdminLayout', () => ({ default: ({ children }: { children: ReactNode }) => <main className="admin-content">{children}</main> }));
vi.mock('@/components/admin/attendance/Odontogram', () => ({ default: () => <div>Odontograma da consulta de teste</div> }));
vi.mock('@/lib/api', () => ({ fetchClient: vi.fn() }));
const draft = {
  id: 1, patientId: 1, patient: { id: 1, name: 'Paciente fictício' }, createdAt: '2026-11-01T12:00:00Z', validUntil: '2099-01-01', status: 'awaiting_authorization',
  items: [
    { id: 1, name: 'Restauração teste', toothNumber: 17, pricingUnit: 'procedure', phase: 'mouth_adjustment', quantity: 1, unitPrice: 100, quotedTotal: 100, authorizedTotal: null, clinicalStatus: 'proposed' },
    { id: 2, name: 'Procedimento futuro', pricingUnit: 'procedure', phase: 'other', quantity: 2, unitPrice: 21.63, quotedTotal: 43.26, authorizedTotal: null, clinicalStatus: 'proposed' },
  ], payments: [], totals: { quoted: 143.26, authorized: 0, received: 0, balance: 0, discount: 0, byPhase: {} },
};
const updated = { ...draft, status: 'partially_authorized', items: [{ ...draft.items[0], authorizedTotal: 98.5, clinicalStatus: 'completed' }, draft.items[1]],
  payments: [{ id: 1, amount: 40, method: 'pix', receivedAt: '2026-11-01T12:00:00Z' }],
  totals: { ...draft.totals, authorized: 98.5, received: 40, balance: 58.5, discount: 1.5 },
};
afterEach(() => { vi.restoreAllMocks(); vi.mocked(fetchClient).mockReset(); });

it('refreshes the print snapshot and waits for the shared clinic logo before printing', async () => {
  let latest = draft;
  vi.mocked(fetchClient).mockImplementation(async path => ({ ok: true, json: async () => path === '/treatment-plans' ? [draft] : path === '/digital-signatures/clinic' ? { name: 'Clínica teste', address: 'Endereço teste', phone: 'Contato teste', cnpj: 'Cadastro teste' } : latest }) as Response);
  let frame: FrameRequestCallback;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { frame = callback; return 1; });
  const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
  render(<AdminTreatmentPlans />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Imprimir' })).toBeEnabled());
  await waitFor(() => expect(fetchClient).toHaveBeenCalledWith('/treatment-plans/1'));
  latest = updated;
  fireEvent.click(screen.getByRole('button', { name: 'Imprimir' }));
  const root = await waitFor(() => {
    const element = document.querySelector<HTMLElement>('[data-print-target="treatment-plan"]');
    expect(element).not.toBeNull(); return element!;
  });
  expect(root.parentElement).toHaveClass('admin-content');
  const documentView = within(root);
  expect(documentView.getByText('Endereço teste')).toBeInTheDocument();
  expect(documentView.getByText('CNPJ: Cadastro teste')).toBeInTheDocument();
  expect(documentView.getByText('Concluído')).toBeInTheDocument();
  expect(documentView.getByText('Não autorizado · proposto')).toBeInTheDocument();
  expect(documentView.getByText('Pix')).toBeInTheDocument();
  expect(documentView.getByText('R$ 58,50')).toBeInTheDocument();
  expect(documentView.getByText('R$ 1,50')).toBeInTheDocument();
  expect(root).toHaveTextContent('Pagamento parcial');
  const logo = documentView.getByRole('img', { name: 'Logo' });
  Object.defineProperty(logo, 'complete', { configurable: true, value: false });
  frame!(0);
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(print).not.toHaveBeenCalled();
  fireEvent.load(logo);
  await waitFor(() => expect(print).toHaveBeenCalledOnce());
  fireEvent(window, new Event('afterprint'));
  await waitFor(() => expect(document.querySelector('[data-print-target="treatment-plan"]')).toBeNull());
});

it('does not print stale values if the fresh plan request fails', async () => {
  let fail = false;
  vi.mocked(fetchClient).mockImplementation(async path => ({ ok: !fail, json: async () => path === '/treatment-plans' ? [draft] : draft }) as Response);
  const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
  render(<AdminTreatmentPlans />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Imprimir' })).toBeEnabled());
  fail = true;
  fireEvent.click(screen.getByRole('button', { name: 'Imprimir' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Imprimir' })).toBeEnabled());
  expect(print).not.toHaveBeenCalled();
  expect(document.querySelector('[data-print-target="treatment-plan"]')).toBeNull();
});
