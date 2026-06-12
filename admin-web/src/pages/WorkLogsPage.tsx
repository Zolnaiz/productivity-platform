import React, { useEffect, useState } from 'react';
import Card from '../components/common/Card';
import { operationsService } from '../services/operations.service';
import { TimeEntry, WorkLog } from '../types/operations.types';

const today = () => new Date().toISOString().slice(0, 10);

const WorkLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [draft, setDraft] = useState({
    logDate: today(),
    summary: '',
    hours: '1',
    blockers: '',
    nextSteps: '',
  });

  useEffect(() => {
    operationsService.getWorkLogs().then(setLogs);
    operationsService.getTimeEntries().then(setTimeEntries);
  }, []);

  const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.summary.trim()) return;

    const optimisticLog: WorkLog = {
      id: `local-log-${Date.now()}`,
      logDate: draft.logDate,
      summary: draft.summary,
      blockers: draft.blockers,
      nextSteps: draft.nextSteps,
      hours: Number(draft.hours || 0),
    };
    const optimisticTime: TimeEntry = {
      id: `local-time-${Date.now()}`,
      workDate: draft.logDate,
      hours: Number(draft.hours || 0),
      note: draft.summary,
    };

    setLogs((current) => [optimisticLog, ...current]);
    setTimeEntries((current) => [optimisticTime, ...current]);
    setDraft({ logDate: today(), summary: '', hours: '1', blockers: '', nextSteps: '' });

    try {
      await operationsService.createWorkLog(optimisticLog);
      await operationsService.createTimeEntry(optimisticTime);
    } catch {
      // Demo mode keeps the optimistic items locally.
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Work Logs & Time</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Ажилтан бүрийн өдөр тутмын хийсэн ажил, blocker, дараагийн алхам, зарцуулсан цаг.
        </p>
      </div>

      <Card title="Add daily work log">
        <form onSubmit={handleCreate} className="grid gap-3 lg:grid-cols-6">
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            type="date"
            value={draft.logDate}
            onChange={(event) => setDraft((current) => ({ ...current, logDate: event.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 lg:col-span-2"
            placeholder="What did you finish?"
            value={draft.summary}
            onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            type="number"
            min="0"
            step="0.5"
            value={draft.hours}
            onChange={(event) => setDraft((current) => ({ ...current, hours: event.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Next step"
            value={draft.nextSteps}
            onChange={(event) => setDraft((current) => ({ ...current, nextSteps: event.target.value }))}
          />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" type="submit">
            Add log
          </button>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-gray-500">Work logs</div>
          <div className="mt-2 text-3xl font-semibold">{logs.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Tracked hours</div>
          <div className="mt-2 text-3xl font-semibold">{totalHours}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Monthly report source</div>
          <div className="mt-2 text-3xl font-semibold">Ready</div>
        </Card>
      </div>

      <Card title="Daily work logs">
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900 dark:text-white">{log.logDate}</div>
                <div className="text-sm text-gray-500">{log.hours}h</div>
              </div>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{log.summary}</p>
              {log.blockers && <p className="mt-2 text-sm text-red-600">Blocker: {log.blockers}</p>}
              {log.nextSteps && <p className="mt-2 text-sm text-gray-500">Next: {log.nextSteps}</p>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default WorkLogsPage;
