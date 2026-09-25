import {
  FiveSRedTag,
  FiveSStage,
  FiveSZone,
} from '../../types/fiveS.types';
import { formatLocalDate, getAuditDueDate, getDaysUntilDate, isAuditDue } from './auditSchedule';
import { AuditWalkStatus } from './floorPlanFormats';

/**
 * The rules a 5S area is judged by.
 *
 * These decide what an area still needs, whether it may move to the next S,
 * which areas a filter should show, and what a task raised from an area should
 * say. They were written inside a 3,300-line component, where the only way to
 * check them was to render the whole floor plan and read the screen. Nothing
 * here touches React, the DOM, or a service, so each rule can be stated as a
 * case and checked as one.
 */

export const stageLabels: Record<FiveSStage, string> = {
  sort: '1 Sort',
  set_in_order: '2 Set',
  shine: '3 Shine',
  standardize: '4 Standardize',
  sustain: '5 Sustain',
};

/**
 * The five S's, keyed for translation.
 *
 * The numbers stay, because 1S through 5S is how the programme is spoken about
 * in every language it runs in; only the words move.
 */
export const stageKeys: Record<FiveSStage, string> = {
  sort: 'sort',
  set_in_order: 'setInOrder',
  shine: 'shine',
  standardize: 'standardize',
  sustain: 'sustain',
};

export const stageOrder: FiveSStage[] = ['sort', 'set_in_order', 'shine', 'standardize', 'sustain'];

export type ZoneStatusFilter =
  | 'all'
  | 'needs_attention'
  | 'ready_to_advance'
  | 'audit_due'
  | 'red_tags'
  | 'low_score'
  | 'unassigned';

/**
 * The area filters.
 *
 * Each carries both an English label and a key. The label is what an export
 * writes, because a CSV goes to somebody who may not share the reader's
 * language; the key is what the screen shows, in whichever language the reader
 * is in. They were one English string doing both jobs, so a Mongolian
 * workspace filtered its areas in English.
 */
export const zoneStatusOptions: Array<{ value: ZoneStatusFilter; label: string; key: string }> = [
  { value: 'all', label: 'All areas', key: 'allAreas' },
  { value: 'needs_attention', label: 'Needs attention', key: 'needsAttention' },
  { value: 'ready_to_advance', label: 'Ready to advance', key: 'readyToAdvance' },
  { value: 'audit_due', label: 'Audit due', key: 'auditDue' },
  { value: 'red_tags', label: 'Red tags', key: 'redTags' },
  { value: 'low_score', label: 'Low score', key: 'lowScore' },
  { value: 'unassigned', label: 'Unassigned', key: 'unassigned' },
];

export const redTagStatusOptions: Array<{ value: FiveSRedTag['status']; label: string; key: string }> = [
  { value: 'open', label: 'Open', key: 'open' },
  { value: 'review', label: 'Review', key: 'review' },
  { value: 'disposed', label: 'Disposed', key: 'disposed' },
  { value: 'returned', label: 'Returned', key: 'returned' },
];

/** The key for a red tag's status, for the screen. */
export const redTagStatusKey = (status: FiveSRedTag['status']) =>
  redTagStatusOptions.find((option) => option.value === status)?.key ?? 'open';

/** Radius of a red-tag pin on the canvas. */
export const PIN_RADIUS = 11;

/**
 * Where a new pin goes, and where an old one sits.
 *
 * Tags recorded before pins existed have no position. Rather than piling them
 * on one spot, they are laid out along a line inside their zone so each is
 * separately grabbable, and dragging one commits its real place.
 */
export const nextPinSpot = (zone: FiveSZone, index: number) => {
  const step = PIN_RADIUS * 2 + 6;
  const usable = Math.max(zone.width - PIN_RADIUS * 2 - 12, step);
  const perRow = Math.max(1, Math.floor(usable / step));

  return {
    x: Math.round(zone.x + PIN_RADIUS + 10 + (index % perRow) * step),
    y: Math.round(zone.y + zone.height - PIN_RADIUS - 10 - Math.floor(index / perRow) * step),
  };
};

/** A pin's drawn position: its own if it has one, otherwise a laid-out spot. */
export const pinPosition = (zone: FiveSZone, redTag: FiveSRedTag, index: number) =>
  redTag.x !== undefined && redTag.y !== undefined
    ? { x: redTag.x, y: redTag.y }
    : nextPinSpot(zone, index);

export const getAuditWalkStatus = (zone: FiveSZone, today = formatLocalDate()) => {
  const dueDate = getAuditDueDate(zone);

  if (!dueDate) {
    return {
      status: 'due_today' as AuditWalkStatus,
      dueDate: 'Now',
      label: 'Due now',
      daysUntil: 0,
    };
  }

  const daysUntil = getDaysUntilDate(dueDate, today);

  if (daysUntil < 0) {
    return {
      status: 'overdue' as AuditWalkStatus,
      dueDate,
      label: `${Math.abs(daysUntil)} day(s) overdue`,
      daysUntil,
    };
  }

  if (daysUntil === 0) {
    return {
      status: 'due_today' as AuditWalkStatus,
      dueDate,
      label: 'Due today',
      daysUntil,
    };
  }

  if (daysUntil <= 7) {
    return {
      status: 'upcoming' as AuditWalkStatus,
      dueDate,
      label: `Due in ${daysUntil} day(s)`,
      daysUntil,
    };
  }

  return {
    status: 'scheduled' as AuditWalkStatus,
    dueDate,
    label: `Scheduled in ${daysUntil} day(s)`,
    daysUntil,
  };
};

/**
 * A tag still needing attention.
 *
 * `closedAt` is set when the cleanup task is finished, before anyone has
 * recorded whether the item was disposed of or returned — so a tag can be
 * finished while its status is still 'open'.
 */
export const isOpenRedTag = (redTag: FiveSRedTag) =>
  !redTag.closedAt && (redTag.status === 'open' || redTag.status === 'review');

export const getRedTagCount = (zone: FiveSZone) =>
  zone.redTags?.length ? zone.redTags.filter(isOpenRedTag).length : zone.redTagCount || 0;

export const withSyncedRedTags = (redTags: FiveSRedTag[]) => ({
  redTags,
  redTagCount: redTags.filter(isOpenRedTag).length,
});

export const getNextStage = (stage: FiveSStage) => {
  const index = stageOrder.indexOf(stage);
  return index >= 0 && index < stageOrder.length - 1 ? stageOrder[index + 1] : undefined;
};

export const getStageGateItems = (zone: FiveSZone, includeAudit = true) => {
  if (zone.stage === 'sort') {
    return [
      { key: 'ownerAssigned', label: 'Responsible owner assigned', complete: Boolean(zone.ownerName) },
      { key: 'contentsListed', label: 'Area contents listed', complete: Boolean(zone.contents.trim()) },
      { key: 'redTagsCleared', label: 'Red tags cleared', complete: getRedTagCount(zone) === 0 },
    ];
  }

  if (zone.stage === 'set_in_order') {
    return [
      { key: 'labelWritten', label: 'Location label note written', complete: Boolean(zone.labelText.trim()) },
      { key: 'ownerAssigned', label: 'Owner assigned', complete: Boolean(zone.ownerName) },
      { key: 'contentsListed', label: 'Area contents listed', complete: Boolean(zone.contents.trim()) },
    ];
  }

  if (zone.stage === 'shine') {
    return [
      { key: 'cleanedRecorded', label: 'Last cleaned date recorded', complete: Boolean(zone.lastCleanedAt) },
      { key: 'redTagsCleared', label: 'Red tags cleared', complete: getRedTagCount(zone) === 0 },
      { key: 'standardDrafted', label: 'Area standard drafted', complete: Boolean(zone.standard.trim()) },
    ];
  }

  if (zone.stage === 'standardize') {
    const setupItems = [
      { key: 'standardPublished', label: 'Area standard published', complete: Boolean(zone.standard.trim()) },
      { key: 'labelWritten', label: 'Location label note written', complete: Boolean(zone.labelText.trim()) },
      { key: 'ownerAssigned', label: 'Owner assigned', complete: Boolean(zone.ownerName) },
    ];

    return includeAudit
      ? [
          ...setupItems,
          { key: 'firstAuditDone', label: 'First audit completed', complete: zone.lastAuditScore !== undefined },
          { key: 'scoreAtLeast85', label: 'Audit score at least 85%', complete: Number(zone.lastAuditScore || 0) >= 85 },
        ]
      : setupItems;
  }

  const setupItems = [
    { key: 'ownerAssigned', label: 'Owner assigned', complete: Boolean(zone.ownerName) },
    { key: 'standardPublished', label: 'Area standard published', complete: Boolean(zone.standard.trim()) },
    { key: 'redTagsCleared', label: 'Red tags cleared', complete: getRedTagCount(zone) === 0 },
  ];

  return includeAudit
    ? [
        { key: 'auditScheduleCurrent', label: 'Audit schedule current', complete: !isAuditDue(zone) },
        { key: 'redTagsCleared', label: 'Red tags cleared', complete: getRedTagCount(zone) === 0 },
        { key: 'scoreAtLeast85', label: 'Audit score at least 85%', complete: Number(zone.lastAuditScore || 0) >= 85 },
      ]
    : setupItems;
};

export const getStageGate = (zone: FiveSZone, includeAudit = true) => {
  const items = getStageGateItems(zone, includeAudit);
  return {
    items,
    nextStage: getNextStage(zone.stage),
    complete: items.every((item) => item.complete),
  };
};

export const getZoneStageActions = (zone: FiveSZone, includeAudit = true): ZoneAction[] => {
  const gate = getStageGate(zone, includeAudit);

  if (gate.nextStage && gate.complete) {
    return [
      {
        key: 'advance',
        label: `Advance to ${stageLabels[gate.nextStage]}`,
        params: { stageKey: stageKeys[gate.nextStage] },
      },
    ];
  }

  return gate.items
    .filter((item) => !item.complete)
    .map((item) => ({ key: 'gate', label: `Gate: ${item.label}`, params: { gateKey: item.key } }));
};

export const matchesZoneStatus = (zone: FiveSZone, filter: ZoneStatusFilter, includeAudit = true) => {
  if (filter === 'all') return true;
  if (filter === 'needs_attention') return getZoneActionItems(zone, includeAudit).length > 0;
  if (filter === 'ready_to_advance') {
    const gate = getStageGate(zone, includeAudit);
    return Boolean(gate.nextStage && gate.complete);
  }
  if (filter === 'audit_due') return includeAudit && isAuditDue(zone);
  if (filter === 'red_tags') return getRedTagCount(zone) > 0;
  if (filter === 'low_score') return includeAudit && Number(zone.lastAuditScore || 100) < 85;
  return !zone.ownerName;
};

/**
 * What is still missing from an area, as something that can be said in any
 * language.
 *
 * These used to be English sentences built here and printed straight onto the
 * screen, so a Mongolian workspace read its own next actions in English. Each
 * one now carries a key and its numbers; the English label stays because an
 * export goes to somebody who may not share the reader's language.
 */
export interface ZoneAction {
  key: string;
  label: string;
  params?: Record<string, string | number>;
}

export const getZoneSetupGaps = (zone: FiveSZone, includeAudit = true): ZoneAction[] => {
  const gaps: ZoneAction[] = [];
  const score = zone.lastAuditScore;
  const redTags = getRedTagCount(zone);

  if (!zone.ownerName) gaps.push({ key: 'assignOwner', label: 'Assign responsible owner' });
  if (!zone.contents.trim()) gaps.push({ key: 'listContents', label: 'List what belongs in the area' });
  if (!zone.standard.trim()) gaps.push({ key: 'writeStandard', label: 'Write the 5S standard' });
  if (includeAudit && score === undefined) gaps.push({ key: 'firstAudit', label: 'Run the first audit' });
  if (includeAudit && score !== undefined && isAuditDue(zone)) {
    gaps.push({ key: 'scheduledAudit', label: 'Run scheduled audit' });
  }
  if (includeAudit && Number(score || 100) < 85) {
    gaps.push({
      key: 'improveScore',
      label: `Improve audit score from ${score}% to 85%+`,
      params: { score: score ?? 0 },
    });
  }
  if (redTags > 0) {
    gaps.push({ key: 'clearRedTags', label: `Clear ${redTags} red tag(s)`, params: { count: redTags } });
  }

  return gaps;
};

export const getZoneActionItems = (zone: FiveSZone, includeAudit = true): ZoneAction[] => {
  const actions = [...getZoneSetupGaps(zone, includeAudit), ...getZoneStageActions(zone, includeAudit)];
  const seen = new Set<string>();

  // Deduped by what they say rather than by object identity, which is what the
  // set of strings was doing before these became objects.
  return actions.filter((action) => {
    if (seen.has(action.label)) return false;

    seen.add(action.label);
    return true;
  });
};

export const getDateFromToday = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
};

export const getZoneTaskPriority = (zone: FiveSZone, gaps: ZoneAction[], includeAudit = true) =>
  getRedTagCount(zone) > 0 ||
  (includeAudit && (Number(zone.lastAuditScore || 100) < 85 || isAuditDue(zone))) ||
  gaps.length > 2
    ? 'high'
    : 'medium';

export const getZoneTaskDueDate = (zone: FiveSZone, includeAudit = true) => {
  if (getRedTagCount(zone) > 0) return getDateFromToday(3);
  if (includeAudit && isAuditDue(zone)) return formatLocalDate();
  return getDateFromToday(7);
};

export const buildZoneTaskPayload = (zone: FiveSZone, titlePrefix: string, includeAudit = true) => {
  const gaps = getZoneActionItems(zone, includeAudit);

  return {
    title: `${titlePrefix}: ${zone.code} - ${zone.name}`,
    description: [
      `Next actions: ${gaps.length ? gaps.join(', ') : 'Maintain current standard'}`,
      `Owner: ${zone.ownerName || 'Unassigned'}`,
      `Stage: ${stageLabels[zone.stage]}`,
      ...(includeAudit ? [`Audit cycle: ${zone.auditFrequency}`] : []),
      `Contents: ${zone.contents || 'Not documented'}`,
      `Standard: ${zone.standard || 'Not documented'}`,
      `Label note: ${zone.labelText || 'Not documented'}`,
    ].join('\n'),
    assigneeId: zone.ownerId,
    status: 'todo' as const,
    priority: getZoneTaskPriority(zone, gaps, includeAudit),
    dueDate: getZoneTaskDueDate(zone, includeAudit),
    estimatedHours: gaps.length > 2 ? 3 : 2,
    actualHours: 0,
  };
};
