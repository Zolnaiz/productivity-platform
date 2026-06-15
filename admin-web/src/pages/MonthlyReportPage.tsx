import React, { useEffect, useState } from 'react';
import Card from '../components/common/Card';
import { operationsService } from '../services/operations.service';
import { OperationsMonthlyReport } from '../types/operations.types';

const formatMnt = (value: number) =>
  new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency: 'MNT',
    maximumFractionDigits: 0,
  }).format(value);

const currentMonth = () => new Date().toISOString().slice(0, 7);

const MonthlyReportPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [report, setReport] = useState<OperationsMonthlyReport | null>(null);
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
        if (active) setError('Сарын тайлангийн өгөгдөл ачаалж чадсангүй.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReport();

    return () => {
      active = false;
    };
  }, [selectedMonth]);

  const improvementActions = report
    ? report.assessmentResponses.filter((response) => response.score < 85).length
    : 0;
  const pendingExpenses = report ? report.expenses.filter((expense) => expense.status === 'submitted') : [];

  const executiveSummary = report
    ? [
        `Monthly productivity report (${report.period}): ${report.totals.projects} projects, ${report.totals.tasks} tasks, ${report.kpis.completionRate}% task completion.`,
        `Tracked work: ${report.totals.totalHours} hours and ${report.totals.workLogs} work logs.`,
        `Quality and compliance: ${report.totals.auditRuns} audit runs; ${report.totals.assessmentResponses} assessment responses with ${report.kpis.averageAssessmentScore}% average score.`,
        `Finance: ${formatMnt(report.totals.approvedExpenseTotal)} approved expenses and ${formatMnt(report.totals.pendingExpenseTotal)} waiting approval.`,
        `Management attention: ${improvementActions} improvement actions need follow-up.`,
      ].join('\n')
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
      ['Tracked hours', report.totals.totalHours],
      ['Work logs', report.totals.workLogs],
      ['Audit runs', report.totals.auditRuns],
      ['Assessment responses', report.totals.assessmentResponses],
      ['Average assessment score', `${report.kpis.averageAssessmentScore}%`],
      ['Approved expenses', report.totals.approvedExpenseTotal],
      ['Pending expenses', report.totals.pendingExpenseTotal],
      ['Improvement actions needed', improvementActions],
      ['Average project progress', `${report.kpis.averageProjectProgress}%`],
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Monthly Report</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Төсөл, task, work log, time entry, audit, assessment, expense өгөгдлөөс сарын нэгдсэн тайлан гаргана.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value || currentMonth())}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            aria-label="Report month"
          />
          <button
            type="button"
            onClick={exportCsv}
            disabled={loading || !report}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={copySummary}
            disabled={loading || !report}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Copy summary
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={loading || !report}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Print
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && <Card>Сарын тайлангийн өгөгдөл ачаалж байна...</Card>}

      {!loading && !report && !error && <Card>Энэ сард тайлангийн өгөгдөл олдсонгүй.</Card>}

      {report && (
        <>
          <Card title="Executive summary">
            <pre className="whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-300">
              {executiveSummary}
            </pre>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            <Card>
              <div className="text-sm text-gray-500">Projects</div>
              <div className="mt-2 text-3xl font-semibold">{report.totals.projects}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Completion</div>
              <div className="mt-2 text-3xl font-semibold">{report.kpis.completionRate}%</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Tracked hours</div>
              <div className="mt-2 text-3xl font-semibold">{report.totals.totalHours}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Work logs</div>
              <div className="mt-2 text-3xl font-semibold">{report.totals.workLogs}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Audit runs</div>
              <div className="mt-2 text-3xl font-semibold">{report.totals.auditRuns}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Assessment</div>
              <div className="mt-2 text-3xl font-semibold">{report.kpis.averageAssessmentScore}%</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Approved cost</div>
              <div className="mt-2 text-xl font-semibold">{formatMnt(report.totals.approvedExpenseTotal)}</div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Completed tasks">
              <div className="space-y-3">
                {report.completedTasks.length === 0 && <p className="text-sm text-gray-500">Completed task алга.</p>}
                {report.completedTasks.map((task) => (
                  <div key={task.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="font-medium text-gray-900 dark:text-white">{task.title}</div>
                    <div className="mt-1 text-sm text-gray-500">{task.actualHours || 0} actual hours</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Work log highlights">
              <div className="space-y-3">
                {report.workLogs.length === 0 && <p className="text-sm text-gray-500">Work log алга.</p>}
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

            <Card title="Time entries">
              <div className="space-y-3">
                {report.timeEntries.length === 0 && <p className="text-sm text-gray-500">Time entry алга.</p>}
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

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Assessment responses">
              <div className="space-y-3">
                {report.assessmentResponses.length === 0 && (
                  <p className="text-sm text-gray-500">Assessment response алга.</p>
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

            <Card title="Expense summary">
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="text-sm text-gray-500">Approved</div>
                  <div className="mt-1 text-xl font-semibold text-green-600">
                    {formatMnt(report.totals.approvedExpenseTotal)}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="text-sm text-gray-500">Pending approval</div>
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

            <Card title="Management actions">
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="font-medium text-gray-900 dark:text-white">Improvement actions</div>
                  <div className="mt-1 text-2xl font-semibold text-blue-600">{improvementActions}</div>
                  <p className="mt-1 text-gray-500">Assessment score 85%-аас доош байгаа зүйлс.</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="font-medium text-gray-900 dark:text-white">Pending approvals</div>
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
