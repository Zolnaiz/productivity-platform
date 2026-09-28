import React, { useEffect, useMemo, useState } from 'react';
import { Check, Columns3, List, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { raisedDescription, raisedTitle } from '../components/common/raisedText';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
import { scrollArea } from '../components/common/scrollArea';
import { localDay } from '../components/progress/progressBoard';
import { useAuth } from '../contexts/AuthContext';
import { operationsService } from '../services/operations.service';
import { peopleService } from '../services/people.service';
import { Project, WorkTask } from '../types/operations.types';
import { TeamUser, memberName } from '../types/people.types';

const columns: Array<{ key: WorkTask['status']; labelKey: string }> = [
  { key: 'backlog', labelKey: 'tasks.status.backlog' },
  { key: 'todo', labelKey: 'tasks.status.todo' },
  { key: 'in_progress', labelKey: 'tasks.status.inProgress' },
  { key: 'review', labelKey: 'tasks.status.review' },
  { key: 'done', labelKey: 'tasks.status.done' },
];

const priorities = ['low', 'medium', 'high'] as const;

const priorityDot: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-gray-400',
};

const emptyDraft = {
  title: '',
  description: '',
  assigneeId: '',
  projectId: '',
  priority: 'medium',
  dueDate: '',
  estimatedHours: '1',
};

/** Mine, everybody's, nobody's, or one person's: what the board is showing. */
type Filter = 'mine' | 'all' | 'unassigned' | string;
type View = 'board' | 'list';

const VIEW_KEY = 'tasks-view';

const readView = (): View => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'board';
  } catch {
    return 'board';
  }
};

/**
 * The work, by stage, and who it is for.
 *
 * Moving a task along meant opening a status list inside its card, and every
 * card carried two lists and a delete button, so the board was mostly form.
 * It now works as the task boards people already know do: a card is dragged
 * to its next column (Trello), a title typed at the top and Enter adds one
 * (Linear), the same work can be read as a list sorted by what is due, and
 * everything else about a task is in one place, opened from its title.
 */
const TasksPage: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission, user } = useAuth();
  // Giving work out is a manager's act; the server refuses it to anybody else,
  // so the button and the choice of person are shown only where it would work.
  const canAssign = hasPermission('tasks:create');
  // Taking back work raised by mistake - a task typed twice, raised against
  // the wrong area - is a manager's call, as the server has it.
  const canDelete = hasPermission('tasks:delete');
  const [pendingDelete, setPendingDelete] = useState<WorkTask | null>(null);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  // Somebody who is given work opens on theirs; somebody who gives it out,
  // on everybody's.
  const [filter, setFilter] = useState<Filter>(canAssign || !user?.id ? 'all' : 'mine');
  const [view, setView] = useState<View>(readView);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<WorkTask['status'] | null>(null);
  const [quickTitle, setQuickTitle] = useState('');
  /*
    The project comes from the address and nowhere else, so the menu's
    "Tasks" link - which has none - shows every project again, and a link
    to one project's work can be shared.
  */
  const [searchParams, setSearchParams] = useSearchParams();
  const projectFilter = searchParams.get('project') ?? '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  // New work opened from a project is filed under it.
  useEffect(() => {
    setDraft((current) => ({ ...current, projectId: projectFilter }));
  }, [projectFilter]);

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

    // Names and projects are the page's labels, not its substance; failing to
    // load them leaves the board standing.
    Promise.resolve()
      .then(() => peopleService.getMembers())
      .then((data) => {
        if (active) setMembers((data ?? []).filter((member) => member.isActive !== false));
      })
      .catch(() => undefined);
    Promise.resolve()
      .then(() => operationsService.getProjects())
      .then((data) => {
        if (active) setProjects(data ?? []);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const chooseView = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // A private window keeps no preference; the view still changes.
    }
  };

  const nameOf = (userId?: string) => {
    if (!userId) return null;
    const member = members.find((candidate) => candidate.id === userId);

    return member ? memberName(member) : userId;
  };

  const projectName = (projectId?: string) => projects.find((project) => project.id === projectId)?.name;

  const today = localDay(new Date());
  const isLate = (task: WorkTask) =>
    Boolean(task.dueDate) && task.status !== 'done' && task.status !== 'backlog' && task.dueDate!.slice(0, 10) < today;

  const visible = useMemo(
    () =>
      tasks
        .filter((task) => !projectFilter || task.projectId === projectFilter)
        .filter((task) => {
          if (filter === 'all') return true;
          if (filter === 'unassigned') return !task.assigneeId;
          if (filter === 'mine') return task.assigneeId === user?.id;
          return task.assigneeId === filter;
        }),
    [filter, projectFilter, tasks, user?.id],
  );

  const grouped = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        tasks: visible.filter((task) => task.status === column.key),
      })),
    [visible],
  );

  // The list reads as a to-do list: what is open first, soonest due first,
  // work with no date after it, finished work last.
  const listed = useMemo(
    () =>
      [...visible].sort((a, b) => {
        const doneA = a.status === 'done' ? 1 : 0;
        const doneB = b.status === 'done' ? 1 : 0;
        if (doneA !== doneB) return doneA - doneB;
        return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
      }),
    [visible],
  );

  /** Who new work is for: the person the board is narrowed to, if any. */
  const assigneeForNewWork = () => {
    if (filter === 'mine') return user?.id ?? '';
    if (filter === 'all' || filter === 'unassigned') return '';
    return filter;
  };

  const create = async (fields: typeof emptyDraft) => {
    if (!fields.title.trim()) return;
    setError(null);

    const localId = `local-${Date.now()}`;
    const optimistic: WorkTask = {
      id: localId,
      title: fields.title.trim(),
      description: fields.description.trim() || undefined,
      status: 'todo',
      priority: fields.priority,
      assigneeId: fields.assigneeId || undefined,
      projectId: fields.projectId || undefined,
      dueDate: fields.dueDate || undefined,
      estimatedHours: Number(fields.estimatedHours || 0),
      actualHours: 0,
    };

    setTasks((current) => [optimistic, ...current]);

    try {
      const saved = await operationsService.createTask(optimistic);
      // The server's copy replaces the placeholder. Keeping the local id meant
      // the next change to this task was sent for a task that did not exist.
      setTasks((current) => current.map((item) => (item.id === localId ? { ...item, ...saved } : item)));
    } catch {
      setTasks((current) => current.filter((item) => item.id !== localId));
      setError(t('tasks.saveFailed'));
    }
  };

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    const fields = draft;
    setDraft({ ...emptyDraft, projectId: projectFilter });
    setCreateOpen(false);
    void create(fields);
  };

  const handleQuickAdd = (event: React.FormEvent) => {
    event.preventDefault();
    const title = quickTitle;
    setQuickTitle('');
    void create({ ...emptyDraft, title, projectId: projectFilter, assigneeId: assigneeForNewWork() });
  };

  const updateTask = async (task: WorkTask, changes: Partial<WorkTask>, failureKey: string) => {
    setError(null);
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, ...changes } : item)));

    try {
      const saved = await operationsService.updateTask(task.id, changes);
      if (saved) setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, ...saved } : item)));
    } catch {
      setTasks((current) => current.map((item) => (item.id === task.id ? task : item)));
      setError(t(failureKey));
    }
  };

  const moveTo = (task: WorkTask, status: WorkTask['status']) => {
    if (task.status !== status) void updateTask(task, { status }, 'tasks.statusFailed');
  };

  const removeTask = async () => {
    const task = pendingDelete;
    setPendingDelete(null);
    if (!task) return;

    setError(null);
    setOpenId(null);
    setTasks((current) => current.filter((item) => item.id !== task.id));

    try {
      await operationsService.deleteTask(task.id);
    } catch {
      // Back where it was: it was not taken off the server.
      setTasks((current) => [task, ...current]);
      setError(t('tasks.deleteFailed'));
    }
  };

  const openTask = tasks.find((task) => task.id === openId) ?? null;

  const dueLabel = (task: WorkTask) =>
    task.dueDate ? (
      <span className={isLate(task) ? 'font-semibold text-red-700 dark:text-red-300' : undefined}>
        {isLate(task) ? t('tasks.lateSince', { date: task.dueDate.slice(0, 10) }) : task.dueDate.slice(0, 10)}
      </span>
    ) : (
      <span>-</span>
    );

  const priorityLabel = (task: WorkTask) =>
    priorities.includes(task.priority as (typeof priorities)[number]) ? t(`tasks.priorities.${task.priority}`) : task.priority;

  const titleButton = (task: WorkTask, className: string) => (
    <button
      type="button"
      className={`text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
      onClick={() => setOpenId(task.id)}
    >
      {raisedTitle(task, t)}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('tasks.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('tasks.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56">
            <Select label={t('tasks.showFor')} value={filter} onChange={(event) => setFilter(event.target.value)}>
              {user?.id && <option value="mine">{t('tasks.mine')}</option>}
              <option value="all">{t('tasks.everyone')}</option>
              {canAssign && <option value="unassigned">{t('tasks.unassigned')}</option>}
              {canAssign &&
                members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {memberName(member)}
                  </option>
                ))}
            </Select>
          </div>
          <div
            role="radiogroup"
            aria-label={t('tasks.view.label')}
            className="inline-flex rounded-lg border border-gray-300 p-0.5 dark:border-gray-600"
          >
            {(
              [
                ['board', Columns3],
                ['list', List],
              ] as const
            ).map(([key, Icon]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={view === key}
                onClick={() => chooseView(key)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === key
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {t(`tasks.view.${key}`)}
              </button>
            ))}
          </div>
          {canAssign && (
            <Button icon={Plus} type="button" onClick={() => setCreateOpen(true)}>
              {t('tasks.newTask')}
            </Button>
          )}
        </div>
      </div>

      {projectFilter && (
        <div
          data-testid="project-filter"
          className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200"
        >
          <span>{t('tasks.projectOnly', { project: projectName(projectFilter) ?? '…' })}</span>
          <button type="button" className="font-medium underline" onClick={() => setSearchParams({})}>
            {t('tasks.allProjects')}
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {canAssign && (
        <form onSubmit={handleQuickAdd} className="flex gap-2" data-testid="quick-add">
          <input
            id="quick-add-title"
            value={quickTitle}
            onChange={(event) => setQuickTitle(event.target.value)}
            placeholder={t('tasks.quickAddPlaceholder')}
            aria-label={t('tasks.quickAdd')}
            className="h-11 flex-1 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
          />
          <Button type="submit" variant="outline" disabled={!quickTitle.trim()}>
            {t('tasks.quickAddButton')}
          </Button>
        </form>
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
            label={t('tasks.description')}
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={t('tasks.assignee')}
              value={draft.assigneeId}
              onChange={(event) => setDraft((current) => ({ ...current, assigneeId: event.target.value }))}
            >
              <option value="">{t('tasks.nobodyYet')}</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {memberName(member)}
                </option>
              ))}
            </Select>
            <Select
              label={t('tasks.project')}
              value={draft.projectId}
              onChange={(event) => setDraft((current) => ({ ...current, projectId: event.target.value }))}
            >
              <option value="">{t('tasks.noProject')}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
            <Select
              label={t('tasks.priority')}
              value={draft.priority}
              onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {t(`tasks.priorities.${priority}`)}
                </option>
              ))}
            </Select>
            <Input
              label={t('tasks.dueDate')}
              type="date"
              value={draft.dueDate}
              onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
            />
          </div>
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
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('tasks.empty')}</div>
        </Card>
      )}

      {view === 'board' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {grouped.map((column) => (
            <section
              key={column.key}
              aria-label={t(column.labelKey)}
              data-testid={`column-${column.key}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(column.key);
              }}
              onDragLeave={() => setDragOver((current) => (current === column.key ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(null);
                const task = tasks.find((item) => item.id === event.dataTransfer.getData('text/plain'));
                if (task) moveTo(task, column.key);
              }}
              className={`flex min-h-[8rem] flex-col rounded-xl border bg-gray-100/70 p-3 transition-colors dark:bg-gray-900/60 ${
                dragOver === column.key
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                  : 'border-transparent'
              }`}
            >
              <h2 className="mb-3 flex items-center justify-between px-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                {t(column.labelKey)}
                <span className="rounded-full bg-white px-2 text-xs tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {column.tasks.length}
                </span>
              </h2>
              <div className="space-y-2">
                {column.tasks.map((task) => {
                  const owner = nameOf(task.assigneeId);
                  const project = projectName(task.projectId);

                  return (
                    <div
                      key={task.id}
                      data-testid="task-card"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', task.id);
                        event.dataTransfer.effectAllowed = 'move';
                      }}
                      className="cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800"
                    >
                      {titleButton(task, 'block w-full font-medium text-gray-900 dark:text-white')}
                      {/* Work raised by a finding says so, so nobody has to guess
                          why a task they did not write appeared in their column. */}
                      {task.sourceType && (
                        <div className="mt-1 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                          {t(`tasks.source.${task.sourceType}`)}
                        </div>
                      )}
                      {project && <div className="mt-1 truncate text-xs text-blue-700 dark:text-blue-300">{project}</div>}
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                        {owner ? (
                          <span className="truncate text-gray-700 dark:text-gray-300">{owner}</span>
                        ) : (
                          <span className="font-medium text-amber-700 dark:text-amber-300">{t('tasks.unassigned')}</span>
                        )}
                        <span className="inline-flex shrink-0 items-center gap-1 text-gray-600 dark:text-gray-400">
                          <span className={`h-2 w-2 rounded-full ${priorityDot[task.priority] ?? 'bg-gray-400'}`} aria-hidden="true" />
                          {priorityLabel(task)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        {dueLabel(task)}
                        <span>{t('tasks.hoursOf', { actual: task.actualHours || 0, estimated: task.estimatedHours || 0 })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={`${scrollArea} rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800`} tabIndex={0}>
          <table className="w-full min-w-[760px] text-left text-sm" data-testid="task-list">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-600 dark:border-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="w-12 px-4 py-3">
                  <span className="sr-only">{t('tasks.status.done')}</span>
                </th>
                <th scope="col" className="px-2 py-3">{t('tasks.taskTitle')}</th>
                <th scope="col" className="px-2 py-3">{t('tasks.assignee')}</th>
                <th scope="col" className="px-2 py-3">{t('tasks.project')}</th>
                <th scope="col" className="px-2 py-3">{t('tasks.dueDate')}</th>
                <th scope="col" className="px-2 py-3">{t('tasks.priority')}</th>
                <th scope="col" className="px-2 py-3">{t('tasks.statusHeader')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {listed.map((task) => (
                <tr key={task.id} className={task.status === 'done' ? 'text-gray-500 dark:text-gray-400' : undefined}>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => moveTo(task, task.status === 'done' ? 'todo' : 'done')}
                      aria-pressed={task.status === 'done'}
                      aria-label={t('tasks.doneFor', { title: raisedTitle(task, t) })}
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                        task.status === 'done'
                          ? 'border-green-600 bg-green-600 text-white'
                          : 'border-gray-300 text-transparent hover:border-green-600 hover:text-green-600 dark:border-gray-600'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </td>
                  <td className="px-2 py-2">
                    {titleButton(task, task.status === 'done' ? 'line-through' : 'font-medium text-gray-900 dark:text-white')}
                  </td>
                  <td className="px-2 py-2">
                    {nameOf(task.assigneeId) ?? (
                      <span className="font-medium text-amber-700 dark:text-amber-300">{t('tasks.unassigned')}</span>
                    )}
                  </td>
                  <td className="px-2 py-2">{projectName(task.projectId) ?? '-'}</td>
                  <td className="px-2 py-2 tabular-nums">{dueLabel(task)}</td>
                  <td className="px-2 py-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${priorityDot[task.priority] ?? 'bg-gray-400'}`} aria-hidden="true" />
                      {priorityLabel(task)}
                    </span>
                  </td>
                  <td className="px-2 py-2">{t(columns.find((column) => column.key === task.status)?.labelKey ?? '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Everything about one task in one place: what it is, whose it is, where it stands. */}
      <Modal isOpen={Boolean(openTask)} onClose={() => setOpenId(null)} title={openTask ? raisedTitle(openTask, t) : ''}>
        {openTask && (
          <div className="space-y-4" data-testid="task-details">
            {openTask.sourceType && (
              <div className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                {t(`tasks.source.${openTask.sourceType}`)}
              </div>
            )}
            {raisedDescription(openTask, t) && (
              <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">{raisedDescription(openTask, t)}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label={t('tasks.statusHeader')}
                aria-label={t('tasks.statusFor', { title: raisedTitle(openTask, t) })}
                value={openTask.status}
                onChange={(event) => moveTo(openTask, event.target.value as WorkTask['status'])}
              >
                {columns.map((option) => (
                  <option key={option.key} value={option.key}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </Select>
              {canAssign && (
                <Select
                  label={t('tasks.assignee')}
                  aria-label={t('tasks.assigneeFor', { title: raisedTitle(openTask, t) })}
                  value={openTask.assigneeId ?? ''}
                  onChange={(event) =>
                    // null, not undefined: an absent field changes nothing on the
                    // server, so taking the work off somebody needs an explicit null.
                    updateTask(openTask, { assigneeId: (event.target.value || null) as string | undefined }, 'tasks.assignFailed')
                  }
                >
                  <option value="">{t('tasks.nobodyYet')}</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {memberName(member)}
                    </option>
                  ))}
                </Select>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('tasks.project')}</dt>
                <dd className="text-gray-900 dark:text-white">{projectName(openTask.projectId) ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('tasks.priority')}</dt>
                <dd className="text-gray-900 dark:text-white">{priorityLabel(openTask)}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('tasks.dueDate')}</dt>
                <dd className="text-gray-900 dark:text-white">{dueLabel(openTask)}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('tasks.estimatedHours')}</dt>
                <dd className="text-gray-900 dark:text-white">
                  {t('tasks.hoursOf', { actual: openTask.actualHours || 0, estimated: openTask.estimatedHours || 0 })}
                </dd>
              </div>
            </dl>
            {canDelete && (
              <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-sm text-red-700 hover:underline dark:text-red-400"
                  aria-label={t('tasks.deleteFor', { title: raisedTitle(openTask, t) })}
                  onClick={() => {
                    setOpenId(null);
                    setPendingDelete(openTask);
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {t('common.delete')}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title={t('tasks.deleteTitle')}
        message={t('tasks.deleteMessage', { title: pendingDelete ? raisedTitle(pendingDelete, t) : '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={removeTask}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default TasksPage;
