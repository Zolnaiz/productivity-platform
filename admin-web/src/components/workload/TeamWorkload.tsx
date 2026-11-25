/**
 * The team's load this week on the progress board (PLAN_V2 M12): one bar per person, hours of open work due
 * within 7 days against a 40-hour week, most loaded first, and who has room. Members with no open work are shown
 * as free, so the quietest people are visible too. For whoever assigns work (workload:read); numbers from
 * GET /workload, rules in backend/src/operations/workload.ts.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../common/Card';
import { workloadService } from '../../services/workload.service';
import { LoadLevel, PersonWorkload } from './workload';

interface TeamWorkloadProps {
  members: Array<{ id: string }>;
  nameOf: (userId: string) => string;
}

const barColor: Record<LoadLevel, string> = {
  free: 'bg-emerald-500',
  busy: 'bg-amber-500',
  over: 'bg-red-500',
};

/** How many of the freest people to name as having room. */
const ROOM_FOR = 2;

const TeamWorkload = ({ members, nameOf }: TeamWorkloadProps) => {
  const { t } = useTranslation();
  const [people, setPeople] = useState<PersonWorkload[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    workloadService
      .team()
      .then((loaded) => !cancelled && setPeople(loaded))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return null;

  const loaded = new Map((people ?? []).map((person) => [person.userId, person]));
  const rows: PersonWorkload[] = [
    ...(people ?? []),
    ...members
      .filter((member) => !loaded.has(member.id))
      .map((member) => ({ userId: member.id, open: 0, inProgress: 0, overdue: 0, hours: 0, percent: 0, level: 'free' as LoadLevel })),
  ];
  const withRoom = [...rows].filter((row) => row.level === 'free').sort((a, b) => a.percent - b.percent).slice(0, ROOM_FOR);
  const over = rows.filter((row) => row.level === 'over').length;

  return (
    <Card title={t('workload.teamTitle')} subtitle={t('workload.teamSubtitle')} loading={!people}>
      <div data-testid="team-workload" className="space-y-1">
        {rows.map((row) => (
          <div key={row.userId} className="flex items-center gap-3 text-sm" data-testid="team-workload-row">
            <span className="w-40 truncate text-gray-900 dark:text-gray-100">{nameOf(row.userId)}</span>
            <span
              className="relative h-2.5 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-gray-800"
              role="img"
              aria-label={t('workload.barLabel', { percent: row.percent })}
            >
              <span
                className={`absolute inset-y-0 left-0 ${barColor[row.level]}`}
                style={{ width: `${Math.min(row.percent, 100)}%` }}
              />
            </span>
            <span className="w-56 text-right text-xs tabular-nums text-gray-600 dark:text-gray-400">
              {t('workload.row', { hours: row.hours, percent: row.percent, open: row.open })}
              {row.overdue > 0 && (
                <span className="ml-1 font-semibold text-red-600 dark:text-red-400">
                  {t('workload.late', { count: row.overdue })}
                </span>
              )}
            </span>
          </div>
        ))}
        {!rows.length && <p className="text-sm text-gray-500 dark:text-gray-400">{t('progressBoard.noPeople')}</p>}
      </div>
      {rows.length > 0 && (
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300" data-testid="team-workload-hint">
          {over > 0
            ? t('workload.overHint', { count: over, names: withRoom.map((row) => nameOf(row.userId)).join(', ') || '—' })
            : t('workload.balancedHint')}
        </p>
      )}
    </Card>
  );
};

export default TeamWorkload;
