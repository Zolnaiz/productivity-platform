/** Unit test for TeamWorkload.tsx: everybody's load, the free members included, and who has room. */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TeamWorkload from './TeamWorkload';
import { PersonWorkload } from './workload';

const service = vi.hoisted(() => ({ team: vi.fn() }));
vi.mock('../../services/workload.service', () => ({ workloadService: service }));

const person = (userId: string, percent: number, overdue = 0): PersonWorkload => ({
  userId, open: 3, inProgress: 1, overdue, hours: (percent * 40) / 100, percent,
  level: percent > 100 ? 'over' : percent >= 80 ? 'busy' : 'free',
});
const names: Record<string, string> = { ana: 'Ana', bat: 'Bat', dorj: 'Dorj' };
const members = [{ id: 'ana' }, { id: 'bat' }, { id: 'dorj' }];

describe('TeamWorkload', () => {
  beforeEach(() => service.team.mockReset());

  it('lists the loaded people first and the members with no open work after them', async () => {
    service.team.mockResolvedValue([person('ana', 120, 1), person('bat', 50)]);
    render(<TeamWorkload members={members} nameOf={(id) => names[id]} />);
    const rows = await screen.findAllByTestId('team-workload-row');
    expect(rows.map((row) => row.textContent?.split(/\d/)[0])).toEqual(['Ana', 'Bat', 'Dorj']);
  });

  it('names who has room when somebody is over a week', async () => {
    service.team.mockResolvedValue([person('ana', 120, 1), person('bat', 50)]);
    render(<TeamWorkload members={members} nameOf={(id) => names[id]} />);
    const hint = await screen.findByTestId('team-workload-hint');
    expect(hint.textContent).toContain('Dorj');
    expect(hint.textContent).toContain('Bat');
    expect(hint.textContent).not.toContain('Ana');
  });

  it('says so when nobody is over', async () => {
    service.team.mockResolvedValue([person('ana', 60)]);
    render(<TeamWorkload members={members} nameOf={(id) => names[id]} />);
    expect((await screen.findByTestId('team-workload-hint')).textContent).not.toContain('Ana');
  });
});
