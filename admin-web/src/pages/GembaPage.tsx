import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Footprints, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import { localDay } from '../components/progress/progressBoard';
import { useAuth } from '../contexts/AuthContext';
import { useSaveFailure } from '../hooks/useSaveFailure';
import { addDays, mondayOf } from '../services/checkin.service';
import { fiveSLayoutService } from '../services/fiveSLayout.service';
import { gembaService, GembaWeek } from '../services/gemba.service';
import { peopleService } from '../services/people.service';
import { FiveSZone } from '../types/fiveS.types';
import { TeamUser, memberName } from '../types/people.types';

const emptyWalk = { zoneId: '', area: '', observations: '', conversations: '' };

/**
 * Gemba walks: going to where the work is done, looking, and asking.
 *
 * The other half of leader standard work beside the audit. Each manager has
 * a number of walks a week (Tervene's leader standard work); a walk is
 * written down where it happened - what was seen, what the people doing the
 * work said - and each follow-up becomes a task at once, so nothing seen
 * on the floor stays in a notebook.
 */
const GembaPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const notSaved = useSaveFailure();

  const today = localDay(new Date());
  const [day, setDay] = useState(today);
  const [week, setWeek] = useState<GembaWeek | null>(null);
  const [zones, setZones] = useState<FiveSZone[]>([]);
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [walk, setWalk] = useState(emptyWalk);
  const [followUps, setFollowUps] = useState<Array<{ title: string; assigneeId: string }>>([{ title: '', assigneeId: '' }]);
  const [saving, setSaving] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const monday = mondayOf(day);
  const thisWeek = mondayOf(today);

  useEffect(() => {
    let active = true;
    gembaService
      .getWeek(day)
      .then((value) => active && setWeek(value))
      .catch(() => active && setWeek(null));
    return () => {
      active = false;
    };
  }, [day]);

  useEffect(() => {
    fiveSLayoutService.getPlans().then((plans) => setZones((plans ?? []).flatMap((plan) => plan.zones ?? []))).catch(() => undefined);
    peopleService.getMembers().then((items) => setMembers((items ?? []).filter((member) => member.isActive !== false))).catch(() => undefined);
  }, []);

  const nameOf = (id?: string) => {
    if (id && id === user?.id) return t('gemba.you');
    const member = members.find((candidate) => candidate.id === id);
    return member ? memberName(member) : t('gemba.someone');
  };

  const zoneName = (id?: string) => {
    const zone = zones.find((candidate) => candidate.id === id);
    return zone ? `${zone.code} - ${zone.name}` : '';
  };

  const record = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await gembaService.record({
        zoneId: walk.zoneId || undefined,
        area: walk.area.trim() || zoneName(walk.zoneId) || undefined,
        observations: walk.observations,
        conversations: walk.conversations,
        followUps: followUps
          .filter((followUp) => followUp.title.trim().length >= 3)
          .map((followUp) => ({ title: followUp.title.trim(), assigneeId: followUp.assigneeId || undefined })),
      });
      setWalk(emptyWalk);
      setFollowUps([{ title: '', assigneeId: '' }]);
      setRecorded(true);
      setDay(today);
      setWeek((current) =>
        current && current.week === thisWeek
          ? {
              ...current,
              walks: [saved, ...current.walks],
              walkers: current.walkers.map((walker) =>
                walker.userId === saved.walkerId ? { ...walker, walks: walker.walks + 1 } : walker,
              ),
            }
          : current,
      );
    } catch (error) {
      notSaved(error);
    } finally {
      setSaving(false);
    }
  };

  const target = week?.target ?? 1;
  const canRecord = walk.observations.trim().length > 0 || followUps.some((followUp) => followUp.title.trim());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('gemba.title')}</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-400">{t('gemba.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label={t('gemba.weekLabel')}>
          <Button variant="outline" size="sm" icon={ChevronLeft} type="button" aria-label={t('gemba.previous')} onClick={() => setDay(addDays(monday, -7))} />
          <span className="min-w-[11rem] text-center text-sm font-medium tabular-nums text-gray-900 dark:text-white" data-testid="gemba-week">
            {monday} - {addDays(monday, 6)}
          </span>
          <Button
            variant="outline"
            size="sm"
            icon={ChevronRight}
            type="button"
            aria-label={t('gemba.next')}
            disabled={monday >= thisWeek}
            onClick={() => setDay(addDays(monday, 7))}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card title={t('gemba.recordTitle')} subtitle={t('gemba.recordSubtitle')}>
          <form onSubmit={record} className="space-y-4" data-testid="gemba-form">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label={t('gemba.zone')} value={walk.zoneId} onChange={(event) => setWalk((current) => ({ ...current, zoneId: event.target.value }))}>
                <option value="">{t('gemba.noZone')}</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.code} - {zone.name}
                  </option>
                ))}
              </Select>
              <Input
                label={t('gemba.area')}
                placeholder={t('gemba.areaPlaceholder')}
                value={walk.area}
                onChange={(event) => setWalk((current) => ({ ...current, area: event.target.value }))}
              />
            </div>
            <Textarea
              label={t('gemba.observations')}
              placeholder={t('gemba.observationsHint')}
              rows={3}
              value={walk.observations}
              onChange={(event) => setWalk((current) => ({ ...current, observations: event.target.value }))}
            />
            <Textarea
              label={t('gemba.conversations')}
              placeholder={t('gemba.conversationsHint')}
              rows={2}
              value={walk.conversations}
              onChange={(event) => setWalk((current) => ({ ...current, conversations: event.target.value }))}
            />
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('gemba.followUps')}</legend>
              {followUps.map((followUp, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_200px_auto]">
                  <Input
                    aria-label={t('gemba.followUpNumber', { number: index + 1 })}
                    placeholder={t('gemba.followUpHint')}
                    value={followUp.title}
                    onChange={(event) =>
                      setFollowUps((current) => current.map((item, at) => (at === index ? { ...item, title: event.target.value } : item)))
                    }
                  />
                  <Select
                    aria-label={t('gemba.whoFor', { number: index + 1 })}
                    value={followUp.assigneeId}
                    onChange={(event) =>
                      setFollowUps((current) => current.map((item, at) => (at === index ? { ...item, assigneeId: event.target.value } : item)))
                    }
                  >
                    <option value="">{t('gemba.me')}</option>
                    {members
                      .filter((member) => member.id !== user?.id)
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {memberName(member)}
                        </option>
                      ))}
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={X}
                    type="button"
                    aria-label={t('gemba.removeFollowUp', { number: index + 1 })}
                    disabled={followUps.length === 1}
                    onClick={() => setFollowUps((current) => current.filter((_, at) => at !== index))}
                  />
                </div>
              ))}
              {followUps.length < 10 && (
                <Button variant="ghost" size="sm" icon={Plus} type="button" onClick={() => setFollowUps((current) => [...current, { title: '', assigneeId: '' }])}>
                  {t('gemba.addFollowUp')}
                </Button>
              )}
            </fieldset>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" icon={Footprints} disabled={saving || !canRecord}>
                {t('gemba.record')}
              </Button>
              {recorded && (
                <span role="status" className="text-sm text-green-700 dark:text-green-300">
                  {t('gemba.recorded')}
                </span>
              )}
            </div>
          </form>
        </Card>

        <Card title={t('gemba.adherenceTitle')} subtitle={t('gemba.target', { count: target })}>
          <ul className="space-y-2" data-testid="gemba-adherence">
            {(week?.walkers ?? []).map((walker) => {
              const met = walker.walks >= target;
              return (
                <li key={walker.userId} className="flex items-center gap-3 text-sm">
                  {met ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
                  ) : (
                    <Footprints className="h-5 w-5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                  )}
                  <span className="flex-1 text-gray-900 dark:text-white">{nameOf(walker.userId)}</span>
                  <span className={`tabular-nums ${met ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    {walker.walks}/{target}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card title={t('gemba.walksTitle')} subtitle={t('gemba.walksCount', { count: week?.walks.length ?? 0 })}>
        {!week?.walks.length ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('gemba.none')}</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700" data-testid="gemba-walks">
            {week.walks.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">{item.area || zoneName(item.zoneId) || t('gemba.somewhere')}</span>
                  <span className="text-xs tabular-nums text-gray-600 dark:text-gray-400">
                    {nameOf(item.walkerId)} · {item.walkedOn}
                  </span>
                </div>
                {item.observations && <p className="mt-1 whitespace-pre-line text-sm text-gray-800 dark:text-gray-200">{item.observations}</p>}
                {item.conversations && (
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{t('gemba.conversations')}:</span> {item.conversations}
                  </p>
                )}
                {item.followUps.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm">
                    {item.followUps.map((followUp) => (
                      <li key={followUp.title} className="flex flex-wrap gap-2">
                        <span className="text-gray-800 dark:text-gray-200">→ {followUp.title}</span>
                        <span className="text-gray-600 dark:text-gray-400">({nameOf(followUp.assigneeId)})</span>
                        {followUp.taskId && (
                          <Link to="/tasks" className="text-blue-700 hover:underline dark:text-blue-300">
                            {t('gemba.task')}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default GembaPage;
