import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FiveSGuidelineRegisters from './FiveSGuidelineRegisters';

const storageKey = 'productivity-demo-5s-guideline-registers';

const mocks = vi.hoisted(() => ({
  permissions: ['guidelines:update', 'tasks:read', 'tasks:create'],
  getTasks: vi.fn(),
  createTask: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { roles: ['manager'] },
    hasPermission: (permission: string) => mocks.permissions.includes(permission),
  }),
}));

vi.mock('../../services/operations.service', () => ({
  operationsService: { getTasks: mocks.getTasks, createTask: mocks.createTask },
}));

const improvement = (over: Record<string, unknown> = {}) => ({
  id: 'improvement-1',
  area: 'Assembly line',
  responsible: 'Bat',
  recordDate: '2026-09-01',
  whenObserved: 'Morning shift',
  duration: '2 weeks',
  symptomLoss: 'Tools missing from the board',
  rootCause: 'No return rule after a shift',
  teamDecision: 'Shadow board with named slots',
  actionPlan: 'Install the shadow board by the 15th',
  managementDecision: '',
  status: 'open',
  ...over,
});

const seed = (improvements: unknown[]) =>
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      improvements,
      implementationCards: [],
      assessmentScores: [],
      checklistProgress: [],
      updatedAt: '2026-09-01T00:00:00.000Z',
    }),
  );

const renderRegisters = () =>
  render(
    <MemoryRouter>
      <FiveSGuidelineRegisters />
    </MemoryRouter>,
  );

/**
 * An action plan in a register is a wish until somebody is given it. These
 * are about turning one into work that has an owner and a place on the board.
 */
describe('raising work from an improvement', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'demo-token');
    mocks.permissions = ['guidelines:update', 'tasks:read', 'tasks:create'];
    mocks.getTasks.mockReset();
    mocks.createTask.mockReset();
    mocks.getTasks.mockResolvedValue([]);
  });

  it('raises the action plan as a task tied to its record, and marks the record in progress', async () => {
    seed([improvement()]);
    mocks.createTask.mockImplementation(async (task) => ({ id: 'task-1', ...task }));
    renderRegisters();

    await userEvent.click(await screen.findByRole('button', { name: 'Make it a task' }));

    expect(mocks.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '5S improvement: Assembly line',
        description: 'Install the shadow board by the 15th',
        sourceType: 'five_s_improvement',
        sourceId: 'improvement-1',
        status: 'todo',
      }),
    );
    expect(await screen.findByText('Task: To do')).toBeTruthy();
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(storageKey) ?? '{}').improvements[0].status).toBe('in_progress'),
    );
  });

  it('shows the work already raised instead of offering to raise it again', async () => {
    seed([improvement({ status: 'in_progress' })]);
    mocks.getTasks.mockResolvedValue([
      { id: 'old', title: 'x', status: 'done', sourceType: 'five_s_improvement', sourceId: 'improvement-1' },
      { id: 'new', title: 'x', status: 'in_progress', sourceType: 'five_s_improvement', sourceId: 'improvement-1' },
    ]);
    renderRegisters();

    expect(await screen.findByText('Task: In progress')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Make it a task' })).toBeNull();
  });

  it('offers nothing to somebody who may not give out work', async () => {
    mocks.permissions = ['guidelines:update', 'tasks:read'];
    seed([improvement()]);
    renderRegisters();

    await screen.findByDisplayValue('Assembly line');
    expect(screen.queryByRole('button', { name: 'Make it a task' })).toBeNull();
  });
});
