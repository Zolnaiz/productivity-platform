import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { operationsService } from '../../services/operations.service';
import { AuditRun, AuditTemplate } from '../../types/operations.types';
import { FiveSLayoutPlan, FiveSZone } from '../../types/fiveS.types';
import { AuditAnswers, answersForRun, scoreAnswers } from './auditAnswers';
import { tierForRole, tiersForRole } from './tierRules';

interface ZoneAuditWalkProps {
  plan: FiveSLayoutPlan;
  zone: FiveSZone;
  /** The signed-in person's role, which decides the layers they may record. */
  role?: string;
  onRecorded: (run: AuditRun) => void;
  onClose: () => void;
}

/**
 * Walking a checklist in the area it is about.
 *
 * An audit used to be something typed up afterwards at a desk, from notes and
 * memory. The checks that matter are the daily ones, and a person doing a
 * daily check is holding a phone in front of the shelf they are looking at —
 * so the questions come to them, one column, with answers big enough to tap
 * without looking.
 *
 * What is recorded is a full run: the same template, the same scoring and the
 * same score the audit page writes, so a walk means the same thing wherever it
 * was recorded. The server does the rest — it writes the score onto the zone,
 * which repaints the floor plan and resets this layer's clock.
 */
const ZoneAuditWalk: React.FC<ZoneAuditWalkProps> = ({ plan, zone, role, onRecorded, onClose }) => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [answers, setAnswers] = useState<AuditAnswers>({});
  const [tier, setTier] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  // The layers this person may record, and the one they are most likely doing.
  const layers = useMemo(() => tiersForRole(plan.auditTiers, role), [plan.auditTiers, role]);

  useEffect(() => {
    let active = true;

    operationsService
      .getAuditTemplates()
      .then((loaded) => {
        if (!active) return;
        // 5S checklists only: this is a 5S area, and a phone is the wrong
        // place to scroll past a compliance questionnaire to find one.
        const usable = loaded.filter((template) => template.isActive && template.category === '5s');
        setTemplates(usable);
        setTemplateId(usable[0]?.id || '');
      })
      .catch(() => active && setLoadFailed(true))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setTier(String(tierForRole(plan.auditTiers, role)?.tier ?? ''));
  }, [plan.auditTiers, role]);

  /**
   * A layer can name its own checklist, and now something reads it.
   *
   * Higher layers usually ask fewer questions — a manager's monthly walk is
   * not the operator's daily one — and a layer that says which paper it uses
   * was being ignored, so every layer walked the same questions.
   *
   * Only when that checklist is one this organization still has: a template
   * that was retired must not leave somebody holding a phone with nothing to
   * answer.
   */
  useEffect(() => {
    const wanted = layers.find((layer) => String(layer.tier) === tier)?.templateId;

    if (wanted && templates.some((item) => item.id === wanted)) {
      setTemplateId(wanted);
      setAnswers({});
    }
  }, [tier, layers, templates]);

  const template = templates.find((item) => item.id === templateId);
  const score = useMemo(() => scoreAnswers(template, answers), [answers, template]);

  const answer = (questionId: string, value: string) =>
    setAnswers((current) => ({ ...current, [questionId]: value }));

  const record = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!template) return;

    setSaving(true);
    setFailed(false);

    try {
      const run = await operationsService.createAuditRun({
        templateId: template.id,
        zoneId: zone.id,
        tier: tier ? Number(tier) : undefined,
        // Kept so the run still reads sensibly once the zone has been renamed
        // or retired, which is the normal end of a 5S area.
        location: `${zone.code} - ${zone.name}`,
        score,
        status: 'submitted',
        answers: answersForRun(template, answers),
      });

      onRecorded(run);
    } catch {
      // The same rule as the red tag: somebody who believes they have recorded
      // a check and has not is worse off than somebody who knows.
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="mt-3 text-sm text-gray-500" role="status">
        {t('zone.auditLoading')}
      </p>
    );
  }

  if (loadFailed || !template) {
    return (
      <div className="mt-3 space-y-2">
        <p className="text-sm text-gray-500">
          {loadFailed ? t('zone.auditLoadFailed') : t('zone.auditNoTemplate')}
        </p>
        <button
          type="button"
          className="w-full rounded-lg border border-gray-300 py-3 text-sm dark:border-gray-600 dark:text-gray-200"
          onClick={onClose}
        >
          {t('common.cancel')}
        </button>
      </div>
    );
  }

  return (
    <form className="mt-3 space-y-4" onSubmit={record}>
      {templates.length > 1 && (
        <label className="block text-sm">
          <span className="text-gray-500">{t('zone.auditChecklist')}</span>
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base dark:border-gray-600 dark:bg-gray-900"
            value={templateId}
            onChange={(event) => {
              setTemplateId(event.target.value);
              // A different checklist asks different questions; keeping the
              // old answers would score one walk against another's paper.
              setAnswers({});
            }}
          >
            {templates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
      )}

      {layers.length > 1 && (
        <label className="block text-sm">
          <span className="text-gray-500">{t('zone.auditLayer')}</span>
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base dark:border-gray-600 dark:bg-gray-900"
            value={tier}
            onChange={(event) => setTier(event.target.value)}
          >
            {layers.map((layer) => (
              <option key={layer.tier} value={layer.tier}>
                {layer.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <ol className="space-y-4">
        {template.questions.map((question, index) => (
          <li key={question.id}>
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {index + 1}. {question.text}
            </p>

            {question.type === 'score' && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.from({ length: (question.maxScore || 5) + 1 }, (_, value) => value).map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={answers[question.id] === String(value)}
                      className={`h-11 w-11 rounded-lg border text-sm tabular-nums ${
                        answers[question.id] === String(value)
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200'
                      }`}
                      onClick={() => answer(question.id, String(value))}
                    >
                      {value}
                    </button>
                  ),
                )}
              </div>
            )}

            {question.type === 'yes_no' && (
              <div className="mt-2 flex gap-2">
                {(['yes', 'no'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={answers[question.id] === value}
                    className={`flex-1 rounded-lg border py-3 text-sm ${
                      answers[question.id] === value
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200'
                    }`}
                    onClick={() => answer(question.id, value)}
                  >
                    {t(value === 'yes' ? 'zone.auditYes' : 'zone.auditNo')}
                  </button>
                ))}
              </div>
            )}

            {question.type === 'text' && (
              <textarea
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-600 dark:bg-gray-900"
                rows={2}
                aria-label={question.text}
                value={answers[question.id] || ''}
                onChange={(event) => answer(question.id, event.target.value)}
              />
            )}
          </li>
        ))}
      </ol>

      {/*
        The score as it stands, so somebody can see what they are about to
        record before they record it rather than after.
      */}
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {t('zone.auditScoreSoFar')} <span className="font-medium tabular-nums">{score}%</span>
      </p>

      <div className="flex gap-2">
        <button
          type="submit"
          data-testid="zone-audit-submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-medium text-white disabled:opacity-40"
        >
          {t('zone.auditSubmit')}
        </button>
        <button
          type="button"
          className="rounded-lg border border-gray-300 px-4 py-3 text-sm dark:border-gray-600 dark:text-gray-200"
          onClick={onClose}
        >
          {t('common.cancel')}
        </button>
      </div>

      {failed && <p className="text-sm text-red-600">{t('zone.auditFailed')}</p>}
    </form>
  );
};

export default ZoneAuditWalk;
