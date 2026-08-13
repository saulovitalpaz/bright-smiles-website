import { describe, expect, it } from 'vitest';
import { financePeriodQuery, financePeriodTitle } from './finance';

describe('finance period UI helpers', () => {
  it('uses the same selected month and year in both finance requests', () => {
    expect(financePeriodQuery(3, 2026)).toBe('month=3&year=2026');
  });

  it('names the selected period in Brazilian Portuguese', () => {
    expect(financePeriodTitle(3, 2026)).toMatch(/março.*2026/i);
  });
});
