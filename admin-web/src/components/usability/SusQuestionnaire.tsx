/**
 * The ten SUS statements with a 1-5 scale; submits one person's answers for the open round (K7).
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../common/Button';
import { apiErrorMessage } from '../../i18n/apiError';
import { MySusAnswers, SusRound, susService } from '../../services/sus.service';
import { SUS_ITEMS, SUS_SCALE } from './sus';

interface SusQuestionnaireProps {
  round: SusRound;
  mine: MySusAnswers | null;
  onSaved: (mine: MySusAnswers) => void;
}

/**
 * The ten SUS statements (Appendix B of the thesis), each answered 1-5.
 *
 * One fieldset a statement, so a screen reader reads the statement as the
 * question its five choices answer. Nothing is sent until all ten are
 * answered: a SUS score from nine answers is not a SUS score. Answers already
 * given come back filled in, and can be changed while the round is open.
 */
const SusQuestionnaire: React.FC<SusQuestionnaireProps> = ({ round, mine, onSaved }) => {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Array<number | null>>(
    () => mine?.answers ?? Array.from({ length: SUS_ITEMS }, () => null),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<MySusAnswers | null>(null);
  const complete = answers.every((value) => value !== null);

  const choose = (item: number, value: number) => {
    setAnswers((current) => current.map((answer, index) => (index === item ? value : answer)));
    setSaved(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!complete) return;
    setSaving(true);
    setError(null);
    try {
      const result = await susService.answer(round.id, answers as number[]);
      setSaved(result);
      onSaved(result);
    } catch (saveError) {
      setError(apiErrorMessage(saveError, t));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" aria-describedby="sus-scale">
      <p id="sus-scale" className="text-sm text-gray-600 dark:text-gray-400">
        {t('usability.scaleHint')}
      </p>

      <ol className="space-y-4">
        {Array.from({ length: SUS_ITEMS }, (_, item) => (
          <li key={item}>
            <fieldset className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
              <legend className="px-1 text-sm font-medium text-gray-900 dark:text-white">
                S{item + 1}. {t(`usability.items.s${item + 1}`)}
              </legend>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('usability.scale.disagree')}</span>
                {SUS_SCALE.map((value) => (
                  <label key={value} className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      name={`sus-s${item + 1}`}
                      value={value}
                      checked={answers[item] === value}
                      onChange={() => choose(item, value)}
                      aria-label={t('usability.choice', { value, item: item + 1 })}
                    />
                    {value}
                  </label>
                ))}
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('usability.scale.agree')}</span>
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-sm text-green-700 dark:text-green-400" role="status">
          {t('usability.thanks', { score: saved.score })}
        </p>
      )}
      {!complete && <p className="text-sm text-gray-600 dark:text-gray-400">{t('usability.answerAll')}</p>}

      <Button type="submit" disabled={!complete} loading={saving}>
        {mine ? t('usability.update') : t('usability.submit')}
      </Button>
    </form>
  );
};

export default SusQuestionnaire;
