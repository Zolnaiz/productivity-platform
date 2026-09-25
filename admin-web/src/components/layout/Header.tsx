import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';
import { assessmentService } from '../../services/assessment.service';
import { financeService } from '../../services/finance.service';
import { operationsService } from '../../services/operations.service';

interface HeaderProps {
  onMenuClick: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  type: string;
  roles?: string[];
}

const adminRoles = ['admin', 'super_admin'];
const ownerRoles = ['super_admin'];

/**
 * The pages search can take somebody to.
 *
 * Worded from the same keys as the navigation, and described by each page's
 * own subtitle, so searching in Mongolian finds Mongolian page names. It was
 * a list of English titles, so "тайлан" found nothing, and it did not know
 * about pages added since it was written.
 */
const pageEntries: Array<{ key: string; subtitleKey?: string; path: string; roles?: string[] }> = [
  { key: 'dashboard', subtitleKey: 'dashboard.subtitle', path: '/dashboard' },
  { key: 'progressBoard', subtitleKey: 'progressBoard.subtitle', path: '/progress' },
  { key: 'monthPlan', subtitleKey: 'monthPlan.subtitle', path: '/plan' },
  { key: 'projects', subtitleKey: 'projects.subtitle', path: '/projects' },
  { key: 'tasks', subtitleKey: 'tasks.subtitle', path: '/tasks' },
  { key: 'calendar', subtitleKey: 'calendar.subtitle', path: '/calendar' },
  { key: 'workLogs', subtitleKey: 'workLogs.subtitle', path: '/work-logs' },
  { key: 'fiveS', subtitleKey: 'fiveS.subtitle', path: '/fives' },
  { key: 'responses', path: '/responses' },
  { key: 'reports', subtitleKey: 'monthlyReport.subtitle', path: '/reports' },
  { key: 'periodReports', subtitleKey: 'periodReport.subtitle', path: '/reports/period' },
  { key: 'analytics', subtitleKey: 'analytics.subtitle', path: '/analytics' },
  { key: 'expenses', subtitleKey: 'expenses.subtitle', path: '/expenses' },
  { key: 'notifications', subtitleKey: 'notifications.subtitle', path: '/notifications' },
  { key: 'users', subtitleKey: 'users.subtitle', path: '/users', roles: adminRoles },
  { key: 'departments', subtitleKey: 'departments.subtitle', path: '/departments', roles: adminRoles },
  { key: 'adminHome', subtitleKey: 'search.adminSubtitle', path: '/admin', roles: adminRoles },
  { key: 'organizations', subtitleKey: 'organizations.subtitle', path: '/organizations', roles: adminRoles },
  { key: 'settings', subtitleKey: 'settings.subtitle', path: '/settings', roles: adminRoles },
  { key: 'auditLog', subtitleKey: 'auditLog.subtitle', path: '/audit', roles: ownerRoles },
  { key: 'profile', subtitleKey: 'profile.subtitle', path: '/profile' },
  { key: 'goals', subtitleKey: 'goals.subtitle', path: '/goals' },
  { key: 'notes', subtitleKey: 'notes.subtitle', path: '/notes' },
];

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userRoles = useMemo(() => user?.roles || [], [user?.roles]);
  const visiblePageItems = useMemo<SearchItem[]>(
    () =>
      pageEntries
        .filter((item) => !item.roles?.length || item.roles.some((role) => userRoles.includes(role as any)))
        .map((item) => ({
          id: `page-${item.key}`,
          title: t(`nav.${item.key}`),
          subtitle: item.subtitleKey ? t(item.subtitleKey, { defaultValue: '' }) : '',
          path: item.path,
          type: t('search.typePage'),
          roles: item.roles,
        })),
    [t, userRoles],
  );
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [items, setItems] = useState<SearchItem[]>(visiblePageItems);

  useEffect(() => {
    let active = true;

    const loadSearchItems = async () => {
      let projects: Awaited<ReturnType<typeof operationsService.getProjects>> = [];
      let tasks: Awaited<ReturnType<typeof operationsService.getTasks>> = [];
      let auditTemplates: Awaited<ReturnType<typeof operationsService.getAuditTemplates>> = [];
      let responses: Awaited<ReturnType<typeof assessmentService.getResponses>> = [];
      let expenses: Awaited<ReturnType<typeof financeService.getExpenses>> = [];

      try {
        [projects, tasks, auditTemplates, responses, expenses] = await Promise.all([
          operationsService.getProjects(),
          operationsService.getTasks(),
          operationsService.getAuditTemplates(),
          assessmentService.getResponses(),
          financeService.getExpenses(),
        ]);
      } catch {
        if (active) {
          setItems(visiblePageItems);
        }
        return;
      }

      if (!active) return;

      setItems([
        ...visiblePageItems,
        ...projects.map((project) => ({
          id: `project-${project.id}`,
          title: project.name,
          subtitle: `${project.status} - ${project.progress}% complete`,
          path: '/projects',
          type: t('search.typeProject'),
        })),
        ...tasks.map((task) => ({
          id: `task-${task.id}`,
          title: task.title,
          subtitle: `${task.status} - ${task.priority}`,
          path: '/tasks',
          type: t('search.typeTask'),
        })),
        ...auditTemplates.map((template) => ({
          id: `audit-template-${template.id}`,
          title: template.title,
          subtitle: `${template.industry || 'General'} - ${template.category.replace('_', ' ')}`,
          path: '/fives',
          type: t('search.typeAuditTemplate'),
        })),
        ...responses.map((response) => ({
          id: `response-${response.id}`,
          title: response.respondent,
          subtitle: `${response.department} - ${response.score}% - ${response.status}`,
          path: '/responses',
          type: t('search.typeResponse'),
        })),
        ...expenses.map((expense) => ({
          id: `expense-${expense.id}`,
          title: expense.title,
          subtitle: `${expense.category} - ${expense.status}`,
          path: '/expenses',
          type: t('search.typeExpense'),
        })),
      ]);
    };

    loadSearchItems();

    return () => {
      active = false;
    };
  }, [visiblePageItems]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return visiblePageItems.slice(0, 6);

    return items
      .filter((item) =>
        `${item.title} ${item.subtitle} ${item.type}`.toLowerCase().includes(normalized),
      )
      .slice(0, 8);
  }, [items, query, visiblePageItems]);

  const goTo = (item: SearchItem) => {
    setQuery('');
    setFocused(false);
    navigate(item.path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          type="button"
          aria-label={t('search.openMenu')}
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800"
            placeholder={t('common.search')}
            type="search"
            value={query}
            onBlur={() => window.setTimeout(() => setFocused(false), 150)}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && results[0]) {
                goTo(results[0]);
              }
              if (event.key === 'Escape') {
                setFocused(false);
              }
            }}
          />
          {focused && (
            <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
              {results.length ? (
                results.map((item) => (
                  <button
                    key={item.id}
                    className="flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => goTo(item)}
                  >
                    <span className="mt-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      {item.type}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </span>
                      <span className="block truncate text-xs text-gray-500">{item.subtitle}</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">{t('search.noResults')}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="ml-4 flex items-center gap-2 sm:gap-3">
        {/*
          Both of these were fully built and unreachable: the theme context
          has supported light, dark and system from the start with every
          component styled for it, and the translations were only switchable
          from a Settings page three clicks away. A capability nobody can
          reach is the same as not having it.
        */}
        <LanguageToggle />
        <ThemeToggle />
        <div className="hidden text-right sm:block">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {user?.name || 'Admin user'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {user?.roles?.join(', ') || 'owner'}
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {t('common.logout')}
        </button>
      </div>
    </header>
  );
};

export default Header;
