import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { currentPage, visibleSections } from './navigation';

/**
 * The pages of the section somebody is in, as tabs across the top.
 *
 * What used to be a menu entry of its own - the calendar, the half-year
 * report, the audit templates - is here, next to the pages it belongs with.
 * A section with one page has no tabs.
 */
const SectionTabs: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const here = currentPage(pathname, visibleSections(user?.roles || []));

  if (!here || here.section.pages.length < 2) return null;

  return (
    <nav
      aria-label={t(here.section.labelKey)}
      data-testid="section-tabs"
      className="mb-6 overflow-x-auto border-b border-gray-200 dark:border-gray-700"
    >
      <ul className="flex min-w-max gap-1">
        {here.section.pages.map((page) => {
          const active = page.path === here.page.path;
          return (
            <li key={page.path}>
              <Link
                to={page.path}
                aria-current={active ? 'page' : undefined}
                className={`-mb-px inline-block whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                {t(page.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SectionTabs;
