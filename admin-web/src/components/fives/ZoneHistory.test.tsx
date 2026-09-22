import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ZoneHistory from './ZoneHistory';
import { FiveSZone } from '../../types/fiveS.types';

const serviceMocks = vi.hoisted(() => ({ getAuditRuns: vi.fn() }));

vi.mock('../../services/operations.service', () => ({
  operationsService: serviceMocks,
}));

/*
  The photograph slot fetches its own attachments. What this panel decides is
  which run's pictures to show — the last one — so the slot itself is stood in
  for here and tested where it lives.
*/
vi.mock('../common/PhotoEvidence', () => ({
  default: ({ ownerType, ownerId }: { ownerType: string; ownerId: string }) => (
    <div data-testid="photo-evidence">{`${ownerType}:${ownerId}`}</div>
  ),
}));

const zone = (over: Partial<FiveSZone> = {}): FiveSZone =>
  ({
    id: 'zone-2',
    code: 'A02',
    name: 'Workstations',
    color: '#38bdf8',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    contents: '',
    standard: '',
    labelText: '',
    stage: '2 Set',
    auditFrequency: 'weekly',
    redTags: [],
    ...over,
  }) as FiveSZone;

const run = (id: string, score: number, createdAt: string) => ({
  id,
  templateId: 't-1',
  zoneId: 'zone-2',
  score,
  status: 'submitted',
  answers: [],
  createdAt,
});

describe('ZoneHistory', () => {
  beforeEach(() => {
    serviceMocks.getAuditRuns.mockReset().mockResolvedValue([]);
  });

  it('asks only for this zone history', async () => {
    render(<ZoneHistory zone={zone()} />);

    expect(serviceMocks.getAuditRuns).toHaveBeenCalledWith('zone-2');
    await screen.findByText('Audit history');
  });

  it('says plainly when an area has never been audited', async () => {
    render(<ZoneHistory zone={zone()} />);

    expect(await screen.findByText('This area has not been audited yet.')).toBeTruthy();
  });

  it('shows the latest score against the baseline', async () => {
    render(
      <ZoneHistory
        zone={zone({ lastAuditScore: 88, lastAuditAt: '2026-09-01', baselineScore: 62, baselineAt: '2026-06-01' })}
      />,
    );

    expect(await screen.findByText('88%')).toBeTruthy();
    expect(screen.getByText('62%')).toBeTruthy();
    expect(screen.getByText('Up 26 points since the baseline')).toBeTruthy();
  });

  it('spells out a decline rather than relying on a colour', async () => {
    render(<ZoneHistory zone={zone({ lastAuditScore: 55, baselineScore: 80 })} />);

    expect(await screen.findByText('Down 25 points since the baseline')).toBeTruthy();
  });

  it('says nothing about change when the score has not moved', async () => {
    render(<ZoneHistory zone={zone({ lastAuditScore: 80, baselineScore: 80 })} />);

    await screen.findByText('Audit history');
    expect(screen.queryByText(/points since the baseline/)).toBeNull();
  });

  it('counts only the red tags still needing attention', async () => {
    const zoneWithTags = zone({
      redTags: [
        { id: 'a', title: 'One', disposition: '', status: 'open' },
        { id: 'b', title: 'Two', disposition: '', status: 'review' },
        // Finished work: closedAt is set before anyone files a disposition.
        { id: 'c', title: 'Three', disposition: '', status: 'open', closedAt: '2026-09-01' },
        { id: 'd', title: 'Four', disposition: '', status: 'disposed' },
      ],
    });

    render(<ZoneHistory zone={zoneWithTags} />);

    expect(await screen.findByText('2 open red tag(s)')).toBeTruthy();
  });

  it('lists past audits newest first, as dates and scores', async () => {
    serviceMocks.getAuditRuns.mockResolvedValue([
      run('r-2', 88, '2026-09-01T00:00:00.000Z'),
      run('r-1', 62, '2026-06-01T00:00:00.000Z'),
    ]);

    render(<ZoneHistory zone={zone({ lastAuditScore: 88 })} />);

    const rows = await screen.findAllByRole('row');
    // Header plus two runs.
    expect(rows).toHaveLength(3);
    expect(rows[1].textContent).toContain('2026-09-01');
  });

  it('reports a failed load instead of showing an empty history', async () => {
    serviceMocks.getAuditRuns.mockRejectedValue({
      response: { status: 500, data: { errorCode: 'INTERNAL_ERROR' } },
    });

    render(<ZoneHistory zone={zone()} />);

    expect(
      await screen.findByText('Something went wrong on the server. Try again in a moment.'),
    ).toBeTruthy();
  });

  it('shows the photographs of the most recent check, not of an old one', async () => {
    // A picture taken on a phone in the area had nowhere to be looked at,
    // which is what makes taking it pointless.
    serviceMocks.getAuditRuns.mockResolvedValue([
      run('r-2', 88, '2026-09-01T00:00:00.000Z'),
      run('r-1', 62, '2026-06-01T00:00:00.000Z'),
    ]);

    render(<ZoneHistory zone={zone({ lastAuditScore: 88 })} />);

    expect(await screen.findByTestId('photo-evidence')).toHaveProperty(
      'textContent',
      'audit_run:r-2',
    );
  });

  it('offers no photographs for a zone nobody has audited', async () => {
    serviceMocks.getAuditRuns.mockResolvedValue([]);

    render(<ZoneHistory zone={zone()} />);

    // Waits for the panel to have finished loading before saying what is
    // absent, so this cannot pass merely by being early.
    expect(await screen.findByText('This area has not been audited yet.')).toBeTruthy();
    expect(screen.queryByTestId('photo-evidence')).toBeNull();
  });
});
