import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bell,
  BarChart3,
  Briefcase,
  Lightbulb,
  Map as MapIcon,
  MoreHorizontal,
  Settings,
  Sun,
  Users,
} from 'lucide-react';

/**
 * Where everything is.
 *
 * The menu had 27 entries in six groups - four of them dashboards, two of
 * them the same page as another - and an operator saw nearly all of them.
 * Apps people keep open all day hold their main menu to a handful of places
 * and put the rest one step down (Asana, Linear, Tervene). So the menu names
 * sections, and a section's pages are tabs across the top of it: nothing is
 * gone, but each person's menu is only what their job uses.
 *
 * Within that, a page marked `core` for a person's tier stays where it is;
 * every other page they may open moves to one "Other" section. An employee
 * keeps at most eight pages in sight, a manager twelve; nothing is removed.
 */

/** Whose everyday work a page is: `employee` for staff, `manager` for whoever runs others' work. */
export type Tier = 'employee' | 'manager';

export interface NavPage {
  path: string;
  labelKey: string;
  roles?: string[];
  core?: Tier[];
}

export interface NavSection {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  pages: NavPage[];
  roles?: string[];
  /** Administration: shown whole to those who may see it, never folded into "Other". */
  whole?: boolean;
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
      { path: '/dashboard', labelKey: 'nav.today', core: ['employee', 'manager'] },
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
      { path: '/huddle', labelKey: 'nav.huddle', core: ['manager'] },
      { path: '/progress', labelKey: 'nav.progressBoard', core: ['manager'] },
      { path: '/gemba', labelKey: 'nav.gemba', core: ['manager'] },
    ],
  },
  {
    id: 'work',
    labelKey: 'nav.section.work',
    icon: Briefcase,
    pages: [
      { path: '/tasks', labelKey: 'nav.tasks', core: ['employee', 'manager'] },
      { path: '/projects', labelKey: 'nav.projects', core: ['manager'] },
      { path: '/plan', labelKey: 'nav.monthPlan', core: ['manager'] },
      { path: '/calendar', labelKey: 'nav.calendar' },
      { path: '/work-logs', labelKey: 'nav.workLogs', core: ['employee', 'manager'] },
      { path: '/weekly', labelKey: 'nav.weekly', core: ['employee'] },
    ],
  },
  {
    id: 'quality',
    labelKey: 'nav.section.quality',
    icon: MapIcon,
    pages: [
      { path: '/fives', labelKey: 'nav.fiveS', core: ['employee', 'manager'] },
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
    pages: [{ path: '/ideas', labelKey: 'nav.section.ideas', core: ['employee', 'manager'] }],
  },
  {
    id: 'notifications',
    labelKey: 'nav.notifications',
    icon: Bell,
    pages: [{ path: '/notifications', labelKey: 'nav.notifications', core: ['employee', 'manager'] }],
  },
  {
    id: 'reports',
    labelKey: 'nav.section.reports',
    icon: BarChart3,
    pages: [
      { path: '/reports', labelKey: 'nav.monthlyReport', core: ['employee', 'manager'] },
      { path: '/reports/period', labelKey: 'nav.periodReports' },
      { path: '/history', labelKey: 'nav.history' },
      { path: '/analytics', labelKey: 'nav.analytics' },
      { path: '/expenses', labelKey: 'nav.expenses' },
    ],
  },
  {
    id: 'support',
    labelKey: 'nav.section.support',
    icon: Lightbulb,
    pages: [
      { path: '/help', labelKey: 'nav.help' },
      { path: '/feedback', labelKey: 'nav.feedback' },
    ],
  },
  {
    id: 'people',
    labelKey: 'nav.section.people',
    icon: Users,
    roles: adminRoles,
    whole: true,
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
    whole: true,
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

/** The tier whose everyday pages this person keeps in sight. */
export const tierOf = (userRoles: readonly string[]): Tier => (runsOthersWork(userRoles) ? 'manager' : 'employee');

/**
 * The sections this person has, each holding only the pages they may open.
 *
 * Pages that are not everyday work for their tier are gathered, in menu
 * order, into one "Other" section placed before administration.
 */
export const visibleSections = (userRoles: readonly string[]): NavSection[] => {
  const tier = tierOf(userRoles);
  const everyday: NavSection[] = [];
  const administration: NavSection[] = [];
  const other: NavPage[] = [];

  for (const section of sections) {
    if (!allowed(section.roles, userRoles)) continue;
    const pages = section.pages.filter((page) => allowed(page.roles, userRoles));
    if (section.whole) {
      if (pages.length) administration.push({ ...section, pages });
      continue;
    }
    const kept = pages.filter((page) => page.core?.includes(tier));
    other.push(...pages.filter((page) => !page.core?.includes(tier)));
    if (kept.length) everyday.push({ ...section, pages: kept });
  }

  const more: NavSection[] = other.length
    ? [{ id: 'more', labelKey: 'nav.section.more', icon: MoreHorizontal, pages: other }]
    : [];

  return [...everyday, ...more, ...administration];
};

/** How many pages a person sees outside "Other" and administration — the number kept small. */
export const everydayPageCount = (userRoles: readonly string[]) =>
  visibleSections(userRoles)
    .filter((section) => section.id !== 'more' && !section.whole)
    .reduce((count, section) => count + section.pages.length, 0);

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
