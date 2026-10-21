import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../common/Button';
import Card from '../common/Card';
import { apiErrorMessage } from '../../i18n/apiError';
import { operationsService } from '../../services/operations.service';
import type { AuditTemplate } from '../../types/operations.types';

/** The ready checklists, in the order they are offered. Their words live in the locale files. */
export const LIBRARY = ['office', 'production', 'warehouse'] as const;
export type LibraryId = (typeof LIBRARY)[number];

type Translate = (key: string, options?: Record<string, unknown>) => unknown;

/** A library checklist as a template, in the language the reader has chosen. */
export const libraryTemplate = (id: LibraryId, t: Translate): Partial<AuditTemplate> => {
  const questions = t(`fiveSLibrary.${id}.questions`, { returnObjects: true });
  const texts = Array.isArray(questions) ? (questions as string[]) : [];
  return {
    title: String(t(`fiveSLibrary.${id}.title`)),
    description: String(t(`fiveSLibrary.${id}.description`)),
    category: '5s',
    industry: String(t(`fiveSLibrary.${id}.industry`)),
    isActive: true,
    questions: texts.map((text, index) => ({ id: `q${index + 1}`, text, type: 'score' as const, maxScore: 5 })),
  };
};

/**
 * UC-20: ready-made 5S checklists an administrator adds in one click and can
 * then edit like any other template. Adding the same one twice is refused on
 * the screen, by title, so the list does not fill with copies.
 */
const FiveSTemplateLibrary: React.FC<{ existing: AuditTemplate[]; onAdded: (template: AuditTemplate) => void }> = ({
  existing,
  onAdded,
}) => {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<LibraryId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const titles = new Set(existing.map((template) => template.title));

  const add = async (id: LibraryId) => {
    setBusy(id);
    setError(null);
    try {
      onAdded(await operationsService.createAuditTemplate(libraryTemplate(id, t as Translate)));
    } catch (addError) {
      setError(apiErrorMessage(addError, t));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('fiveSLibrary.title')}</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('fiveSLibrary.hint')}</p>
      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <ul className="mt-4 grid gap-3 md:grid-cols-3">
        {LIBRARY.map((id) => {
          const template = libraryTemplate(id, t as Translate);
          const added = titles.has(template.title ?? '');
          return (
            <li key={id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <p className="font-medium text-gray-900 dark:text-white">{template.title}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('fiveSLibrary.questionCount', { count: template.questions?.length ?? 0 })}
              </p>
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                icon={Download}
                type="button"
                disabled={added || busy !== null}
                onClick={() => add(id)}
              >
                {added ? t('fiveSLibrary.added') : t('fiveSLibrary.add')}
              </Button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default FiveSTemplateLibrary;
