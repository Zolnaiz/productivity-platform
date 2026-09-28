import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import FiveSFloorPlanSetup from '../components/fives/FiveSFloorPlanSetup';
import FiveSGuidelineRegisters from '../components/fives/FiveSGuidelineRegisters';

const views = ['map', 'areas', 'registers'] as const;
type View = (typeof views)[number];

/**
 * 5S, one job at a time.
 *
 * The page was the floor plan editor, the area and owner lists, the red-tag
 * register and the standard's registers one under another: eight and a half
 * screens and 124 buttons, so somebody come to check who owns an area
 * scrolled past the drawing tools to find it. Now it is three tabs - the
 * map, the areas, the registers - and the tab is in the address, so a link
 * can open straight on the registers.
 */
const FiveSSetupPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const asked = searchParams.get('view');
  const view: View = views.includes(asked as View) ? (asked as View) : 'map';

  const choose = (next: View) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'map') params.delete('view');
    else params.set('view', next);
    setSearchParams(params, { replace: true });
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = views[(index + step + views.length) % views.length];
    choose(next);
    document.getElementById(`fives-tab-${next}`)?.focus();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('fiveS.title')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('fiveS.subtitle')}</p>
      </div>

      <div
        role="tablist"
        aria-label={t('fiveS.tabs.label')}
        className="inline-flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800"
      >
        {views.map((key, index) => (
          <button
            key={key}
            id={`fives-tab-${key}`}
            type="button"
            role="tab"
            aria-selected={view === key}
            aria-controls="fives-panel"
            tabIndex={view === key ? 0 : -1}
            onClick={() => choose(key)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              view === key
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {t(`fiveS.tabs.${key}`)}
          </button>
        ))}
      </div>

      <div id="fives-panel" role="tabpanel" aria-labelledby={`fives-tab-${view}`} className="space-y-6">
        {/* Kept mounted on the registers tab, so undo and unsaved drawing survive a look at them. */}
        <div hidden={view === 'registers'}>
          <FiveSFloorPlanSetup section={view === 'registers' ? 'none' : view} />
        </div>
        {view === 'registers' && <FiveSGuidelineRegisters />}
      </div>
    </div>
  );
};

export default FiveSSetupPage;
