import React, { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { susService } from '../../services/sus.service';

/**
 * A word on the home page while the usability questionnaire (SUS, K7) is open
 * and the person has not answered it - the same way WeekReminder asks for the
 * week. A questionnaire only measures something if most people answer, and
 * people answer what they are asked where they already are. Gone once they
 * have answered, or when the round closes.
 */
const SusReminder: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canAnswer = hasPermission('sus:answer');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!canAnswer) return;
    let active = true;
    susService
      .current()
      .then((current) => active && setShow(Boolean(current.round) && !current.mine))
      // A reminder that cannot be read is not shown; the page itself still works.
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [canAnswer]);

  if (!show) return null;

  return (
    <div
      data-testid="sus-reminder"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
    >
      <span className="inline-flex items-center gap-2">
        <ClipboardList className="h-5 w-5" aria-hidden="true" />
        {t('usability.reminder')}
      </span>
      <Link to="/usability" className="font-medium underline">
        {t('usability.answerNow')}
      </Link>
    </div>
  );
};

export default SusReminder;
