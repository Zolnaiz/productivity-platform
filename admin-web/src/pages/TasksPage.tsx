import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/common/Card';
import { operationsService } from '../services/operations.service';
import { WorkTask } from '../types/operations.types';

const columns: Array<{ key: WorkTask['status']; label: string }> = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [draft, setDraft] = useState({
    title: '',
    dueDate: '',
    estimatedHours: '1',
  });

  useEffect(() => {
    operationsService.getTasks().then(setTasks);
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
    await operationsService.createTask(optimistic);
  };

  const updateStatus = async (task: WorkTask, status: WorkTask['status']) => {
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status } : item)));
    await operationsService.updateTask(task.id, { status });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tasks / Kanban</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Ирээдүйд хийх, шинээр гарсан, хийж байгаа, review, дууссан ажлууд.
        </p>
      </div>

      <Card title="New task">
        <form onSubmit={handleCreate} className="grid gap-3 lg:grid-cols-5">
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 lg:col-span-2"
            placeholder="Task title"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            type="date"
            value={draft.dueDate}
            onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            type="number"
            min="0"
            step="0.5"
            value={draft.estimatedHours}
            onChange={(event) => setDraft((current) => ({ ...current, estimatedHours: event.target.value }))}
          />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" type="submit">
            Add task
          </button>
        </form>
      </Card>

      <div className="grid gap-4 xl:grid-cols-5">
        {grouped.map((column) => (
          <Card key={column.key} title={`${column.label} (${column.tasks.length})`}>
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
                  <select
                    className="mt-3 w-full rounded-lg border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                    value={task.status}
                    onChange={(event) => updateStatus(task, event.target.value as WorkTask['status'])}
                  >
                    {columns.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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
