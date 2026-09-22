import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowLeft, CalendarCheck, ClipboardList, MapPin, UserCheck } from 'lucide-react';
import { fiveSLayoutService } from '../services/fiveSLayout.service';
import { FiveSLayoutPlan, FiveSZone } from '../types/fiveS.types';
import { getAuditDueDate, isAuditDue } from '../components/fives/auditSchedule';
import { getRedTagCount, isOpenRedTag, stageKeys } from '../components/fives/floorPlanRules';
import ZoneAuditWalk from '../components/fives/ZoneAuditWalk';
import PhotoEvidence from '../components/common/PhotoEvidence';
import { useAuth } from '../contexts/AuthContext';

/**
 * One area, for somebody standing in front of its label.
 *
 * The label on the wall says what belongs in the area and who owns it. It
 * cannot say what the standard is in full, what is still red-tagged, or when
 * the area was last audited — and the person reading the label is exactly the
 * person who wants to know.
 *
 * Built for a phone held in one hand: one column, large type, no editing. The
 * editor is where a plan is changed; this is where it is consulted, and
 * something that can be changed by accident while standing next to a running
 * machine is worse than something that cannot be changed at all.
 */
const ZonePage: React.FC = () => {
  const { t } = useTranslation();
  /*
    What this person may do, from the server's own table rather than from a
    guess about their role. A viewer sees the same page and is offered nothing
    they would only be refused — a button that always fails is a worse answer
    than no button.
  */
  const { user, hasPermission } = useAuth();
  const { planId = '', zoneId = '' } = useParams();
  const [plan, setPlan] = useState<FiveSLayoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  /**
   * Raising a tag from here, which is what makes this a tool.
   *
   * Two fields, because somebody is typing one-handed next to the thing they
   * are tagging. The form is closed until asked for: this page is read most
   * of the time, and a form sitting open pushes what somebody came to read
   * off the screen.
   */
  const [tagging, setTagging] = useState(false);
  const [title, setTitle] = useState('');
  const [disposition, setDisposition] = useState('');
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  /*
    One flag per action rather than one for the page. They fail separately and
    the message has to sit next to the control that failed — a phone screen is
    too small to go looking for an explanation, and a message under the wrong
    button is worse than none.
  */
  const [tagFailed, setTagFailed] = useState(false);
  const [cleanFailed, setCleanFailed] = useState(false);
  /** Walking the checklist here, rather than writing it up at a desk after. */
  const [auditing, setAuditing] = useState(false);
  const [auditMessage, setAuditMessage] = useState('');
  /**
   * The walk just recorded, so a photograph can be hung on it.
   *
   * A score is an opinion until there is a picture beside it, and the phone is
   * the one device in the building that always has a camera. It appears only
   * after the check is recorded, because a photograph needs something to
   * belong to — and the person is still standing in the area.
   */
  const [recordedRunId, setRecordedRunId] = useState('');

  useEffect(() => {
    let active = true;

    fiveSLayoutService
      .getPlan(planId)
      .then((loaded) => active && setPlan(loaded))
      .catch(() => active && setPlan(null))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [planId]);

  const zone: FiveSZone | undefined = plan?.zones.find((item) => item.id === zoneId);

  /**
   * Adds the tag, and shows it immediately.
   *
   * The page is rebuilt from what the server returned rather than from what
   * was typed, so the tag on screen is the tag that was stored — including
   * the id and the date, which are the server's to decide.
   */
  const raiseTag = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!plan || !zone || !title.trim()) return;

    setSaving(true);
    setTagFailed(false);

    try {
      const raised = await fiveSLayoutService.addRedTag(plan.id, zone.id, {
        title: title.trim(),
        disposition: disposition.trim(),
      });

      setPlan({
        ...plan,
        zones: plan.zones.map((item) =>
          item.id === zone.id
            ? {
                ...item,
                redTags: [...(item.redTags ?? []), raised],
                redTagCount: (item.redTagCount ?? 0) + 1,
              }
            : item,
        ),
      });
      setTitle('');
      setDisposition('');
      setTagging(false);
    } catch {
      // Said out loud rather than swallowed: somebody who thinks they have
      // tagged an item and has not is worse off than somebody who knows.
      setTagFailed(true);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Says the area was cleaned today.
   *
   * One tap and no form: there is nothing to say beyond that it happened, and
   * the date is the server's. The page then shows the date that was stored,
   * not the one this machine thinks it is.
   */
  const markCleaned = async () => {
    if (!plan || !zone) return;

    setCleaning(true);
    setCleanFailed(false);

    try {
      const { lastCleanedAt } = await fiveSLayoutService.markCleaned(plan.id, zone.id);

      setPlan({
        ...plan,
        zones: plan.zones.map((item) => (item.id === zone.id ? { ...item, lastCleanedAt } : item)),
      });
    } catch {
      setCleanFailed(true);
    } finally {
      setCleaning(false);
    }
  };

  /**
   * Takes the finished walk onto the page.
   *
   * The score and the date come from the run the server stored, which is also
   * what it wrote onto the zone — so this page and the floor plan agree
   * without either of them recomputing anything.
   */
  const auditRecorded = (run: { id: string; score: number; createdAt?: string }) => {
    if (!plan || !zone) return;

    const lastAuditAt = (run.createdAt || new Date().toISOString()).slice(0, 10);

    setPlan({
      ...plan,
      zones: plan.zones.map((item) =>
        item.id === zone.id
          ? { ...item, lastAuditAt, lastAuditScore: Number(run.score) || 0 }
          : item,
      ),
    });
    setAuditing(false);
    setAuditMessage(t('zone.auditRecorded', { score: Number(run.score) || 0 }));
    setRecordedRunId(run.id);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg p-6 text-sm text-gray-500" role="status">
        {t('zone.loading')}
      </div>
    );
  }

  /*
    A label that outlives the zone it names is the normal end of a 5S area:
    zones are merged, renamed and retired. Saying so plainly beats an empty
    page, and beats pretending the area is there.
  */
  if (!zone) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('zone.goneTitle')}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('zone.goneBody')}</p>
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-blue-600" to="/fives">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('zone.backToPlan')}
        </Link>
      </div>
    );
  }

  const openTags = (zone.redTags ?? []).filter(isOpenRedTag);
  const due = isAuditDue(zone);

  return (
    <div className="mx-auto max-w-lg space-y-5 p-5">
      <header>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {[plan?.site, plan?.floor].filter(Boolean).join(' · ')}
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
          {zone.code} · {zone.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800 dark:text-gray-200">
            {t(`fiveS.stage.${stageKeys[zone.stage]}`)}
          </span>
          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <UserCheck className="h-4 w-4" aria-hidden="true" />
            {zone.ownerName || t('fiveS.ui.unassigned')}
          </span>
        </div>
      </header>

      {/*
        The standard first. It is the thing somebody is checking the area
        against, and on a phone whatever is at the top is what gets read.
      */}
      <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <h2 className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          {t('zone.standard')}
        </h2>
        <p className="mt-2 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
          {zone.standard?.trim() || t('zone.noStandard')}
        </p>
      </section>

      <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">{t('zone.contents')}</h2>
        <p className="mt-2 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
          {zone.contents?.trim() || t('zone.noContents')}
        </p>
      </section>

      <section
        className={`rounded-xl border p-4 ${
          openTags.length
            ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
            : 'border-gray-200 dark:border-gray-700'
        }`}
      >
        <h2 className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          {t('zone.redTags', { count: getRedTagCount(zone) })}
        </h2>
        {/*
          The one thing somebody can do from here. Everything else on this
          page is read-only, because standing next to a running machine is
          not where a plan should be editable by accident — but red-tagging
          is exactly what the person standing there is for.
        */}
        {!tagging && hasPermission('redtags:create') && (
          <button
            type="button"
            data-testid="zone-red-tag"
            className="mt-3 w-full rounded-lg border border-red-300 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:text-red-300"
            onClick={() => setTagging(true)}
          >
            {t('zone.addRedTag')}
          </button>
        )}

        {tagging && (
          <form className="mt-3 space-y-2" onSubmit={raiseTag}>
            <input
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base dark:border-gray-600 dark:bg-gray-900"
              placeholder={t('zone.redTagTitle')}
              aria-label={t('zone.redTagTitle')}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base dark:border-gray-600 dark:bg-gray-900"
              placeholder={t('zone.redTagDisposition')}
              aria-label={t('zone.redTagDisposition')}
              value={disposition}
              onChange={(event) => setDisposition(event.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!title.trim() || saving}
                className="flex-1 rounded-lg bg-red-600 py-3 text-sm font-medium text-white disabled:opacity-40"
              >
                {t('zone.redTagSave')}
              </button>
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-4 py-3 text-sm dark:border-gray-600"
                onClick={() => setTagging(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
            {tagFailed && <p className="text-sm text-red-600">{t('zone.redTagFailed')}</p>}
          </form>
        )}

        <ul className="mt-2 space-y-2">
          {openTags.map((tag) => (
            <li key={tag.id} className="text-sm text-gray-700 dark:text-gray-300">
              <div className="font-medium">{tag.title}</div>
              {tag.disposition && <div className="text-xs text-gray-500">{tag.disposition}</div>}
            </li>
          ))}
          {!openTags.length && (
            <li className="text-sm text-gray-500 dark:text-gray-400">{t('zone.noRedTags')}</li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <h2 className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          {t('zone.audit')}
        </h2>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">{t('zone.lastAudit')}</dt>
            <dd className="tabular-nums text-gray-800 dark:text-gray-200">
              {zone.lastAuditAt || t('zone.never')}
              {zone.lastAuditScore !== undefined && ` · ${zone.lastAuditScore}%`}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">{t('zone.nextAudit')}</dt>
            <dd className={`tabular-nums ${due ? 'font-medium text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
              {getAuditDueDate(zone) || t('zone.now')}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">{t('zone.lastCleaned')}</dt>
            <dd className="tabular-nums text-gray-800 dark:text-gray-200">
              {zone.lastCleanedAt || t('zone.never')}
            </dd>
          </div>
        </dl>

        {/*
          The second thing somebody can do from here, and the last: recording
          that an area was cleaned belongs to whoever cleaned it.
        */}
        {hasPermission('zones:clean') && (
          <button
            type="button"
            data-testid="zone-cleaned"
            disabled={cleaning}
            className="mt-3 w-full rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200"
            onClick={() => void markCleaned()}
          >
            {t('zone.markCleaned')}
          </button>
        )}
        {cleanFailed && <p className="mt-2 text-sm text-red-600">{t('zone.cleanedFailed')}</p>}

        {/*
          And the check itself. A daily audit is walked in the area, not
          written up at a desk afterwards from memory, so the questions come
          to whoever is standing here.
        */}
        {!auditing && hasPermission('audits:create') && (
          <button
            type="button"
            data-testid="zone-audit"
            className="mt-2 w-full rounded-lg border border-blue-300 py-3 text-sm font-medium text-blue-700 dark:border-blue-800 dark:text-blue-300"
            onClick={() => {
              setAuditMessage('');
              setRecordedRunId('');
              setAuditing(true);
            }}
          >
            {t('zone.startAudit')}
          </button>
        )}
        {auditMessage && <p className="mt-2 text-sm text-green-700 dark:text-green-400">{auditMessage}</p>}

        {recordedRunId && hasPermission('attachments:create') && (
          <div className="mt-3">
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">{t('zone.auditPhotoPrompt')}</p>
            <PhotoEvidence
              ownerType="audit_run"
              ownerId={recordedRunId}
              kinds={['evidence']}
              label={t('zone.auditPhotoPrompt')}
            />
          </div>
        )}

        {auditing && plan && (
          <ZoneAuditWalk
            plan={plan}
            zone={zone}
            role={user?.roles?.[0]}
            onRecorded={auditRecorded}
            onClose={() => setAuditing(false)}
          />
        )}
      </section>

      <Link className="inline-flex items-center gap-2 text-sm font-medium text-blue-600" to="/fives">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('zone.backToPlan')}
      </Link>
    </div>
  );
};

export default ZonePage;
