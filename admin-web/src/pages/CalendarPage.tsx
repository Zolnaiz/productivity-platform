import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { operationsService } from '../services/operations.service';

interface CalendarEvent {
  id: string;
  date: string;
  type: string;
  title: string;
  description: string;
  path: string;
}

const CalendarPage: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    operationsService
      .getCalendarEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    return events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      acc[event.date] = [...(acc[event.date] || []), event];
      return acc;
    }, {});
  }, [events]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('calendar.title')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('calendar.subtitle')}</p>
      </div>

      <Card title={t('calendar.upcomingTimeline')} loading={loading}>
        <div className="space-y-5">
          {Object.keys(grouped).length ? (
            Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="grid gap-3 md:grid-cols-[140px_1fr]">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{date}</div>
                <div className="space-y-3">
                  {items.map((event) => (
                    <div key={event.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {event.type}
                          </span>
                          <div className="mt-2 font-medium text-gray-900 dark:text-white">{event.title}</div>
                          <div className="mt-1 text-sm text-gray-500">{event.description}</div>
                        </div>
                        <Link className="text-sm font-medium text-blue-600 hover:text-blue-500" to={event.path}>
                          Open
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={CalendarDays}
              title={t('calendar.emptyTitle')}
              description={t('calendar.emptyDescription')}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default CalendarPage;
