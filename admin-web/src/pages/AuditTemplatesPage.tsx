import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/common/Card';
import { operationsService } from '../services/operations.service';
import { AuditRun, AuditTemplate } from '../types/operations.types';

type Answers = Record<string, string>;

const AuditTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [runs, setRuns] = useState<AuditRun[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [location, setLocation] = useState('');
  const [answers, setAnswers] = useState<Answers>({});
  const [actionMessage, setActionMessage] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    operationsService.getAuditTemplates().then((items) => {
      setTemplates(items);
      setSelectedTemplateId(items[0]?.id || '');
    });
    operationsService.getAuditRuns().then(setRuns);
  }, []);

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
  const industries = useMemo(
    () => Array.from(new Set(templates.map((template) => template.industry || 'General'))).sort(),
    [templates],
  );
  const categories = useMemo(
    () => Array.from(new Set(templates.map((template) => template.category))).sort(),
    [templates],
  );
  const filteredTemplates = useMemo(
    () =>
      templates.filter((template) => {
        const industry = template.industry || 'General';
        const matchesIndustry = industryFilter === 'all' || industry === industryFilter;
        const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
        return matchesIndustry && matchesCategory;
      }),
    [categoryFilter, industryFilter, templates],
  );

  const score = useMemo(() => {
    if (!selectedTemplate) return 0;

    let earned = 0;
    let possible = 0;

    selectedTemplate.questions.forEach((question) => {
      if (question.type === 'score') {
        possible += question.maxScore || 5;
        earned += Number(answers[question.id] || 0);
      }

      if (question.type === 'yes_no') {
        possible += 1;
        earned += answers[question.id] === 'yes' ? 1 : 0;
      }
    });

    return possible ? Math.round((earned / possible) * 100) : 0;
  }, [answers, selectedTemplate]);

  const createCorrectiveTask = async (run: AuditRun, templateTitle: string) => {
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await operationsService.createTask({
      title: `Corrective action: ${templateTitle} at ${run.location || 'audit location'}`,
      description: `Audit score was ${run.score}%. Review failed checklist items and record improvement work.`,
      status: 'todo',
      priority: run.score < 70 ? 'high' : 'medium',
      dueDate,
      estimatedHours: 2,
      actualHours: 0,
    });
    setActionMessage(`Corrective action task created for ${run.location || templateTitle}.`);
  };

  const submitAudit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedTemplate) return;

    const auditRun: AuditRun = {
      id: `local-audit-${Date.now()}`,
      templateId: selectedTemplate.id,
      location,
      score,
      status: 'submitted',
      answers: selectedTemplate.questions.map((question) => ({
        questionId: question.id,
        value:
          question.type === 'score'
            ? Number(answers[question.id] || 0)
            : question.type === 'yes_no'
              ? answers[question.id] === 'yes'
              : answers[question.id] || '',
      })),
    };

    setRuns((current) => [auditRun, ...current]);
    setAnswers({});
    setLocation('');
    await operationsService.createAuditRun(auditRun);
    if (auditRun.score < 85) {
      await createCorrectiveTask(auditRun, selectedTemplate.title);
    } else {
      setActionMessage('Audit submitted. No corrective action needed.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">5S / Audit Templates</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          5S, safety, quality, compliance, risk, and industry-specific inspection templates.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm text-gray-500">Templates</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{templates.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Industries</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{industries.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Categories</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{categories.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Audit runs</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{runs.length}</div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_440px]">
        <Card title="Run audit" subtitle={selectedTemplate?.description}>
          <form onSubmit={submitAudit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Template
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  value={selectedTemplateId}
                  onChange={(event) => {
                    setSelectedTemplateId(event.target.value);
                    setAnswers({});
                  }}
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Location
                <input
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  placeholder="Production floor, branch, site..."
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                />
              </label>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="text-sm text-blue-700 dark:text-blue-300">Current audit score</div>
              <div className="mt-1 text-3xl font-semibold text-blue-700 dark:text-blue-300">{score}%</div>
              <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                Scores below 85% automatically create a corrective action task.
              </div>
            </div>

            <div className="space-y-3">
              {selectedTemplate?.questions.map((question) => (
                <div key={question.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="font-medium text-gray-900 dark:text-white">{question.text}</div>
                  {question.type === 'score' && (
                    <div className="mt-3">
                      <input
                        className="w-full"
                        type="range"
                        min="0"
                        max={question.maxScore || 5}
                        value={answers[question.id] || 0}
                        onChange={(event) =>
                          setAnswers((current) => ({ ...current, [question.id]: event.target.value }))
                        }
                      />
                      <div className="mt-1 text-xs text-gray-500">
                        Score: {answers[question.id] || 0}/{question.maxScore || 5}
                      </div>
                    </div>
                  )}
                  {question.type === 'yes_no' && (
                    <select
                      className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                      value={answers[question.id] || 'no'}
                      onChange={(event) =>
                        setAnswers((current) => ({ ...current, [question.id]: event.target.value }))
                      }
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  )}
                  {question.type === 'text' && (
                    <input
                      className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                      value={answers[question.id] || ''}
                      onChange={(event) =>
                        setAnswers((current) => ({ ...current, [question.id]: event.target.value }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>

            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" type="submit">
              Submit audit
            </button>
            {actionMessage && <div className="text-sm text-green-600">{actionMessage}</div>}
          </form>
        </Card>

        <div className="space-y-6">
          <Card title="Template library">
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                value={industryFilter}
                onChange={(event) => setIndustryFilter(event.target.value)}
              >
                <option value="all">All industries</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">All needs</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedTemplateId === template.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-gray-200 hover:border-blue-200 dark:border-gray-700'
                  }`}
                  type="button"
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setAnswers({});
                  }}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{template.title}</div>
                  <p className="mt-1 text-xs text-gray-500">{template.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    {template.category.replace('_', ' ')} - {template.industry || 'General'} - {template.questions.length} questions
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Recent audit runs">
            <div className="space-y-3">
              {runs.map((run) => {
                const template = templates.find((item) => item.id === run.templateId);
                return (
                  <div key={run.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {template?.title || 'Audit run'}
                        </div>
                        <div className="text-sm text-gray-500">{run.location || 'No location'}</div>
                      </div>
                      <div className="text-lg font-semibold text-blue-600">{run.score}%</div>
                    </div>
                    {run.score < 85 && (
                      <button
                        className="mt-3 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/30"
                        type="button"
                        onClick={() => createCorrectiveTask(run, template?.title || 'Audit run')}
                      >
                        Create corrective task
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuditTemplatesPage;
