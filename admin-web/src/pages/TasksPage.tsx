import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
import { operationsService } from '../services/operations.service';
import { WorkTask } from '../types/operations.types';

const columns: Array<{ key: WorkTask['status']; labelKey: string }> = [
  { key: 'backlog', labelKey: 'tasks.status.backlog' },
  { key: 'todo', labelKey: 'tasks.status.todo' },
  { key: 'in_progress', labelKey: 'tasks.status.inProgress' },
  { key: 'review', labelKey: 'tasks.status.review' },
  { key: 'done', labelKey: 'tasks.status.done' },
];

const TasksPage: React.FC = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    dueDate: '',
    estimatedHours: '1',
  });

  useEffect(() => {
    let active = true;

    const loadTasks = async () => {
      try {
        const data = await operationsService.getTasks();
        if (active) setTasks(data);
      } catch {
        if (active) setError(t('tasks.loadFailed'));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTasks();

    return () => {
      active = false;
    };
  }, []);

  const grouped = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.status === column.key),
      })),
    [tasks],
  );

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    setError(null);

    const optimistic: WorkTask = {
      id: `local-${Date.now()}`,
      title: draft.title,
      status: 'todo',
      priority: 'medium',
      dueDate: draft.dueDate,
      estimatedHours: Number(draft.estimatedHours || 0),
      actualHours: 0,
    };

    setTasks((current) => [optimistic, ...current]);
    setDraft({ title: '', dueDate: '', estimatedHours: '1' });
    setCreateOpen(false);

    try {
      await operationsService.createTask(optimistic);
    } catch {
      setError(t('tasks.saveFailed'));
    }
  };

  const updateStatus = async (task: WorkTask, status: WorkTask['status']) => {
    setError(null);
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status } : item)));

    try {
      await operationsService.updateTask(task.id, { status });
    } catch {
      setError(t('tasks.statusFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('tasks.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('tasks.subtitle')}</p>
        </div>
        <Button icon={Plus} type="button" onClick={() => setCreateOpen(true)}>
          {t('tasks.newTask')}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={t('tasks.newTask')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label={t('tasks.taskTitle')}
            placeholder={t('tasks.taskTitle')}
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            required
          />
          <Input
            label={t('tasks.dueDate')}
            type="date"
            value={draft.dueDate}
            onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
          />
          <Input
            label={t('tasks.estimatedHours')}
            type="number"
            min="0"
            step="0.5"
            value={draft.estimatedHours}
            onChange={(event) => setDraft((current) => ({ ...current, estimatedHours: event.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('tasks.addTask')}</Button>
          </div>
        </form>
      </Modal>

      {loading && (
        <Card loading>
          <div />
        </Card>
      )}
      {!loading && tasks.length === 0 && (
        <Card>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('tasks.empty')}
          </div>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-5">
        {grouped.map((column) => (
          <Card key={column.key} title={`${t(column.labelKey)} (${column.tasks.length})`}>
            <div className="space-y-3">
              {column.tasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="font-medium text-gray-900 dark:text-white">{task.title}</div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{task.priority}</span>
                    <span>{task.dueDate || '-'}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {task.actualHours || 0}h / {task.estimatedHours || 0}h
                  </div>
                  <Select
                    className="mt-3"
                    fieldSize="sm"
                    aria-label={t('tasks.statusFor', { title: task.title })}
                    value={task.status}
                    onChange={(event) => updateStatus(task, event.target.value as WorkTask['status'])}
                  >
                    {columns.map((option) => (
                      <option key={option.key} value={option.key}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TasksPage;
