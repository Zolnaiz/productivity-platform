import { FiveSRedTag, FiveSZone } from '../../types/fiveS.types';
import { addDaysToDate, formatLocalDate, getDaysUntilDate } from './auditSchedule';

/**
 * The red-tag holding area.
 *
 * A tagged item is taken out of the work area and parked somewhere visible
 * while its use is watched. If nobody needs it in that time, it goes; if
 * somebody does, it goes back where it belongs. The waiting period is the
 * whole point — it is what turns "I think we can throw this out" into
 * evidence.
 *
 * This is a state, not a new record: status `review` means the item is in the
 * holding area. `disposed` and `returned` are the two ways out.
 */

/** Common practice is one to two months. Long enough that a real need shows up. */
export const HOLD_PERIOD_DAYS = 30;

export const isHeld = (redTag: FiveSRedTag) => redTag.status === 'review' && !redTag.closedAt;

/**
 * The hold dates an item entering the holding area should carry.
 *
 * Returns nothing when the tag already has them, so re-saving a held item does
 * not restart its clock.
 */
export const holdDatesFor = (redTag: FiveSRedTag, today = formatLocalDate()) => {
  if (redTag.heldAt && redTag.holdUntil) {
    return null;
  }

  return {
    heldAt: redTag.heldAt || today,
    holdUntil: redTag.holdUntil || addDaysToDate(redTag.heldAt || today, HOLD_PERIOD_DAYS),
  };
};

export interface HeldItem {
  zone: FiveSZone;
  redTag: FiveSRedTag;
  /** Negative once the hold has run out. */
  daysLeft: number;
  overdue: boolean;
}

/**
 * Everything currently waiting, most urgent first.
 *
 * An item with no `holdUntil` — held before these dates existed — sorts as due
 * now rather than never, so it is chased rather than forgotten.
 */
export const heldItems = (zones: FiveSZone[], today = formatLocalDate()): HeldItem[] =>
  zones
    .flatMap((zone) => (zone.redTags || []).filter(isHeld).map((redTag) => ({ zone, redTag })))
    .map(({ zone, redTag }) => {
      const daysLeft = redTag.holdUntil ? getDaysUntilDate(redTag.holdUntil, today) : 0;

      return { zone, redTag, daysLeft, overdue: daysLeft <= 0 };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
