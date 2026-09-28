import type { LucideIcon } from 'lucide-react';
import { Activity, Bell, BarChart3, Briefcase, Lightbulb, Map as MapIcon, Settings, Sun, Users } from 'lucide-react';

/**
 * Where everything is.
 *
 * The menu had 27 entries in six groups - four of them dashboards, two of
 * them the same page as another - and an operator saw nearly all of them.
 * Apps people keep open all day hold their main menu to a handful of places
 * and put the rest one step down (Asana, Linear, Tervene). So the menu names
 * sections, and a section's pages are tabs across the top of it: nothing is
 * gone, but each person's menu is only what their job uses.
 */

export interface NavPage {
  path: string;
  labelKey: string;
  roles?: string[];
}

export interface NavSection {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  pages: NavPage[];
  roles?: string[];
}

const adminRoles = ['admin', 'super_admin'];
// Whoever runs other people's work.
const managerRoles = ['manager', 'admin', 'organization_admin', 'super_admin'];

/** Whether this person runs other people's work, and so reads the organization's figures. */
export const runsOthersWork = (userRoles: readonly string[]) => managerRoles.some((role) => userRoles.includes(role));
const ownerRoles = ['super_admin'];

export const sections: NavSection[] = [
  {
    id: 'today',
    labelKey: 'nav.section.today',
    icon: Sun,
    pages: [
      { path: '/dashboard', labelKey: 'nav.today' },
      { path: '/goals', labelKey: 'nav.goals' },
      { path: '/notes', labelKey: 'nav.notes' },
      { path: '/badges', labelKey: 'nav.badges' },
    ],
  },
  {
    id: 'team',
    labelKey: 'nav.section.team',
    icon: Activity,
    roles: managerRoles,
    pages: [
      { path: '/huddle', labelKey: 'nav.huddle' },
      { path: '/progress', labelKey: 'nav.progressBoard' },
      { path: '/gemba', labelKey: 'nav.gemba' },
    ],
  },
  {
    id: 'work',
    labelKey: 'nav.section.work',
    icon: Briefcase,
    pages: [
      { path: '/tasks', labelKey: 'nav.tasks' },
      { path: '/projects', labelKey: 'nav.projects' },
      { path: '/plan', labelKey: 'nav.monthPlan' },
      { path: '/calendar', labelKey: 'nav.calendar' },
      { path: '/work-logs', labelKey: 'nav.workLogs' },
      { path: '/weekly', labelKey: 'nav.weekly' },
    ],
  },
  {
    id: 'quality',
    labelKey: 'nav.section.quality',
    icon: MapIcon,
    pages: [
      { path: '/fives', labelKey: 'nav.fiveS' },
      { path: '/audit-insights', labelKey: 'nav.auditInsights' },
      { path: '/audit-templates', labelKey: 'nav.auditTemplates' },
      { path: '/assessments', labelKey: 'nav.assessments' },
      { path: '/responses', labelKey: 'nav.responses' },
    ],
  },
  {
    id: 'ideas',
    labelKey: 'nav.section.ideas',
    icon: Lightbulb,
    pages: [{ path: '/ideas', labelKey: 'nav.section.ideas' }],
  },
  {
    id: 'notifications',
    labelKey: 'nav.notifications',
    icon: Bell,
    pages: [{ path: '/notifications', labelKey: 'nav.notifications' }],
  },
  {
    id: 'reports',
    labelKey: 'nav.section.reports',
    icon: BarChart3,
    pages: [
      { path: '/reports', labelKey: 'nav.monthlyReport' },
      { path: '/reports/period', labelKey: 'nav.periodReports' },
      { path: '/history', labelKey: 'nav.history' },
      { path: '/analytics', labelKey: 'nav.analytics' },
      { path: '/expenses', labelKey: 'nav.expenses' },
    ],
  },
  {
    id: 'people',
    labelKey: 'nav.section.people',
    icon: Users,
    roles: adminRoles,
    pages: [
      { path: '/users', labelKey: 'nav.users' },
      { path: '/departments', labelKey: 'nav.departments' },
    ],
  },
  {
    id: 'settings',
    labelKey: 'nav.settings',
    icon: Settings,
    roles: adminRoles,
    pages: [
      { path: '/setup', labelKey: 'nav.setup' },
      { path: '/settings', labelKey: 'nav.settings' },
      { path: '/organizations', labelKey: 'nav.organizations' },
      { path: '/admin', labelKey: 'nav.adminHome' },
      { path: '/audit', labelKey: 'nav.auditLog', roles: ownerRoles },
    ],
  },
];

const allowed = (roles: string[] | undefined, userRoles: readonly string[]) =>
  !roles?.length || roles.some((role) => userRoles.includes(role));

/** The sections this person has, each holding only the pages they may open. */
export const visibleSections = (userRoles: readonly string[]): NavSection[] =>
  sections
    .filter((section) => allowed(section.roles, userRoles))
    .map((section) => ({ ...section, pages: section.pages.filter((page) => allowed(page.roles, userRoles)) }))
    .filter((section) => section.pages.length > 0);

const matches = (pathname: string, path: string) => pathname === path || pathname.startsWith(`${path}/`);

/**
 * The page of `candidates` that `pathname` is on: the longest match, so the
 * half-year report is its own tab and not the monthly one beneath it.
 */
export const currentPage = (pathname: string, candidates: readonly NavSection[]) => {
  let best: { section: NavSection; page: NavPage } | undefined;
  for (const section of candidates) {
    for (const page of section.pages) {
      if (matches(pathname, page.path) && (!best || page.path.length > best.page.path.length)) {
        best = { section, page };
      }
    }
  }
  return best;
};
