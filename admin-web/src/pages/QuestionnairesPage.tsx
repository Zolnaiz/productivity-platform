import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/common/Card';
import { assessmentService } from '../services/assessment.service';
import { AssessmentTemplate } from '../types/assessment.types';

const QuestionnairesPage: React.FC = () => {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    type: 'inspection' as AssessmentTemplate['type'],
    industry: 'Operations',
    questionText: '',
  });

  useEffect(() => {
    assessmentService.getTemplates().then(setTemplates);
  }, []);

  const filteredTemplates = useMemo(
    () => (filter === 'all' ? templates : templates.filter((template) => template.status === filter || template.type === filter)),
    [filter, templates],
  );

  const createTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) return;

    const template = await assessmentService.createTemplate({
      title: draft.title,
      description: draft.description,
      type: draft.type,
      industry: draft.industry,
      status: 'draft',
      questions: [
        {
          id: `q-${Date.now()}`,
          text: draft.questionText || 'Score this checkpoint',
          type: 'score',
          maxScore: 5,
        },
      ],
    });
    setTemplates((current) => [template, ...current]);
    setDraft({ title: '', description: '', type: 'inspection', industry: 'Operations', questionText: '' });
  };

  const updateStatus = async (template: AssessmentTemplate, status: AssessmentTemplate['status']) => {
    const updated = await assessmentService.updateTemplate(template.id, { status });
    setTemplates((current) => current.map((item) => (item.id === template.id ? updated : item)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Questionnaires</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Build reusable checklists, feedback forms, and inspection templates for different industries.
          </p>
        </div>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All templates</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="inspection">Inspection</option>
          <option value="quality">Quality</option>
          <option value="safety">Safety</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm text-gray-500">Templates</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{templates.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Published</div>
          <div className="mt-2 text-2xl font-semibold text-green-600">
            {templates.filter((template) => template.status === 'published').length}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Draft</div>
          <div className="mt-2 text-2xl font-semibold text-yellow-600">
            {templates.filter((template) => template.status === 'draft').length}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Questions</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {templates.reduce((sum, template) => sum + template.questions.length, 0)}
          </div>
        </Card>
      </div>

      <Card title="New template" subtitle="Start with one checkpoint. More question editing can grow from this model.">
        <form onSubmit={createTemplate} className="grid gap-3 lg:grid-cols-6">
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 lg:col-span-2"
            placeholder="Template title"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Industry"
            value={draft.industry}
            onChange={(event) => setDraft((current) => ({ ...current, industry: event.target.value }))}
          />
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={draft.type}
            onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as AssessmentTemplate['type'] }))}
          >
            <option value="inspection">Inspection</option>
            <option value="quality">Quality</option>
            <option value="safety">Safety</option>
            <option value="feedback">Feedback</option>
            <option value="survey">Survey</option>
          </select>
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="First question"
            value={draft.questionText}
            onChange={(event) => setDraft((current) => ({ ...current, questionText: event.target.value }))}
          />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" type="submit">
            Add template
          </button>
          <textarea
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 lg:col-span-6"
            placeholder="Description"
            rows={2}
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          />
        </form>
      </Card>

      <Card title={`Template library (${filteredTemplates.length})`}>
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">{template.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium capitalize text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  {template.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{template.type}</span>
                <span className="rounded-full bg-gray-50 px-2 py-1 text-gray-600 dark:bg-gray-900 dark:text-gray-300">{template.industry}</span>
                <span className="rounded-full bg-gray-50 px-2 py-1 text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                  {template.questions.length} questions
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                {template.status !== 'published' && (
                  <button className="text-sm font-medium text-green-600" onClick={() => updateStatus(template, 'published')} type="button">
                    Publish
                  </button>
                )}
                {template.status !== 'archived' && (
                  <button className="text-sm font-medium text-gray-600" onClick={() => updateStatus(template, 'archived')} type="button">
                    Archive
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default QuestionnairesPage;
