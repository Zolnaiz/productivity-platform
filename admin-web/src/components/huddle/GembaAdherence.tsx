import React, { useEffect, useState } from 'react';
import { Footprints } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { gembaService, GembaWeek } from '../../services/gemba.service';

interface Props {
  today: string;
  /** Read again with the rest of the board. */
  readAt: Date | null;
  /** Only these people, when the board is for one department. */
  people: Set<string> | null;
  nameOf: (id?: string) => string;
  className: string;
  headingClassName: string;
}

/**
 * Whether the managers have been to the floor this week.
 *
 * A gemba walk only works as a habit; the huddle is where the habit is seen,
 * the way a lean plant's leader standard work board is.
 */
const GembaAdherence: React.FC<Props> = ({ today, readAt, people, nameOf, className, headingClassName }) => {
  const { t } = useTranslation();
  const [week, setWeek] = useState<GembaWeek | null>(null);

  useEffect(() => {
    let active = true;
    gembaService
      .getWeek(today)
      .then((value) => active && setWeek(value))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [today, readAt]);

  if (!week) return null;

  const walkers = week.walkers.filter((walker) => !people || people.has(walker.userId));
  const onTarget = walkers.filter((walker) => walker.walks >= week.target).length;
  const behind = walkers.filter((walker) => walker.walks < week.target);

  return (
    <section className={className} aria-labelledby="huddle-gemba" data-testid="huddle-gemba">
      <h2 id="huddle-gemba" className={headingClassName}>
        <Footprints className="h-5 w-5 text-blue-700 dark:text-blue-400" aria-hidden="true" />
        {t('huddle.gemba.title')}
      </h2>
      <div className="text-4xl font-bold tabular-nums text-gray-900 dark:text-white" data-testid="gemba-on-target">
        {onTarget}/{walkers.length}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{t('huddle.gemba.onTarget', { count: week.target })}</div>
      {behind.length > 0 && (
        <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
          {behind.slice(0, 5).map((walker) => (
            <li key={walker.userId} className="flex items-baseline justify-between gap-3 py-1.5 text-base">
              <span className="truncate text-gray-800 dark:text-gray-200">{nameOf(walker.userId)}</span>
              <span className="shrink-0 tabular-nums text-amber-800 dark:text-amber-300">
                {walker.walks}/{week.target}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link to="/gemba" className="mt-3 inline-block text-sm font-medium text-blue-700 underline dark:text-blue-300">
        {t('huddle.gemba.record')}
      </Link>
    </section>
  );
};

export default GembaAdherence;
