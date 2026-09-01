import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
import Table from '../components/common/Table';
import { peopleService } from '../services/people.service';
import { Department, TeamUser } from '../types/people.types';

const TeamUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({
    name: '',
    email: '',
    role: 'employee' as TeamUser['role'],
    departmentId: '',
    position: '',
  });

  useEffect(() => {
    Promise.all([peopleService.getUsers(), peopleService.getDepartments()])
      .then(([teamUsers, items]) => {
        setUsers(teamUsers);
        setDepartments(items);
        setDraft((current) => ({ ...current, departmentId: current.departmentId || items[0]?.id || '' }));
      })
      .finally(() => setLoading(false));
  }, []);

  const departmentById = useMemo(
    () => Object.fromEntries(departments.map((department) => [department.id, department])),
    [departments],
  );

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.email.trim()) return;

    const user = await peopleService.createUser({
      ...draft,
      active: true,
    });
    setUsers((current) => [user, ...current]);
    setDraft({
      name: '',
      email: '',
      role: 'employee',
      departmentId: departments[0]?.id || '',
      position: '',
    });
    setCreateOpen(false);
  };

  const toggleActive = async (user: TeamUser) => {
    const updated = await peopleService.updateUser(user.id, { active: !user.active });
    setUsers((current) => current.map((item) => (item.id === user.id ? updated : item)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('users.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('users.subtitle')}</p>
        </div>
        <Button icon={Plus} type="button" onClick={() => setCreateOpen(true)}>
          {t('users.newUser')}
        </Button>
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={t('users.newUser')}>
        <form onSubmit={createUser} className="space-y-4">
          <Input
            label={t('users.name')}
            placeholder={t('users.name')}
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <Input
            label={t('users.email')}
            type="email"
            placeholder={t('users.email')}
            value={draft.email}
            onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
            required
          />
          <Input
            label={t('users.position')}
            placeholder={t('users.position')}
            value={draft.position}
            onChange={(event) => setDraft((current) => ({ ...current, position: event.target.value }))}
          />
          <Select
            label={t('users.role')}
            value={draft.role}
            onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value as TeamUser['role'] }))}
          >
            <option value="owner">{t('users.roles.owner')}</option>
            <option value="admin">{t('users.roles.admin')}</option>
            <option value="manager">{t('users.roles.manager')}</option>
            <option value="employee">{t('users.roles.employee')}</option>
          </Select>
          <Select
            label={t('users.department')}
            value={draft.departmentId}
            onChange={(event) => setDraft((current) => ({ ...current, departmentId: event.target.value }))}
          >
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('users.addUser')}</Button>
          </div>
        </form>
      </Modal>

      <Card title={`${t('users.teamUsers')} (${users.length})`} loading={loading}>
        <Table
          rows={users}
          rowKey={(user) => user.id}
          columns={[
            {
              key: 'name',
              header: t('users.name'),
              render: (user) => (
                <>
                  <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </>
              ),
            },
            { key: 'role', header: t('users.role') },
            {
              key: 'department',
              header: t('users.department'),
              render: (user) => departmentById[user.departmentId]?.name || '-',
            },
            { key: 'position', header: t('users.position') },
            { key: 'status', header: t('users.status'), render: (user) => (user.active ? t('users.active') : t('users.inactive')) },
            {
              key: 'actions',
              header: '',
              className: 'py-3 text-right',
              render: (user) => (
                <div className="flex justify-end gap-3">
                  <Link className="text-sm text-blue-600" to="/profile">
                    {t('users.report')}
                  </Link>
                  <button className="text-sm text-blue-600" onClick={() => toggleActive(user)} type="button">
                    {user.active ? t('users.deactivate') : t('users.activate')}
                  </button>
                </div>
              ),
            },
          ]}
          empty={
            <EmptyState
              icon={Users}
              title={t('users.emptyTitle')}
              description={t('users.emptyDescription')}
            />
          }
        />
      </Card>
    </div>
  );
};

export default TeamUsersPage;
