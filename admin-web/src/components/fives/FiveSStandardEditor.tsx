import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FiveSGuidelineContent } from '../../types/fiveS.types';

interface FiveSStandardEditorProps {
  content: FiveSGuidelineContent;
  onSave: (content: FiveSGuidelineContent) => Promise<void> | void;
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white';

/**
 * Turns the criteria into a spreadsheet and back.
 *
 * Thirty-five assessment criteria and seventy checklist items are a
 * spreadsheet in every organization that has them, and a form with seventy
 * rows of three inputs is a form nobody finishes. So the long lists are edited
 * the way they are actually maintained — exported, changed in a spreadsheet,
 * pasted back — while the short ones are edited in place.
 */
const asCriteriaText = (content: FiveSGuidelineContent) =>
  content.assessmentCriteria
    .map((criterion) => [criterion.id, criterion.category, criterion.criterion].join(' | '))
    .join('\n');

const parseCriteria = (text: string): FiveSGuidelineContent['assessmentCriteria'] =>
  text
    .split('\n')
    .map((line) => line.split('|').map((part) => part.trim()))
    .filter((parts) => parts.length >= 3 && parts[2])
    .map(([id, category, criterion]) => ({ id, category, criterion }));

const asChecklistText = (content: FiveSGuidelineContent) =>
  content.publicChecklistGroups
    .map((group) => [`${group.code} | ${group.title}`, ...group.items.map((item) => `- ${item}`)].join('\n'))
    .join('\n\n');

/**
 * Reads the checklists back.
 *
 * A heading line names the group, and the lines under it are its items. It is
 * the shape somebody writes anyway when they type a checklist into a message,
 * which is the point: a format nobody has to be taught.
 */
const parseChecklists = (text: string): FiveSGuidelineContent['publicChecklistGroups'] => {
  const groups: FiveSGuidelineContent['publicChecklistGroups'] = [];

  text.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('-')) {
      const item = trimmed.replace(/^-\s*/, '');
      if (item && groups.length) groups[groups.length - 1].items.push(item);
      return;
    }

    const [code, title] = trimmed.split('|').map((part) => part.trim());
    if (code) groups.push({ code, title: title || code, items: [] });
  });

  return groups;
};

/**
 * The 5S standard an organization works to, as something it can change.
 *
 * The cadence, the labelling rules, the criteria and the checklists are the
 * customer's own — they were a hundred strings in a component, then seed data,
 * and until now changing them meant a database write by hand. That is the
 * difference between data being theirs and data being theirs to keep.
 */
const FiveSStandardEditor: React.FC<FiveSStandardEditorProps> = ({ content, onSave }) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<FiveSGuidelineContent>(content);
  const [criteriaText, setCriteriaText] = useState(() => asCriteriaText(content));
  const [checklistText, setChecklistText] = useState(() => asChecklistText(content));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);

  /*
    The standard arrives after the first render — it is fetched — so the draft
    has to follow it. Without this the editor holds the empty standard it was
    mounted with, shows an organization nothing where their cadence should be,
    and saving would write that emptiness over the real thing.
  */
  useEffect(() => {
    setDraft(content);
    setCriteriaText(asCriteriaText(content));
    setChecklistText(asChecklistText(content));
    setSaved(false);
  }, [content]);

  const change = (patch: Partial<FiveSGuidelineContent>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setFailed(false);

    try {
      await onSave({
        ...draft,
        assessmentCriteria: parseCriteria(criteriaText),
        publicChecklistGroups: parseChecklists(checklistText),
      });
      setSaved(true);
    } catch {
      // Said out loud: somebody who believes they have changed the standard
      // everybody is judged against, and has not, is worse off than somebody
      // who knows.
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {t('fiveSStandard.title')}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('fiveSStandard.subtitle')}</p>
      </div>

      <section className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {t('fiveSStandard.cadence')}
        </div>
        {draft.operatingCadence.map((row, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
            <input
              className={inputClass}
              aria-label={t('fiveSStandard.cadenceTitle', { index: index + 1 })}
              value={row.title}
              onChange={(event) =>
                change({
                  operatingCadence: draft.operatingCadence.map((item, position) =>
                    position === index ? { ...item, title: event.target.value } : item,
                  ),
                })
              }
            />
            <input
              className={inputClass}
              aria-label={t('fiveSStandard.cadenceTiming', { index: index + 1 })}
              value={row.timing}
              onChange={(event) =>
                change({
                  operatingCadence: draft.operatingCadence.map((item, position) =>
                    position === index ? { ...item, timing: event.target.value } : item,
                  ),
                })
              }
            />
            <input
              className={inputClass}
              aria-label={t('fiveSStandard.cadenceDetail', { index: index + 1 })}
              value={row.detail}
              onChange={(event) =>
                change({
                  operatingCadence: draft.operatingCadence.map((item, position) =>
                    position === index ? { ...item, detail: event.target.value } : item,
                  ),
                })
              }
            />
            <button
              type="button"
              className="justify-self-start rounded-lg border border-gray-300 p-2 text-gray-500 dark:border-gray-600"
              aria-label={t('fiveSStandard.removeCadence', { name: row.title })}
              onClick={() =>
                change({
                  operatingCadence: draft.operatingCadence.filter((_, position) => position !== index),
                })
              }
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200"
          onClick={() =>
            change({
              operatingCadence: [...draft.operatingCadence, { title: '', timing: '', detail: '' }],
            })
          }
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('fiveSStandard.addCadence')}
        </button>
      </section>

      <section className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
          {t('fiveSStandard.labelStandards')}
          <textarea
            className={`${inputClass} mt-1 min-h-[120px] normal-case tracking-normal`}
            value={draft.labelStandards.join('\n')}
            onChange={(event) =>
              change({
                // One rule per line, which is how somebody writes a list of
                // rules anyway. Blank lines are not rules.
                labelStandards: event.target.value.split('\n').filter((line) => line.trim()),
              })
            }
          />
        </label>
      </section>

      <section className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
          {t('fiveSStandard.criteria')}
          <span className="ml-2 normal-case tracking-normal text-gray-400">
            {t('fiveSStandard.criteriaFormat')}
          </span>
          <textarea
            className={`${inputClass} mt-1 min-h-[160px] font-mono text-xs normal-case tracking-normal`}
            value={criteriaText}
            onChange={(event) => {
              setCriteriaText(event.target.value);
              setSaved(false);
            }}
          />
        </label>
      </section>

      <section className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
          {t('fiveSStandard.checklists')}
          <span className="ml-2 normal-case tracking-normal text-gray-400">
            {t('fiveSStandard.checklistsFormat')}
          </span>
          <textarea
            className={`${inputClass} mt-1 min-h-[200px] font-mono text-xs normal-case tracking-normal`}
            value={checklistText}
            onChange={(event) => {
              setChecklistText(event.target.value);
              setSaved(false);
            }}
          />
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-gray-900"
          disabled={saving}
          onClick={() => void save()}
        >
          {t('fiveSStandard.save')}
        </button>
        {saved && <span className="text-sm text-green-700 dark:text-green-400">{t('fiveSStandard.saved')}</span>}
        {failed && <span className="text-sm text-red-600">{t('fiveSStandard.failed')}</span>}
      </div>
    </div>
  );
};

export default FiveSStandardEditor;
