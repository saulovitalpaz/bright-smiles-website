import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ClinicalConditionEditor } from './ClinicalConditionEditor';
import type { ClinicalConditionGroup } from '@/lib/clinicalConditions';

const customKey = 'custom_11111111-1111-4111-8111-111111111111';
const groups: ClinicalConditionGroup[] = [
  { key: 'achado', name: 'Achados da clínica', active: true, conditions: [
    { key: 'carie', name: 'Cárie', groupKey: 'achado', active: false },
    { key: customKey, name: 'Condição personalizada', groupKey: 'achado', active: true },
  ] },
  { key: 'protese', name: 'Grupo excluído', active: false, conditions: [{ key: 'implante', name: 'Implante', groupKey: 'protese', active: true }] },
];

it('offers only enabled clinic groups and conditions and saves the display name snapshot', async () => {
  const user = userEvent.setup(); const save = vi.fn();
  render(<ClinicalConditionEditor toothNumber={16} conditionGroups={groups} onSave={save} onCancel={() => undefined} />);
  expect(screen.queryByRole('option', { name: 'Grupo excluído' })).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Categoria'), 'achado');
  expect(within(screen.getByLabelText('Procedimento')).queryByRole('option', { name: 'Cárie' })).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Procedimento'), customKey);
  await user.click(screen.getByRole('button', { name: 'Definir condição do dente inteiro' }));
  await user.click(screen.getByRole('button', { name: 'Selecionar situação Planejado / a tratar' }));
  await user.click(screen.getByRole('button', { name: 'Salvar ocorrência' }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ type: customKey, label: 'Condição personalizada', category: 'achado' }));
});

it('preserves a historical condition after its catalog entry is excluded', () => {
  render(<ClinicalConditionEditor toothNumber={16} conditionGroups={[]} onSave={() => undefined} onCancel={() => undefined}
    initialCondition={{ id: 'old', category: 'achado', type: customKey, label: 'Nome histórico', stage: 'concluido', targets: [{ kind: 'tooth' }] }} />);
  expect(screen.getByLabelText('Procedimento')).toHaveValue(customKey);
  expect(screen.getByRole('option', { name: 'Nome histórico' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Atualizar ocorrência' })).toBeEnabled();
});
