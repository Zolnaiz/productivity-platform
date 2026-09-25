import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TeamUsersPage from './TeamUsersPage';
import { MemberRole, TeamUser } from '../types/people.types';

const people = vi.hoisted(() => ({
  getOwnPermissions: vi.fn(),
  getMembers: vi.fn(),
  getPendingInvitations: vi.fn(),
  getDepartments: vi.fn(),
  updateMember: vi.fn(),
  setMemberActive: vi.fn(),
  changeMemberRole: vi.fn(),
  invite: vi.fn(),
  revokeInvitation: vi.fn(),
}));

vi.mock('../services/people.service', () => ({ peopleService: people }));

const member = (over: Partial<TeamUser> = {}): TeamUser => ({
  id: 'u1',
  firstName: 'Bat',
  lastName: 'Dorj',
  email: 'bat@example.com',
  role: 'user',
  position: 'Operator',
  isActive: true,
  ...over,
});

const signedInAs = (role: MemberRole, permissions: string[]) => {
  people.getOwnPermissions.mockResolvedValue({ role, permissions });
};

describe('TeamUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    people.getMembers.mockResolvedValue([member()]);
    people.getPendingInvitations.mockResolvedValue([]);
    people.getDepartments.mockResolvedValue([
      { id: 'd1', name: 'Assembly' },
      { id: 'd2', name: 'Warehouse' },
    ]);
    people.updateMember.mockResolvedValue(member({ departmentId: 'd2' }));
    signedInAs('organization_admin', [
      'users:read',
      'users:update',
      'invitations:read',
      'invitations:create',
      'invitations:delete',
    ]);
  });

  it('lists the members the server returned', async () => {
    render(<TeamUsersPage />);

    expect(await screen.findByText('Bat Dorj')).toBeTruthy();
    expect(screen.getByText('bat@example.com')).toBeTruthy();
  });

  it('invites rather than creating, and shows the token once', async () => {
    people.invite.mockResolvedValue({
      invitation: { id: 'i1', email: 'new@example.com', role: 'user', expiresAt: '2026-10-01', createdAt: '2026-09-14' },
      token: 'the-only-copy',
    });
    render(<TeamUsersPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Invite somebody' }));
    await userEvent.type(screen.getByLabelText('Email'), 'new@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }));

    // `user` is the default: an ordinary employee, and a role an organization
    // admin may grant.
    await waitFor(() => expect(people.invite).toHaveBeenCalledWith('new@example.com', 'user'));
    expect(await screen.findByText('the-only-copy')).toBeTruthy();
  });

  it('offers only the roles the signed-in person may grant', async () => {
    // An admin cannot make somebody an organization admin, so the server would
    // refuse it. Offering the choice would just produce a refusal.
    signedInAs('admin', ['users:read', 'users:update', 'invitations:create', 'invitations:read']);
    render(<TeamUsersPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Invite somebody' }));
    const roles = within(screen.getByLabelText('Role'))
      .getAllByRole('option')
      .map((option) => option.textContent);

    expect(roles).toEqual(['Manager', 'Employee', 'Viewer']);
    expect(roles).not.toContain('Organization admin');
  });

  it('deactivates through the service rather than editing a flag', async () => {
    people.setMemberActive.mockResolvedValue(member({ isActive: false }));
    render(<TeamUsersPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Deactivate' }));

    expect(people.setMemberActive).toHaveBeenCalledWith('u1', false);
  });

  it('changes a role through the server', async () => {
    people.changeMemberRole.mockResolvedValue(member({ role: 'manager' }));
    render(<TeamUsersPage />);

    await userEvent.selectOptions(await screen.findByLabelText('Role for Bat Dorj'), 'manager');

    expect(people.changeMemberRole).toHaveBeenCalledWith('u1', 'manager');
  });

  it('hides every control a viewer has no permission for', async () => {
    signedInAs('viewer', []);
    render(<TeamUsersPage />);

    expect(await screen.findByText('Bat Dorj')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Invite somebody' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Deactivate' })).toBeNull();
    expect(screen.queryByLabelText('Role for Bat Dorj')).toBeNull();
    expect(people.getPendingInvitations).not.toHaveBeenCalled();
  });

  it('reports a refusal instead of leaving the page looking as though it worked', async () => {
    people.setMemberActive.mockRejectedValue({
      response: { data: { errorCode: 'ACCESS_DENIED' } },
    });
    render(<TeamUsersPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Deactivate' }));

    expect(await screen.findByRole('alert')).toBeTruthy();
  });
});

/**
 * Membership is changed where the member is.
 *
 * Without this column a department's people could only ever be set through
 * the API, which would leave every department on the departments page reading
 * as empty no matter how many people were in it.
 */
describe('which department somebody is in', () => {
  it('moves a member, and says whose department is being changed', async () => {
    signedInAs('admin', ['users:read', 'users:update']);

    render(<TeamUsersPage />);

    const select = await screen.findByLabelText('Department for Bat Dorj');
    await userEvent.selectOptions(select, 'd2');

    await waitFor(() =>
      expect(people.updateMember).toHaveBeenCalledWith('u1', { departmentId: 'd2' }),
    );
  });

  it('shows the department as plain text to somebody who may not change it', async () => {
    people.getMembers.mockResolvedValue([member({ departmentId: 'd1' })]);
    signedInAs('viewer', ['users:read']);

    render(<TeamUsersPage />);

    expect(await screen.findByText('Assembly')).toBeTruthy();
    expect(screen.queryByLabelText('Department for Bat Dorj')).toBeNull();
  });

  it('still shows the staff list when the departments cannot be fetched', async () => {
    // A column that reads "no department" is not a reason to put an error over
    // the list somebody came here for.
    people.getDepartments.mockRejectedValue(new Error('offline'));
    signedInAs('admin', ['users:read', 'users:update']);

    render(<TeamUsersPage />);

    expect(await screen.findByText('bat@example.com')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
