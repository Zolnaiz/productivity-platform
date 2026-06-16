import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
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

const pageItems: SearchItem[] = [
  { id: 'page-dashboard', title: 'Dashboard', subtitle: 'Operations overview', path: '/dashboard', type: 'Page' },
  { id: 'page-projects', title: 'Projects', subtitle: 'Project progress and status', path: '/projects', type: 'Page' },
  { id: 'page-tasks', title: 'Tasks', subtitle: 'Task and Kanban workflow', path: '/tasks', type: 'Page' },
  { id: 'page-calendar', title: 'Calendar', subtitle: 'Deadlines and audit schedule', path: '/calendar', type: 'Page' },
  { id: 'page-work-logs', title: 'Work Logs', subtitle: 'Daily employee work logs', path: '/work-logs', type: 'Page' },
  { id: 'page-fives', title: '5S / Audits', subtitle: 'Industry inspection templates', path: '/fives', type: 'Page' },
  { id: 'page-questionnaires', title: 'Questionnaires', subtitle: 'Assessment template builder', path: '/questionnaires', type: 'Page' },
  { id: 'page-responses', title: 'Responses', subtitle: 'Assessment response review', path: '/responses', type: 'Page' },
  { id: 'page-reports', title: 'Reports', subtitle: 'Monthly productivity report', path: '/reports', type: 'Page' },
  { id: 'page-analytics', title: 'Analytics', subtitle: 'Productivity and department analytics', path: '/analytics', type: 'Page' },
  { id: 'page-expenses', title: 'Expenses', subtitle: 'Project expenses and approvals', path: '/expenses', type: 'Page' },
  { id: 'page-users', title: 'Users', subtitle: 'Team members and roles', path: '/users', type: 'Page', roles: adminRoles },
  { id: 'page-departments', title: 'Departments', subtitle: 'Team structure', path: '/departments', type: 'Page', roles: adminRoles },
  { id: 'page-admin', title: 'Admin', subtitle: 'Workspace control center', path: '/admin', type: 'Page', roles: adminRoles },
  { id: 'page-organizations', title: 'Organizations', subtitle: 'Workspace profile', path: '/organizations', type: 'Page', roles: adminRoles },
  { id: 'page-settings', title: 'Settings', subtitle: 'Workspace automation rules', path: '/settings', type: 'Page', roles: adminRoles },
  { id: 'page-audit', title: 'Audit Log', subtitle: 'Owner activity and security events', path: '/audit', type: 'Page', roles: ownerRoles },
  { id: 'page-profile', title: 'Profile', subtitle: 'Employee monthly summary', path: '/profile', type: 'Page' },
  { id: 'page-goals', title: 'Goals', subtitle: 'Daily productivity goals', path: '/goals', type: 'Page' },
  { id: 'page-notes', title: 'Notes', subtitle: 'Personal and project notes', path: '/notes', type: 'Page' },
];

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userRoles = useMemo(() => user?.roles || [], [user?.roles]);
  const visiblePageItems = useMemo(
    () => pageItems.filter((item) => !item.roles?.length || item.roles.some((role) => userRoles.includes(role as any))),
    [userRoles],
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
          type: 'Project',
        })),
        ...tasks.map((task) => ({
          id: `task-${task.id}`,
          title: task.title,
          subtitle: `${task.status} - ${task.priority}`,
          path: '/tasks',
          type: 'Task',
        })),
        ...auditTemplates.map((template) => ({
          id: `audit-template-${template.id}`,
          title: template.title,
          subtitle: `${template.industry || 'General'} - ${template.category.replace('_', ' ')}`,
          path: '/fives',
          type: 'Audit Template',
        })),
        ...responses.map((response) => ({
          id: `response-${response.id}`,
          title: response.respondent,
          subtitle: `${response.department} - ${response.score}% - ${response.status}`,
          path: '/responses',
          type: 'Response',
        })),
        ...expenses.map((expense) => ({
          id: `expense-${expense.id}`,
          title: expense.title,
          subtitle: `${expense.category} - ${expense.status}`,
          path: '/expenses',
          type: 'Expense',
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
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800"
            placeholder="Search tasks, projects, audits, reports..."
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
                <div className="px-4 py-3 text-sm text-gray-500">No matching result</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="ml-4 flex items-center gap-3">
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
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
