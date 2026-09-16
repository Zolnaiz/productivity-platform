import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

type Choice = 'light' | 'dark' | 'system';

const choices: Array<{ value: Choice; icon: typeof Sun; label: string }> = [
  { value: 'light', icon: Sun, label: 'theme.light' },
  { value: 'dark', icon: Moon, label: 'theme.dark' },
  { value: 'system', icon: Monitor, label: 'theme.system' },
];

/**
 * Light, dark, or whatever the machine is set to.
 *
 * `ThemeContext` has supported all three from the beginning — it persists the
 * choice, follows the operating system when asked to, and every component in
 * the application already carries its dark styling. Nothing anywhere let a
 * person choose. The capability was complete and unreachable, which is the
 * same as not having it.
 *
 * Three buttons rather than one that cycles: a cycling toggle cannot show what
 * the current setting *is*, and "system" is invisible in it — somebody on a
 * machine set to dark cannot tell whether they chose dark or inherited it.
 */
const ThemeToggle: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label={t('theme.label')}
      className="flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700"
    >
      {choices.map(({ value, icon: Icon, label }) => {
        const active = theme === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(label)}
            title={t(label)}
            onClick={() => setTheme(value)}
            className={`rounded-md p-1.5 transition-colors ${
              active
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
