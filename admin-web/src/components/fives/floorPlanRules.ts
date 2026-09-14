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

export const stageOrder: FiveSStage[] = ['sort', 'set_in_order', 'shine', 'standardize', 'sustain'];

export type ZoneStatusFilter =
  | 'all'
  | 'needs_attention'
  | 'ready_to_advance'
  | 'audit_due'
  | 'red_tags'
  | 'low_score'
  | 'unassigned';

export const zoneStatusOptions: Array<{ value: ZoneStatusFilter; label: string }> = [
  { value: 'all', label: 'All areas' },
  { value: 'needs_attention', label: 'Needs attention' },
  { value: 'ready_to_advance', label: 'Ready to advance' },
  { value: 'audit_due', label: 'Audit due' },
  { value: 'red_tags', label: 'Red tags' },
  { value: 'low_score', label: 'Low score' },
  { value: 'unassigned', label: 'Unassigned' },
];

export const redTagStatusLabel = (status: FiveSRedTag['status']) =>
  redTagStatusOptions.find((option) => option.value === status)?.label ?? status;

export const redTagStatusOptions: Array<{ value: FiveSRedTag['status']; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'review', label: 'Review' },
  { value: 'disposed', label: 'Disposed' },
  { value: 'returned', label: 'Returned' },
];

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
      { label: 'Responsible owner assigned', complete: Boolean(zone.ownerName) },
      { label: 'Area contents listed', complete: Boolean(zone.contents.trim()) },
      { label: 'Red tags cleared', complete: getRedTagCount(zone) === 0 },
    ];
  }

  if (zone.stage === 'set_in_order') {
    return [
      { label: 'Location label note written', complete: Boolean(zone.labelText.trim()) },
      { label: 'Owner assigned', complete: Boolean(zone.ownerName) },
      { label: 'Area contents listed', complete: Boolean(zone.contents.trim()) },
    ];
  }

  if (zone.stage === 'shine') {
    return [
      { label: 'Last cleaned date recorded', complete: Boolean(zone.lastCleanedAt) },
      { label: 'Red tags cleared', complete: getRedTagCount(zone) === 0 },
      { label: 'Area standard drafted', complete: Boolean(zone.standard.trim()) },
    ];
  }

  if (zone.stage === 'standardize') {
    const setupItems = [
      { label: 'Area standard published', complete: Boolean(zone.standard.trim()) },
      { label: 'Location label note written', complete: Boolean(zone.labelText.trim()) },
      { label: 'Owner assigned', complete: Boolean(zone.ownerName) },
    ];

    return includeAudit
      ? [
          ...setupItems,
          { label: 'First audit completed', complete: zone.lastAuditScore !== undefined },
          { label: 'Audit score at least 85%', complete: Number(zone.lastAuditScore || 0) >= 85 },
        ]
      : setupItems;
  }

  const setupItems = [
    { label: 'Owner assigned', complete: Boolean(zone.ownerName) },
    { label: 'Area standard published', complete: Boolean(zone.standard.trim()) },
    { label: 'Red tags cleared', complete: getRedTagCount(zone) === 0 },
  ];

  return includeAudit
    ? [
        { label: 'Audit schedule current', complete: !isAuditDue(zone) },
        { label: 'Red tags cleared', complete: getRedTagCount(zone) === 0 },
        { label: 'Audit score at least 85%', complete: Number(zone.lastAuditScore || 0) >= 85 },
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

export const getZoneStageActions = (zone: FiveSZone, includeAudit = true) => {
  const gate = getStageGate(zone, includeAudit);

  if (gate.nextStage && gate.complete) {
    return [`Advance to ${stageLabels[gate.nextStage]}`];
  }

  return gate.items.filter((item) => !item.complete).map((item) => `Gate: ${item.label}`);
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

export const getZoneSetupGaps = (zone: FiveSZone, includeAudit = true) => {
  const gaps: string[] = [];

  if (!zone.ownerName) gaps.push('Assign responsible owner');
  if (!zone.contents.trim()) gaps.push('List what belongs in the area');
  if (!zone.standard.trim()) gaps.push('Write the 5S standard');
  if (includeAudit && zone.lastAuditScore === undefined) gaps.push('Run the first audit');
  if (includeAudit && zone.lastAuditScore !== undefined && isAuditDue(zone)) gaps.push('Run scheduled audit');
  if (includeAudit && Number(zone.lastAuditScore || 100) < 85) gaps.push(`Improve audit score from ${zone.lastAuditScore}% to 85%+`);
  if (getRedTagCount(zone) > 0) gaps.push(`Clear ${getRedTagCount(zone)} red tag(s)`);

  return gaps;
};

export const getZoneActionItems = (zone: FiveSZone, includeAudit = true) => {
  const actions = [...getZoneSetupGaps(zone, includeAudit), ...getZoneStageActions(zone, includeAudit)];
  return Array.from(new Set(actions));
};

export const getDateFromToday = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
};

export const getZoneTaskPriority = (zone: FiveSZone, gaps: string[], includeAudit = true) =>
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
