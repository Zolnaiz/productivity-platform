import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import { operationsService } from '../services/operations.service';
import { peopleService } from '../services/people.service';
import { OperationsMonthlyReport } from '../types/operations.types';
import { TeamUser, memberName } from '../types/people.types';

const formatMnt = (value: number) =>
  new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency: 'MNT',
    maximumFractionDigits: 0,
  }).format(value);

const currentMonth = () => new Date().toISOString().slice(0, 7);

const MonthlyReportPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [report, setReport] = useState<OperationsMonthlyReport | null>(null);
  /**
   * The people the report is about.
   *
   * Fetched separately because the report knows ids and this knows names, and
   * because somebody with nothing recorded is worth a line of their own —
   * which can only be written by a page that knows who was there.
   */
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadReport = async () => {
      setLoading(true);
      setError(null);

      try {
        const reportData = await operationsService.getMonthlyReport(selectedMonth);
        if (active) setReport(reportData);
      } catch {
        if (active) setError(t('monthlyReport.loadFailed'));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReport();

    return () => {
      active = false;
    };
  }, [selectedMonth]);

  /*
    Names are loaded on their own, and their failure is not the report's.
    Loading both together meant a hiccup fetching the staff list blanked the
    whole month; the ids are in the report either way, and a row with an id on
    it still says what somebody did.
  */
  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(() => peopleService.getMembers())
      .then((memberData) => {
        if (active) setMembers(memberData ?? []);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const improvementActions = report
    ? report.assessmentResponses.filter((response) => response.score < 85).length
    : 0;
  const pendingExpenses = report ? report.expenses.filter((expense) => expense.status === 'submitted') : [];
  const dailyGoals = report?.dailyGoals ?? [];
  const completedDailyGoals = dailyGoals.filter((goal) => goal.completed);

  // One source for both the on-screen summary and the copyable text, so the
  // two can never drift apart.
  const summaryLines = report
    ? [
        {
          label: t('monthlyReport.labels.delivery'),
          text: t('monthlyReport.lines.delivery', {
            period: report.period,
            projects: report.totals.projects,
            tasks: report.totals.tasks,
            completion: report.kpis.completionRate,
          }),
        },
        {
          label: t('monthlyReport.labels.dailyGoals'),
          text: t('monthlyReport.lines.dailyGoals', {
            completed: report.totals.completedDailyGoals,
            total: report.totals.dailyGoals,
            rate: report.kpis.dailyGoalCompletionRate,
          }),
        },
        {
          label: t('monthlyReport.labels.trackedWork'),
          text: t('monthlyReport.lines.trackedWork', {
            hours: report.totals.totalHours,
            logs: report.totals.workLogs,
          }),
        },
        {
          label: t('monthlyReport.labels.quality'),
          text: t('monthlyReport.lines.quality', {
            audits: report.totals.auditRuns,
            responses: report.totals.assessmentResponses,
            score: report.kpis.averageAssessmentScore,
          }),
        },
        {
          label: t('monthlyReport.labels.finance'),
          text: t('monthlyReport.lines.finance', {
            approved: formatMnt(report.totals.approvedExpenseTotal),
            pending: formatMnt(report.totals.pendingExpenseTotal),
          }),
        },
        {
          label: t('monthlyReport.labels.needsAttention'),
          text: t('monthlyReport.lines.needsAttention', { count: improvementActions }),
        },
      ]
    : [];

  /**
   * One row per person: what they did, and a name to put on it.
   *
   * People with nothing recorded appear at the bottom with zeros rather than
   * being left out. A month in which somebody logged nothing is a fact about
   * the month — sometimes it means they were on leave, sometimes it means the
   * recording is not happening — and dropping them hides both.
   */
  const peopleRows = (() => {
    const recorded = report?.people ?? [];
    const byId = new Map(recorded.map((person) => [person.userId, person]));
    const named = members.map((member) => ({
      userId: member.id,
      name: memberName(member),
      month: byId.get(member.id),
    }));
    // Somebody in the records who is no longer on the list still worked.
    const departed = recorded
      .filter((person) => !members.some((member) => member.id === person.userId))
      .map((person) => ({ userId: person.userId, name: person.userId, month: person }));

    return [...named, ...departed].sort((a, b) => {
      const weight = (row: (typeof named)[number]) =>
        (row.month?.completedTasks ?? 0) + (row.month?.hours ?? 0);

      return weight(b) - weight(a);
    });
  })();

  const executiveSummary = report
    ? summaryLines.map((line) => `${line.label}: ${line.text}`).join('\n')
    : 'Monthly productivity report is loading.';

  const exportCsv = () => {
    if (!report) return;

    const rows = [
      ['Metric', 'Value'],
      ['Period', report.period],
      ['Projects', report.totals.projects],
      ['Tasks', report.totals.tasks],
      ['Completed tasks', report.totals.completedTasks],
      ['Task completion rate', `${report.kpis.completionRate}%`],
      ['Daily goals', report.totals.dailyGoals],
      ['Completed daily goals', report.totals.completedDailyGoals],
      ['Daily goal completion rate', `${report.kpis.dailyGoalCompletionRate}%`],
      ['Tracked hours', report.totals.totalHours],
      ['Work logs', report.totals.workLogs],
      ['Audit runs', report.totals.auditRuns],
      ['Assessment responses', report.totals.assessmentResponses],
      ['Average assessment score', `${report.kpis.averageAssessmentScore}%`],
      ['Approved expenses', report.totals.approvedExpenseTotal],
      ['Pending expenses', report.totals.pendingExpenseTotal],
      ['Improvement actions needed', improvementActions],
      ['Average project progress', `${report.kpis.averageProjectProgress}%`],
      [],
      // The per-person rows go in the same file: a monthly report that has to
      // be read on screen and re-typed to be shared is not a report.
      ['Person', 'Tasks done', 'Tasks assigned', 'Hours', 'Work logs', 'Audits', 'Assessments'],
      ...peopleRows.map((row) => [
        row.name,
        row.month?.completedTasks ?? 0,
        row.month?.assignedTasks ?? 0,
        (row.month?.hours ?? 0).toFixed(1),
        row.month?.workLogs ?? 0,
        row.month?.auditRuns ?? 0,
        row.month?.assessments ?? 0,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monthly-productivity-report-${report.period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copySummary = async () => {
    await navigator.clipboard.writeText(executiveSummary);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('monthlyReport.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('monthlyReport.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value || currentMonth())}
            aria-label={t('monthlyReport.reportMonth')}
          />
          <Button type="button" onClick={exportCsv} disabled={loading || !report}>
            {t('monthlyReport.exportCsv')}
          </Button>
          <Button variant="outline" type="button" onClick={copySummary} disabled={loading || !report}>
            {t('monthlyReport.copySummary')}
          </Button>
          <Button variant="outline" type="button" onClick={() => window.print()} disabled={loading || !report}>
            {t('monthlyReport.print')}
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

      {!loading && !report && !error && <Card>{t('monthlyReport.noData')}</Card>}

      {report && (
        <>
          <Card title={t('monthlyReport.executiveSummary')} subtitle={t('monthlyReport.reportingPeriod', { period: report.period })}>
            <dl className="divide-y divide-gray-200 dark:divide-gray-700">
              {summaryLines.map((line) => (
                <div key={line.label} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[160px_1fr] sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{line.label}</dt>
                  <dd className="text-sm leading-6 text-gray-800 dark:text-gray-200">{line.text}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-8">
            <Card>
              <div className="text-sm text-gray-500">{t('monthlyReport.cardProjects')}</div>
              <div className="mt-2 text-3xl font-semibold">{report.totals.projects}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">{t('monthlyReport.cardCompletion')}</div>
              <div className="mt-2 text-3xl font-semibold">{report.kpis.completionRate}%</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">{t('monthlyReport.cardHours')}</div>
              <div className="mt-2 text-3xl font-semibold">{report.totals.totalHours}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">{t('monthlyReport.cardWorkLogs')}</div>
              <div className="mt-2 text-3xl font-semibold">{report.totals.workLogs}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">{t('monthlyReport.cardGoals')}</div>
              <div className="mt-2 text-3xl font-semibold">{report.kpis.dailyGoalCompletionRate}%</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">{t('monthlyReport.cardAudits')}</div>
              <div className="mt-2 text-3xl font-semibold">{report.totals.auditRuns}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">{t('monthlyReport.cardAssessment')}</div>
              <div className="mt-2 text-3xl font-semibold">{report.kpis.averageAssessmentScore}%</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">{t('monthlyReport.cardApprovedCost')}</div>
              <div className="mt-2 text-xl font-semibold">{formatMnt(report.totals.approvedExpenseTotal)}</div>
            </Card>
          </div>

          {/*
            The month, person by person. The totals above are for a board
            paper; this is the conversation a manager actually has.
          */}
          <Card title={t('monthlyReport.peopleTitle')} subtitle={t('monthlyReport.peopleSubtitle')}>
            <div className="overflow-x-auto">
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
                  {peopleRows.map((row) => (
                    <tr key={row.userId} className={row.month ? '' : 'text-gray-400 dark:text-gray-500'}>
                      <td className="py-2 pr-4">{row.name}</td>
                      <td className="py-2 pr-4 tabular-nums">
                        {row.month
                          ? t('monthlyReport.personTasksValue', {
                              done: row.month.completedTasks,
                              total: row.month.assignedTasks,
                            })
                          : t('monthlyReport.personNothing')}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">{(row.month?.hours ?? 0).toFixed(1)}</td>
                      <td className="py-2 pr-4 tabular-nums">{row.month?.workLogs ?? 0}</td>
                      <td className="py-2 pr-4 tabular-nums">{row.month?.auditRuns ?? 0}</td>
                      <td className="py-2 tabular-nums">{row.month?.assessments ?? 0}</td>
                    </tr>
                  ))}
                  {!peopleRows.length && (
                    <tr>
                      <td className="py-3 text-gray-500" colSpan={6}>
                        {t('monthlyReport.peopleEmpty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title={t('monthlyReport.completedTasks')}>
              <div className="space-y-3">
                {report.completedTasks.length === 0 && <p className="text-sm text-gray-500">{t('monthlyReport.emptyCompletedTasks')}</p>}
                {report.completedTasks.map((task) => (
                  <div key={task.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="font-medium text-gray-900 dark:text-white">{task.title}</div>
                    <div className="mt-1 text-sm text-gray-500">{task.actualHours || 0} actual hours</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title={t('monthlyReport.workLogHighlights')}>
              <div className="space-y-3">
                {report.workLogs.length === 0 && <p className="text-sm text-gray-500">{t('monthlyReport.emptyWorkLogs')}</p>}
                {report.workLogs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">{log.logDate}</span>
                      <span className="text-gray-500">{log.hours}h</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{log.summary}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card title={t('monthlyReport.timeEntries')}>
              <div className="space-y-3">
                {report.timeEntries.length === 0 && <p className="text-sm text-gray-500">{t('monthlyReport.emptyTimeEntries')}</p>}
                {report.timeEntries.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">{entry.workDate}</span>
                      <span className="text-blue-600">{entry.hours}h</span>
                    </div>
                    {entry.note && <p className="mt-2 text-sm text-gray-500">{entry.note}</p>}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card title={t('monthlyReport.cardGoals')}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dailyGoals.length === 0 && <p className="text-sm text-gray-500">{t('monthlyReport.emptyGoals')}</p>}
              {dailyGoals.map((goal) => (
                <div key={goal.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={goal.completed ? 'font-medium text-gray-400 line-through' : 'font-medium text-gray-900 dark:text-white'}>
                        {goal.title}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">{goal.date}</div>
                    </div>
                    <span
                      className={`w-fit rounded-full px-2 py-0.5 text-xs ${
                        goal.completed ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {goal.completed ? 'Done' : 'Open'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {dailyGoals.length > 0 && (
              <p className="mt-3 text-sm text-gray-500">
                {completedDailyGoals.length}/{dailyGoals.length} daily goals completed in this period.
              </p>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title={t('monthlyReport.assessmentResponses')}>
              <div className="space-y-3">
                {report.assessmentResponses.length === 0 && (
                  <p className="text-sm text-gray-500">{t('monthlyReport.emptyAssessments')}</p>
                )}
                {report.assessmentResponses.map((response) => (
                  <div key={response.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">{response.respondent}</span>
                      <span className={response.score < 85 ? 'text-yellow-600' : 'text-green-600'}>
                        {response.score}%
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {response.department} - {response.status}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card title={t('monthlyReport.expenseSummary')}>
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="text-sm text-gray-500">{t('monthlyReport.approved')}</div>
                  <div className="mt-1 text-xl font-semibold text-green-600">
                    {formatMnt(report.totals.approvedExpenseTotal)}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="text-sm text-gray-500">{t('monthlyReport.pendingApproval')}</div>
                  <div className="mt-1 text-xl font-semibold text-yellow-600">
                    {formatMnt(report.totals.pendingExpenseTotal)}
                  </div>
                </div>
                {report.expenses.map((expense) => (
                  <div key={expense.id} className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">{expense.title}</span>
                      <span>{formatMnt(expense.amount)}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{expense.status}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title={t('monthlyReport.managementActions')}>
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="font-medium text-gray-900 dark:text-white">{t('monthlyReport.improvementActions')}</div>
                  <div className="mt-1 text-2xl font-semibold text-blue-600">{improvementActions}</div>
                  <p className="mt-1 text-gray-500">{t('monthlyReport.improvementHint')}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="font-medium text-gray-900 dark:text-white">{t('monthlyReport.pendingApprovals')}</div>
                  <div className="mt-1 text-2xl font-semibold text-yellow-600">{pendingExpenses.length}</div>
                  <p className="mt-1 text-gray-500">Submitted expenses waiting for owner/admin decision.</p>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlyReportPage;
