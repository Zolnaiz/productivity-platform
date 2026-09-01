import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Users</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Owner, admin, manager, employee role-той хэрэглэгчид болон хэлтсийн холбоос.
          </p>
        </div>
        <Button icon={Plus} type="button" onClick={() => setCreateOpen(true)}>
          New user
        </Button>
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New user">
        <form onSubmit={createUser} className="space-y-4">
          <Input
            label="Name"
            placeholder="Name"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="Email"
            value={draft.email}
            onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
            required
          />
          <Input
            label="Position"
            placeholder="Position"
            value={draft.position}
            onChange={(event) => setDraft((current) => ({ ...current, position: event.target.value }))}
          />
          <Select
            label="Role"
            value={draft.role}
            onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value as TeamUser['role'] }))}
          >
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </Select>
          <Select
            label="Department"
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
              Cancel
            </Button>
            <Button type="submit">Add user</Button>
          </div>
        </form>
      </Modal>

      <Card title={`Team users (${users.length})`} loading={loading}>
        <Table
          rows={users}
          rowKey={(user) => user.id}
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (user) => (
                <>
                  <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </>
              ),
            },
            { key: 'role', header: 'Role' },
            {
              key: 'department',
              header: 'Department',
              render: (user) => departmentById[user.departmentId]?.name || '-',
            },
            { key: 'position', header: 'Position' },
            { key: 'status', header: 'Status', render: (user) => (user.active ? 'Active' : 'Inactive') },
            {
              key: 'actions',
              header: '',
              className: 'py-3 text-right',
              render: (user) => (
                <div className="flex justify-end gap-3">
                  <Link className="text-sm text-blue-600" to="/profile">
                    Report
                  </Link>
                  <button className="text-sm text-blue-600" onClick={() => toggleActive(user)} type="button">
                    {user.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ),
            },
          ]}
          empty={
            <EmptyState
              icon={Users}
              title="No users yet"
              description="Add owners, admins, managers, and employees so work can be assigned and reported by role."
            />
          }
        />
      </Card>
    </div>
  );
};

export default TeamUsersPage;
