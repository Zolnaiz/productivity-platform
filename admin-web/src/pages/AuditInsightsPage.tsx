import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import Select from '../components/common/Select';
import Table from '../components/common/Table';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import MonthlyScoreChart from '../components/charts/MonthlyScoreChart';
import { AUDIT_PASSING_SCORE } from '../components/charts/palette';
import { monthlyTrend, shortfallPareto } from '../components/fives/auditInsights';
import { localDay } from '../components/progress/progressBoard';
import { fiveSLayoutService } from '../services/fiveSLayout.service';
import { operationsService } from '../services/operations.service';
import { FiveSZone } from '../types/fiveS.types';
import { AuditRun, AuditTemplate } from '../types/operations.types';

/**
 * Whether the 5S programme is holding, and where it slips.
 *
 * The month-by-month average against the pass mark answers the first
 * question; the Pareto of the checklist questions that fall short most
 * often answers the second - a handful of them usually account for most
 * failures, and they are where next month's improvement is.
 */
const AuditInsightsPage: React.FC = () => {
  const { t } = useTranslation();
  const [runs, setRuns] = useState<AuditRun[]>([]);
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [zones, setZones] = useState<FiveSZone[]>([]);
  const [zoneId, setZoneId] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      operationsService.getAuditRuns().catch(() => []),
      operationsService.getAuditTemplates().catch(() => []),
      fiveSLayoutService.getPlans().catch(() => []),
    ]).then(([runItems, templateItems, plans]) => {
      if (!active) return;
      setRuns(runItems ?? []);
      setTemplates(templateItems ?? []);
      setZones((plans ?? []).flatMap((plan) => plan.zones ?? []));
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const today = localDay(new Date());
  const inScope = useMemo(() => (zoneId ? runs.filter((run) => run.zoneId === zoneId) : runs), [runs, zoneId]);
  const trend = useMemo(() => monthlyTrend(inScope, today), [inScope, today]);
  // The last three months: what is failing now, not what failed last year.
  const recent = useMemo(() => {
    const since = trend[trend.length - 3]?.month ?? '';
    return inScope.filter((run) => (run.createdAt ?? '').slice(0, 7) >= since);
  }, [inScope, trend]);
  const pareto = useMemo(() => shortfallPareto(recent, templates), [recent, templates]);

  const thisMonth = trend[trend.length - 1];
  const lastMonth = trend[trend.length - 2];
  const change =
    thisMonth?.average !== null && thisMonth?.average !== undefined && lastMonth?.average !== null && lastMonth?.average !== undefined
      ? thisMonth.average - lastMonth.average
      : null;
  // The "vital few": the questions it takes to reach four failures in five.
  const vitalFew = pareto.filter((_, index) => index === 0 || pareto[index - 1].cumulative < 80);

  const tile = 'rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('insights.title')}</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-400">{t('insights.subtitle')}</p>
        </div>
        <div className="w-64">
          <Select label={t('insights.area')} value={zoneId} onChange={(event) => setZoneId(event.target.value)}>
            <option value="">{t('insights.allAreas')}</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.code} - {zone.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={tile}>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('insights.thisMonth')}</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums text-gray-900 dark:text-white" data-testid="this-month">
            {thisMonth?.average === null || thisMonth?.average === undefined ? '-' : `${thisMonth.average}%`}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('insights.walksCount', { count: thisMonth?.count ?? 0 })}</div>
        </div>
        <div className={tile}>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('insights.sinceLastMonth')}</div>
          <div
            className={`mt-1 text-3xl font-semibold tabular-nums ${
              change === null ? 'text-gray-900 dark:text-white' : change >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
            }`}
            data-testid="change"
          >
            {change === null ? '-' : `${change > 0 ? '+' : ''}${change}`}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('insights.points')}</div>
        </div>
        <div className={tile}>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('insights.passMark', { score: AUDIT_PASSING_SCORE })}</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums text-gray-900 dark:text-white">
            {zones.filter((zone) => (zone.lastAuditScore ?? -1) >= AUDIT_PASSING_SCORE).length}/{zones.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('insights.areasAtStandard')}</div>
        </div>
      </div>

      <Card title={t('insights.trendTitle')} subtitle={t('insights.trendSubtitle')}>
        {loaded && runs.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('insights.noWalks')}</p>
        ) : (
          <MonthlyScoreChart data={trend} />
        )}
      </Card>

      <Card title={t('insights.paretoTitle')} subtitle={t('insights.paretoSubtitle')}>
        {pareto.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('insights.noShortfalls')}</p>
        ) : (
          <div className="space-y-5">
            {vitalFew.length < pareto.length && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200" data-testid="vital-few">
                {t('insights.vitalFew', { count: vitalFew.length, share: vitalFew[vitalFew.length - 1]?.cumulative ?? 0 })}
              </p>
            )}
            <HorizontalBarChart
              data={pareto.slice(0, 10).map((entry) => ({ label: entry.text, value: entry.count }))}
              labelWidth={220}
              allowDecimals={false}
              valueLabel={t('insights.timesShort')}
              categoryLabel={t('insights.question')}
            />
            <Table
              rows={pareto.slice(0, 10)}
              rowKey={(row) => row.questionId}
              columns={[
                { key: 'text', header: t('insights.question'), className: 'py-2 text-gray-900 dark:text-white' },
                { key: 'count', header: t('insights.timesShort'), className: 'py-2 text-right tabular-nums', headerClassName: 'text-right' },
                { key: 'share', header: t('insights.share'), className: 'py-2 text-right tabular-nums', headerClassName: 'text-right', render: (row) => `${row.share}%` },
                { key: 'cumulative', header: t('insights.cumulative'), className: 'py-2 text-right tabular-nums', headerClassName: 'text-right', render: (row) => `${row.cumulative}%` },
              ]}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuditInsightsPage;
