import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('adminService demo storage', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('recovers default workspace profile when stored data is invalid JSON', async () => {
    localStorage.setItem('productivity-demo-workspace-profile', '{broken-json');
    const { adminService } = await import('./admin.service');

    const profile = await adminService.getWorkspaceProfile();

    expect(profile.id).toBe('workspace-demo');
    expect(localStorage.getItem('productivity-demo-workspace-profile')).not.toBe('{broken-json');
  });

  it('recovers default audit log when stored data is invalid JSON', async () => {
    localStorage.setItem('productivity-demo-audit-log', '{broken-json');
    const { adminService } = await import('./admin.service');

    const logs = await adminService.getAuditLog();

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]).toHaveProperty('module');
    expect(localStorage.getItem('productivity-demo-audit-log')).not.toBe('{broken-json');
  });
});
