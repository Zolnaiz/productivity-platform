import React, { useEffect, useRef, useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import { raisedTitle } from '../components/common/raisedText';
import { apiErrorMessage } from '../i18n/apiError';
import { operationsService } from '../services/operations.service';
import { Project, TimeEntry, WorkLog, WorkTask } from '../types/operations.types';
import { localDay } from '../utils/localDay';

const emptyDraft = () => ({
  logDate: localDay(),
  summary: '',
  hours: '1',
  blockers: '',
  nextSteps: '',
  projectId: '',
  taskId: '',
});

const WorkLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState(false);
  const [reload, setReload] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(emptyDraft);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setContextLoading(true);
    setLoadError(null);
    setContextError(null);

    // A failed task lookup must not hide the work already recorded.
    Promise.all([operationsService.getWorkLogs(), operationsService.getTimeEntries()])
      .then(([workLogs, entries]) => {
        if (!active) return;
        setLogs(workLogs);
        setTimeEntries(entries);
      })
      .catch((error) => {
        if (active) setLoadError(apiErrorMessage(error, t));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    Promise.all([operationsService.getProjects(), operationsService.getTasks()])
      .then(([loadedProjects, loadedTasks]) => {
        if (!active) return;
        setProjects(loadedProjects);
        setTasks(loadedTasks);
        setDraft((current) => {
          const projectId = loadedProjects.some((project) => project.id === current.projectId) ? current.projectId : '';
          const task = loadedTasks.find((candidate) => candidate.id === current.taskId);
          return {
            ...current,
            projectId,
            taskId: task && (task.projectId ?? '') === projectId ? task.id : '',
          };
        });
      })
      .catch((error) => {
        if (active) setContextError(apiErrorMessage(error, t));
      })
      .finally(() => {
        if (active) setContextLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reload, t]);

  const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
  // Finished tasks stay selectable: a daily log often describes completed work.
  const projectIds = new Set(projects.map((project) => project.id));
  const availableTasks = tasks.filter(
    (task) =>
      (!task.projectId || projectIds.has(task.projectId)) && (!draft.projectId || task.projectId === draft.projectId),
  );
  const unavailable = loading || contextLoading || Boolean(loadError || contextError);

  const selectProject = (projectId: string) => {
    setDraft((current) => {
      const task = tasks.find((candidate) => candidate.id === current.taskId);
      return {
        ...current,
        projectId,
        taskId: task && (task.projectId ?? '') === projectId ? task.id : '',
      };
    });
  };

  const selectTask = (taskId: string) => {
    const task = tasks.find((candidate) => candidate.id === taskId);
    setDraft((current) => ({
      ...current,
      taskId,
      projectId: task ? (task.projectId ?? '') : current.projectId,
    }));
  };

  const closeCreate = () => {
    if (!savingRef.current) setCreateOpen(false);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (savingRef.current || unavailable) return;
    if (!draft.summary.trim()) {
      setSummaryError(true);
      summaryRef.current?.focus();
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setSaveError(null);

    try {
      const { workLog, timeEntry } = await operationsService.createDailyWorkLog({
        logDate: draft.logDate,
        summary: draft.summary.trim(),
        hours: Number(draft.hours),
        blockers: draft.blockers.trim(),
        nextSteps: draft.nextSteps.trim(),
        projectId: draft.projectId || undefined,
        taskId: draft.taskId || undefined,
      });
      // Use both confirmed records so their ids, scope and hours match the API.
      setLogs((current) => [workLog, ...current]);
      setTimeEntries((current) => [timeEntry, ...current]);
      setDraft(emptyDraft());
      setCreateOpen(false);
    } catch (error) {
      setSaveError(apiErrorMessage(error, t));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const loadFailure = (loadError || contextError) && (
    <div
      role="alert"
      className="space-y-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
    >
      {loadError && (
        <p>
          {t('workLogs.loadFailed')} {loadError}
        </p>
      )}
      {contextError && (
        <p>
          {t('workLogs.contextLoadFailed')} {contextError}
        </p>
      )}
      <Button type="button" variant="outline" onClick={() => setReload((current) => current + 1)}>
        {t('common.tryAgain')}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('workLogs.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('workLogs.subtitle')}</p>
        </div>
        <Button icon={Plus} type="button" disabled={unavailable} onClick={() => setCreateOpen(true)}>
          {t('workLogs.addDailyLog')}
        </Button>
      </div>

      {!createOpen && loadFailure}

      <div className="grid gap-4 md:grid-cols-3">
        <Card loading={loading}>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('workLogs.workLogs')}</div>
          <div className="mt-2 text-3xl font-semibold">{loadError ? t('workLogs.unavailable') : logs.length}</div>
        </Card>
        <Card loading={loading}>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('workLogs.trackedHours')}</div>
          <div className="mt-2 text-3xl font-semibold">{loadError ? t('workLogs.unavailable') : totalHours}</div>
        </Card>
        <Card loading={loading}>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('workLogs.monthlyReportSource')}</div>
          <div className="mt-2 text-3xl font-semibold">{t(loadError ? 'workLogs.unavailable' : 'workLogs.ready')}</div>
        </Card>
      </div>

      <Card title={t('workLogs.dailyWorkLogs')} loading={loading}>
        <div className="space-y-4">
          {!loadError && logs.length === 0 && (
            <EmptyState icon={ClipboardList} title={t('workLogs.emptyTitle')} description={t('workLogs.empty')} />
          )}
          {logs.map((log) => {
            const project = projects.find((candidate) => candidate.id === log.projectId);
            const task = tasks.find((candidate) => candidate.id === log.taskId);
            return (
              <article key={log.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-gray-900 dark:text-white">{log.logDate}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('workLogs.hoursValue', { hours: log.hours })}
                  </div>
                </div>
                <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex min-w-0 gap-1">
                    <dt>{t('workLogs.project')}:</dt>
                    <dd className="break-words">
                      {log.projectId
                        ? (project?.name ?? t(contextLoading ? 'common.loading' : 'workLogs.projectUnavailable'))
                        : t('workLogs.generalWork')}
                    </dd>
                  </div>
                  {log.taskId && (
                    <div className="flex min-w-0 gap-1">
                      <dt>{t('workLogs.task')}:</dt>
                      <dd className="break-words">
                        {task
                          ? raisedTitle(task, t)
                          : t(contextLoading ? 'common.loading' : 'workLogs.taskUnavailable')}
                      </dd>
                    </div>
                  )}
                </dl>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">
                  {log.summary}
                </p>
                {log.blockers && (
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-red-600 dark:text-red-400">
                    {t('workLogs.blocker')}: {log.blockers}
                  </p>
                )}
                {log.nextSteps && (
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-500 dark:text-gray-400">
                    {t('workLogs.next')}: {log.nextSteps}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </Card>

      <Modal
        isOpen={createOpen}
        onClose={closeCreate}
        title={t('workLogs.addDailyLog')}
        size="lg"
        showCloseButton={!saving}
      >
        <form onSubmit={handleCreate} className="space-y-4" aria-busy={saving}>
          {loadFailure}
          {saveError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
            >
              {saveError}
            </div>
          )}
          <fieldset disabled={saving} className="space-y-4">
            <legend className="sr-only">{t('workLogs.addDailyLog')}</legend>
            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                label={t('workLogs.date')}
                name="logDate"
                type="date"
                required
                value={draft.logDate}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    logDate: event.target.value,
                  }))
                }
              />
              <Input
                label={t('workLogs.hours')}
                name="hours"
                type="number"
                min="0"
                step="0.25"
                required
                value={draft.hours}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    hours: event.target.value,
                  }))
                }
              />
              <Select
                label={t('workLogs.projectOptional')}
                name="projectId"
                value={draft.projectId}
                disabled={contextLoading || Boolean(contextError)}
                onChange={(event) => selectProject(event.target.value)}
              >
                <option value="">{t('workLogs.generalWork')}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
              <Select
                label={t('workLogs.taskOptional')}
                name="taskId"
                value={draft.taskId}
                disabled={contextLoading || Boolean(contextError)}
                helperText={t(
                  contextLoading ? 'common.loading' : availableTasks.length ? 'workLogs.taskHelp' : 'workLogs.noTasks',
                )}
                onChange={(event) => selectTask(event.target.value)}
              >
                <option value="">{t('workLogs.noTask')}</option>
                {availableTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {raisedTitle(task, t)}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={contextLoading}
              onClick={() => setReload((current) => current + 1)}
            >
              {t('workLogs.refreshChoices')}
            </Button>
            <Textarea
              ref={summaryRef}
              label={t('workLogs.whatDidYouFinish')}
              name="summary"
              required
              rows={3}
              value={draft.summary}
              error={summaryError ? t('workLogs.summaryRequired') : undefined}
              onChange={(event) => {
                setSummaryError(false);
                setDraft((current) => ({
                  ...current,
                  summary: event.target.value,
                }));
              }}
            />
            <Textarea
              label={t('workLogs.blocker')}
              name="blockers"
              rows={2}
              helperText={t('workLogs.blockerHelp')}
              value={draft.blockers}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  blockers: event.target.value,
                }))
              }
            />
            <Textarea
              label={t('workLogs.nextStep')}
              name="nextSteps"
              rows={2}
              value={draft.nextSteps}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  nextSteps: event.target.value,
                }))
              }
            />
          </fieldset>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" disabled={saving} onClick={closeCreate}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving} disabled={unavailable}>
              {t('workLogs.addLog')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkLogsPage;
