import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Select from '../components/common/Select';
import { operationsService } from '../services/operations.service';
import { peopleService } from '../services/people.service';
import { spanOf } from '../components/reports/periodReport';
import { PeriodReport } from '../types/operations.types';
import { TeamUser, memberName } from '../types/people.types';
import { scrollArea } from '../components/common/scrollArea';

type Span = 'h1' | 'h2' | 'year';

/**
 * The half-year and the year.
 *
 * The reports a director and a funder actually ask for. Nothing produced
 * them: somebody opened six monthly reports and added the figures up by hand,
 * which is exactly the work a productivity system is supposed to take away.
 */
const PeriodReportPage: React.FC = () => {
  const { t } = useTranslation();
  const thisYear = new Date().getUTCFullYear();
  // Opens on the period somebody is most likely writing up: from July, this
  // year's first half; before it, last year as a whole.
  const inSecondHalf = new Date().getUTCMonth() >= 6;
  const [year, setYear] = useState(inSecondHalf ? thisYear : thisYear - 1);
  const [span, setSpan] = useState<Span>(inSecondHalf ? 'h1' : 'year');
  const [report, setReport] = useState<PeriodReport | null>(null);
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const { from, to } = spanOf(year, span);

    setLoading(true);
    setError(null);
    operationsService
      .getPeriodReport(from, to)
      .then((data) => {
        if (active) setReport(data);
      })
      .catch(() => {
        if (active) setError(t('periodReport.loadFailed'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [year, span]);

  // Names are the report's garnish, not its substance: a failure here leaves
  // the ids on the rows and the rest of the page standing.
  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(() => peopleService.getMembers())
      .then((data) => {
        if (active) setMembers(data ?? []);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const nameOf = (userId: string) => {
    const member = members.find((candidate) => candidate.id === userId);

    return member ? memberName(member) : userId;
  };

  const years = Array.from({ length: 5 }, (_, index) => thisYear - index);

  const exportCsv = () => {
    if (!report) return;
    // In the language of whoever exports it, like the page it comes from.
    const c = (key: string, options?: Record<string, unknown>) => t(`reportCsv.${key}`, options);

    const rows: Array<Array<string | number>> = [
      [c('period'), c('range', { from: report.from, to: report.to })],
      [c('closedMonths'), c('closedOfTotal', { closed: report.closedMonths, total: report.months.length })],
      [c('tasksDone'), report.totals.completedTasks],
      [c('completionRate'), `${report.kpis.completionRate}%`],
      [c('trackedHours'), report.totals.totalHours],
      [c('workLogs'), report.totals.workLogs],
      [c('auditRuns'), report.totals.auditRuns],
      [c('averageAssessmentScore'), `${report.kpis.averageAssessmentScore}%`],
      [c('dailyGoalCompletionRate'), `${report.kpis.dailyGoalCompletionRate}%`],
      [c('approvedExpenses'), report.totals.approvedExpenseTotal],
      [],
      ['month', 'status', 'tasksDone', 'completionRate', 'hours', 'workLogs', 'audits'].map((key) => c(key)),
      ...report.months.map((month) => [
        month.period,
        month.closed ? c('closed') : c('open'),
        month.totals.completedTasks,
        `${month.kpis.completionRate}%`,
        month.totals.totalHours,
        month.totals.workLogs,
        month.totals.auditRuns,
      ]),
      [],
      ['person', 'tasksDone', 'tasksAssigned', 'hours', 'workLogs', 'audits', 'assessments'].map((key) => c(key)),
      ...report.people.map((person) => [
        nameOf(person.userId),
        person.completedTasks,
        person.assignedTasks,
        person.hours.toFixed(1),
        person.workLogs,
        person.auditRuns,
        person.assessments,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `productivity-report-${report.from}-${report.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const cards = report
    ? [
        { label: t('periodReport.tasksDone'), value: report.totals.completedTasks },
        { label: t('periodReport.completion'), value: `${report.kpis.completionRate}%` },
        { label: t('periodReport.hours'), value: report.totals.totalHours },
        { label: t('periodReport.workLogs'), value: report.totals.workLogs },
        { label: t('periodReport.audits'), value: report.totals.auditRuns },
        { label: t('monthlyReport.cardAssessment'), value: `${report.kpis.averageAssessmentScore}%` },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('periodReport.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('periodReport.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-28">
            <Select
              label={t('periodReport.year')}
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
            >
              {years.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {candidate}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-56">
            <Select
              label={t('periodReport.span')}
              value={span}
              onChange={(event) => setSpan(event.target.value as Span)}
            >
              <option value="h1">{t('periodReport.spanH1')}</option>
              <option value="h2">{t('periodReport.spanH2')}</option>
              <option value="year">{t('periodReport.spanYear')}</option>
            </Select>
          </div>
          <Button type="button" onClick={exportCsv} disabled={loading || !report}>
            {t('monthlyReport.exportCsv')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <Card loading>
          <div />
        </Card>
      )}

      {report && !loading && (
        <>
          {/*
            Whether the year can still move. A figure quoted in an annual
            report has to be one that will say the same thing next month.
          */}
          <div
            data-testid="period-close-status"
            className={`rounded-lg border px-4 py-3 text-sm ${
              report.closedMonths === report.months.length
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300'
            }`}
          >
            {report.closedMonths === report.months.length
              ? t('periodReport.allClosed')
              : `${t('periodReport.closedCount', { closed: report.closedMonths, total: report.months.length })} ${t(
                  'periodReport.openWarning',
                )}`}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {cards.map((card) => (
              <Card key={card.label}>
                <div className="text-sm text-gray-500 dark:text-gray-400">{card.label}</div>
                <div className="mt-2 text-3xl font-semibold tabular-nums text-gray-900 dark:text-white">
                  {card.value}
                </div>
              </Card>
            ))}
          </div>

          <Card title={t('periodReport.monthsTitle')}>
            <div className={scrollArea} tabIndex={0}>
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                <thead className="text-left text-xs font-medium uppercase text-gray-500">
                  <tr>
                    <th className="py-2 pr-4">{t('periodReport.month')}</th>
                    <th className="py-2 pr-4">{t('periodReport.status')}</th>
                    <th className="py-2 pr-4">{t('periodReport.tasksDone')}</th>
                    <th className="py-2 pr-4">{t('periodReport.completion')}</th>
                    <th className="py-2 pr-4">{t('periodReport.hours')}</th>
                    <th className="py-2 pr-4">{t('periodReport.workLogs')}</th>
                    <th className="py-2">{t('periodReport.audits')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {report.months.map((month) => (
                    <tr key={month.period} data-testid="period-month-row">
                      <td className="py-2 pr-4 tabular-nums">
                        <Link
                          to={`/reports?month=${month.period}`}
                          className="font-medium text-blue-700 hover:underline dark:text-blue-300"
                        >
                          {month.period}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            month.closed
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {month.closed ? t('periodReport.statusClosed') : t('periodReport.statusOpen')}
                        </span>
                      </td>
                      <td className="py-2 pr-4 tabular-nums">{month.totals.completedTasks}</td>
                      <td className="py-2 pr-4 tabular-nums">{month.kpis.completionRate}%</td>
                      <td className="py-2 pr-4 tabular-nums">{month.totals.totalHours}</td>
                      <td className="py-2 pr-4 tabular-nums">{month.totals.workLogs}</td>
                      <td className="py-2 tabular-nums">{month.totals.auditRuns}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title={t('periodReport.peopleTitle')}>
            <div className={scrollArea} tabIndex={0}>
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                <thead className="text-left text-xs font-medium uppercase text-gray-500">
                  <tr>
                    <th className="py-2 pr-4">{t('monthlyReport.person')}</th>
                    <th className="py-2 pr-4">{t('monthlyReport.personTasks')}</th>
                    <th className="py-2 pr-4">{t('monthlyReport.personHours')}</th>
                    <th className="py-2 pr-4">{t('monthlyReport.personLogs')}</th>
                    <th className="py-2 pr-4">{t('monthlyReport.personAudits')}</th>
                    <th className="py-2">{t('monthlyReport.personAssessments')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {report.people.map((person) => (
                    <tr key={person.userId}>
                      <td className="py-2 pr-4">{nameOf(person.userId)}</td>
                      <td className="py-2 pr-4 tabular-nums">
                        {t('monthlyReport.personTasksValue', {
                          done: person.completedTasks,
                          total: person.assignedTasks,
                        })}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">{person.hours.toFixed(1)}</td>
                      <td className="py-2 pr-4 tabular-nums">{person.workLogs}</td>
                      <td className="py-2 pr-4 tabular-nums">{person.auditRuns}</td>
                      <td className="py-2 tabular-nums">{person.assessments}</td>
                    </tr>
                  ))}
                  {!report.people.length && (
                    <tr>
                      <td className="py-3 text-gray-500" colSpan={6}>
                        {t('periodReport.peopleEmpty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default PeriodReportPage;
