import { describe, expect, it } from 'vitest';
import {
  buildZoneTaskPayload,
  getAuditWalkStatus,
  getRedTagCount,
  getStageGate,
  getZoneActionItems,
  isOpenRedTag,
  matchesZoneStatus,
  withSyncedRedTags,
} from './floorPlanRules';
import { formatLocalDate } from './auditSchedule';
import { FiveSRedTag, FiveSZone } from '../../types/fiveS.types';

/**
 * The rules an area is judged by.
 *
 * These decide what a supervisor is told to do next, so getting one wrong
 * sends somebody to the wrong part of the plant. They lived inside a
 * 3,300-line component where the only way to check them was to render the
 * whole floor plan and read the screen.
 */

const zone = (over: Partial<FiveSZone> = {}): FiveSZone =>
  ({
    id: 'z1',
    code: 'A01',
    name: 'Reception',
    x: 0,
    y: 0,
    width: 200,
    height: 120,
    color: '#38bdf8',
    stage: 'sort',
    contents: '',
    standard: '',
    labelText: '',
    auditFrequency: 'monthly',
    redTagCount: 0,
    ...over,
  }) as FiveSZone;

const tag = (over: Partial<FiveSRedTag> = {}): FiveSRedTag =>
  ({ id: 't1', item: 'Broken pallet', status: 'open', ...over }) as FiveSRedTag;

const fullySetUp = {
  ownerName: 'Bat',
  ownerId: 'u1',
  contents: 'Reception desk, visitor chairs',
  standard: 'Desk clear at end of shift',
  labelText: 'A01 Reception',
};

describe('counting red tags', () => {
  it('counts a tag as open until it is closed', () => {
    expect(isOpenRedTag(tag({ status: 'open' }))).toBe(true);
    expect(isOpenRedTag(tag({ status: 'review' }))).toBe(true);
    expect(isOpenRedTag(tag({ status: 'disposed' }))).toBe(false);
    expect(isOpenRedTag(tag({ status: 'returned' }))).toBe(false);
  });

  it('treats a closed tag as settled even while its status still says open', () => {
    // `closedAt` is set when the cleanup task finishes, before anybody has
    // recorded whether the item was thrown out or put back.
    expect(isOpenRedTag(tag({ status: 'open', closedAt: '2026-09-01' }))).toBe(false);
  });

  it('falls back to the stored count for areas tagged before the register existed', () => {
    expect(getRedTagCount(zone({ redTagCount: 4 }))).toBe(4);
    expect(getRedTagCount(zone({ redTagCount: 4, redTags: [tag()] }))).toBe(1);
  });

  it('keeps the count and the register in step', () => {
    const synced = withSyncedRedTags([tag(), tag({ id: 't2', status: 'disposed' })]);

    expect(synced.redTags).toHaveLength(2);
    expect(synced.redTagCount).toBe(1);
  });
});

describe('the gate between one S and the next', () => {
  it('holds an area in Sort until it has an owner, its contents and no open tags', () => {
    const gate = getStageGate(zone({ stage: 'sort' }));

    expect(gate.complete).toBe(false);
    expect(gate.nextStage).toBe('set_in_order');
    expect(gate.items.map((item) => item.label)).toEqual([
      'Responsible owner assigned',
      'Area contents listed',
      'Red tags cleared',
    ]);
    // A blank area has no tags, so that one gate is already met.
    expect(gate.items.filter((item) => !item.complete).map((item) => item.label)).toEqual([
      'Responsible owner assigned',
      'Area contents listed',
    ]);
  });

  it('opens once those three are done', () => {
    const gate = getStageGate(zone({ stage: 'sort', ...fullySetUp }));

    expect(gate.complete).toBe(true);
  });

  it('will not pass Standardize on a score below 85', () => {
    const gate = getStageGate(zone({ stage: 'standardize', ...fullySetUp, lastAuditScore: 80 }));

    expect(gate.complete).toBe(false);
    expect(gate.items.some((item) => item.label.includes('85%') && !item.complete)).toBe(true);
  });

  it('leaves Sustain with nowhere further to go', () => {
    expect(getStageGate(zone({ stage: 'sustain', ...fullySetUp })).nextStage).toBeUndefined();
  });

  it('drops the audit checks when audits are switched off', () => {
    const withAudit = getStageGate(zone({ stage: 'standardize', ...fullySetUp }), true);
    const without = getStageGate(zone({ stage: 'standardize', ...fullySetUp }), false);

    expect(withAudit.complete).toBe(false);
    expect(without.complete).toBe(true);
  });
});

describe('what an area still needs', () => {
  it('names every gap on a blank area', () => {
    // Each gap carries a key for the screen, which shows it in the reader's
    // language, and an English label, which is what an export writes.
    const actions = getZoneActionItems(zone());

    expect(actions.map((action) => action.key)).toEqual(
      expect.arrayContaining(['assignOwner', 'listContents', 'writeStandard']),
    );
    expect(actions.map((action) => action.label)).toEqual(
      expect.arrayContaining([
        'Assign responsible owner',
        'List what belongs in the area',
        'Write the 5S standard',
      ]),
    );
  });

  it('says nothing to do when the area is set up and scoring well', () => {
    const settled = zone({
      stage: 'sustain',
      ...fullySetUp,
      lastAuditScore: 95,
      lastAuditAt: formatLocalDate(),
    });

    expect(getZoneActionItems(settled)).toEqual([]);
  });

  it('reports the number of tags to clear rather than just that there are some', () => {
    const actions = getZoneActionItems(zone({ ...fullySetUp, redTags: [tag(), tag({ id: 't2' })] }));
    const clearing = actions.find((action) => action.key === 'clearRedTags');

    // The count travels as a parameter, so the sentence can be built in any
    // language rather than only in the one it was written in here.
    expect(clearing?.params).toEqual({ count: 2 });
    expect(clearing?.label).toBe('Clear 2 red tag(s)');
  });

  it('lists each gap once even when two rules find it', () => {
    const actions = getZoneActionItems(zone({ redTags: [tag()] }));

    expect(new Set(actions.map((action) => action.label)).size).toBe(actions.length);
  });
});

describe('filtering the areas on the plan', () => {
  const settled = zone({
    stage: 'sustain',
    ...fullySetUp,
    lastAuditScore: 95,
    lastAuditAt: formatLocalDate(),
  });

  it('shows everything under "all"', () => {
    expect(matchesZoneStatus(zone(), 'all')).toBe(true);
    expect(matchesZoneStatus(settled, 'all')).toBe(true);
  });

  it('picks out the areas with something outstanding', () => {
    expect(matchesZoneStatus(zone(), 'needs_attention')).toBe(true);
    expect(matchesZoneStatus(settled, 'needs_attention')).toBe(false);
  });

  it('picks out the areas nobody owns', () => {
    expect(matchesZoneStatus(zone(), 'unassigned')).toBe(true);
    expect(matchesZoneStatus(settled, 'unassigned')).toBe(false);
  });

  it('picks out the areas with open tags', () => {
    expect(matchesZoneStatus(zone({ redTags: [tag()] }), 'red_tags')).toBe(true);
    expect(matchesZoneStatus(zone({ redTags: [tag({ status: 'disposed' })] }), 'red_tags')).toBe(false);
  });

  it('picks out a low score, and treats an unaudited area as not low', () => {
    expect(matchesZoneStatus(zone({ lastAuditScore: 60 }), 'low_score')).toBe(true);
    expect(matchesZoneStatus(zone(), 'low_score')).toBe(false);
  });

  it('finds nothing audit-related when audits are switched off', () => {
    expect(matchesZoneStatus(zone({ lastAuditScore: 60 }), 'low_score', false)).toBe(false);
    expect(matchesZoneStatus(zone(), 'audit_due', false)).toBe(false);
  });
});

describe('when an area is due a walk', () => {
  const today = '2026-09-14';

  it('calls an area that has never been audited due now', () => {
    // There is no cycle to count from, and an unaudited area is the one most
    // worth walking — so it is due rather than quietly unscheduled.
    const status = getAuditWalkStatus(zone(), today);

    expect(status.status).toBe('due_today');
    expect(status.dueDate).toBe('Now');
  });

  it('calls a date more than a week out scheduled', () => {
    const fresh = zone({ auditFrequency: 'monthly', lastAuditAt: '2026-09-10' });

    expect(getAuditWalkStatus(fresh, today).status).toBe('scheduled');
  });

  it('calls a date inside the week upcoming', () => {
    const soon = zone({ auditFrequency: 'weekly', lastAuditAt: '2026-09-11' });

    expect(getAuditWalkStatus(soon, today).status).toBe('upcoming');
  });

  it('calls a passed due date overdue', () => {
    const late = zone({ auditFrequency: 'monthly', lastAuditAt: '2026-06-01' });

    expect(getAuditWalkStatus(late, today).status).toBe('overdue');
  });

  it('separates today from the days ahead', () => {
    // A monthly cycle is thirty days, so 15 August falls due on 14 September.
    const dueToday = zone({ auditFrequency: 'monthly', lastAuditAt: '2026-08-15' });

    expect(getAuditWalkStatus(dueToday, today).status).toBe('due_today');
  });
});

describe('the task raised from an area', () => {
  it('says which area, what is outstanding and who owns it', () => {
    const payload = buildZoneTaskPayload(zone({ ownerName: 'Bat', ownerId: 'u1' }), '5S setup');

    expect(payload.title).toBe('5S setup: A01 - Reception');
    expect(payload.description).toContain('Owner: Bat');
    expect(payload.description).toContain('Stage: 1 Sort');
    expect(payload.assigneeId).toBe('u1');
    expect(payload.status).toBe('todo');
  });

  it('raises the priority when there are tags to clear', () => {
    // A recent audit date matters: without one the area counts as audit-due,
    // which is high priority on its own.
    const audited = { ...fullySetUp, lastAuditScore: 95, lastAuditAt: formatLocalDate() };

    expect(buildZoneTaskPayload(zone(audited), 'x').priority).toBe('medium');
    expect(buildZoneTaskPayload(zone({ ...audited, redTags: [tag()] }), 'x').priority).toBe('high');
  });

  it('gives tags three days and everything else a week', () => {
    const audited = { ...fullySetUp, lastAuditScore: 95, lastAuditAt: formatLocalDate() };
    const withTags = buildZoneTaskPayload(zone({ ...audited, redTags: [tag()] }), 'x');
    const without = buildZoneTaskPayload(zone(audited), 'x');

    expect(new Date(withTags.dueDate).getTime()).toBeLessThan(new Date(without.dueDate).getTime());
  });

  it('makes an area that is due an audit today due today', () => {
    expect(buildZoneTaskPayload(zone(fullySetUp), 'x').dueDate).toBe(formatLocalDate());
  });

  it('leaves the audit cycle out when audits are switched off', () => {
    expect(buildZoneTaskPayload(zone(), 'x', false).description).not.toContain('Audit cycle');
    expect(buildZoneTaskPayload(zone(), 'x', true).description).toContain('Audit cycle');
  });

  it('says so plainly when an unowned area has nobody to assign to', () => {
    const payload = buildZoneTaskPayload(zone(), 'x');

    expect(payload.description).toContain('Owner: Unassigned');
    expect(payload.assigneeId).toBeUndefined();
  });
});
