import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/common/Card';
import { assessmentService } from '../services/assessment.service';
import { operationsService } from '../services/operations.service';
import { productivityService } from '../services/productivity.service';
import { AssessmentResponse } from '../types/assessment.types';
import { AuditRun, TimeEntry, WorkLog, WorkTask } from '../types/operations.types';
import { Badge, DailyGoal, FocusSession } from '../types/productivity.types';

const ProfilePage: React.FC = () => {
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [auditRuns, setAuditRuns] = useState<AuditRun[]>([]);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [focus, setFocus] = useState<FocusSession[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    operationsService.getTasks().then(setTasks);
    operationsService.getWorkLogs().then(setLogs);
    operationsService.getTimeEntries().then(setTimeEntries);
    operationsService.getAuditRuns().then(setAuditRuns);
    assessmentService.getResponses().then(setResponses);
    productivityService.getGoals().then(setGoals);
    productivityService.getFocusSessions().then(setFocus);
    productivityService.getBadges().then(setBadges);
  }, []);

  const summary = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.status === 'done');
    const openTasks = tasks.filter((task) => task.status !== 'done');
    const completedGoals = goals.filter((goal) => goal.completed);
    const focusMinutes = focus.reduce((sum, item) => sum + item.minutes, 0);
    const trackedHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
    const earnedBadges = badges.filter((badge) => badge.earned);
    const averageAuditScore = auditRuns.length
      ? Math.round(auditRuns.reduce((sum, run) => sum + run.score, 0) / auditRuns.length)
      : 0;
    const averageAssessmentScore = responses.length
      ? Math.round(responses.reduce((sum, response) => sum + response.score, 0) / responses.length)
      : 0;
    const productivityScore = Math.round(
      (completedTasks.length ? 25 : 0) +
        Math.min(25, trackedHours * 2) +
        Math.min(20, focusMinutes / 5) +
        (averageAuditScore ? averageAuditScore * 0.15 : 0) +
        (averageAssessmentScore ? averageAssessmentScore * 0.15 : 0),
    );

    return {
      completedTasks,
      openTasks,
      completedGoals,
      focusMinutes,
      trackedHours,
      earnedBadges,
      averageAuditScore,
      averageAssessmentScore,
      productivityScore: Math.min(100, productivityScore),
    };
  }, [auditRuns, badges, focus, goals, responses, tasks, timeEntries]);

  const employeeSummary = [
    `Demo Owner completed ${summary.completedTasks.length} tasks and logged ${summary.trackedHours} hours this month.`,
    `${logs.length} work logs were submitted, with ${summary.openTasks.length} open tasks remaining.`,
    `Quality indicators: ${summary.averageAuditScore}% audit score and ${summary.averageAssessmentScore}% assessment score.`,
    `${summary.completedGoals.length}/${goals.length} daily goals completed, ${summary.focusMinutes} focus minutes recorded, ${summary.earnedBadges.length} badges earned.`,
  ].join('\n');

  const copySummary = async () => {
    await navigator.clipboard.writeText(employeeSummary);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Profile</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Employee productivity summary, monthly report preview, goals, focus, and recognition.
          </p>
        </div>
        <button
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          type="button"
          onClick={copySummary}
        >
          Copy employee summary
        </button>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-xl font-semibold text-white">
              DO
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Demo Owner</h2>
              <p className="text-sm text-gray-500">owner@example.com - Workspace Owner</p>
            </div>
          </div>
          <div className="rounded-lg bg-blue-50 px-5 py-3 text-right dark:bg-blue-950/30">
            <div className="text-sm text-blue-700 dark:text-blue-300">Productivity score</div>
            <div className="text-3xl font-semibold text-blue-700 dark:text-blue-300">{summary.productivityScore}%</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card>
          <div className="text-sm text-gray-500">Completed tasks</div>
          <div className="mt-2 text-3xl font-semibold">{summary.completedTasks.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Tracked hours</div>
          <div className="mt-2 text-3xl font-semibold">{summary.trackedHours}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Work logs</div>
          <div className="mt-2 text-3xl font-semibold">{logs.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Focus minutes</div>
          <div className="mt-2 text-3xl font-semibold">{summary.focusMinutes}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Goals</div>
          <div className="mt-2 text-3xl font-semibold">{summary.completedGoals.length}/{goals.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Badges</div>
          <div className="mt-2 text-3xl font-semibold">{summary.earnedBadges.length}</div>
        </Card>
      </div>

      <Card title="Employee monthly summary">
        <pre className="whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-300">{employeeSummary}</pre>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Completed tasks">
          <div className="space-y-3">
            {summary.completedTasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="font-medium text-gray-900 dark:text-white">{task.title}</div>
                <div className="mt-1 text-sm text-gray-500">{task.actualHours || 0} actual hours</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent work logs">
          <div className="space-y-3">
            {logs.slice(0, 5).map((log) => (
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

        <Card title="Quality signals">
          <div className="space-y-3">
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="text-sm text-gray-500">Average audit score</div>
              <div className="mt-1 text-2xl font-semibold text-blue-600">{summary.averageAuditScore}%</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="text-sm text-gray-500">Average assessment score</div>
              <div className="mt-1 text-2xl font-semibold text-purple-600">{summary.averageAssessmentScore}%</div>
            </div>
            {summary.earnedBadges.map((badge) => (
              <div key={badge.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="font-medium text-gray-900 dark:text-white">{badge.title}</div>
                <div className="text-sm text-gray-500">{badge.description}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
