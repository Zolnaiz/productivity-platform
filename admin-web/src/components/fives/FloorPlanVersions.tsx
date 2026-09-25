import React, { useCallback, useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../common/ConfirmDialog';
import { fiveSLayoutService } from '../../services/fiveSLayout.service';
import { FiveSLayoutVersion } from '../../types/fiveS.types';

interface FloorPlanVersionsProps {
  planId: string;
  /** Whether this person may take a snapshot or put the plan back. */
  editable: boolean;
  /** Called with the restored plan, so the editor can draw it. */
  onRestored: () => void;
}

const dayOf = (version: FiveSLayoutVersion) => version.takenOn?.slice(0, 10) ?? '';

/**
 * What this plan looked like on the days it changed.
 *
 * An audit from March scored the building as it stood in March, and the plan
 * is a living document: walls move, areas merge, a zone is retired. Without
 * this, a score three months old is attached to a drawing that no longer
 * exists, and nobody reading the history can tell whether an area improved or
 * was simply redrawn.
 */
const FloorPlanVersions: React.FC<FloorPlanVersionsProps> = ({ planId, editable, onRestored }) => {
  const { t } = useTranslation();
  const [versions, setVersions] = useState<FiveSLayoutVersion[]>([]);
  const [pending, setPending] = useState<FiveSLayoutVersion | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setVersions(await fiveSLayoutService.getPlanVersions(planId));
    } catch {
      // A history that cannot be read is not a reason to take the editor away
      // from somebody: the panel simply has nothing to show.
      setVersions([]);
    }
  }, [planId]);

  useEffect(() => {
    void load();
  }, [load]);

  const keep = async () => {
    setBusy(true);
    setFailed(false);

    try {
      await fiveSLayoutService.keepPlanVersion(planId);
      await load();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (!pending) return;

    setBusy(true);
    setFailed(false);

    try {
      await fiveSLayoutService.restorePlanVersion(planId, pending.id);
      await load();
      onRestored();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
          <History className="h-4 w-4" aria-hidden="true" />
          {t('planVersions.title')}
        </div>
        {editable && (
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-gray-600 dark:text-gray-200"
            disabled={busy}
            onClick={() => void keep()}
          >
            {t('planVersions.keepToday')}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">{t('planVersions.subtitle')}</p>

      {versions.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('planVersions.empty')}</p>
      ) : (
        <ul className="divide-y divide-gray-200 text-sm dark:divide-gray-700">
          {versions.map((version) => (
            <li key={version.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="tabular-nums text-gray-800 dark:text-gray-200">{dayOf(version)}</span>
              {version.label && (
                <span className="flex-1 text-xs text-gray-500 dark:text-gray-400">{version.label}</span>
              )}
              {editable && (
                <button
                  type="button"
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
                  aria-label={t('planVersions.restoreDay', { day: dayOf(version) })}
                  disabled={busy}
                  onClick={() => setPending(version)}
                >
                  {t('planVersions.restore')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {failed && <p className="text-xs text-red-600">{t('planVersions.failed')}</p>}

      {/*
        Asked rather than done: putting a plan back is a change to the drawing
        everybody else is working from. The plan as it stands is snapshotted
        first, so this is undoable — and the dialog says so.
      */}
      <ConfirmDialog
        isOpen={Boolean(pending)}
        title={t('planVersions.restoreTitle')}
        message={t('planVersions.restoreBody', { day: pending ? dayOf(pending) : '' })}
        confirmLabel={t('planVersions.restore')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => void restore()}
        onCancel={() => setPending(null)}
      />
    </div>
  );
};

export default FloorPlanVersions;
