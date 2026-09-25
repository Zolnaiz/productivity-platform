import { assigneeForTier, coversTier } from './tier-assignee';

const tier = (role?: string) => ({ role });

/**
 * A layered audit exists so that somebody above the work looks at it. Sending
 * every layer's task to the person doing the work defeats the practice while
 * appearing to run it.
 */
describe('who a layered audit lands on', () => {
  it('gives the daily check to the area owner, not up to a manager', () => {
    // A supervisor doing the operator's check is not the operator's check.
    expect(
      assigneeForTier(tier('user'), {
        owner: { id: 'operator', role: 'user' },
        departmentManager: { id: 'boss', role: 'manager' },
      }),
    ).toBe('operator');
  });

  it('gives a supervisor check to the department manager, not to the operator', () => {
    // The fault this fixes: the supervisor's weekly check arrived in the
    // operator's list, which is the one place it cannot be done from.
    expect(
      assigneeForTier(tier('manager'), {
        owner: { id: 'operator', role: 'user' },
        departmentManager: { id: 'boss', role: 'manager' },
      }),
    ).toBe('boss');
  });

  it('keeps it with the owner when the department manager is not senior enough', () => {
    expect(
      assigneeForTier(tier('admin'), {
        owner: { id: 'plant-admin', role: 'admin' },
        departmentManager: { id: 'boss', role: 'manager' },
      }),
    ).toBe('plant-admin');
  });

  it('still names the owner when nobody covers the layer', () => {
    // A task nobody is named on is a task nobody does, and the layer is named
    // in the task, so whoever gets it can see what it is and pass it on.
    expect(
      assigneeForTier(tier('admin'), {
        owner: { id: 'operator', role: 'user' },
        departmentManager: { id: 'boss', role: 'manager' },
      }),
    ).toBe('operator');
  });

  it('leaves it unassigned when there is no owner at all', () => {
    expect(assigneeForTier(tier('user'), { owner: null, departmentManager: null })).toBeUndefined();
  });

  it('treats a layer that names no role as open to anybody', () => {
    expect(coversTier('viewer', tier(undefined))).toBe(true);
    expect(
      assigneeForTier(tier(undefined), {
        owner: { id: 'operator', role: 'user' },
        departmentManager: { id: 'boss', role: 'manager' },
      }),
    ).toBe('operator');
  });

  it('fails closed on a role nobody recognises', () => {
    expect(coversTier('caretaker', tier('manager'))).toBe(false);
    expect(
      assigneeForTier(tier('manager'), {
        owner: { id: 'operator', role: 'caretaker' },
        departmentManager: { id: 'boss', role: 'caretaker' },
      }),
    ).toBe('operator');
  });

  it('reads seniority the same way the permission table nests', () => {
    expect(coversTier('organization_admin', tier('manager'))).toBe(true);
    expect(coversTier('manager', tier('manager'))).toBe(true);
    expect(coversTier('user', tier('manager'))).toBe(false);
  });
});
