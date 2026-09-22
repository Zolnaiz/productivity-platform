import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ZonePage from './ZonePage';

const serviceMocks = vi.hoisted(() => ({
  getPlan: vi.fn(),
  addRedTag: vi.fn(),
  markCleaned: vi.fn(),
  getAuditTemplates: vi.fn(),
  createAuditRun: vi.fn(),
}));

vi.mock('../services/fiveSLayout.service', () => ({
  fiveSLayoutService: {
    getPlan: serviceMocks.getPlan,
    addRedTag: serviceMocks.addRedTag,
    markCleaned: serviceMocks.markCleaned,
  },
}));

/*
  The photograph slot talks to the attachment API on its own. The page's job is
  to offer it against the run that was just recorded, and nothing else, so the
  component itself is stood in for here and tested where it lives.
*/
vi.mock('../components/common/PhotoEvidence', () => ({
  default: ({ ownerType, ownerId }: { ownerType: string; ownerId: string }) => (
    <div data-testid="photo-evidence">{`${ownerType}:${ownerId}`}</div>
  ),
}));

vi.mock('../services/operations.service', () => ({
  operationsService: {
    getAuditTemplates: serviceMocks.getAuditTemplates,
    createAuditRun: serviceMocks.createAuditRun,
  },
}));

/*
  Who is holding the phone. The page asks the server's own permission list
  rather than guessing from a role name, so the test says what this person may
  do in the same words the table uses.
*/
const signedIn = vi.hoisted(() => ({ role: 'admin', permissions: [] as string[] }));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { roles: [signedIn.role] },
    hasPermission: (permission: string) => signedIn.permissions.includes(permission),
  }),
}));

const zone = (over: Record<string, unknown> = {}) => ({
  id: 'z1',
  code: 'A03',
  name: 'Storage',
  color: '#f59e0b',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  ownerName: 'Quality Manager',
  contents: 'Office supplies, PPE, spare labels',
  standard: 'Every shelf position labelled, min/max stock marked.',
  labelText: '',
  stage: 'sort' as const,
  auditFrequency: 'weekly' as const,
  redTags: [],
  redTagCount: 0,
  ...over,
});

const plan = (over: Record<string, unknown> = {}) => ({
  id: 'l1',
  name: 'Machine shop',
  site: 'Plant',
  floor: '1st floor',
  scale: '1 square = 1 meter',
  zones: [zone()],
  objects: [],
  updatedAt: '2026-09-20T00:00:00.000Z',
  ...over,
});

const renderZone = (planId = 'l1', zoneId = 'z1') =>
  render(
    <MemoryRouter initialEntries={[`/zone/${planId}/${zoneId}`]}>
      <Routes>
        <Route path="/zone/:planId/:zoneId" element={<ZonePage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('the page a zone label opens', () => {
  beforeEach(() => {
    signedIn.role = 'admin';
    signedIn.permissions = ['redtags:create', 'zones:clean', 'audits:create', 'attachments:create'];
    serviceMocks.getAuditTemplates.mockReset();
    serviceMocks.getAuditTemplates.mockResolvedValue([
      {
        id: 't1',
        title: 'Daily 5S walk',
        category: '5s',
        isActive: true,
        questions: [{ id: 'q1', text: 'Is the aisle clear?', type: 'yes_no' }],
      },
    ]);
    serviceMocks.createAuditRun.mockReset();
    serviceMocks.createAuditRun.mockResolvedValue({
      id: 'run-1',
      templateId: 't1',
      zoneId: 'z1',
      score: 100,
      status: 'submitted',
      answers: [],
      createdAt: '2026-09-22T09:00:00.000Z',
    });
    serviceMocks.getPlan.mockReset();
    serviceMocks.addRedTag.mockReset();
    serviceMocks.markCleaned.mockReset();
    serviceMocks.markCleaned.mockResolvedValue({ zoneId: 'z1', lastCleanedAt: '2026-09-22' });
    serviceMocks.getPlan.mockResolvedValue(plan());
    serviceMocks.addRedTag.mockResolvedValue({
      id: 'r-new',
      title: 'Unowned pallet',
      disposition: 'Find the owner',
      status: 'open',
      createdAt: '2026-09-22T08:00:00.000Z',
    });
  });

  it('opens the plan the label names, not whichever comes back first', async () => {
    // A label is printed once and stuck to a wall; it has to keep meaning the
    // same area in a building with a plan per floor.
    renderZone('l2', 'z9');

    expect(await screen.findByText(/no longer on the plan/)).toBeTruthy();
    expect(serviceMocks.getPlan).toHaveBeenCalledWith('l2');
  });

  it('leads with the standard, which is what somebody is checking against', async () => {
    renderZone();

    expect(await screen.findByText('Every shelf position labelled, min/max stock marked.')).toBeTruthy();
  });

  it('says where the area is and who owns it', async () => {
    renderZone();

    expect(await screen.findByText('A03 · Storage')).toBeTruthy();
    expect(screen.getByText('Plant · 1st floor')).toBeTruthy();
    expect(screen.getByText('Quality Manager')).toBeTruthy();
  });

  it('lists what is still red-tagged', async () => {
    serviceMocks.getPlan.mockResolvedValue(
      plan({
        zones: [
          zone({
            redTags: [
              { id: 'r1', title: 'Unowned supply box', disposition: 'Identify owner or dispose', status: 'open' },
              { id: 'r2', title: 'Old labels', disposition: '', status: 'disposed' },
            ],
          }),
        ],
      }),
    );

    renderZone();

    // Open ones only: a tag that has been dealt with is history, and history
    // on a wall label is noise.
    expect(await screen.findByText('Unowned supply box')).toBeTruthy();
    expect(screen.queryByText('Old labels')).toBeNull();
  });

  it('says plainly when nothing is red-tagged', async () => {
    renderZone();

    expect(await screen.findByText('Nothing is red-tagged here.')).toBeTruthy();
  });

  it('says when the area was last audited and when it is due', async () => {
    serviceMocks.getPlan.mockResolvedValue(
      plan({ zones: [zone({ lastAuditAt: '2026-09-01', lastAuditScore: 82 })] }),
    );

    renderZone();

    expect(await screen.findByText(/2026-09-01/)).toBeTruthy();
    expect(screen.getByText(/82%/)).toBeTruthy();
  });

  it('says so when the label has outlived its area', async () => {
    // Areas get merged, renamed and retired; an empty page would read as the
    // application being broken.
    renderZone('l1', 'gone');

    expect(await screen.findByText(/no longer on the plan/)).toBeTruthy();
  });

  it('says so when the plan cannot be loaded at all', async () => {
    serviceMocks.getPlan.mockRejectedValue(new Error('offline'));

    renderZone();

    expect(await screen.findByText(/no longer on the plan/)).toBeTruthy();
  });

  it('offers the three things somebody standing here does, and no way to edit the plan', async () => {
    // Standing next to a running machine is not where a plan should be
    // editable by accident — but noticing clutter, cleaning up and walking the
    // daily check are exactly what the person standing there is for.
    renderZone();
    await screen.findByText('A03 · Storage');

    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByRole('button', { name: /Red-tag something here/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cleaned today' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Walk the checklist' })).toBeTruthy();
  });

  it('offers a viewer nothing they would only be refused', async () => {
    // A button that always fails is a worse answer than no button: the page
    // reads the server's own permission list rather than guessing.
    signedIn.role = 'viewer';
    signedIn.permissions = [];

    renderZone();
    await screen.findByText('A03 · Storage');

    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('records a walk of the checklist against this zone', async () => {
    renderZone();
    await screen.findByText('A03 · Storage');

    fireEvent.click(screen.getByRole('button', { name: 'Walk the checklist' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record the check' }));

    await waitFor(() =>
      expect(serviceMocks.createAuditRun).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 't1',
          zoneId: 'z1',
          score: 100,
          status: 'submitted',
          answers: [{ questionId: 'q1', value: true }],
        }),
      ),
    );

    // The page then reads back what was stored, so it agrees with the floor
    // plan the server has just repainted.
    expect(await screen.findByText(/2026-09-22 · 100%/)).toBeTruthy();
  });

  it('asks for a photograph once there is a check to hang it on', async () => {
    // A score is an opinion until there is a picture beside it, and the phone
    // is the one device in the building that always has a camera. Not before:
    // a photograph needs something to belong to.
    renderZone();
    await screen.findByText('A03 · Storage');

    expect(screen.queryByTestId('photo-evidence')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Walk the checklist' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record the check' }));

    expect(await screen.findByTestId('photo-evidence')).toHaveProperty(
      'textContent',
      'audit_run:run-1',
    );
  });

  it('does not offer a photograph to somebody who may not upload one', async () => {
    signedIn.permissions = ['audits:create'];

    renderZone();
    await screen.findByText('A03 · Storage');
    fireEvent.click(screen.getByRole('button', { name: 'Walk the checklist' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record the check' }));

    await screen.findByText(/This area now stands at/);
    expect(screen.queryByTestId('photo-evidence')).toBeNull();
  });

  it('records the walk as the layer the person actually is', async () => {
    // An administrator walking the floor is doing the manager's check;
    // recording it as the operator's would reset the wrong clock.
    renderZone();
    await screen.findByText('A03 · Storage');

    fireEvent.click(screen.getByRole('button', { name: 'Walk the checklist' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Record the check' }));

    await waitFor(() =>
      expect(serviceMocks.createAuditRun).toHaveBeenCalledWith(
        expect.objectContaining({ tier: 3, location: 'A03 - Storage' }),
      ),
    );
  });

  it('records that the area was cleaned, and shows the date that was stored', async () => {
    // Not the date this machine thinks it is: a browser's clock is whatever
    // the machine says, and this date is what the audit schedule reads.
    renderZone();
    await screen.findByText('A03 · Storage');

    fireEvent.click(screen.getByRole('button', { name: 'Cleaned today' }));

    await waitFor(() => expect(serviceMocks.markCleaned).toHaveBeenCalledWith('l1', 'z1'));
    expect(await screen.findByText('2026-09-22')).toBeTruthy();
  });

  it('says so when the cleaning could not be recorded', async () => {
    serviceMocks.markCleaned.mockRejectedValue(new Error('offline'));

    renderZone();
    await screen.findByText('A03 · Storage');
    fireEvent.click(screen.getByRole('button', { name: 'Cleaned today' }));

    expect(await screen.findByText(/was not saved/)).toBeTruthy();
  });

  it('keeps the form closed until it is asked for', async () => {
    // This page is read most of the time; a form sitting open pushes what
    // somebody came to read off a phone screen.
    renderZone();
    await screen.findByText('A03 · Storage');

    expect(screen.queryByPlaceholderText('What is it?')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Red-tag something here/ }));

    expect(await screen.findByPlaceholderText('What is it?')).toBeTruthy();
  });

  it('raises the tag against the plan and zone the label named', async () => {
    renderZone();
    await screen.findByText('A03 · Storage');
    fireEvent.click(screen.getByRole('button', { name: /Red-tag something here/ }));

    fireEvent.change(await screen.findByPlaceholderText('What is it?'), {
      target: { value: 'Unowned pallet' },
    });
    fireEvent.change(screen.getByPlaceholderText('What should happen to it?'), {
      target: { value: 'Find the owner' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Raise the tag' }));

    await waitFor(() =>
      expect(serviceMocks.addRedTag).toHaveBeenCalledWith('l1', 'z1', {
        title: 'Unowned pallet',
        disposition: 'Find the owner',
      }),
    );
  });

  it('shows the tag the server stored, not the words that were typed', async () => {
    // The id and the date are the server's to decide, and what appears on
    // screen has to be what was actually kept.
    serviceMocks.addRedTag.mockResolvedValue({
      id: 'r-new',
      title: 'Pallet (as stored)',
      disposition: '',
      status: 'open',
      createdAt: '2026-09-22T08:00:00.000Z',
    });

    renderZone();
    await screen.findByText('A03 · Storage');
    fireEvent.click(screen.getByRole('button', { name: /Red-tag something here/ }));
    fireEvent.change(await screen.findByPlaceholderText('What is it?'), {
      target: { value: 'Pallet' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Raise the tag' }));

    expect(await screen.findByText('Pallet (as stored)')).toBeTruthy();
  });

  it('will not raise a tag with nothing written on it', async () => {
    renderZone();
    await screen.findByText('A03 · Storage');
    fireEvent.click(screen.getByRole('button', { name: /Red-tag something here/ }));

    expect(await screen.findByRole('button', { name: 'Raise the tag' })).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('says so when the tag was not saved', async () => {
    // Somebody who thinks they have tagged an item and has not is worse off
    // than somebody who knows.
    serviceMocks.addRedTag.mockRejectedValue(new Error('offline'));

    renderZone();
    await screen.findByText('A03 · Storage');
    fireEvent.click(screen.getByRole('button', { name: /Red-tag something here/ }));
    fireEvent.change(await screen.findByPlaceholderText('What is it?'), {
      target: { value: 'Pallet' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Raise the tag' }));

    expect(await screen.findByText(/was not saved/)).toBeTruthy();
  });
});
