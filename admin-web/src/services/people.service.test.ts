import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('peopleService demo storage', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('recovers default departments when stored data is invalid JSON', async () => {
    localStorage.setItem('productivity-demo-departments', '{broken-json');
    const { peopleService } = await import('./people.service');

    const departments = await peopleService.getDepartments();

    expect(departments.length).toBeGreaterThan(0);
    expect(departments[0]).toHaveProperty('memberCount');
    expect(localStorage.getItem('productivity-demo-departments')).not.toBe('{broken-json');
  });

  it('recovers default users when stored data is invalid JSON', async () => {
    localStorage.setItem('productivity-demo-users', '{broken-json');
    const { peopleService } = await import('./people.service');

    const users = await peopleService.getUsers();

    expect(users.length).toBeGreaterThan(0);
    expect(users[0]).toHaveProperty('email');
    expect(localStorage.getItem('productivity-demo-users')).not.toBe('{broken-json');
  });
});
