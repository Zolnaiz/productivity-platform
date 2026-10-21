import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../common/Button';
import Card from '../common/Card';
import EmptyState from '../common/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { apiErrorMessage } from '../../i18n/apiError';
import { attachmentService } from '../../services/attachment.service';
import { fiveSLayoutService } from '../../services/fiveSLayout.service';
import { peopleService } from '../../services/people.service';
import type { FiveSLayoutPlan, FiveSZone } from '../../types/fiveS.types';
import type { TeamUser } from '../../types/people.types';
import { newZone, zoneProblems } from './zoneTable';
import { qrPath, zonePath, zoneUrl } from './zoneLink';

const cell = 'w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white';

const QrSquare: React.FC<{ text: string; label: string }> = ({ text, label }) => {
  const code = useMemo(() => qrPath(text), [text]);
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`-2 -2 ${code.size + 4} ${code.size + 4}`}
      className="h-14 w-14 bg-white"
      shapeRendering="crispEdges"
    >
      <path d={code.path} fill="#000" />
    </svg>
  );
};

/**
 * UC-19: 5S areas as a table - name, code, floor area, who answers for it,
 * the standard, a photo - with a QR code per row. The default way to set up
 * 5S; drawing a floor plan is optional and lives on its own tab.
 */
const FiveSZoneTable: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('zones:update');
  const [plans, setPlans] = useState<FiveSLayoutPlan[]>([]);
  const [planId, setPlanId] = useState('');
  const [zones, setZones] = useState<FiveSZone[]>([]);
  const [people, setPeople] = useState<TeamUser[]>([]);
  const [photos, setPhotos] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plan = plans.find((candidate) => candidate.id === planId);

  useEffect(() => {
    Promise.all([fiveSLayoutService.getPlans(), peopleService.getMembers().catch(() => [] as TeamUser[])])
      .then(([loaded, members]) => {
        setPlans(loaded);
        setPeople(members);
        if (loaded[0]) {
          setPlanId(loaded[0].id);
          setZones(loaded[0].zones);
        }
      })
      .catch((loadError) => setError(apiErrorMessage(loadError, t)))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    if (!zones.length) return;
    let cancelled = false;
    Promise.all(
      zones.map((zone) =>
        attachmentService
          .list('five_s_zone', zone.id)
          .then((items) => [zone.id, items.length] as const)
          .catch(() => [zone.id, 0] as const),
      ),
    ).then((counts) => {
      if (!cancelled) setPhotos(Object.fromEntries(counts));
    });
    return () => {
      cancelled = true;
    };
    // Only when the set of zones changes, not on every keystroke.
  }, [planId, zones.length]);

  // A photo hangs off the zone's id, so a row must be saved before it can carry one.
  const savedIds = new Set(plan?.zones.map((zone) => zone.id));
  const problems = zoneProblems(zones);
  const hasProblems = Object.keys(problems).length > 0;

  const choosePlan = (id: string) => {
    const next = plans.find((candidate) => candidate.id === id);
    if (!next) return;
    setPlanId(id);
    setZones(next.zones);
    setDirty(false);
  };

  const edit = (id: string, change: Partial<FiveSZone>) => {
    setZones((current) => current.map((zone) => (zone.id === id ? { ...zone, ...change } : zone)));
    setDirty(true);
    setMessage(null);
  };

  const add = () => {
    setZones((current) => [...current, newZone(current, t('fiveSTable.newArea'))]);
    setDirty(true);
  };

  const remove = (zone: FiveSZone) => {
    if (!window.confirm(t('fiveSTable.confirmRemove', { name: zone.name }))) return;
    setZones((current) => current.filter((candidate) => candidate.id !== zone.id));
    setDirty(true);
  };

  const save = async () => {
    if (!plan || hasProblems) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await fiveSLayoutService.savePlan({ ...plan, zones });
      setPlans((current) => current.map((candidate) => (candidate.id === saved.id ? saved : candidate)));
      setZones(saved.zones);
      setDirty(false);
      setMessage(t('fiveSTable.saved'));
    } catch (saveError) {
      setError(apiErrorMessage(saveError, t));
    } finally {
      setSaving(false);
    }
  };

  const attach = async (zone: FiveSZone, file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      await attachmentService.upload(file, { ownerType: 'five_s_zone', ownerId: zone.id, kind: 'standard' });
      setPhotos((current) => ({ ...current, [zone.id]: (current[zone.id] ?? 0) + 1 }));
    } catch (uploadError) {
      setError(apiErrorMessage(uploadError, t));
    }
  };

  if (loading) {
    return (
      <Card loading>
        <div />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('fiveSTable.title')}</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('fiveSTable.hint')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {plans.length > 1 && (
            <select
              aria-label={t('fiveSTable.plan')}
              className={cell}
              value={planId}
              onChange={(event) => choosePlan(event.target.value)}
            >
              {plans.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          )}
          {canEdit && (
            <>
              <Button type="button" variant="outline" icon={Plus} onClick={add}>
                {t('fiveSTable.add')}
              </Button>
              <Button type="button" onClick={save} disabled={!dirty || saving || hasProblems}>
                {t('fiveSTable.save')}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 text-sm text-green-700 dark:text-green-400" role="status">
          {message}
        </p>
      )}

      {zones.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={t('fiveSTable.emptyTitle')} description={t('fiveSTable.emptyHint')} />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-2 py-2">{t('fiveSTable.code')}</th>
                <th className="px-2 py-2">{t('fiveSTable.name')}</th>
                <th className="px-2 py-2">{t('fiveSTable.area')}</th>
                <th className="px-2 py-2">{t('fiveSTable.owner')}</th>
                <th className="px-2 py-2">{t('fiveSTable.standard')}</th>
                <th className="px-2 py-2">{t('fiveSTable.photo')}</th>
                <th className="px-2 py-2">{t('fiveSTable.qr')}</th>
                {canEdit && <th className="px-2 py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {zones.map((zone) => {
                const rowProblems = problems[zone.id] ?? [];
                return (
                  <tr key={zone.id} className="align-top">
                    <td className="w-24 px-2 py-2">
                      <input
                        aria-label={t('fiveSTable.codeOf', { name: zone.name })}
                        className={cell}
                        value={zone.code}
                        disabled={!canEdit}
                        onChange={(event) => edit(zone.id, { code: event.target.value })}
                      />
                    </td>
                    <td className="min-w-[10rem] px-2 py-2">
                      <input
                        aria-label={t('fiveSTable.nameOf', { code: zone.code })}
                        className={cell}
                        value={zone.name}
                        disabled={!canEdit}
                        onChange={(event) => edit(zone.id, { name: event.target.value })}
                      />
                      {rowProblems.map((problem) => (
                        <p key={problem} className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {t(`fiveSTable.problem.${problem}`)}
                        </p>
                      ))}
                    </td>
                    <td className="w-24 px-2 py-2">
                      <input
                        aria-label={t('fiveSTable.areaOf', { code: zone.code })}
                        className={cell}
                        type="number"
                        min={0}
                        step="0.1"
                        value={zone.areaSquareMetres ?? ''}
                        disabled={!canEdit}
                        onChange={(event) =>
                          edit(zone.id, {
                            areaSquareMetres: event.target.value === '' ? undefined : Number(event.target.value),
                          })
                        }
                      />
                    </td>
                    <td className="min-w-[10rem] px-2 py-2">
                      <select
                        aria-label={t('fiveSTable.ownerOf', { code: zone.code })}
                        className={cell}
                        value={zone.ownerId ?? ''}
                        disabled={!canEdit}
                        onChange={(event) => {
                          const person = people.find((candidate) => candidate.id === event.target.value);
                          edit(zone.id, {
                            ownerId: person?.id,
                            ownerName: person ? `${person.firstName} ${person.lastName}`.trim() : undefined,
                          });
                        }}
                      >
                        <option value="">{t('fiveSTable.noOwner')}</option>
                        {people.map((person) => (
                          <option key={person.id} value={person.id}>
                            {`${person.firstName} ${person.lastName}`.trim()}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="min-w-[14rem] px-2 py-2">
                      <textarea
                        aria-label={t('fiveSTable.standardOf', { code: zone.code })}
                        className={cell}
                        rows={2}
                        value={zone.standard}
                        disabled={!canEdit}
                        onChange={(event) => edit(zone.id, { standard: event.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <span className="block text-xs text-gray-600 dark:text-gray-400">
                        {t('fiveSTable.photoCount', { count: photos[zone.id] ?? 0 })}
                      </span>
                      {canEdit && savedIds.has(zone.id) && (
                        <label className="mt-1 inline-flex cursor-pointer items-center gap-1 text-xs text-blue-600">
                          <ImagePlus className="h-4 w-4" />
                          {t('fiveSTable.addPhoto')}
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="sr-only"
                            aria-label={t('fiveSTable.photoOf', { code: zone.code })}
                            onChange={(event) => attach(zone, event.target.files?.[0])}
                          />
                        </label>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {plan && (
                        <Link to={zonePath(plan.id, zone.id)} title={t('fiveSTable.openZone')}>
                          <QrSquare
                            text={zoneUrl(window.location.origin, plan.id, zone.id)}
                            label={t('fiveSTable.qrOf', { code: zone.code })}
                          />
                        </Link>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          aria-label={t('fiveSTable.removeOf', { code: zone.code })}
                          className="rounded p-1 text-gray-500 hover:text-red-600"
                          onClick={() => remove(zone)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default FiveSZoneTable;
