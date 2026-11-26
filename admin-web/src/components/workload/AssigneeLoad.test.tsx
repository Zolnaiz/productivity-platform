/** Unit test for AssigneeLoad.tsx: candidates by load, picking one, and the warning for an overloaded pick. */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AssigneeLoad from './AssigneeLoad';
import { AssignmentPreview } from './workload';

const serviceMocks = vi.hoisted(() => ({ preview: vi.fn() }));
vi.mock('../../services/workload.service', () => ({ workloadService: serviceMocks }));

const members = [
  { id: 'ana', name: 'Ana' },
  { id: 'bat', name: 'Bat' },
];

const row = (userId: string, percent: number, warnings: AssignmentPreview['warnings'] = []): AssignmentPreview => ({
  userId,
  open: warnings.includes('many_open') ? 3 : 1,
  inProgress: 0,
  overdue: 0,
  hours: 0,
  percent: 0,
  level: 'free',
  after: { open: 2, hours: (percent * 40) / 100, percent, level: percent > 100 ? 'over' : percent >= 80 ? 'busy' : 'free' },
  warnings,
});

const renderLoad = (selectedId = '', onPick = vi.fn(), onWarnings = vi.fn()) =>
  render(
    <AssigneeLoad
      members={members}
      nameOf={(member) => member.name}
      selectedId={selectedId}
      dueDate="2026-11-27"
      estimatedHours={8}
      onPick={onPick}
      onWarnings={onWarnings}
    />,
  );

describe('AssigneeLoad', () => {
  beforeEach(() => {
    serviceMocks.preview.mockReset().mockResolvedValue([row('bat', 30), row('ana', 115, ['over_capacity', 'many_open'])]);
  });

  it('asks for the load of every member with this task’s date and estimate, and lists them quietest first', async () => {
    renderLoad();
    const panel = await screen.findByTestId('assignee-load');
    expect(serviceMocks.preview).toHaveBeenCalledWith({
      assigneeIds: ['ana', 'bat'],
      dueDate: '2026-11-27',
      estimatedHours: 8,
      taskId: undefined,
    });
    const names = within(panel).getAllByRole('button').map((button) => button.textContent ?? '');
    expect(names[0]).toContain('Bat');
    expect(names[1]).toContain('Ana');
  });

  it('picks the person whose row is clicked', async () => {
    const onPick = vi.fn();
    renderLoad('', onPick);
    await userEvent.click(await screen.findByRole('button', { name: /Bat/ }));
    expect(onPick).toHaveBeenCalledWith('bat');
  });

  it('warns about an overloaded choice and tells the page, so it can ask before assigning', async () => {
    const onWarnings = vi.fn();
    renderLoad('ana', vi.fn(), onWarnings);
    const warning = await screen.findByTestId('assignee-load-warning');
    expect(within(warning).getAllByRole('listitem')).toHaveLength(2);
    await waitFor(() => expect(onWarnings).toHaveBeenLastCalledWith(['over_capacity', 'many_open']));
  });

  it('shows no warning for a choice with room', async () => {
    renderLoad('bat');
    await screen.findByTestId('assignee-load');
    expect(screen.queryByTestId('assignee-load-warning')).toBeNull();
  });

  it('stays out of the way when the load cannot be read', async () => {
    serviceMocks.preview.mockReset().mockRejectedValue(new Error('offline'));
    const { container } = renderLoad('ana');
    await waitFor(() => expect(serviceMocks.preview).toHaveBeenCalled());
    expect(container.querySelector('[data-testid="assignee-load"]')).toBeNull();
  });
});
