import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import { peopleService } from '../services/people.service';
import { Department, TeamUser } from '../types/people.types';

const TeamUsersPage: React.FC = () => {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [draft, setDraft] = useState({
    name: '',
    email: '',
    role: 'employee' as TeamUser['role'],
    departmentId: '',
    position: '',
  });

  useEffect(() => {
    peopleService.getUsers().then(setUsers);
    peopleService.getDepartments().then((items) => {
      setDepartments(items);
      setDraft((current) => ({ ...current, departmentId: current.departmentId || items[0]?.id || '' }));
    });
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
  };

  const toggleActive = async (user: TeamUser) => {
    const updated = await peopleService.updateUser(user.id, { active: !user.active });
    setUsers((current) => current.map((item) => (item.id === user.id ? updated : item)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Users</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Owner, admin, manager, employee role-той хэрэглэгчид болон хэлтсийн холбоос.
        </p>
      </div>

      <Card title="New user">
        <form onSubmit={createUser} className="grid gap-3 lg:grid-cols-6">
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Name"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Email"
            value={draft.email}
            onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Position"
            value={draft.position}
            onChange={(event) => setDraft((current) => ({ ...current, position: event.target.value }))}
          />
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={draft.role}
            onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value as TeamUser['role'] }))}
          >
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={draft.departmentId}
            onChange={(event) => setDraft((current) => ({ ...current, departmentId: event.target.value }))}
          >
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" type="submit">
            Add user
          </button>
        </form>
      </Card>

      <Card title={`Team users (${users.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500 dark:border-gray-700">
              <tr>
                <th className="py-3">Name</th>
                <th className="py-3">Role</th>
                <th className="py-3">Department</th>
                <th className="py-3">Position</th>
                <th className="py-3">Status</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b dark:border-gray-700">
                  <td className="py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td className="py-3">{user.role}</td>
                  <td className="py-3">{departmentById[user.departmentId]?.name || '-'}</td>
                  <td className="py-3">{user.position}</td>
                  <td className="py-3">{user.active ? 'Active' : 'Inactive'}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link className="text-sm text-blue-600" to="/profile">
                        Report
                      </Link>
                      <button className="text-sm text-blue-600" onClick={() => toggleActive(user)} type="button">
                        {user.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TeamUsersPage;
