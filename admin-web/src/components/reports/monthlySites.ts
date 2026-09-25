import { FiveSLayoutPlan, FiveSZone } from '../../types/fiveS.types';
import { isAuditDue } from '../fives/auditSchedule';
import { isOpenRedTag } from '../fives/floorPlanRules';

/**
 * How each building is doing.
 *
 * An organization has a plan per floor, each carrying the site it belongs to,
 * and the editor moves between them — but everything above them was a flat
 * list. A plant with two buildings read as one, so a site whose 5S programme
 * had quietly stopped was averaged away by a site where it had not.
 *
 * The same records the department rollup uses, added up along the other axis
 * a plant is actually organised by. A department crosses buildings; a building
 * does not move.
 */
export interface SiteMonth {
  /** Empty for plans that name no site, which is what a single-site plant has. */
  site: string;
  floors: number;
  zones: number;
  /** Undefined when no area in the building has ever been audited. */
  averageAuditScore?: number;
  openRedTags: number;
  /** Areas whose next audit date has passed, or which have never had one. */
  auditsDue: number;
}

const blank = (site: string): SiteMonth => ({
  site,
  floors: 0,
  zones: 0,
  openRedTags: 0,
  auditsDue: 0,
});

/**
 * One row per site, in the order a list is read.
 *
 * Plans with no site named collect into one row rather than disappearing: a
 * single-site plant names nothing, and a plan somebody forgot to label still
 * has areas that have to be audited.
 */
export const summariseSites = (plans: FiveSLayoutPlan[], today?: string): SiteMonth[] => {
  const rows = new Map<string, SiteMonth>();
  const scores = new Map<string, number[]>();

  plans.forEach((plan) => {
    const site = (plan.site ?? '').trim();

    if (!rows.has(site)) rows.set(site, blank(site));
    const row = rows.get(site) as SiteMonth;

    row.floors += 1;

    (plan.zones ?? []).forEach((zone: FiveSZone) => {
      row.zones += 1;
      row.openRedTags += (zone.redTags ?? []).filter(isOpenRedTag).length;

      if (isAuditDue(zone, today)) {
        row.auditsDue += 1;
      }

      if (typeof zone.lastAuditScore === 'number') {
        const collected = scores.get(site) ?? [];
        collected.push(zone.lastAuditScore);
        scores.set(site, collected);
      }
    });
  });

  rows.forEach((row) => {
    const collected = scores.get(row.site) ?? [];

    // Never audited reads as never rather than as nought, the same rule the
    // department rollup follows: a building nobody has walked is not the worst
    // building.
    row.averageAuditScore = collected.length
      ? Math.round(collected.reduce((sum, score) => sum + score, 0) / collected.length)
      : undefined;
  });

  return [...rows.values()].sort((a, b) => {
    // The unnamed row last: it is a gap in the records, not a building.
    if (!a.site) return 1;
    if (!b.site) return -1;

    return a.site.localeCompare(b.site);
  });
};
