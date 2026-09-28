import React, { useEffect, useMemo, useState } from 'react';
import { Award, CalendarCheck, ClipboardCheck, FolderCheck, Lightbulb, Printer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import { HistoryEvent, HistoryKind, historyEvents } from '../components/history/history';
import { fiveSLayoutService } from '../services/fiveSLayout.service';
import { ideaService } from '../services/idea.service';
import { operationsService } from '../services/operations.service';

const kindIcon: Record<HistoryKind, { icon: LucideIcon; tone: string }> = {
  monthClosed: { icon: CalendarCheck, tone: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  projectDone: { icon: FolderCheck, tone: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
  ideaInPlace: { icon: Lightbulb, tone: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
  firstAudit: { icon: ClipboardCheck, tone: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  reachedStandard: { icon: Award, tone: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300' },
};

/**
 * The organization's history: a timeline of what it did.
 *
 * Every closed month, finished project, idea put in place, first audit of
 * an area and the day it first reached standard - read from what the
 * application already keeps, by year, so the year can be looked back on
 * (and printed for the annual review) without anybody writing it up.
 */
const HistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    let active = true;
    const settle = <T,>(request: () => Promise<T>, fallback: T) => Promise.resolve().then(request).catch(() => fallback);
    Promise.all([
      settle(() => operationsService.getClosedMonths(), []),
      settle(() => operationsService.getProjects(), []),
      settle(() => ideaService.getIdeas(), []),
      settle(() => fiveSLayoutService.getPlans(), []),
      settle(() => operationsService.getAuditRuns(), []),
    ]).then(([closes, projects, ideas, plans, runs]) => {
      if (!active) return;
      setEvents(
        historyEvents({
          closes: closes ?? [],
          projects: projects ?? [],
          ideas: ideas ?? [],
          zones: (plans ?? []).flatMap((plan) => plan.zones ?? []),
          runs: runs ?? [],
        }),
      );
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const years = useMemo(() => {
    const found = new Set(events.map((event) => event.date.slice(0, 4)));
    found.add(String(new Date().getFullYear()));
    return [...found].sort().reverse();
  }, [events]);

  const inYear = events.filter((event) => event.date.startsWith(year));
  const byMonth = useMemo(() => {
    const groups = new Map<string, HistoryEvent[]>();
    for (const event of inYear) {
      const month = event.date.slice(0, 7);
      groups.set(month, [...(groups.get(month) ?? []), event]);
    }
    return [...groups.entries()];
  }, [inYear]);

  const counts = (kind: HistoryKind) => inYear.filter((event) => event.kind === kind).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('history.title')}</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-400">{t('history.subtitle')}</p>
        </div>
        <div className="flex items-end gap-3 print:hidden">
          <div className="w-32">
            <Select label={t('history.year')} value={year} onChange={(event) => setYear(event.target.value)}>
              {years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
          <Button variant="outline" icon={Printer} type="button" onClick={() => window.print()}>
            {t('history.print')}
          </Button>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-5" data-testid="year-summary">
        {(Object.keys(kindIcon) as HistoryKind[]).map((kind) => (
          <div key={kind} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <dt className="text-sm text-gray-600 dark:text-gray-400">{t(`history.kinds.${kind}`)}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">{counts(kind)}</dd>
          </div>
        ))}
      </dl>

      {loaded && inYear.length === 0 && <p className="text-sm text-gray-600 dark:text-gray-400">{t('history.empty')}</p>}

      <div className="space-y-8" data-testid="timeline">
        {byMonth.map(([month, items]) => (
          <section key={month} aria-labelledby={`history-${month}`}>
            <h2 id={`history-${month}`} className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
              {t('history.month', { month: Number(month.slice(5)), year: month.slice(0, 4) })}
            </h2>
            <ol className="relative space-y-3 border-l-2 border-gray-200 pl-6 dark:border-gray-700">
              {items.map((event, index) => {
                const { icon: Icon, tone } = kindIcon[event.kind];
                return (
                  <li key={`${event.kind}-${event.subject}-${index}`} className="relative" data-testid="history-event">
                    <span className={`absolute -left-[2.35rem] flex h-7 w-7 items-center justify-center rounded-full ${tone}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {t(`history.events.${event.kind}`, { subject: event.subject, score: event.score ?? '' })}
                    </div>
                    <div className="text-xs tabular-nums text-gray-600 dark:text-gray-400">{event.date}</div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
};

export default HistoryPage;
