import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { raisedDescription, raisedTitle } from '../components/common/raisedText';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
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

const emptyDraft = {
  title: '',
  description: '',
  assigneeId: '',
  projectId: '',
  priority: 'medium',
  dueDate: '',
  estimatedHours: '1',
};

/** Everybody, nobody, or one person: what the board is showing. */
type Filter = 'all' | 'unassigned' | string;


/**
 * The work, by stage, and who it is for.
 *
 * A task could be written here and given to nobody: the form had a title, a
 * date and an estimate, and no way to say whose it was or which project it
 * belonged to. Everything built on assignment — the plan, the progress board,
 * the morning reminder, a person's month — had nothing to count unless the
 * work came from a 5S finding.
 */
const TasksPage: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
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
  const [filter, setFilter] = useState<Filter>('all');
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
  // New work opened from a project is filed under it.
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

  const nameOf = (userId?: string) => {
    if (!userId) return null;
    const member = members.find((candidate) => candidate.id === userId);

    return member ? memberName(member) : userId;
  };

  const projectName = (projectId?: string) => projects.find((project) => project.id === projectId)?.name;

  const visible = useMemo(
    () =>
      tasks
        .filter((task) => !projectFilter || task.projectId === projectFilter)
        .filter((task) =>
          filter === 'all' ? true : filter === 'unassigned' ? !task.assigneeId : task.assigneeId === filter,
        ),
    [filter, projectFilter, tasks],
  );

  const grouped = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        tasks: visible.filter((task) => task.status === column.key),
      })),
    [visible],
  );

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    setError(null);

    const localId = `local-${Date.now()}`;
    const optimistic: WorkTask = {
      id: localId,
      title: draft.title.trim(),
      description: draft.description.trim() || undefined,
      status: 'todo',
      priority: draft.priority,
      assigneeId: draft.assigneeId || undefined,
      projectId: draft.projectId || undefined,
      dueDate: draft.dueDate || undefined,
      estimatedHours: Number(draft.estimatedHours || 0),
      actualHours: 0,
    };

    setTasks((current) => [optimistic, ...current]);
    setDraft({ ...emptyDraft, projectId: projectFilter });
    setCreateOpen(false);

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

  const removeTask = async () => {
    const task = pendingDelete;
    setPendingDelete(null);
    if (!task) return;

    setError(null);
    setTasks((current) => current.filter((item) => item.id !== task.id));

    try {
      await operationsService.deleteTask(task.id);
    } catch {
      // Back where it was: it was not taken off the server.
      setTasks((current) => [task, ...current]);
      setError(t('tasks.deleteFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('tasks.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('tasks.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {canAssign && (
            <div className="w-56">
              <Select
                label={t('tasks.showFor')}
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="all">{t('tasks.everyone')}</option>
                <option value="unassigned">{t('tasks.unassigned')}</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {memberName(member)}
                  </option>
                ))}
              </Select>
            </div>
          )}
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
          <button
            type="button"
            className="font-medium underline"
            onClick={() => setSearchParams({})}
          >
            {t('tasks.allProjects')}
          </button>
        </div>
      )}

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

      <div className="grid gap-4 xl:grid-cols-5">
        {grouped.map((column) => (
          <Card key={column.key} title={`${t(column.labelKey)} (${column.tasks.length})`}>
            <div className="space-y-3">
              {column.tasks.map((task) => {
                const owner = nameOf(task.assigneeId);
                const project = projectName(task.projectId);

                return (
                  <div
                    key={task.id}
                    data-testid="task-card"
                    className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{raisedTitle(task, t)}</div>
                    {/* Work raised by a finding says so, so nobody has to guess
                        why a task they did not write appeared in their column. */}
                    {task.sourceType && (
                      <div className="mt-1 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        {t(`tasks.source.${task.sourceType}`)}
                      </div>
                    )}
                    {project && <div className="mt-1 truncate text-xs text-blue-700 dark:text-blue-300">{project}</div>}
                    {/* What the work is about - an audit's score, a tag's area -
                        folded away so the board stays a board. */}
                    {raisedDescription(task, t) && (
                      <details className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        <summary className="cursor-pointer text-gray-500 dark:text-gray-400">{t('tasks.details')}</summary>
                        <p className="mt-1 whitespace-pre-line">{raisedDescription(task, t)}</p>
                      </details>
                    )}
                    <div className="mt-2 text-xs">
                      {owner ? (
                        <span className="text-gray-700 dark:text-gray-300">{owner}</span>
                      ) : (
                        <span className="font-medium text-amber-700 dark:text-amber-300">{t('tasks.unassigned')}</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {priorities.includes(task.priority as (typeof priorities)[number])
                          ? t(`tasks.priorities.${task.priority}`)
                          : task.priority}
                      </span>
                      <span>{task.dueDate || '-'}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {t('tasks.hoursOf', { actual: task.actualHours || 0, estimated: task.estimatedHours || 0 })}
                    </div>
                    {canAssign && (
                      <Select
                        className="mt-3"
                        fieldSize="sm"
                        aria-label={t('tasks.assigneeFor', { title: raisedTitle(task, t) })}
                        value={task.assigneeId ?? ''}
                        onChange={(event) =>
                          // null, not undefined: an absent field changes nothing on the
                          // server, so taking the work off somebody needs an explicit null.
                          updateTask(
                            task,
                            { assigneeId: (event.target.value || null) as string | undefined },
                            'tasks.assignFailed',
                          )
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
                    <Select
                      className="mt-2"
                      fieldSize="sm"
                      aria-label={t('tasks.statusFor', { title: raisedTitle(task, t) })}
                      value={task.status}
                      onChange={(event) =>
                        updateTask(task, { status: event.target.value as WorkTask['status'] }, 'tasks.statusFailed')
                      }
                    >
                      {columns.map((option) => (
                        <option key={option.key} value={option.key}>
                          {t(option.labelKey)}
                        </option>
                      ))}
                    </Select>
                    {canDelete && (
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        aria-label={t('tasks.deleteFor', { title: raisedTitle(task, t) })}
                        onClick={() => setPendingDelete(task)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('common.delete')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

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
