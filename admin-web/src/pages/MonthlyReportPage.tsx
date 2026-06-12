import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/common/Card';
import { assessmentService } from '../services/assessment.service';
import { financeService } from '../services/finance.service';
import { operationsService } from '../services/operations.service';
import { AssessmentResponse } from '../types/assessment.types';
import { ExpenseItem } from '../types/finance.types';
import { AuditRun, Project, TimeEntry, WorkLog, WorkTask } from '../types/operations.types';

const formatMnt = (value: number) =>
  new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency: 'MNT',
    maximumFractionDigits: 0,
  }).format(value);

const MonthlyReportPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [auditRuns, setAuditRuns] = useState<AuditRun[]>([]);
  const [assessmentResponses, setAssessmentResponses] = useState<AssessmentResponse[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

  useEffect(() => {
    operationsService.getProjects().then(setProjects);
    operationsService.getTasks().then(setTasks);
    operationsService.getWorkLogs().then(setLogs);
    operationsService.getTimeEntries().then(setTimeEntries);
    operationsService.getAuditRuns().then(setAuditRuns);
    assessmentService.getResponses().then(setAssessmentResponses);
    financeService.getExpenses().then(setExpenses);
  }, []);

  const report = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.status === 'done');
    const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
    const completionRate = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    const averageProjectProgress = projects.length
      ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length)
      : 0;
    const averageAuditScore = auditRuns.length
      ? Math.round(auditRuns.reduce((sum, run) => sum + run.score, 0) / auditRuns.length)
      : 0;
    const averageAssessmentScore = assessmentResponses.length
      ? Math.round(assessmentResponses.reduce((sum, response) => sum + response.score, 0) / assessmentResponses.length)
      : 0;
    const approvedExpenses = expenses.filter((expense) => expense.status === 'approved');
    const submittedExpenses = expenses.filter((expense) => expense.status === 'submitted');
    const totalApprovedExpense = approvedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalPendingExpense = submittedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const improvementActions = [
      ...auditRuns.filter((run) => run.score < 85),
      ...assessmentResponses.filter((response) => response.score < 85),
    ].length;

    return {
      completedTasks,
      totalHours,
      completionRate,
      averageProjectProgress,
      averageAuditScore,
      averageAssessmentScore,
      approvedExpenses,
      submittedExpenses,
      totalApprovedExpense,
      totalPendingExpense,
      improvementActions,
    };
  }, [assessmentResponses, auditRuns, expenses, projects, tasks, timeEntries]);

  const exportCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Projects', projects.length],
      ['Tasks', tasks.length],
      ['Completed tasks', report.completedTasks.length],
      ['Task completion rate', `${report.completionRate}%`],
      ['Tracked hours', report.totalHours],
      ['Work logs', logs.length],
      ['Audit runs', auditRuns.length],
      ['Average audit score', `${report.averageAuditScore}%`],
      ['Assessment responses', assessmentResponses.length],
      ['Average assessment score', `${report.averageAssessmentScore}%`],
      ['Approved expenses', report.totalApprovedExpense],
      ['Pending expenses', report.totalPendingExpense],
      ['Improvement actions needed', report.improvementActions],
      ['Average project progress', `${report.averageProjectProgress}%`],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'monthly-productivity-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const executiveSummary = [
    `Monthly productivity report: ${projects.length} projects, ${tasks.length} tasks, ${report.completionRate}% task completion.`,
    `Tracked work: ${report.totalHours} hours and ${logs.length} work logs.`,
    `Quality and compliance: ${auditRuns.length} audit runs with ${report.averageAuditScore}% average audit score; ${assessmentResponses.length} assessment responses with ${report.averageAssessmentScore}% average score.`,
    `Finance: ${formatMnt(report.totalApprovedExpense)} approved expenses and ${formatMnt(report.totalPendingExpense)} waiting approval.`,
    `Management attention: ${report.improvementActions} improvement actions need follow-up.`,
  ].join('\n');

  const copySummary = async () => {
    await navigator.clipboard.writeText(executiveSummary);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Monthly Report</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Ажилтан, төсөл, task, work log, time entry, audit дээрээс сарын тайлангийн preview үүсгэнэ.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Export CSV
        </button>
        <button
          type="button"
          onClick={copySummary}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Copy summary
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Print
        </button>
      </div>

      <Card title="Executive summary">
        <pre className="whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-300">
          {executiveSummary}
        </pre>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <Card>
          <div className="text-sm text-gray-500">Projects</div>
          <div className="mt-2 text-3xl font-semibold">{projects.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Completion</div>
          <div className="mt-2 text-3xl font-semibold">{report.completionRate}%</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Tracked hours</div>
          <div className="mt-2 text-3xl font-semibold">{report.totalHours}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Work logs</div>
          <div className="mt-2 text-3xl font-semibold">{logs.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Audit score</div>
          <div className="mt-2 text-3xl font-semibold">{report.averageAuditScore}%</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Assessment</div>
          <div className="mt-2 text-3xl font-semibold">{report.averageAssessmentScore}%</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Approved cost</div>
          <div className="mt-2 text-xl font-semibold">{formatMnt(report.totalApprovedExpense)}</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Completed tasks">
          <div className="space-y-3">
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
            {logs.map((log) => (
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

        <Card title="Audit results">
          <div className="space-y-3">
            {auditRuns.map((run) => (
              <div key={run.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">{run.location || 'Audit run'}</span>
                  <span className="text-blue-600">{run.score}%</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">{run.status}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Assessment responses">
          <div className="space-y-3">
            {assessmentResponses.map((response) => (
              <div key={response.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">{response.respondent}</span>
                  <span className={response.score < 85 ? 'text-yellow-600' : 'text-green-600'}>{response.score}%</span>
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
              <div className="mt-1 text-xl font-semibold text-green-600">{formatMnt(report.totalApprovedExpense)}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="text-sm text-gray-500">Pending approval</div>
              <div className="mt-1 text-xl font-semibold text-yellow-600">{formatMnt(report.totalPendingExpense)}</div>
            </div>
            {expenses.map((expense) => (
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
              <div className="mt-1 text-2xl font-semibold text-blue-600">{report.improvementActions}</div>
              <p className="mt-1 text-gray-500">Audit or assessment scores below 85%.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="font-medium text-gray-900 dark:text-white">Pending approvals</div>
              <div className="mt-1 text-2xl font-semibold text-yellow-600">{report.submittedExpenses.length}</div>
              <p className="mt-1 text-gray-500">Submitted expenses waiting for owner/admin decision.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MonthlyReportPage;
