import React, { useEffect, useState } from 'react';
import Card from '../components/common/Card';
import { operationsService } from '../services/operations.service';
import { Project } from '../types/operations.types';

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [draft, setDraft] = useState({
    name: '',
    description: '',
    dueDate: '',
    priority: 'medium',
  });

  useEffect(() => {
    operationsService.getProjects().then(setProjects);
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;

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
    await operationsService.createProject(optimistic);
  };

  const updateProgress = async (project: Project, progress: number) => {
    const nextProgress = Math.max(0, Math.min(100, progress));
    setProjects((current) =>
      current.map((item) => (item.id === project.id ? { ...item, progress: nextProgress } : item)),
    );
    await operationsService.updateProject(project.id, { progress: nextProgress });
  };

  const updateStatus = async (project: Project, status: Project['status']) => {
    setProjects((current) =>
      current.map((item) => (item.id === project.id ? { ...item, status } : item)),
    );
    await operationsService.updateProject(project.id, { status });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Projects</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Төсөл бүрийн явц, deadline, priority, budget-ийг хянана.
        </p>
      </div>

      <Card title="New project">
        <form onSubmit={handleCreate} className="grid gap-3 lg:grid-cols-4">
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Project name"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Short description"
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            type="date"
            value={draft.dueDate}
            onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
          />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" type="submit">
            Add project
          </button>
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
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
                <div className="text-gray-500">Priority</div>
                <div className="font-medium">{project.priority}</div>
              </div>
              <div>
                <div className="text-gray-500">Due date</div>
                <div className="font-medium">{project.dueDate || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">Progress</div>
                <div className="font-medium">{project.progress}%</div>
              </div>
            </div>

            <div className="mt-4 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${project.progress}%` }} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Progress
                <input
                  className="mt-1 w-full"
                  type="range"
                  min="0"
                  max="100"
                  value={project.progress}
                  onChange={(event) => updateProgress(project, Number(event.target.value))}
                />
              </label>
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Status
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  value={project.status}
                  onChange={(event) => updateStatus(project, event.target.value as Project['status'])}
                >
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProjectsPage;
