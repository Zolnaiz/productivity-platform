import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GembaAdherence from './GembaAdherence';

const mocks = vi.hoisted(() => ({ getWeek: vi.fn() }));
vi.mock('../../services/gemba.service', () => ({ gembaService: { getWeek: mocks.getWeek } }));

const names: Record<string, string> = { m1: 'Bold', m2: 'Saran', m3: 'Tuya' };

const renderIt = (people: Set<string> | null = null) =>
  render(
    <MemoryRouter>
      <GembaAdherence
        today="2026-10-01"
        readAt={null}
        people={people}
        nameOf={(id) => names[id ?? ''] ?? 'Nobody'}
        className=""
        headingClassName=""
      />
    </MemoryRouter>,
  );

describe('gemba on the huddle board', () => {
  beforeEach(() => {
    mocks.getWeek.mockResolvedValue({
      week: '2026-09-28',
      target: 1,
      walks: [],
      walkers: [
        { userId: 'm2', walks: 0 },
        { userId: 'm3', walks: 0 },
        { userId: 'm1', walks: 2 },
      ],
    });
  });

  it('counts the managers who have walked and names those who have not', async () => {
    renderIt();
    expect((await screen.findByTestId('gemba-on-target')).textContent).toBe('1/3');
    expect(mocks.getWeek).toHaveBeenCalledWith('2026-10-01');
    expect(screen.getByText('Saran')).toBeTruthy();
    expect(screen.getByText('Tuya')).toBeTruthy();
    expect(screen.queryByText('Bold')).toBeNull();
  });

  it('keeps to the department the board is for', async () => {
    renderIt(new Set(['m1', 'm2']));
    expect((await screen.findByTestId('gemba-on-target')).textContent).toBe('1/2');
    expect(screen.queryByText('Tuya')).toBeNull();
  });
});
