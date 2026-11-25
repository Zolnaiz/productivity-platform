import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import SusQuestionnaire from '../components/usability/SusQuestionnaire';
import SusResults from '../components/usability/SusResults';
import { useAuth } from '../contexts/AuthContext';
import { apiErrorMessage } from '../i18n/apiError';
import { CurrentSus, susService } from '../services/sus.service';

/**
 * The usability questionnaire (SUS, measure K7): everybody answers the open
 * round here, and an administrator opens and closes rounds and reads the
 * totals below. The home page reminds whoever has not answered
 * (widgets/SusReminder) and links here; so does the phone.
 */
const UsabilityPage: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('sus:manage');
  const [current, setCurrent] = useState<CurrentSus | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Moves on each answer saved, so an administrator's totals below are read
  // again and include their own answer rather than the count from before it.
  const [answersSaved, setAnswersSaved] = useState(0);

  const load = useCallback(async () => {
    try {
      setCurrent(await susService.current());
    } catch (loadError) {
      setError(apiErrorMessage(loadError, t));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('usability.title')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('usability.subtitle')}</p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">
          {error}
        </p>
      )}

      <Card title={current?.round?.title} loading={!current && !error}>
        {current?.round ? (
          <>
            {current.mine && (
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {t('usability.answered', { score: current.mine.score })}
              </p>
            )}
            {/* Keyed by round, so a round opened while the page is open starts empty. */}
            <SusQuestionnaire
              key={current.round.id}
              round={current.round}
              mine={current.mine}
              onSaved={(mine) => {
                setCurrent((previous) => (previous ? { ...previous, mine } : previous));
                setAnswersSaved((count) => count + 1);
              }}
            />
          </>
        ) : (
          current && <p className="text-sm text-gray-600 dark:text-gray-400">{t('usability.noRound')}</p>
        )}
      </Card>

      {canManage && <SusResults key={answersSaved} onRoundsChanged={() => void load()} />}
    </div>
  );
};

export default UsabilityPage;
