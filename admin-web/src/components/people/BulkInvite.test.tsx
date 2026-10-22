import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BulkInvite from './BulkInvite';

const mocks = vi.hoisted(() => ({ importInvitations: vi.fn() }));
vi.mock('../../services/people.service', () => ({ peopleService: mocks }));

const csv = (text: string) => new File([text], 'people.csv', { type: 'text/csv' });

describe('inviting people from a file', () => {
  beforeEach(() => mocks.importInvitations.mockReset());

  it('previews every row with its error, then invites only the valid ones', async () => {
    mocks.importInvitations.mockImplementation(async (rows, dryRun) => ({
      dryRun,
      total: rows?.length ?? -1,
      valid: 1,
      rows: [
        { row: 1, email: 'bat@x.mn', role: 'user', status: 'ok' },
        { row: 2, email: 'bad', role: 'user', status: 'error', error: 'email_invalid' },
      ],
    }));
    const onDone = vi.fn();
    render(<BulkInvite onDone={onDone} />);

    await userEvent.upload(screen.getByLabelText('File'), csv('Email,Role\nbat@x.mn,employee\nbad,employee\n'));

    expect(await screen.findByText('Invalid email')).toBeTruthy();
    expect(mocks.importInvitations).toHaveBeenCalledWith(
      [
        { email: 'bat@x.mn', role: 'user' },
        { email: 'bad', role: 'user' },
      ],
      true,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Invite 1 people' }));
    await waitFor(() => expect(mocks.importInvitations).toHaveBeenLastCalledWith(expect.any(Array), false));
    expect(onDone).toHaveBeenCalled();
    expect((await screen.findByRole('status')).textContent).toContain('Invitations sent to 1 of 2');
  });

  it('says so when the file has no rows, and sends nothing', async () => {
    render(<BulkInvite onDone={vi.fn()} />);

    await userEvent.upload(screen.getByLabelText('File'), csv('\n\n'));

    expect((await screen.findByRole('alert')).textContent).toContain('No rows');
    expect(mocks.importInvitations).not.toHaveBeenCalled();
  });
});
