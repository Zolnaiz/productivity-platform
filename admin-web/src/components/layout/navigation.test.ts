import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { currentPage, sections, visibleSections } from './navigation';

describe('the menu', () => {
  it('is short for everybody: six places for staff, seven for a manager, nine for an admin', () => {
    expect(visibleSections(['user']).map((section) => section.id)).toEqual([
      'today',
      'work',
      'quality',
      'ideas',
      'notifications',
      'reports',
    ]);
    expect(visibleSections(['manager'])).toHaveLength(7);
    expect(visibleSections(['admin'])).toHaveLength(9);
  });

  it('keeps the owner-only audit log from an admin who is not the owner', () => {
    const settings = (roles: string[]) =>
      visibleSections(roles).find((section) => section.id === 'settings')?.pages.map((page) => page.path);
    expect(settings(['admin'])).not.toContain('/audit');
    expect(settings(['super_admin'])).toContain('/audit');
  });

  it('lists every page once', () => {
    const paths = sections.flatMap((section) => section.pages.map((page) => page.path));
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('points only at pages the application has', () => {
    const routes = readFileSync(resolve(__dirname, '../../App.tsx'), 'utf-8');
    for (const section of sections) {
      for (const page of section.pages) {
        expect(routes, page.path).toContain(`path="${page.path.slice(1)}"`);
      }
    }
  });

  it('knows which tab a page is, the half-year report included', () => {
    const all = visibleSections(['super_admin']);
    expect(currentPage('/reports/period', all)?.page.path).toBe('/reports/period');
    expect(currentPage('/reports', all)?.page.path).toBe('/reports');
    expect(currentPage('/tasks', all)?.section.id).toBe('work');
    // A page outside the menu belongs to no section and shows no tabs.
    expect(currentPage('/zone/plan-1/zone-1', all)).toBeUndefined();
  });
});
