import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AuditInsightsPage from './AuditInsightsPage';

const mocks = vi.hoisted(() => ({ getAuditRuns: vi.fn(), getAuditTemplates: vi.fn(), getPlans: vi.fn() }));

vi.mock('../services/operations.service', () => ({
  operationsService: { getAuditRuns: mocks.getAuditRuns, getAuditTemplates: mocks.getAuditTemplates },
}));
vi.mock('../services/fiveSLayout.service', () => ({ fiveSLayoutService: { getPlans: mocks.getPlans } }));
// The chart needs a laid-out page; what it draws is tested with the numbers.
vi.mock('../components/charts/MonthlyScoreChart', () => ({ default: () => <div data-testid="trend" /> }));
vi.mock('../components/charts/HorizontalBarChart', () => ({ default: () => <div data-testid="pareto" /> }));

const template = {
  id: 't1',
  title: 'Daily',
  category: '5s',
  isActive: true,
  questions: [
    { id: 'q1', text: 'Floor lines unbroken', type: 'yes_no' },
    { id: 'q2', text: 'Tools on the board', type: 'yes_no' },
    { id: 'q3', text: 'Bins labelled', type: 'yes_no' },
  ],
};

const walk = (id: string, zoneId: string, createdAt: string, score: number, failed: string[]) => ({
  id,
  templateId: 't1',
  zoneId,
  createdAt,
  score,
  status: 'submitted',
  answers: ['q1', 'q2', 'q3'].map((questionId) => ({ questionId, value: !failed.includes(questionId) })),
});

describe('audit results', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 28, 9, 0));
    mocks.getAuditTemplates.mockResolvedValue([template]);
    mocks.getPlans.mockResolvedValue([
      { zones: [{ id: 'z1', code: 'A1', name: 'Tools', lastAuditScore: 90 }, { id: 'z2', code: 'A2', name: 'Stores', lastAuditScore: 60 }] },
    ]);
    mocks.getAuditRuns.mockResolvedValue([
      walk('a', 'z1', '2026-09-10T08:00:00Z', 67, ['q1']),
      walk('b', 'z2', '2026-09-12T08:00:00Z', 33, ['q1', 'q2']),
      walk('e', 'z2', '2026-09-14T08:00:00Z', 67, ['q1']),
      walk('c', 'z2', '2026-08-12T08:00:00Z', 67, ['q1']),
      walk('d', 'z1', '2026-08-20T08:00:00Z', 100, []),
    ]);
  });

  afterEach(() => vi.useRealTimers());

  it('says how this month compares with the last, and how many areas are at standard', async () => {
    render(<AuditInsightsPage />);

    await waitFor(() => expect(screen.getByTestId('this-month').textContent).toBe('56%'));
    expect(screen.getByTestId('change').textContent).toBe('-28');
    expect(screen.getByText('1/2')).toBeTruthy();
  });

  it('names the few questions behind most shortfalls', async () => {
    render(<AuditInsightsPage />);

    const vitalFew = await screen.findByTestId('vital-few');
    // q1 fell short four times, q2 once: one question is 80% of it.
    expect(vitalFew.textContent).toContain('1 question accounts for 80%');
    expect(screen.getAllByText('Floor lines unbroken').length).toBeGreaterThan(0);
  });

  it('narrows to one area', async () => {
    render(<AuditInsightsPage />);
    await waitFor(() => expect(screen.getByTestId('this-month').textContent).toBe('56%'));

    fireEvent.change(screen.getByLabelText('Area'), { target: { value: 'z1' } });

    expect(screen.getByTestId('this-month').textContent).toBe('67%');
  });
});
