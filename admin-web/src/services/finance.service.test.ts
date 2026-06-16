import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api');
  return {
    ...actual,
    isDemoMode: () => true,
  };
});

describe('financeService demo storage', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('recovers default expenses when stored data is invalid JSON', async () => {
    localStorage.setItem('productivity-demo-expenses', '{broken-json');
    const { financeService } = await import('./finance.service');

    const expenses = await financeService.getExpenses();

    expect(expenses.length).toBeGreaterThan(0);
    expect(expenses[0]).toHaveProperty('amount');
    expect(localStorage.getItem('productivity-demo-expenses')).not.toBe('{broken-json');
  });
});
