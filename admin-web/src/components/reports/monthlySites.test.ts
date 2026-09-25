import { describe, expect, it } from 'vitest';
import { summariseSites } from './monthlySites';
import { FiveSLayoutPlan } from '../../types/fiveS.types';

const plan = (site: string, zones: Array<Record<string, unknown>> = []) =>
  ({ id: `l-${site}-${zones.length}`, name: 'Floor', site, zones, objects: [] }) as unknown as FiveSLayoutPlan;

const row = (rows: ReturnType<typeof summariseSites>, site: string) =>
  rows.find((entry) => entry.site === site);

describe('how each building is doing', () => {
  it('counts the floors and the areas of each site separately', () => {
    // A plant with two buildings read as one, so a site whose programme had
    // quietly stopped was averaged away by a site where it had not.
    const rows = summariseSites([
      plan('Plant A', [{ id: 'z1' }, { id: 'z2' }]),
      plan('Plant A', [{ id: 'z3' }]),
      plan('Plant B', [{ id: 'z4' }]),
    ]);

    expect(row(rows, 'Plant A')).toMatchObject({ floors: 2, zones: 3 });
    expect(row(rows, 'Plant B')).toMatchObject({ floors: 1, zones: 1 });
  });

  it('averages the scores of the areas in the building', () => {
    const rows = summariseSites([
      plan('Plant A', [
        { id: 'z1', lastAuditScore: 90 },
        { id: 'z2', lastAuditScore: 70 },
      ]),
    ]);

    expect(row(rows, 'Plant A')?.averageAuditScore).toBe(80);
  });

  it('says never audited rather than nought', () => {
    const rows = summariseSites([plan('Plant A', [{ id: 'z1' }])]);

    expect(row(rows, 'Plant A')?.averageAuditScore).toBeUndefined();
  });

  it('counts only the red tags still open', () => {
    const rows = summariseSites([
      plan('Plant A', [
        {
          id: 'z1',
          redTags: [
            { id: 'r1', status: 'open' },
            { id: 'r2', status: 'disposed' },
          ],
        },
      ]),
    ]);

    expect(row(rows, 'Plant A')?.openRedTags).toBe(1);
  });

  it('counts the overdue audits, including areas nobody has ever walked', () => {
    const rows = summariseSites(
      [
        plan('Plant A', [
          { id: 'z1', auditFrequency: 'weekly', lastAuditAt: '2026-09-22' },
          { id: 'z2', auditFrequency: 'weekly', lastAuditAt: '2026-07-01' },
          { id: 'z3', auditFrequency: 'weekly' },
        ]),
      ],
      '2026-09-23',
    );

    expect(row(rows, 'Plant A')?.auditsDue).toBe(2);
  });

  it('collects plans that name no site, and puts them last', () => {
    // A single-site plant names nothing, and a plan somebody forgot to label
    // still has areas that have to be audited.
    const rows = summariseSites([plan('Plant A', [{ id: 'z1' }]), plan('', [{ id: 'z2' }])]);

    expect(rows[rows.length - 1]).toMatchObject({ site: '', zones: 1 });
  });

  it('treats a site named with stray spaces as the same building', () => {
    const rows = summariseSites([plan('Plant A', [{ id: 'z1' }]), plan('  Plant A  ', [{ id: 'z2' }])]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ floors: 2, zones: 2 });
  });

  it('reads in the order a list is read', () => {
    const rows = summariseSites([plan('Warehouse'), plan('Assembly hall'), plan('')]);

    expect(rows.map((entry) => entry.site)).toEqual(['Assembly hall', 'Warehouse', '']);
  });
});
