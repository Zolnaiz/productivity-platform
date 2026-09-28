import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import { adminService } from '../../services/admin.service';
import { fiveSLayoutService } from '../../services/fiveSLayout.service';
import { operationsService } from '../../services/operations.service';
import { peopleService } from '../../services/people.service';
import { SetupFacts, setupSteps } from './setupSteps';

const settle = <T,>(request: () => Promise<T>, fallback: T) =>
  Promise.resolve().then(request).catch(() => fallback);

export const loadSetupFacts = async (): Promise<SetupFacts> => {
  const [profile, departments, people, invitations, plans, templates, runs] = await Promise.all([
    settle(() => adminService.getWorkspaceProfile(), null),
    settle(() => peopleService.getDepartments(), []),
    settle(() => peopleService.getMembers(), []),
    settle(() => peopleService.getPendingInvitations(), []),
    settle(() => fiveSLayoutService.getPlans(), []),
    settle(() => operationsService.getAuditTemplates(), []),
    settle(() => operationsService.getAuditRuns(), []),
  ]);
  const zones = (plans ?? []).flatMap((plan) => plan.zones ?? []);
  return {
    profileComplete: Boolean(profile?.name?.trim() && profile.industry?.trim() && profile.address?.trim()),
    departments: (departments ?? []).length,
    people: (people ?? []).filter((person) => person.isActive !== false).length,
    invitations: (invitations as unknown[] | null)?.length ?? 0,
    zones: zones.length,
    zonesWithOwner: zones.filter((zone) => zone.ownerId || zone.ownerName).length,
    checklists: (templates ?? []).filter((template) => template.isActive !== false).length,
    audits: (runs ?? []).length,
  };
};

/**
 * Getting an organization started, one step at a time.
 *
 * Linear and Asana open a new workspace on a short list of what to do
 * first; a new organization here had the whole application and no idea
 * where to begin. Shown on an administrator's home page until every step
 * is done, and in full on its own page.
 */
const SetupChecklist: React.FC<{ hideWhenDone?: boolean }> = ({ hideWhenDone = false }) => {
  const { t } = useTranslation();
  const [facts, setFacts] = useState<SetupFacts | null>(null);

  useEffect(() => {
    let active = true;
    loadSetupFacts().then((value) => active && setFacts(value));
    return () => {
      active = false;
    };
  }, []);

  if (!facts) return null;
  const steps = setupSteps(facts);
  const done = steps.filter((step) => step.done).length;
  if (hideWhenDone && done === steps.length) return null;
  const next = steps.find((step) => !step.done);

  return (
    <Card title={t('setup.title')} subtitle={t('setup.progress', { done, total: steps.length })}>
      <div
        className="mb-4 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={done}
        aria-label={t('setup.title')}
      >
        <div className="h-full rounded-full bg-green-600" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ol className="space-y-2" data-testid="setup-steps">
        {steps.map((step) => (
          <li key={step.key} className="flex items-start gap-3">
            {step.done ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <div className={`text-sm font-medium ${step.done ? 'text-gray-600 line-through dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                {t(`setup.steps.${step.key}.title`)}
                <span className="sr-only"> - {step.done ? t('setup.done') : t('setup.toDo')}</span>
              </div>
              {!step.done && <p className="text-sm text-gray-600 dark:text-gray-400">{t(`setup.steps.${step.key}.why`)}</p>}
            </div>
            {!step.done && (
              <Link
                to={step.path}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  step === next
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t(`setup.steps.${step.key}.action`)}
              </Link>
            )}
          </li>
        ))}
      </ol>
      {done === steps.length && <p className="mt-4 text-sm text-green-700 dark:text-green-300">{t('setup.allDone')}</p>}
    </Card>
  );
};

export default SetupChecklist;
