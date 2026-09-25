import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import { operationsService } from '../services/operations.service';
import { TimeEntry, WorkLog } from '../types/operations.types';

const today = () => new Date().toISOString().slice(0, 10);

const WorkLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    logDate: today(),
    summary: '',
    hours: '1',
    blockers: '',
    nextSteps: '',
  });

  useEffect(() => {
    let active = true;

    const loadWorkLogs = async () => {
      try {
        const [workLogs, entries] = await Promise.all([
          operationsService.getWorkLogs(),
          operationsService.getTimeEntries(),
        ]);

        if (!active) return;
        setLogs(workLogs);
        setTimeEntries(entries);
      } catch {
        if (active) setError(t('workLogs.loadFailed'));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadWorkLogs();

    return () => {
      active = false;
    };
  }, []);

  const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.summary.trim()) return;
    setError(null);

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
      setError(t('workLogs.saveFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('workLogs.title')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('workLogs.subtitle')}</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <Card title={t('workLogs.addDailyLog')}>
        <form onSubmit={handleCreate} className="grid items-end gap-3 lg:grid-cols-6">
          <Input
            label={t('workLogs.date')}
            type="date"
            value={draft.logDate}
            onChange={(event) => setDraft((current) => ({ ...current, logDate: event.target.value }))}
          />
          <Input
            className="lg:col-span-2"
            label={t('workLogs.whatDidYouFinish')}
            placeholder={t('workLogs.whatDidYouFinish')}
            value={draft.summary}
            onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
          />
          <Input
            label={t('workLogs.hours')}
            type="number"
            min="0"
            step="0.5"
            value={draft.hours}
            onChange={(event) => setDraft((current) => ({ ...current, hours: event.target.value }))}
          />
          <Input
            label={t('workLogs.nextStep')}
            placeholder={t('workLogs.nextStep')}
            value={draft.nextSteps}
            onChange={(event) => setDraft((current) => ({ ...current, nextSteps: event.target.value }))}
          />
          <Button type="submit">{t('workLogs.addLog')}</Button>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-gray-500">{t('workLogs.workLogs')}</div>
          <div className="mt-2 text-3xl font-semibold">{logs.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t('workLogs.trackedHours')}</div>
          <div className="mt-2 text-3xl font-semibold">{totalHours}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t('workLogs.monthlyReportSource')}</div>
          <div className="mt-2 text-3xl font-semibold">{loading ? t('common.loading') : t('workLogs.ready')}</div>
        </Card>
      </div>

      <Card title={t('workLogs.dailyWorkLogs')}>
        <div className="space-y-4">
          {loading && <div className="text-sm text-gray-600 dark:text-gray-400">{t('common.loading')}</div>}
          {!loading && logs.length === 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('workLogs.empty')}</div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900 dark:text-white">{log.logDate}</div>
                <div className="text-sm text-gray-500">{log.hours}h</div>
              </div>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{log.summary}</p>
              {log.blockers && <p className="mt-2 text-sm text-red-600">{t('workLogs.blocker')}: {log.blockers}</p>}
              {log.nextSteps && <p className="mt-2 text-sm text-gray-500">{t('workLogs.next')}: {log.nextSteps}</p>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default WorkLogsPage;
