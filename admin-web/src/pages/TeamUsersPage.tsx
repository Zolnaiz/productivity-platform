import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Mail, UserPlus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
import Table from '../components/common/Table';
import { apiErrorMessage } from '../i18n/apiError';
import { peopleService } from '../services/people.service';
import { Department } from '../types/people.types';
import {
  IssuedInvitation,
  MemberRole,
  PendingInvitation,
  TeamUser,
  memberName,
  memberRoles,
} from '../types/people.types';

/**
 * Which roles somebody in this role may hand out.
 *
 * The server decides this — `shared/roles.ts` is the authority, and it refuses
 * a request that asks for more. This is the same rule written for the select
 * box, so the list offers only roles the request will actually be allowed to
 * grant rather than presenting choices that come back refused.
 */
const assignableBy: Record<string, MemberRole[]> = {
  super_admin: ['organization_admin', 'admin', 'manager', 'user', 'viewer'],
  organization_admin: ['admin', 'manager', 'user', 'viewer'],
  admin: ['manager', 'user', 'viewer'],
  manager: ['user', 'viewer'],
  user: [],
  viewer: [],
};

const TeamUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [ownRole, setOwnRole] = useState<MemberRole>('viewer');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [issued, setIssued] = useState<IssuedInvitation | null>(null);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState<{ email: string; role: MemberRole }>({ email: '', role: 'user' });
  /*
    The departments somebody can be moved between. Without this column a
    department's member count could only ever be set through the API, which
    would leave every department on the page reading as empty.
  */
  const [departments, setDepartments] = useState<Department[]>([]);

  const may = useCallback(
    (permission: string) => permissions.includes('*') || permissions.includes(permission),
    [permissions],
  );

  const grantable = useMemo(() => assignableBy[ownRole] ?? [], [ownRole]);

  const load = useCallback(async () => {
    setError(null);

    try {
      const [access, page] = await Promise.all([
        peopleService.getOwnPermissions(),
        peopleService.getMembers({ search: search.trim() || undefined }),
      ]);

      setPermissions(access.permissions);
      setOwnRole(access.role);
      setMembers(page);
      // Tolerated on its own: a department list that cannot be fetched is a
      // column that reads "no department", not a reason to put an error over
      // the staff list somebody came here for.
      setDepartments(await peopleService.getDepartments().catch(() => []));

      // Only fetched when the caller may see them; asking anyway would put a
      // refusal on screen for something they never asked for.
      const canSeeInvitations = access.permissions.includes('*') || access.permissions.includes('invitations:read');
      setInvitations(canSeeInvitations ? await peopleService.getPendingInvitations() : []);
    } catch (loadError) {
      setError(apiErrorMessage(loadError, t));
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    // Offer a role this person can actually grant, rather than defaulting to
    // one the server will refuse.
    if (grantable.length && !grantable.includes(draft.role)) {
      setDraft((current) => ({ ...current, role: grantable[grantable.length - 1] }));
    }
  }, [grantable, draft.role]);

  const sendInvitation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.email.trim()) return;

    setError(null);

    try {
      const result = await peopleService.invite(draft.email.trim(), draft.role);
      setIssued(result);
      setCopied(false);
      setInviteOpen(false);
      setDraft((current) => ({ ...current, email: '' }));
      await load();
    } catch (inviteError) {
      setError(apiErrorMessage(inviteError, t));
    }
  };

  const act = async (run: () => Promise<unknown>) => {
    setError(null);

    try {
      await run();
      await load();
    } catch (actionError) {
      setError(apiErrorMessage(actionError, t));
    }
  };

  const copyToken = async () => {
    if (!issued) return;

    try {
      await navigator.clipboard.writeText(issued.token);
      setCopied(true);
    } catch {
      // Clipboard access can be refused; the token is on screen to read.
      setCopied(false);
    }
  };

  const roleLabel = (role: MemberRole) => t(`users.roles.${role}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('users.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('users.subtitle')}</p>
        </div>
        {may('invitations:create') && grantable.length > 0 && (
          <Button icon={UserPlus} type="button" onClick={() => setInviteOpen(true)}>
            {t('users.invite')}
          </Button>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">
          {error}
        </p>
      )}

      {issued && (
        <Card title={t('users.invitationIssued')}>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('users.invitationIssuedHelp', { email: issued.invitation.email })}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="flex-1 break-all rounded-md bg-gray-100 px-3 py-2 font-mono text-xs dark:bg-gray-900">
              {issued.token}
            </code>
            <Button variant="outline" size="sm" icon={Copy} type="button" onClick={copyToken}>
              {copied ? t('users.copied') : t('users.copy')}
            </Button>
            <Button variant="ghost" size="sm" type="button" onClick={() => setIssued(null)}>
              {t('common.close')}
            </Button>
          </div>
        </Card>
      )}

      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title={t('users.invite')}>
        <form onSubmit={sendInvitation} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('users.inviteHelp')}</p>
          <Input
            label={t('users.email')}
            type="email"
            placeholder={t('users.email')}
            value={draft.email}
            onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
            required
          />
          <Select
            label={t('users.role')}
            value={draft.role}
            onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value as MemberRole }))}
          >
            {grantable.map((role) => (
              <option key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setInviteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('users.sendInvite')}</Button>
          </div>
        </form>
      </Modal>

      <Card title={`${t('users.teamUsers')} (${members.length})`} loading={loading}>
        <div className="mb-4">
          <Input
            label={t('users.searchLabel')}
            placeholder={t('users.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Table
          rows={members}
          rowKey={(member) => member.id}
          columns={[
            {
              key: 'name',
              header: t('users.name'),
              render: (member) => (
                <>
                  <div className="font-medium text-gray-900 dark:text-white">{memberName(member)}</div>
                  <div className="text-xs text-gray-500">{member.email}</div>
                </>
              ),
            },
            {
              key: 'role',
              header: t('users.role'),
              render: (member) =>
                may('users:update') && grantable.includes(member.role) ? (
                  <Select
                    aria-label={t('users.roleFor', { name: memberName(member) })}
                    value={member.role}
                    onChange={(event) =>
                      act(() => peopleService.changeMemberRole(member.id, event.target.value as MemberRole))
                    }
                  >
                    {memberRoles
                      .filter((role) => grantable.includes(role))
                      .map((role) => (
                        <option key={role} value={role}>
                          {roleLabel(role)}
                        </option>
                      ))}
                  </Select>
                ) : (
                  roleLabel(member.role)
                ),
            },
            { key: 'position', header: t('users.position'), render: (member) => member.position || '-' },
            {
              key: 'department',
              header: t('users.department'),
              render: (member) =>
                may('users:update') ? (
                  <Select
                    aria-label={t('users.departmentOf', { name: memberName(member) })}
                    value={member.departmentId || ''}
                    onChange={(event) =>
                      act(() => peopleService.updateMember(member.id, { departmentId: event.target.value }))
                    }
                  >
                    <option value="">{t('users.noDepartment')}</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  departments.find((department) => department.id === member.departmentId)?.name ||
                  t('users.noDepartment')
                ),
            },
            {
              key: 'status',
              header: t('users.status'),
              render: (member) => (member.isActive ? t('users.active') : t('users.inactive')),
            },
            {
              key: 'actions',
              header: '',
              className: 'py-3 text-right',
              render: (member) =>
                may('users:update') ? (
                  <button
                    className="text-sm text-blue-600"
                    onClick={() => act(() => peopleService.setMemberActive(member.id, !member.isActive))}
                    type="button"
                  >
                    {member.isActive ? t('users.deactivate') : t('users.activate')}
                  </button>
                ) : null,
            },
          ]}
          empty={<EmptyState icon={Users} title={t('users.emptyTitle')} description={t('users.emptyDescription')} />}
        />
      </Card>

      {may('invitations:read') && (
        <Card title={`${t('users.pendingInvitations')} (${invitations.length})`}>
          <Table
            rows={invitations}
            rowKey={(invitation) => invitation.id}
            columns={[
              { key: 'email', header: t('users.email') },
              { key: 'role', header: t('users.role'), render: (invitation) => roleLabel(invitation.role) },
              {
                key: 'expires',
                header: t('users.expires'),
                render: (invitation) => new Date(invitation.expiresAt).toLocaleDateString(),
              },
              {
                key: 'actions',
                header: '',
                className: 'py-3 text-right',
                render: (invitation) =>
                  may('invitations:delete') ? (
                    <button
                      className="text-sm text-blue-600"
                      onClick={() => act(() => peopleService.revokeInvitation(invitation.id))}
                      type="button"
                    >
                      {t('users.revoke')}
                    </button>
                  ) : null,
              },
            ]}
            empty={
              <EmptyState
                icon={Mail}
                title={t('users.noInvitationsTitle')}
                description={t('users.noInvitationsDescription')}
              />
            }
          />
        </Card>
      )}
    </div>
  );
};

export default TeamUsersPage;
