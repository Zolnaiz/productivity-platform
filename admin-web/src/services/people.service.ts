import { Department, TeamUser } from '../types/people.types';

type PeopleKey = 'departments' | 'users';

const defaultDepartments: Department[] = [
  {
    id: 'd1',
    name: 'Operations',
    manager: 'Demo Owner',
    memberCount: 8,
    focusArea: 'Projects, audits, daily execution',
  },
  {
    id: 'd2',
    name: 'Quality',
    manager: 'Quality Manager',
    memberCount: 5,
    focusArea: '5S, safety, quality inspections',
  },
  {
    id: 'd3',
    name: 'Engineering',
    manager: 'Engineering Lead',
    memberCount: 7,
    focusArea: 'Automation, tooling, reporting',
  },
];

const defaultUsers: TeamUser[] = [
  {
    id: 'u1',
    name: 'Demo Owner',
    email: 'owner@example.com',
    role: 'owner',
    departmentId: 'd1',
    position: 'Workspace Owner',
    active: true,
  },
  {
    id: 'u2',
    name: 'Quality Manager',
    email: 'quality@example.com',
    role: 'manager',
    departmentId: 'd2',
    position: 'Quality Manager',
    active: true,
  },
  {
    id: 'u3',
    name: 'Employee User',
    email: 'employee@example.com',
    role: 'employee',
    departmentId: 'd1',
    position: 'Operations Specialist',
    active: true,
  },
];

const defaults = {
  departments: defaultDepartments,
  users: defaultUsers,
};

const storageKey = (key: PeopleKey) => `productivity-demo-${key}`;

const read = <T>(key: PeopleKey): T[] => {
  const stored = localStorage.getItem(storageKey(key));
  if (stored) return JSON.parse(stored) as T[];

  const initial = defaults[key] as T[];
  localStorage.setItem(storageKey(key), JSON.stringify(initial));
  return initial;
};

const write = <T>(key: PeopleKey, items: T[]) => {
  localStorage.setItem(storageKey(key), JSON.stringify(items));
  return items;
};

const create = <T extends { id: string }>(key: PeopleKey, data: Omit<T, 'id'>) => {
  const item = { ...data, id: `local-${Date.now()}` } as T;
  write(key, [item, ...read<T>(key)]);
  return item;
};

export const peopleService = {
  getDepartments: () => Promise.resolve(read<Department>('departments')),
  createDepartment: (data: Omit<Department, 'id'>) =>
    Promise.resolve(create<Department>('departments', data)),
  getUsers: () => Promise.resolve(read<TeamUser>('users')),
  createUser: (data: Omit<TeamUser, 'id'>) => Promise.resolve(create<TeamUser>('users', data)),
  updateUser: (id: string, data: Partial<TeamUser>) => {
    const updated = read<TeamUser>('users').map((user) => (user.id === id ? { ...user, ...data } : user));
    return Promise.resolve(write('users', updated).find((user) => user.id === id) as TeamUser);
  },
};
