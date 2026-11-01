import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { TreatmentPlanPrint, type PrintableTreatmentPlan } from './TreatmentPlanPrint';

const plan: PrintableTreatmentPlan = {
  id: 1, patientId: 1, patient: { id: 1, name: 'Paciente fictício' }, createdAt: '2026-11-01T12:00:00Z', validUntil: '2099-01-01T12:00:00Z', status: 'authorized',
  sourceAppointment: { id: 1, date: '2026-11-01', procedure: 'Consulta', dentalNotes: { version: 2, dentition: 'permanent', teeth: { '17': { notes: 'Nota longa que não deve aparecer na referência compacta', conditions: [{ id: '1', category: 'achado', type: 'carie', stage: 'planejado', targets: [{ kind: 'tooth' }] }] } } } },
  items: [{ id: 1, name: 'Procedimento', category: 'Dentística', phase: 'mouth_adjustment', pricingUnit: 'procedure', toothNumber: 17, quantity: 1, unitPrice: 100, quotedTotal: 100, authorizedTotal: 100, clinicalStatus: 'completed' }],
  payments: [{ id: 1, amount: 100, method: 'pix', receivedAt: '2026-11-01T12:00:00Z' }], totals: { quoted: 100, authorized: 100, received: 100, balance: 0, discount: 0, byPhase: {} },
};

it('optionally prints a compact anatomical reference before the cost table without clinical detail lists', () => {
  const props = { plan, clinic: {}, professional: { name: 'Profissional fictício' } };
  const { container, rerender } = render(<TreatmentPlanPrint {...props} includeOdontogram />);
  const chart = container.querySelector('.treatment-plan-odontogram')!;
  const table = container.querySelector('.treatment-plan-items')!;
  expect(chart.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByLabelText('Dente 17 incluído no orçamento')).toBeInTheDocument();
  expect(container.querySelectorAll('.odontogram-plan-marker--selected')).toHaveLength(1);
  expect(container.querySelectorAll('.anatomical-tooth--arch')).toHaveLength(32);
  expect(container.querySelector('.occlusal-tooth--arch')).toBeNull();
  expect(screen.queryByText('Resumo Clínico')).not.toBeInTheDocument();
  expect(screen.queryByText('Nota longa que não deve aparecer na referência compacta')).not.toBeInTheDocument();
  expect(container).toHaveTextContent('Saldo autorizado quitado');
  rerender(<TreatmentPlanPrint {...props} includeOdontogram={false} />);
  expect(container.querySelector('.treatment-plan-odontogram')).toBeNull();
  expect(container.querySelector('.treatment-plan-items')).not.toBeNull();
});
