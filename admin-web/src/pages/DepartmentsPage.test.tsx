import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DepartmentsPage from './DepartmentsPage';

const serviceMocks = vi.hoisted(() => ({
  getDepartments: vi.fn(),
  getMembers: vi.fn(),
  createDepartment: vi.fn(),
  deleteDepartment: vi.fn(),
  getPlans: vi.fn(),
}));

vi.mock('../services/people.service', () => ({
  peopleService: {
    getDepartments: serviceMocks.getDepartments,
    getMembers: serviceMocks.getMembers,
    createDepartment: serviceMocks.createDepartment,
    deleteDepartment: serviceMocks.deleteDepartment,
  },
}));

vi.mock('../services/fiveSLayout.service', () => ({
  fiveSLayoutService: { getPlans: serviceMocks.getPlans },
}));

const signedIn = vi.hoisted(() => ({ permissions: [] as string[] }));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { roles: ['admin'] },
    hasPermission: (permission: string) => signedIn.permissions.includes(permission),
  }),
}));

const member = (id: string, firstName: string, departmentId?: string) => ({
  id,
  firstName,
  lastName: 'Person',
  email: `${id}@example.com`,
  role: 'user',
  isActive: true,
  departmentId,
});

const plan = (zones: Array<Record<string, unknown>>) => ({
  id: 'l1',
  name: 'Ground floor',
  zones,
  objects: [],
});

describe('the departments an organization is made of', () => {
  beforeEach(() => {
    signedIn.permissions = ['departments:create', 'departments:delete'];
    serviceMocks.getDepartments.mockReset();
    serviceMocks.getDepartments.mockResolvedValue([
      { id: 'd1', name: 'Assembly', managerId: 'u2', focusArea: 'Line 1 and 2' },
      { id: 'd2', name: 'Warehouse', focusArea: '' },
    ]);
    serviceMocks.getMembers.mockReset();
    serviceMocks.getMembers.mockResolvedValue([
      member('u1', 'Bat'),
      member('u2', 'Sara', 'd1'),
      member('u3', 'Otgon', 'd1'),
    ]);
    serviceMocks.getPlans.mockReset();
    serviceMocks.getPlans.mockResolvedValue([
      plan([{ id: 'z1', departmentId: 'd1' }, { id: 'z2' }]),
      plan([{ id: 'z3', departmentId: 'd1' }, { id: 'z4', departmentId: 'd2' }]),
    ]);
    serviceMocks.createDepartment.mockReset();
    serviceMocks.createDepartment.mockResolvedValue({ id: 'd3', name: 'Maintenance' });
    serviceMocks.deleteDepartment.mockReset();
    serviceMocks.deleteDepartment.mockResolvedValue({ id: 'd1', deleted: true });
  });

  it('counts the people from the people, not from a number somebody typed', async () => {
    // A member count entered by hand is wrong by the end of the week.
    render(<DepartmentsPage />);

    const assembly = (await screen.findByText('Assembly')).closest('div')?.parentElement;
    expect(assembly?.textContent).toContain('Members: 2');
  });

  it('counts the areas across every floor, not only the first', async () => {
    // A building has a plan per floor, and a department that keeps the whole
    // building tidy would otherwise read as responsible for half of it.
    render(<DepartmentsPage />);

    const assembly = (await screen.findByText('Assembly')).closest('div')?.parentElement;
    expect(assembly?.textContent).toContain('5S areas: 2');
  });

  it('names a manager who exists, and says so plainly when there is none', async () => {
    render(<DepartmentsPage />);

    expect(await screen.findByText(/Sara Person/)).toBeTruthy();
    expect(screen.getByText(/No manager yet/)).toBeTruthy();
  });

  it('offers nothing to change to somebody who may not change it', async () => {
    // A line manager runs their shift; they do not redraw the organization,
    // and a button that always fails is worse than no button.
    signedIn.permissions = [];

    render(<DepartmentsPage />);
    await screen.findByText('Assembly');

    expect(screen.queryByRole('button', { name: /New department/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Remove Assembly/ })).toBeNull();
  });

  it('creates a department with a manager chosen from the staff list', async () => {
    render(<DepartmentsPage />);
    await screen.findByText('Assembly');

    fireEvent.click(screen.getByRole('button', { name: /New department/ }));
    fireEvent.change(await screen.findByPlaceholderText('Department name'), {
      target: { value: 'Maintenance' },
    });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'u1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add department' }));

    await waitFor(() =>
      expect(serviceMocks.createDepartment).toHaveBeenCalledWith({
        name: 'Maintenance',
        managerId: 'u1',
        focusArea: undefined,
      }),
    );
  });

  it('asks before removing one, and says what keeps pointing at it', async () => {
    render(<DepartmentsPage />);
    await screen.findByText('Assembly');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Assembly' }));

    expect(await screen.findByText(/keep pointing at it/)).toBeTruthy();
    expect(serviceMocks.deleteDepartment).not.toHaveBeenCalled();
  });

  it('says so when the list cannot be loaded, rather than showing an empty organization', async () => {
    serviceMocks.getDepartments.mockRejectedValue(new Error('offline'));

    render(<DepartmentsPage />);

    expect(await screen.findByRole('alert')).toBeTruthy();
  });
});
