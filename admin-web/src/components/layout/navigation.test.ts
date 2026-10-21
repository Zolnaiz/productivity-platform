import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { currentPage, everydayPageCount, sections, visibleSections } from './navigation';

describe('the menu', () => {
  it('keeps eight everyday pages for staff and twelve for a manager; the rest is under Other', () => {
    expect(everydayPageCount(['user'])).toBeLessThanOrEqual(8);
    expect(everydayPageCount(['manager'])).toBeLessThanOrEqual(12);
    expect(everydayPageCount(['user'])).toBe(8);
    expect(everydayPageCount(['manager'])).toBe(12);

    expect(visibleSections(['user']).map((section) => section.id)).toEqual([
      'today',
      'work',
      'quality',
      'ideas',
      'notifications',
      'reports',
      'more',
    ]);
    // An administrator keeps a manager's everyday pages, plus the administration sections.
    expect(visibleSections(['admin']).map((section) => section.id)).toEqual([
      'today',
      'team',
      'work',
      'quality',
      'ideas',
      'notifications',
      'reports',
      'more',
      'people',
      'settings',
    ]);
  });

  it('moves pages, never drops them: everything a role could open is still reachable', () => {
    for (const roles of [['user'], ['manager'], ['admin'], ['super_admin']]) {
      const reachable = visibleSections(roles).flatMap((section) => section.pages.map((page) => page.path));
      const permitted = sections
        .filter((section) => !section.roles || section.roles.some((role) => roles.includes(role)))
        .flatMap((section) => section.pages.filter((page) => !page.roles || page.roles.some((role) => roles.includes(role))))
        .map((page) => page.path);
      expect(new Set(reachable)).toEqual(new Set(permitted));
    }
  });

  it('puts help and feedback, goals and notes under Other for staff', () => {
    const other = visibleSections(['user']).find((section) => section.id === 'more')?.pages.map((page) => page.path);
    expect(other).toEqual(expect.arrayContaining(['/help', '/feedback', '/goals', '/notes', '/projects']));
    expect(other).not.toContain('/tasks');
  });

  it('gives a manager the team pages and the month plan in sight, the weekly check-in under Other', () => {
    const everyday = visibleSections(['manager'])
      .filter((section) => section.id !== 'more')
      .flatMap((section) => section.pages.map((page) => page.path));
    expect(everyday).toEqual(expect.arrayContaining(['/huddle', '/gemba', '/progress', '/plan', '/projects']));
    expect(everyday).not.toContain('/weekly');
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
