import React, { useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { localDay } from '../progress/progressBoard';
import { checkinService, mondayOf } from '../../services/checkin.service';

/**
 * A word on Thursday and Friday to somebody who has not written their week.
 *
 * A check-in is only worth reading if most people write one, and people
 * write it when they are reminded at the end of the week - which is why
 * Weekdone emails on Friday. Here it is on the home page instead, and gone
 * once the week is written.
 */
const WeekReminder: React.FC = () => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const now = new Date();
    // Thursday 4, Friday 5 - the end of the working week.
    if (now.getDay() !== 4 && now.getDay() !== 5) return;
    let active = true;
    checkinService
      .getMine(mondayOf(localDay(now)))
      .then((checkin) => active && setShow(!checkin))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (!show) return null;

  return (
    <div
      data-testid="week-reminder"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
    >
      <span className="inline-flex items-center gap-2">
        <CalendarCheck className="h-5 w-5" aria-hidden="true" />
        {t('weekly.reminder')}
      </span>
      <Link to="/weekly" className="font-medium underline">
        {t('weekly.writeNow')}
      </Link>
    </div>
  );
};

export default WeekReminder;
