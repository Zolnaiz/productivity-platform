import { del, get, isDemoMode, localId, patch, post, shouldUseDemoFallback } from './api';
import {
  Department,
  IssuedInvitation,
  MemberRole,
  PendingInvitation,
  TeamUser,
} from '../types/people.types';

/**
 * The people in the organization.
 *
 * This used to keep the team in browser storage, which meant every browser had
 * its own staff list and nothing here matched who could actually sign in. It
 * now talks to the users API. Demo mode keeps a local copy so the workspace can
 * still be explored without a backend, and each demo branch names the server
 * call it stands in for.
 *
 * There is no `createUser`. The server has no create endpoint on purpose — an
 * invitation is the only way into an organization, so that joining always
 * proves an invitation was issued for that address. `invite` is what the
 * "add somebody" control does.
 */

type Paged<T> = { data: T[]; meta?: { total: number; page: number; limit: number; totalPages: number } };

export interface MemberQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: MemberRole;
}

/*
  The demo workspace is somebody's first look at the product, so its people
  belong to its departments: a staff list where nobody is in a department makes
  the departments page read as broken rather than as empty.
*/
const demoMembers: TeamUser[] = [
  {
    id: 'u1',
    firstName: 'Demo',
    lastName: 'Owner',
    email: 'owner@example.com',
    role: 'admin',
    position: 'Workspace Owner',
    isActive: true,
    departmentId: 'd1',
  },
  {
    id: 'u2',
    firstName: 'Quality',
    lastName: 'Manager',
    email: 'quality@example.com',
    role: 'manager',
    position: 'Quality Manager',
    isActive: true,
    departmentId: 'd2',
  },
  {
    id: 'u3',
    firstName: 'Employee',
    lastName: 'User',
    email: 'employee@example.com',
    role: 'user',
    position: 'Operations Specialist',
    isActive: true,
    departmentId: 'd1',
  },
  {
    id: 'u4',
    firstName: 'Shift',
    lastName: 'Viewer',
    email: 'viewer@example.com',
    role: 'viewer',
    position: 'Line Operator',
    isActive: false,
    departmentId: 'd3',
  },
];

const demoDepartments: Department[] = [
  { id: 'd1', name: 'Operations', managerId: 'u1', focusArea: 'Projects, audits, daily execution' },
  { id: 'd2', name: 'Quality', managerId: 'u2', focusArea: '5S, safety, quality inspections' },
  { id: 'd3', name: 'Engineering', managerId: 'u3', focusArea: 'Automation, tooling, reporting' },
];

const storageKey = 'productivity-demo-people';
const departmentsKey = 'productivity-demo-departments';

const readDepartments = (): Department[] => {
  const stored = localStorage.getItem(departmentsKey);

  if (stored) {
    try {
      return JSON.parse(stored) as Department[];
    } catch {
      localStorage.removeItem(departmentsKey);
    }
  }

  localStorage.setItem(departmentsKey, JSON.stringify(demoDepartments));
  return demoDepartments;
};

const writeDepartments = (departments: Department[]) => {
  localStorage.setItem(departmentsKey, JSON.stringify(departments));
  return departments;
};

const readDemo = (): TeamUser[] => {
  const stored = localStorage.getItem(storageKey);

  if (stored) {
    try {
      return JSON.parse(stored) as TeamUser[];
    } catch {
      // Corrupted storage should not take the page down with it.
      localStorage.removeItem(storageKey);
    }
  }

  localStorage.setItem(storageKey, JSON.stringify(demoMembers));
  return demoMembers;
};

const writeDemo = (members: TeamUser[]) => {
  localStorage.setItem(storageKey, JSON.stringify(members));
  return members;
};

/** Stands in for `PATCH /users/:id` and the activate/deactivate routes. */
const updateDemo = (id: string, changes: Partial<TeamUser>) => {
  const members = readDemo().map((member) => (member.id === id ? { ...member, ...changes } : member));
  writeDemo(members);

  return members.find((member) => member.id === id) as TeamUser;
};

/**
 * Reads the member page out of whatever shape came back.
 *
 * The API wraps every response as `{ success, data }`, and `get` already
 * unwraps that one layer. The members list is itself `{ data, meta }`, so a
 * second unwrap would quietly turn the page into the array inside it — and
 * `unwrapApiResponse` cannot tell the two `data` keys apart. This decides
 * explicitly rather than by shape-guessing.
 */
const toPage = (payload: unknown): Paged<TeamUser> => {
  if (Array.isArray(payload)) {
    return { data: payload as TeamUser[] };
  }

  const page = payload as Paged<TeamUser> | null;

  return Array.isArray(page?.data) ? page : { data: [] };
};

const fallback = async <T>(request: () => Promise<T>, demoData: T): Promise<T> => {
  if (isDemoMode()) {
    return demoData;
  }

  try {
    return await request();
  } catch (error) {
    if (!shouldUseDemoFallback()) {
      throw error;
    }

    return demoData;
  }
};

export const peopleService = {
  /**
   * The members of the caller's organization.
   *
   * The API answers with a page and its metadata; callers that only want the
   * list get it, and `listMembers` is there for the ones that page.
   */
  listMembers: (query: MemberQuery = {}) =>
    fallback<Paged<TeamUser>>(
      async () => toPage(await get<unknown>('/users', query)),
      { data: readDemo(), meta: { total: readDemo().length, page: 1, limit: 20, totalPages: 1 } },
    ),

  getMembers: async (query: MemberQuery = {}) => (await peopleService.listMembers(query)).data,

  /**
   * Edits a member.
   *
   * `departmentId` is here rather than on a department route: membership is
   * changed where the member is, so one person moving between departments is
   * one request rather than a list being posted back.
   */
  updateMember: (
    id: string,
    data: Pick<
      Partial<TeamUser>,
      'firstName' | 'lastName' | 'email' | 'position' | 'phone' | 'departmentId'
    >,
  ) =>
    isDemoMode()
      ? Promise.resolve(updateDemo(id, data))
      : patch<TeamUser>(`/users/${id}`, data),

  /**
   * Turning a member off and on again.
   *
   * These are separate routes rather than a field on the edit request: the
   * server refuses to let anybody deactivate themselves, and that check has to
   * live somewhere an ordinary edit cannot reach.
   */
  setMemberActive: (id: string, active: boolean) =>
    isDemoMode()
      ? Promise.resolve(updateDemo(id, { isActive: active }))
      : post<TeamUser>(`/users/${id}/${active ? 'activate' : 'deactivate'}`),

  changeMemberRole: (id: string, role: MemberRole) =>
    isDemoMode()
      ? Promise.resolve(updateDemo(id, { role }))
      : post<TeamUser>(`/users/${id}/change-role`, { role }),

  removeMember: (id: string) =>
    isDemoMode()
      ? Promise.resolve(updateDemo(id, { isActive: false }))
      : del<TeamUser>(`/users/${id}`),

  /** What the signed-in person is allowed to do, straight from the server's table. */
  getOwnPermissions: () =>
    fallback<{ permissions: string[]; role: MemberRole }>(
      () => get<{ permissions: string[]; role: MemberRole }>('/users/profile/permissions'),
      // Demo mode explores the whole workspace, so nothing is hidden there.
      { permissions: ['*'], role: 'admin' },
    ),

  getPendingInvitations: () =>
    fallback<PendingInvitation[]>(
      () => get<PendingInvitation[]>('/auth/invitations'),
      [],
    ),

  /**
   * Invites somebody to join.
   *
   * The token comes back exactly once, here — nothing stores it, so a lost
   * invitation is revoked and reissued rather than recovered.
   */
  invite: (email: string, role: MemberRole) =>
    isDemoMode()
      ? Promise.resolve<IssuedInvitation>({
          invitation: {
            id: `demo-${Date.now()}`,
            email,
            role,
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
          },
          token: 'demo-invitation-token',
        })
      : post<IssuedInvitation>('/auth/invitations', { email, role }),

  revokeInvitation: (id: string) =>
    isDemoMode()
      ? Promise.resolve({ id, revoked: true })
      : del<{ id: string; revoked: boolean }>(`/auth/invitations/${id}`),

  /**
   * Departments, from the operations API.
   *
   * This was browser-local until the question behind it was answered: a
   * department owns its people and its 5S areas. Demo mode keeps its own copy
   * so the workspace can still be explored without a backend, and every branch
   * here names the server call it stands in for.
   */
  getDepartments: async () => {
    if (isDemoMode()) return readDepartments();

    try {
      return await get<Department[]>('/departments');
    } catch (error) {
      if (!shouldUseDemoFallback()) throw error;
      return readDepartments();
    }
  },

  createDepartment: async (data: Omit<Department, 'id'>) => {
    if (!isDemoMode()) {
      return post<Department>('/departments', data);
    }

    const department = { ...data, id: localId() } as Department;
    writeDepartments([department, ...readDepartments()]);

    return department;
  },

  updateDepartment: async (id: string, data: Partial<Department>) => {
    if (!isDemoMode()) {
      return patch<Department>(`/departments/${id}`, data);
    }

    const departments = readDepartments().map((department) =>
      department.id === id ? { ...department, ...data } : department,
    );
    writeDepartments(departments);

    return departments.find((department) => department.id === id) as Department;
  },

  deleteDepartment: async (id: string) => {
    if (!isDemoMode()) {
      return del<{ id: string; deleted: boolean }>(`/departments/${id}`);
    }

    writeDepartments(readDepartments().filter((department) => department.id !== id));

    return { id, deleted: true };
  },
};
