import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bell, ClipboardCheck, NotebookPen, Plus } from 'lucide-react';

/**
 * The four things people come to the application to do, one tap each.
 *
 * Frontline apps (Beekeeper, Connecteam) open on the few actions a shift
 * needs rather than on figures. Here that is writing up the day, giving
 * out or taking on work, checking an area, and reading what one was told.
 */
const actions = [
  { key: 'writeUp', to: '/work-logs', icon: NotebookPen },
  { key: 'addTask', to: '/tasks', icon: Plus },
  { key: 'checkArea', to: '/fives', icon: ClipboardCheck },
  { key: 'readNews', to: '/notifications', icon: Bell },
] as const;

const QuickActions: React.FC = () => {
  const { t } = useTranslation();

  return (
    <nav aria-label={t('quickActions.label')}>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {actions.map(({ key, to, icon: Icon }) => (
          <li key={key}>
            <Link
              to={to}
              data-testid={`quick-${key}`}
              className="flex min-h-[4.5rem] items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm font-medium text-gray-900 transition-colors hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              {t(`quickActions.${key}`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default QuickActions;
