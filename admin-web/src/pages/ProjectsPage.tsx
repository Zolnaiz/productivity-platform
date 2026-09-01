import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
import { operationsService } from '../services/operations.service';
import { Project } from '../types/operations.types';

const ProjectsPage: React.FC = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectPendingDelete, setProjectPendingDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: '',
    description: '',
    dueDate: '',
    priority: 'medium',
  });

  useEffect(() => {
    let active = true;

    const loadProjects = async () => {
      try {
        const data = await operationsService.getProjects();
        if (active) setProjects(data);
      } catch {
        if (active) setError(t('projects.loadFailed'));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProjects();

    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    setError(null);

    const optimistic: Project = {
      id: `local-${Date.now()}`,
      name: draft.name,
      description: draft.description,
      dueDate: draft.dueDate,
      priority: draft.priority,
      status: 'planned',
      progress: 0,
    };

    setProjects((current) => [optimistic, ...current]);
    setDraft({ name: '', description: '', dueDate: '', priority: 'medium' });
    setCreateOpen(false);

    try {
      await operationsService.createProject(optimistic);
    } catch {
      setError(t('projects.saveFailed'));
    }
  };

  const updateProgress = async (project: Project, progress: number) => {
    const nextProgress = Math.max(0, Math.min(100, progress));
    setError(null);
    setProjects((current) =>
      current.map((item) => (item.id === project.id ? { ...item, progress: nextProgress } : item)),
    );

    try {
      await operationsService.updateProject(project.id, { progress: nextProgress });
    } catch {
      setError(t('projects.progressFailed'));
    }
  };

  const updateStatus = async (project: Project, status: Project['status']) => {
    setError(null);
    setProjects((current) =>
      current.map((item) => (item.id === project.id ? { ...item, status } : item)),
    );

    try {
      await operationsService.updateProject(project.id, { status });
    } catch {
      setError(t('projects.statusFailed'));
    }
  };

  const deleteProject = async (project: Project) => {
    setError(null);
    const previousProjects = projects;
    setProjects((current) => current.filter((item) => item.id !== project.id));
    setDeleting(true);

    try {
      await operationsService.deleteProject(project.id);
      setProjectPendingDelete(null);
    } catch {
      setProjects(previousProjects);
      setError(t('projects.deleteFailed'));
      setProjectPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('projects.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('projects.subtitle')}</p>
        </div>
        <Button icon={Plus} type="button" onClick={() => setCreateOpen(true)}>
          {t('projects.newProject')}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {loading && (
          <Card loading>
            <div />
          </Card>
        )}
        {!loading && projects.length === 0 && (
          <Card>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('projects.empty')}
            </div>
          </Card>
        )}
        {projects.map((project) => (
          <Card key={project.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{project.name}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{project.description}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {project.status}
              </span>
            </div>

            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <div className="text-gray-500">{t('projects.priority')}</div>
                <div className="font-medium">{project.priority}</div>
              </div>
              <div>
                <div className="text-gray-500">{t('projects.dueDate')}</div>
                <div className="font-medium">{project.dueDate || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">{t('projects.progress')}</div>
                <div className="font-medium">{project.progress}%</div>
              </div>
            </div>

            <div className="mt-4 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${project.progress}%` }} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                {t('projects.progress')}
                <input
                  className="mt-1 w-full"
                  type="range"
                  min="0"
                  max="100"
                  value={project.progress}
                  onChange={(event) => updateProgress(project, Number(event.target.value))}
                />
              </label>
              <Select
                label={t('projects.status')}
                value={project.status}
                onChange={(event) => updateStatus(project, event.target.value as Project['status'])}
              >
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="on_hold">On hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                type="button"
                onClick={() => setProjectPendingDelete(project)}
              >
                {t('projects.deleteProject')}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={t('projects.newProject')}>
        <form id="new-project-form" onSubmit={handleCreate} className="space-y-4">
          <Input
            label={t('projects.name')}
            placeholder={t('projects.name')}
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <Input
            label={t('projects.description')}
            placeholder={t('projects.description')}
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          />
          <Input
            label={t('projects.dueDate')}
            type="date"
            value={draft.dueDate}
            onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('projects.addProject')}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(projectPendingDelete)}
        title={t('projects.deleteConfirmTitle')}
        message={
          <>
            <strong className="text-gray-900 dark:text-white">{projectPendingDelete?.name}</strong>{' '}
            {t('projects.deleteWarning')}
          </>
        }
        confirmLabel={t('projects.deleteProject')}
        destructive
        loading={deleting}
        onConfirm={() => projectPendingDelete && deleteProject(projectPendingDelete)}
        onCancel={() => setProjectPendingDelete(null)}
      />
    </div>
  );
};

export default ProjectsPage;
