import React from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../i18n';

/**
 * Mongolian or English, from wherever you are.
 *
 * The translations and the switch have both existed for a long time; the only
 * way to reach the switch was the Settings page, which is three clicks away
 * and which somebody who cannot read the current language has to find first.
 *
 * Each language is written in itself — `Монгол`, not `Mongolian` — so it is
 * readable whichever one is currently active. That is the whole reason this
 * control cannot use translated labels.
 */
const languages = [
  { value: 'mn-MN', short: 'МН', label: 'Монгол' },
  { value: 'en-US', short: 'EN', label: 'English' },
];

const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('mn') ? 'mn-MN' : 'en-US';

  return (
    <div
      role="radiogroup"
      aria-label="Language / Хэл"
      className="flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700"
    >
      {languages.map(({ value, short, label }) => {
        const active = current === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => void changeLanguage(value)}
            className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
              active
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {short}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageToggle;
