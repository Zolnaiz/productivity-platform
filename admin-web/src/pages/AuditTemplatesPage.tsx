import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { fiveSLayoutService } from '../services/fiveSLayout.service';
import { operationsService } from '../services/operations.service';
import { AuditRun, AuditTemplate } from '../types/operations.types';
import { FiveSZone } from '../types/fiveS.types';

type Answers = Record<string, string>;

/**
 * A run below this score raises corrective work. 85 is the common 5S pass mark;
 * below 70 the area needs attention this week rather than next.
 */
const PASSING_SCORE = 85;
const URGENT_SCORE = 70;
const CORRECTIVE_DUE_DAYS = 7;

const AuditTemplatesPage: React.FC = () => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [runs, setRuns] = useState<AuditRun[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [zones, setZones] = useState<FiveSZone[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [actionMessage, setActionMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [industryFilter, setIndustryFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    let active = true;

    const loadAudits = async () => {
      try {
        const [templateItems, runItems, plan] = await Promise.all([
          operationsService.getAuditTemplates(),
          operationsService.getAuditRuns(),
          fiveSLayoutService.getPlan(),
        ]);

        if (!active) return;
        setTemplates(templateItems);
        setSelectedTemplateId(templateItems[0]?.id || '');
        setRuns(runItems);
        setZones(plan.zones);
      } catch {
        if (active) setError(t('auditTemplates.loadFailed'));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAudits();

    return () => {
      active = false;
    };
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

  const createCorrectiveTask = async (run: AuditRun, templateTitle: string, place: string) => {
    const dueDate = new Date(Date.now() + CORRECTIVE_DUE_DAYS * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    await operationsService.createTask({
      title: t('auditTemplates.correctiveTitle', { template: templateTitle, place }),
      description: t('auditTemplates.correctiveDescription', { score: run.score }),
      status: 'todo',
      priority: run.score < URGENT_SCORE ? 'high' : 'medium',
      dueDate,
      estimatedHours: 2,
      actualHours: 0,
    });

    setActionMessage(t('auditTemplates.correctiveCreated', { place }));
  };


  const submitAudit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedTemplate) return;

    const zone = zones.find((item) => item.id === zoneId);

    const auditRun: AuditRun = {
      id: `local-audit-${Date.now()}`,
      templateId: selectedTemplate.id,
      zoneId: zoneId || undefined,
      // Kept for audits of places that are not on the map, and so a run still
      // reads sensibly in a list once a zone has been renamed or removed.
      location: zone ? `${zone.code} - ${zone.name}` : undefined,
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
    setZoneId('');

    const place = auditRun.location || selectedTemplate.title;

    // The server writes the score onto the zone, so the map updates even when
    // the audit is submitted from the mobile app or a second browser.
    await operationsService.createAuditRun(auditRun);

    if (auditRun.score < PASSING_SCORE) {
      await createCorrectiveTask(auditRun, selectedTemplate.title, place);
    } else {
      setActionMessage(
        zone ? t('auditTemplates.zoneScoreUpdated', { place }) : t('auditTemplates.submitted'),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('auditTemplates.title')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('auditTemplates.subtitle')}</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <Card loading>
          <div />
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm text-gray-500">{t('auditTemplates.templates')}</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{templates.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t('auditTemplates.industries')}</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{industries.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t('auditTemplates.categories')}</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{categories.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t('auditTemplates.auditRuns')}</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{runs.length}</div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_440px]">
        <Card title={t('auditTemplates.runAudit')} subtitle={selectedTemplate?.description}>
          <form onSubmit={submitAudit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                label={t('auditTemplates.template')}
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
              </Select>
              <Select
                label={t('auditTemplates.zone')}
                value={zoneId}
                onChange={(event) => setZoneId(event.target.value)}
                helperText={t('auditTemplates.zoneHint')}
              >
                <option value="">{t('auditTemplates.noZone')}</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.code} - {zone.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="text-sm text-blue-700 dark:text-blue-300">{t('auditTemplates.currentScore')}</div>
              <div className="mt-1 text-3xl font-semibold text-blue-700 dark:text-blue-300">{score}%</div>
              <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                {t('auditTemplates.scoreHint')}
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
                    <Select
                      className="mt-3"
                      aria-label={question.text}
                      value={answers[question.id] || 'no'}
                      onChange={(event) =>
                        setAnswers((current) => ({ ...current, [question.id]: event.target.value }))
                      }
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </Select>
                  )}
                  {question.type === 'text' && (
                    <Input
                      className="mt-3"
                      aria-label={question.text}
                      value={answers[question.id] || ''}
                      onChange={(event) =>
                        setAnswers((current) => ({ ...current, [question.id]: event.target.value }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>

            <Button disabled={!selectedTemplate || loading} type="submit">
              {t('auditTemplates.submitAudit')}
            </Button>
            {actionMessage && <div className="text-sm text-green-600">{actionMessage}</div>}
          </form>
        </Card>

        <div className="space-y-6">
          <Card title={t('auditTemplates.templateLibrary')}>
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <Select
                label={t('auditTemplates.industry')}
                value={industryFilter}
                onChange={(event) => setIndustryFilter(event.target.value)}
              >
                <option value="all">{t('auditTemplates.allIndustries')}</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </Select>
              <Select
                label={t('auditTemplates.businessNeed')}
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">{t('auditTemplates.allNeeds')}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ')}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-3">
              {!loading && filteredTemplates.length === 0 && (
                <div className="text-sm text-gray-500">
                  {t('auditTemplates.noTemplatesMatch')}
                </div>
              )}
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

          <Card title={t('auditTemplates.recentRuns')}>
            <div className="space-y-3">
              {!loading && runs.length === 0 && (
                <div className="text-sm text-gray-500">
                  Одоогоор audit run бүртгэгдээгүй байна.
                </div>
              )}
              {runs.map((run) => {
                const template = templates.find((item) => item.id === run.templateId);
                return (
                  <div key={run.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {template?.title || 'Audit run'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {run.location || t('auditTemplates.noZone')}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-blue-600">{run.score}%</div>
                    </div>
                    {run.score < PASSING_SCORE && (
                      <Button
                        className="mt-3 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/30"
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() =>
                          createCorrectiveTask(
                            run,
                            template?.title || t('auditTemplates.auditRuns'),
                            run.location || t('auditTemplates.noZone'),
                          )
                        }
                      >
                        {t('auditTemplates.createCorrectiveTask')}
                      </Button>
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
