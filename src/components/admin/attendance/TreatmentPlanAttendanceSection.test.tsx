import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { fetchClient } from '@/lib/api';
import TreatmentPlanAttendanceSection from './TreatmentPlanAttendanceSection';

vi.mock('@/lib/api', () => ({ fetchClient: vi.fn() }));
vi.mock('./Odontogram', () => ({ default: () => <div>Odontograma preservado</div> }));

it('saves an editable quote with patient and source appointment IDs without posting finance', async () => {
  const calls: Array<{ path: string; body?: Record<string, unknown> }> = [];
  vi.mocked(fetchClient).mockImplementation(async (path, init) => {
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ path: String(path), body });
    const result = init?.method === 'POST' ? { id: 8, ...body, validUntil: '2099-01-01', status: 'awaiting_authorization', totals: { quoted: 100 } } : [];
    return { ok: true, json: async () => result } as Response;
  });
  const user = userEvent.setup();
  render(<TreatmentPlanAttendanceSection appointmentId="12" patientId={7} patientName="Fixture" data={{}} onChange={() => undefined} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Manual' })).toBeEnabled());
  await user.click(screen.getByRole('button', { name: 'Manual' }));
  const name = screen.getByLabelText('Procedimento 1'); await user.clear(name); await user.type(name, 'Procedimento teste');
  await user.clear(screen.getByLabelText('Valor unitário do procedimento 1')); await user.type(screen.getByLabelText('Valor unitário do procedimento 1'), '100');
  await user.click(screen.getByRole('button', { name: 'Salvar e gerar orçamento' }));
  await screen.findByRole('button', { name: 'Atualizar orçamento' });
  expect(calls.find(call => call.path === '/treatment-plans')?.body).toMatchObject({ patientId: 7, sourceAppointmentId: 12, items: [{ name: 'Procedimento teste', unitPrice: 100 }] });
  expect(calls.some(call => call.path.startsWith('/finance'))).toBe(false);
});


it('offers facial procedures and searchable regions in a harmonization consultation', async () => {
  vi.mocked(fetchClient).mockImplementation(async path => ({ ok: true, json: async () => path === '/clinical-procedures' ? [{ id: 3, name: 'Toxina', category: 'Harmonização', pricingUnit: 'procedure', sector: 'harmonizacao', price: 300, active: true, conditionTypes: [] }] : [] }) as Response);
  const user = userEvent.setup();
  render(<TreatmentPlanAttendanceSection mode="harmonizacao" appointmentId="12" patientId={7} patientName="Fixture" data={{}} onChange={() => undefined} />);
  await screen.findByRole('button', { name: 'Manual' });
  await waitFor(() => expect(fetchClient).toHaveBeenCalledWith('/clinical-procedures'));
  Element.prototype.scrollIntoView = vi.fn();
  screen.getByLabelText('Procedimento da tabela').focus();
  await user.keyboard('{Enter}');
  await user.click(await screen.findByRole('option', { name: /Toxina/ }));
  await user.type(screen.getByLabelText('Buscar região facial'), 'glabela');
  await user.selectOptions(screen.getByLabelText('Região facial'), 'glabella');
  await user.click(screen.getByRole('button', { name: /Adicionar item/ }));
  expect(screen.getByLabelText('Procedimento 1')).toHaveValue('Toxina');
  expect(screen.getByText('Glabela — Centro', { selector: 'p' })).toBeInTheDocument();
  expect(screen.queryByText('Odontograma preservado')).not.toBeInTheDocument();
});
