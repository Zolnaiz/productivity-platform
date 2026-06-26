import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  DoorOpen,
  ListChecks,
  Map as MapIcon,
  MousePointer2,
  Move,
  Package,
  Plus,
  Printer,
  RotateCcw,
  RotateCw,
  Square,
  Table,
  Trash2,
  Upload,
  UserCheck,
} from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { fiveSLayoutService } from '../../services/fiveSLayout.service';
import { operationsService } from '../../services/operations.service';
import { peopleService } from '../../services/people.service';
import {
  FiveSLayoutPlan,
  FiveSRedTag,
  FiveSStage,
  FiveSZone,
  FloorPlanObject,
  FloorPlanObjectType,
} from '../../types/fiveS.types';
import { TeamUser } from '../../types/people.types';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;

const stageLabels: Record<FiveSStage, string> = {
  sort: '1 Sort',
  set_in_order: '2 Set',
  shine: '3 Shine',
  standardize: '4 Standardize',
  sustain: '5 Sustain',
};

const stageOrder: FiveSStage[] = ['sort', 'set_in_order', 'shine', 'standardize', 'sustain'];

const shapeTools: Array<{
  type: FloorPlanObjectType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'Structure' | 'Furniture' | 'Storage' | 'Utilities';
}> = [
  { type: 'wall', label: 'Wall', icon: Square, group: 'Structure' },
  { type: 'door', label: 'Door', icon: DoorOpen, group: 'Structure' },
  { type: 'desk', label: 'Desk', icon: Table, group: 'Furniture' },
  { type: 'chair', label: 'Chair', icon: Move, group: 'Furniture' },
  { type: 'table', label: 'Meeting table', icon: ClipboardList, group: 'Furniture' },
  { type: 'sofa', label: 'Sofa', icon: Square, group: 'Furniture' },
  { type: 'shelf', label: 'Shelf', icon: Package, group: 'Storage' },
  { type: 'cabinet', label: 'Cabinet', icon: Package, group: 'Storage' },
  { type: 'printer', label: 'Printer', icon: Printer, group: 'Utilities' },
  { type: 'equipment', label: 'Equipment', icon: Move, group: 'Utilities' },
  { type: 'whiteboard', label: 'Whiteboard', icon: Square, group: 'Utilities' },
  { type: 'plant', label: 'Plant', icon: Plus, group: 'Utilities' },
  { type: 'waste_bin', label: 'Waste bin', icon: Trash2, group: 'Utilities' },
  { type: 'sink', label: 'Sink', icon: Square, group: 'Utilities' },
];

const shapeToolGroups: Array<(typeof shapeTools)[number]['group']> = ['Structure', 'Furniture', 'Storage', 'Utilities'];

type ZoneStatusFilter =
  | 'all'
  | 'needs_attention'
  | 'ready_to_advance'
  | 'audit_due'
  | 'red_tags'
  | 'low_score'
  | 'unassigned';

const zoneStatusOptions: Array<{ value: ZoneStatusFilter; label: string }> = [
  { value: 'all', label: 'All areas' },
  { value: 'needs_attention', label: 'Needs attention' },
  { value: 'ready_to_advance', label: 'Ready to advance' },
  { value: 'audit_due', label: 'Audit due' },
  { value: 'red_tags', label: 'Red tags' },
  { value: 'low_score', label: 'Low score' },
  { value: 'unassigned', label: 'Unassigned' },
];

const redTagStatusOptions: Array<{ value: FiveSRedTag['status']; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'review', label: 'Review' },
  { value: 'disposed', label: 'Disposed' },
  { value: 'returned', label: 'Returned' },
];

const zoneColorPresets = [
  { label: 'Front', value: '#38bdf8' },
  { label: 'Work', value: '#22c55e' },
  { label: 'Storage', value: '#f59e0b' },
  { label: 'Meeting', value: '#a855f7' },
  { label: 'Break', value: '#ef4444' },
  { label: 'Shared', value: '#14b8a6' },
  { label: 'Support', value: '#64748b' },
];

const zoneTemplates: Array<
  Pick<FiveSZone, 'name' | 'color' | 'width' | 'height' | 'contents' | 'standard' | 'labelText' | 'stage'>
> = [
  {
    name: 'Reception',
    color: '#38bdf8',
    width: 210,
    height: 126,
    contents: 'Visitor desk, waiting chairs, incoming document tray',
    standard: 'Front desk clear, visitor chairs aligned, incoming documents sorted daily.',
    labelText: 'Reception owner and visitor standard visible',
    stage: 'set_in_order',
  },
  {
    name: 'Workstations',
    color: '#22c55e',
    width: 310,
    height: 190,
    contents: 'Employee desks, laptops, stationery, shared printer access',
    standard: 'Only active work items on desks, cables tied, shared items returned to labeled place.',
    labelText: 'Desk standard photo and cable labels',
    stage: 'shine',
  },
  {
    name: 'Storage',
    color: '#f59e0b',
    width: 220,
    height: 160,
    contents: 'Office supplies, PPE, spare labels, cleaning tools',
    standard: 'Shelf positions labeled, min/max stock visible, red-tag box checked weekly.',
    labelText: 'Shelf labels and red-tag location',
    stage: 'sort',
  },
  {
    name: 'Meeting room',
    color: '#a855f7',
    width: 190,
    height: 150,
    contents: 'Meeting table, chairs, screen, whiteboard markers',
    standard: 'Table clear after each meeting, chairs reset, markers tested.',
    labelText: 'Meeting reset standard',
    stage: 'standardize',
  },
  {
    name: 'Break area',
    color: '#ef4444',
    width: 220,
    height: 120,
    contents: 'Coffee machine, sink, fridge, waste bins',
    standard: 'Counters wiped, food labeled, waste bins emptied, spill kit visible.',
    labelText: 'Food and cleaning labels',
    stage: 'shine',
  },
  {
    name: 'Archive',
    color: '#14b8a6',
    width: 210,
    height: 132,
    contents: 'Document folders, binders, archive boxes',
    standard: 'Folder names follow naming rule, archive index visible, obsolete documents red-tagged.',
    labelText: 'Archive index and folder color rule',
    stage: 'set_in_order',
  },
  {
    name: 'Walkway',
    color: '#64748b',
    width: 260,
    height: 86,
    contents: 'Common passage, emergency route, shared access',
    standard: 'Walkway clear, emergency route visible, no temporary storage.',
    labelText: 'Keep clear',
    stage: 'standardize',
  },
];

const fieldClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const escapeHtml = (value: string | number | undefined) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeCsvCell = (value: string | number | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const auditFrequencyDays: Record<FiveSZone['auditFrequency'], number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

const formatLocalDate = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const addDaysToDate = (dateValue: string, days: number) => {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
};

const getAuditDueDate = (zone: FiveSZone) =>
  zone.lastAuditAt ? addDaysToDate(zone.lastAuditAt, auditFrequencyDays[zone.auditFrequency]) : '';

const isAuditDue = (zone: FiveSZone, today = formatLocalDate()) => {
  const dueDate = getAuditDueDate(zone);
  return !dueDate || dueDate <= today;
};

type AuditWalkStatus = 'overdue' | 'due_today' | 'upcoming' | 'scheduled';

const getDaysUntilDate = (dateValue: string, today = formatLocalDate()) => {
  const target = new Date(`${dateValue}T00:00:00`);
  const current = new Date(`${today}T00:00:00`);
  return Math.round((target.getTime() - current.getTime()) / 86400000);
};

const getAuditWalkStatus = (zone: FiveSZone, today = formatLocalDate()) => {
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

const isOpenRedTag = (redTag: FiveSRedTag) => redTag.status === 'open' || redTag.status === 'review';

const getRedTagCount = (zone: FiveSZone) =>
  zone.redTags?.length ? zone.redTags.filter(isOpenRedTag).length : zone.redTagCount || 0;

const withSyncedRedTags = (redTags: FiveSRedTag[]) => ({
  redTags,
  redTagCount: redTags.filter(isOpenRedTag).length,
});

const getNextStage = (stage: FiveSStage) => {
  const index = stageOrder.indexOf(stage);
  return index >= 0 && index < stageOrder.length - 1 ? stageOrder[index + 1] : undefined;
};

const getStageGateItems = (zone: FiveSZone, includeAudit = true) => {
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

const getStageGate = (zone: FiveSZone, includeAudit = true) => {
  const items = getStageGateItems(zone, includeAudit);
  return {
    items,
    nextStage: getNextStage(zone.stage),
    complete: items.every((item) => item.complete),
  };
};

const getZoneStageActions = (zone: FiveSZone, includeAudit = true) => {
  const gate = getStageGate(zone, includeAudit);

  if (gate.nextStage && gate.complete) {
    return [`Advance to ${stageLabels[gate.nextStage]}`];
  }

  return gate.items.filter((item) => !item.complete).map((item) => `Gate: ${item.label}`);
};

const matchesZoneStatus = (zone: FiveSZone, filter: ZoneStatusFilter, includeAudit = true) => {
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

const getZoneSetupGaps = (zone: FiveSZone, includeAudit = true) => {
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

const getZoneActionItems = (zone: FiveSZone, includeAudit = true) => {
  const actions = [...getZoneSetupGaps(zone, includeAudit), ...getZoneStageActions(zone, includeAudit)];
  return Array.from(new Set(actions));
};

const getDateFromToday = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
};

const getZoneTaskPriority = (zone: FiveSZone, gaps: string[], includeAudit = true) =>
  getRedTagCount(zone) > 0 ||
  (includeAudit && (Number(zone.lastAuditScore || 100) < 85 || isAuditDue(zone))) ||
  gaps.length > 2
    ? 'high'
    : 'medium';

const getZoneTaskDueDate = (zone: FiveSZone, includeAudit = true) => {
  if (getRedTagCount(zone) > 0) return getDateFromToday(3);
  if (includeAudit && isAuditDue(zone)) return formatLocalDate();
  return getDateFromToday(7);
};

const buildZoneTaskPayload = (zone: FiveSZone, titlePrefix: string, includeAudit = true) => {
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

const getPointerPoint = (event: React.PointerEvent<SVGSVGElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
  };
};

interface FiveSFloorPlanSetupProps {
  onAuditZoneSelect?: (location: string) => void;
  refreshKey?: number;
  showAuditControls?: boolean;
}

const FiveSFloorPlanSetup: React.FC<FiveSFloorPlanSetupProps> = ({
  onAuditZoneSelect,
  refreshKey = 0,
  showAuditControls = false,
}) => {
  const [plan, setPlan] = useState<FiveSLayoutPlan | null>(null);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedObjectId, setSelectedObjectId] = useState('');
  const [statusFilter, setStatusFilter] = useState<ZoneStatusFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [drag, setDrag] = useState<
    | { kind: 'zone'; zoneId: string; offsetX: number; offsetY: number }
    | { kind: 'object'; objectId: string; offsetX: number; offsetY: number }
    | null
  >(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([fiveSLayoutService.getPlan(), peopleService.getUsers()])
      .then(([layoutPlan, teamUsers]) => {
        if (!active) return;
        setPlan(layoutPlan);
        setUsers(teamUsers.filter((user) => user.active));
        setSelectedZoneId(layoutPlan.zones[0]?.id || '');
        setSelectedObjectId('');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const selectedZone = useMemo(
    () => plan?.zones.find((zone) => zone.id === selectedZoneId),
    [plan, selectedZoneId],
  );

  const selectedObject = useMemo(
    () => plan?.objects.find((object) => object.id === selectedObjectId),
    [plan, selectedObjectId],
  );

  const selectedStageGate = useMemo(
    () => (selectedZone ? getStageGate(selectedZone, showAuditControls) : null),
    [selectedZone, showAuditControls],
  );

  const readiness = useMemo(() => {
    const zones = plan?.zones ?? [];
    const withOwner = zones.filter((zone) => zone.ownerName).length;
    const withContents = zones.filter((zone) => zone.contents.trim()).length;
    const withStandard = zones.filter((zone) => zone.standard.trim()).length;
    const withAuditScore = zones.filter((zone) => zone.lastAuditScore !== undefined).length;
    const redTags = zones.reduce((total, zone) => total + getRedTagCount(zone), 0);
    const auditDue = zones.filter((zone) => isAuditDue(zone)).length;
    const riskAreas = zones.filter(
      (zone) =>
        getRedTagCount(zone) > 0 ||
        (showAuditControls && (Number(zone.lastAuditScore || 100) < 85 || isAuditDue(zone))),
    ).length;
    const completedFields = withOwner + withContents + withStandard;
    const totalFields = zones.length * 3;

    return {
      zones: zones.length,
      withOwner,
      withContents,
      withStandard,
      withAuditScore,
      redTags,
      auditDue,
      riskAreas,
      rate: totalFields ? Math.round((completedFields / totalFields) * 100) : 0,
    };
  }, [plan, showAuditControls]);

  const stageCounts = useMemo(
    () =>
      stageOrder.map((stage) => ({
        stage,
        count: (plan?.zones ?? []).filter((zone) => zone.stage === stage).length,
      })),
    [plan],
  );

  const launchSteps = useMemo(() => {
    const zones = plan?.zones ?? [];
    const missingNames = (predicate: (zone: FiveSZone) => boolean) => {
      if (!zones.length) return 'No zones';
      const missing = zones.filter(predicate).map((zone) => zone.code);
      if (!missing.length) return 'Complete';
      return `${missing.slice(0, 4).join(', ')}${missing.length > 4 ? ` +${missing.length - 4}` : ''}`;
    };

    const steps = [
      {
        title: '1. Map areas',
        complete: readiness.zones > 0,
        progress: `${readiness.zones} zones`,
        detail: readiness.zones > 0 ? 'Complete' : 'No zones',
      },
      {
        title: '2. Assign owners',
        complete: readiness.withOwner === readiness.zones && readiness.zones > 0,
        progress: `${readiness.withOwner}/${readiness.zones}`,
        detail: missingNames((zone) => !zone.ownerName),
      },
      {
        title: '3. List contents',
        complete: readiness.withContents === readiness.zones && readiness.zones > 0,
        progress: `${readiness.withContents}/${readiness.zones}`,
        detail: missingNames((zone) => !zone.contents.trim()),
      },
      {
        title: '4. Set standards',
        complete: readiness.withStandard === readiness.zones && readiness.zones > 0,
        progress: `${readiness.withStandard}/${readiness.zones}`,
        detail: missingNames((zone) => !zone.standard.trim()),
      },
    ];

    return showAuditControls
      ? [
          ...steps,
          {
            title: '5. First audit',
            complete: readiness.withAuditScore === readiness.zones && readiness.zones > 0,
            progress: `${readiness.withAuditScore}/${readiness.zones}`,
            detail: missingNames((zone) => zone.lastAuditScore === undefined),
          },
        ]
      : steps;
  }, [plan, readiness, showAuditControls]);

  const zonesNeedingLaunchTasks = useMemo(
    () => (plan?.zones ?? []).filter((zone) => getZoneActionItems(zone, showAuditControls).length > 0),
    [plan, showAuditControls],
  );

  const zonesAuditDue = useMemo(
    () => (plan?.zones ?? []).filter((zone) => isAuditDue(zone)),
    [plan],
  );

  const auditWalkItems = useMemo(
    () =>
      (plan?.zones ?? [])
        .map((zone, index) => ({
          zone,
          sequence: index + 1,
          timing: getAuditWalkStatus(zone),
        }))
        .sort((a, b) => {
          const statusOrder: Record<AuditWalkStatus, number> = {
            overdue: 0,
            due_today: 1,
            upcoming: 2,
            scheduled: 3,
          };
          return (
            statusOrder[a.timing.status] - statusOrder[b.timing.status] ||
            a.timing.daysUntil - b.timing.daysUntil ||
            a.zone.code.localeCompare(b.zone.code)
          );
        }),
    [plan],
  );

  const auditWalkSummary = useMemo(
    () => ({
      overdue: auditWalkItems.filter((item) => item.timing.status === 'overdue').length,
      dueToday: auditWalkItems.filter((item) => item.timing.status === 'due_today').length,
      upcoming: auditWalkItems.filter((item) => item.timing.status === 'upcoming').length,
      scheduled: auditWalkItems.filter((item) => item.timing.status === 'scheduled').length,
    }),
    [auditWalkItems],
  );

  const activeAuditWalkItems = useMemo(
    () => auditWalkItems.filter((item) => item.timing.status !== 'scheduled'),
    [auditWalkItems],
  );

  const visibleZoneStatusOptions = useMemo(
    () =>
      showAuditControls
        ? zoneStatusOptions
        : zoneStatusOptions.filter((option) => option.value !== 'audit_due' && option.value !== 'low_score'),
    [showAuditControls],
  );

  useEffect(() => {
    if (!showAuditControls && (statusFilter === 'audit_due' || statusFilter === 'low_score')) {
      setStatusFilter('all');
    }
  }, [showAuditControls, statusFilter]);

  const filteredZones = useMemo(
    () =>
      (plan?.zones ?? []).filter((zone) => {
        const ownerMatches = ownerFilter === 'all' || (ownerFilter === 'unassigned' ? !zone.ownerId : zone.ownerId === ownerFilter);
        return ownerMatches && matchesZoneStatus(zone, statusFilter, showAuditControls);
      }),
    [ownerFilter, plan, showAuditControls, statusFilter],
  );

  const filteredZoneIds = useMemo(() => new Set(filteredZones.map((zone) => zone.id)), [filteredZones]);

  const ownerCoverage = useMemo(() => {
    const coverage = new Map<
      string,
      {
        id: string;
        name: string;
        zones: number;
        redTags: number;
        auditDue: number;
        scoreTotal: number;
        scoreCount: number;
      }
    >();

    (plan?.zones ?? []).forEach((zone) => {
      const id = zone.ownerId || 'unassigned';
      const current =
        coverage.get(id) ||
        {
          id,
          name: zone.ownerName || 'Unassigned',
          zones: 0,
          redTags: 0,
          auditDue: 0,
          scoreTotal: 0,
          scoreCount: 0,
        };

      current.zones += 1;
      current.redTags += getRedTagCount(zone);
      current.auditDue += isAuditDue(zone) ? 1 : 0;
      if (zone.lastAuditScore !== undefined) {
        current.scoreTotal += zone.lastAuditScore;
        current.scoreCount += 1;
      }
      coverage.set(id, current);
    });

    return Array.from(coverage.values()).sort((a, b) => b.auditDue - a.auditDue || b.redTags - a.redTags || a.name.localeCompare(b.name));
  }, [plan]);

  const rolloutQueue = useMemo(
    () =>
      filteredZones
        .map((zone) => {
          const gaps = getZoneActionItems(zone, showAuditControls);

          return {
            zone,
            nextAction: gaps[0] || 'Maintain current standard',
            gapCount: gaps.length,
            priority: getZoneTaskPriority(zone, gaps, showAuditControls),
            dueDate: getZoneTaskDueDate(zone, showAuditControls),
          };
        })
        .filter((item) => item.gapCount > 0)
        .sort((a, b) => {
          const priorityOrder = a.priority === b.priority ? 0 : a.priority === 'high' ? -1 : 1;
          return priorityOrder || a.dueDate.localeCompare(b.dueDate) || a.zone.code.localeCompare(b.zone.code);
        }),
    [filteredZones, showAuditControls],
  );

  const readyToAdvanceZones = useMemo(
    () =>
      filteredZones.filter((zone) => {
        const gate = getStageGate(zone, showAuditControls);
        return Boolean(gate.nextStage && gate.complete);
      }),
    [filteredZones, showAuditControls],
  );

  const redTagRegister = useMemo(
    () =>
      (plan?.zones ?? [])
        .flatMap((zone) => (zone.redTags || []).map((redTag) => ({ zone, redTag })))
        .sort((a, b) => {
          const openOrder = Number(isOpenRedTag(b.redTag)) - Number(isOpenRedTag(a.redTag));
          return openOrder || (a.redTag.dueDate || '').localeCompare(b.redTag.dueDate || '') || a.zone.code.localeCompare(b.zone.code);
        }),
    [plan],
  );

  const openRedTagItems = useMemo(
    () => redTagRegister.filter((item) => isOpenRedTag(item.redTag)),
    [redTagRegister],
  );

  const updatePlan = (buildPlan: (current: FiveSLayoutPlan) => FiveSLayoutPlan) => {
    setPlan((current) => {
      if (!current) return current;
      const nextPlan = {
        ...buildPlan(current),
        updatedAt: new Date().toISOString(),
      };
      void fiveSLayoutService.savePlan(nextPlan);
      return nextPlan;
    });
  };

  const updateZone = (zoneId: string, patch: Partial<FiveSZone>) => {
    updatePlan((current) => ({
      ...current,
      zones: current.zones.map((zone) => (zone.id === zoneId ? { ...zone, ...patch } : zone)),
    }));
  };

  const updateObject = (objectId: string, patch: Partial<FloorPlanObject>) => {
    updatePlan((current) => ({
      ...current,
      objects: current.objects.map((object) => (object.id === objectId ? { ...object, ...patch } : object)),
    }));
  };

  const addZone = () => {
    if (!plan) return;
    const zone = fiveSLayoutService.createZone(plan.zones);
    updatePlan((current) => ({
      ...current,
      zones: [...current.zones, zone],
    }));
    setSelectedZoneId(zone.id);
    setSelectedObjectId('');
  };

  const addZoneFromTemplate = (template: (typeof zoneTemplates)[number]) => {
    if (!plan) return;

    const baseZone = fiveSLayoutService.createZone(plan.zones);
    const index = plan.zones.length;
    const zone = {
      ...baseZone,
      ...template,
      x: Math.round(clamp(64 + (index % 4) * 42, 12, CANVAS_WIDTH - template.width - 12)),
      y: Math.round(clamp(64 + (index % 5) * 34, 12, CANVAS_HEIGHT - template.height - 12)),
    };

    updatePlan((current) => ({
      ...current,
      zones: [...current.zones, zone],
    }));
    setSelectedZoneId(zone.id);
    setSelectedObjectId('');
    setActionMessage(`${zone.code} - ${zone.name} area added.`);
  };

  const addObject = (type: FloorPlanObjectType) => {
    const object = fiveSLayoutService.createObject(type);
    updatePlan((current) => ({
      ...current,
      objects: [...current.objects, object],
    }));
    setSelectedZoneId('');
    setSelectedObjectId(object.id);
    setActionMessage(`${object.label} added to the floorplan.`);
  };

  const deleteSelectedZone = () => {
    if (!selectedZone) return;
    updatePlan((current) => {
      const zones = current.zones.filter((zone) => zone.id !== selectedZone.id);
      setSelectedZoneId(zones[0]?.id || '');
      return { ...current, zones };
    });
  };

  const duplicateSelectedZone = () => {
    if (!selectedZone || !plan) return;

    const template = fiveSLayoutService.createZone(plan.zones);
    const duplicate = {
      ...selectedZone,
      id: `zone-${Date.now()}`,
      code: template.code,
      name: `${selectedZone.name} copy`,
      x: Math.round(clamp(selectedZone.x + 28, 12, CANVAS_WIDTH - selectedZone.width - 12)),
      y: Math.round(clamp(selectedZone.y + 28, 12, CANVAS_HEIGHT - selectedZone.height - 12)),
      lastAuditScore: undefined,
      lastAuditAt: '',
      redTagCount: 0,
      redTags: [],
    };

    updatePlan((current) => ({
      ...current,
      zones: [...current.zones, duplicate],
    }));
    setSelectedZoneId(duplicate.id);
    setSelectedObjectId('');
    setActionMessage(`${duplicate.code} - ${duplicate.name} duplicated.`);
  };

  const deleteSelectedObject = () => {
    if (!selectedObject) return;
    updatePlan((current) => ({
      ...current,
      objects: current.objects.filter((object) => object.id !== selectedObject.id),
    }));
    setSelectedObjectId('');
    setActionMessage(`${selectedObject.label} removed from the floorplan.`);
  };

  const duplicateSelectedObject = () => {
    if (!selectedObject) return;

    const duplicate = {
      ...selectedObject,
      id: `${selectedObject.type}-${Date.now()}`,
      label: `${selectedObject.label} copy`,
      x: Math.round(clamp(selectedObject.x + 24, 8, CANVAS_WIDTH - selectedObject.width - 8)),
      y: Math.round(clamp(selectedObject.y + 24, 8, CANVAS_HEIGHT - selectedObject.height - 8)),
    };

    updatePlan((current) => ({
      ...current,
      objects: [...current.objects, duplicate],
    }));
    setSelectedZoneId('');
    setSelectedObjectId(duplicate.id);
    setActionMessage(`${duplicate.label} duplicated.`);
  };

  const resetPlan = async () => {
    const nextPlan = await fiveSLayoutService.resetPlan();
    setPlan(nextPlan);
    setSelectedZoneId(nextPlan.zones[0]?.id || '');
    setSelectedObjectId('');
  };

  const importBackgroundImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    updatePlan((current) => ({
      ...current,
      backgroundImage: dataUrl,
      backgroundOpacity: current.backgroundOpacity ?? 0.55,
      showGrid: current.showGrid ?? true,
    }));
    setActionMessage(`Blueprint image imported: ${file.name}.`);
  };

  const clearBackgroundImage = () => {
    updatePlan((current) => ({ ...current, backgroundImage: '' }));
    setActionMessage('Blueprint image cleared.');
  };

  const handleZonePointerDown = (event: React.PointerEvent<SVGRectElement>, zone: FiveSZone) => {
    if (!svgRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = svgRef.current.getBoundingClientRect();
    const point = {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };

    setSelectedZoneId(zone.id);
    setSelectedObjectId('');
    setDrag({
      kind: 'zone',
      zoneId: zone.id,
      offsetX: point.x - zone.x,
      offsetY: point.y - zone.y,
    });
  };

  const handleObjectPointerDown = (event: React.PointerEvent<SVGGElement>, object: FloorPlanObject) => {
    if (!svgRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = svgRef.current.getBoundingClientRect();
    const point = {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };

    setSelectedZoneId('');
    setSelectedObjectId(object.id);
    setDrag({
      kind: 'object',
      objectId: object.id,
      offsetX: point.x - object.x,
      offsetY: point.y - object.y,
    });
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drag || !plan) return;
    const point = getPointerPoint(event);

    if (drag.kind === 'zone') {
      const zone = plan.zones.find((item) => item.id === drag.zoneId);
      if (!zone) return;

      updateZone(zone.id, {
        x: Math.round(clamp(point.x - drag.offsetX, 12, CANVAS_WIDTH - zone.width - 12)),
        y: Math.round(clamp(point.y - drag.offsetY, 12, CANVAS_HEIGHT - zone.height - 12)),
      });
      return;
    }

    const object = plan.objects.find((item) => item.id === drag.objectId);
    if (!object) return;

    updateObject(object.id, {
      x: Math.round(clamp(point.x - drag.offsetX, 8, CANVAS_WIDTH - object.width - 8)),
      y: Math.round(clamp(point.y - drag.offsetY, 8, CANVAS_HEIGHT - object.height - 8)),
    });
  };

  const handleOwnerChange = (ownerId: string) => {
    if (!selectedZone) return;
    const owner = users.find((user) => user.id === ownerId);
    updateZone(selectedZone.id, {
      ownerId: owner?.id,
      ownerName: owner?.name || '',
    });
  };

  const useSelectedZoneForAudit = () => {
    if (!selectedZone || !onAuditZoneSelect) return;
    onAuditZoneSelect(`${selectedZone.code} - ${selectedZone.name}`);
    setActionMessage(`Audit location selected: ${selectedZone.code} - ${selectedZone.name}.`);
  };

  const useZoneForAudit = (zone: FiveSZone) => {
    setSelectedZoneId(zone.id);
    setSelectedObjectId('');

    if (!onAuditZoneSelect) {
      setActionMessage(`${zone.code} - ${zone.name} selected.`);
      return;
    }

    onAuditZoneSelect(`${zone.code} - ${zone.name}`);
    setActionMessage(`Audit location selected: ${zone.code} - ${zone.name}.`);
  };

  const markZoneWalkedToday = (zone: FiveSZone) => {
    updateZone(zone.id, { lastAuditAt: formatLocalDate() });
    setActionMessage(`${zone.code} audit walk marked for today.`);
  };

  const advanceSelectedZoneStage = () => {
    if (!selectedZone || !selectedStageGate?.nextStage) return;

    if (!selectedStageGate.complete) {
      setActionMessage(`${selectedZone.code} gate is not complete yet.`);
      return;
    }

    updateZone(selectedZone.id, { stage: selectedStageGate.nextStage });
    setActionMessage(`${selectedZone.code} advanced to ${stageLabels[selectedStageGate.nextStage]}.`);
  };

  const addSelectedZoneRedTag = () => {
    if (!selectedZone) return;

    const redTags = selectedZone.redTags || [];
    const redTag: FiveSRedTag = {
      id: `redtag-${Date.now()}`,
      title: 'New red-tag item',
      disposition: 'Decide disposition',
      status: 'open',
      ownerId: selectedZone.ownerId,
      ownerName: selectedZone.ownerName,
      dueDate: getDateFromToday(3),
      createdAt: formatLocalDate(),
    };

    updateZone(selectedZone.id, withSyncedRedTags([...redTags, redTag]));
    setActionMessage(`Red-tag item added to ${selectedZone.code}.`);
  };

  const updateSelectedZoneRedTag = (redTagId: string, patch: Partial<FiveSRedTag>) => {
    if (!selectedZone) return;

    const redTags = (selectedZone.redTags || []).map((redTag) => {
      if (redTag.id !== redTagId) return redTag;
      const next = { ...redTag, ...patch };
      const closed = next.status === 'disposed' || next.status === 'returned';
      return {
        ...next,
        closedAt: closed ? next.closedAt || formatLocalDate() : '',
      };
    });

    updateZone(selectedZone.id, withSyncedRedTags(redTags));
  };

  const deleteSelectedZoneRedTag = (redTagId: string) => {
    if (!selectedZone) return;

    const redTags = (selectedZone.redTags || []).filter((redTag) => redTag.id !== redTagId);
    updateZone(selectedZone.id, withSyncedRedTags(redTags));
    setActionMessage(`Red-tag item removed from ${selectedZone.code}.`);
  };

  const markSelectedZoneCleanedToday = () => {
    if (!selectedZone) return;

    const redTags = (selectedZone.redTags || []).map((redTag) =>
      isOpenRedTag(redTag)
        ? {
            ...redTag,
            status: 'returned' as const,
            closedAt: formatLocalDate(),
          }
        : redTag,
    );

    updateZone(selectedZone.id, {
      ...withSyncedRedTags(redTags),
      lastCleanedAt: formatLocalDate(),
    });
  };

  const createTaskForZone = (zone: FiveSZone, titlePrefix = '5S setup') =>
    operationsService.createTask(buildZoneTaskPayload(zone, titlePrefix, showAuditControls));

  const createSelectedZoneTask = async () => {
    if (!selectedZone) return;

    try {
      await createTaskForZone(selectedZone);
      setActionMessage(`Setup task created for ${selectedZone.code} - ${selectedZone.name}.`);
    } catch {
      setActionMessage(`Could not create setup task for ${selectedZone.code} - ${selectedZone.name}.`);
    }
  };

  const createLaunchTasks = async () => {
    if (!zonesNeedingLaunchTasks.length) {
      setActionMessage(
        showAuditControls
          ? 'All 5S zones already have owners, contents, standards, and audit scores.'
          : 'All 5S zones already have owners, contents, and standards.',
      );
      return;
    }

    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    try {
      await Promise.all(
        zonesNeedingLaunchTasks.map((zone) =>
          operationsService.createTask({ ...buildZoneTaskPayload(zone, '5S launch', showAuditControls), dueDate }),
        ),
      );

      setActionMessage(`${zonesNeedingLaunchTasks.length} 5S launch task(s) created.`);
    } catch {
      setActionMessage('Could not create all 5S launch tasks.');
    }
  };

  const createRolloutQueueTask = async (zone: FiveSZone) => {
    try {
      await createTaskForZone(zone, '5S rollout');
      setActionMessage(`Rollout task created for ${zone.code} - ${zone.name}.`);
    } catch {
      setActionMessage(`Could not create rollout task for ${zone.code} - ${zone.name}.`);
    }
  };

  const createFilteredRolloutTasks = async () => {
    if (!rolloutQueue.length) {
      setActionMessage('The current filters have no open 5S rollout actions.');
      return;
    }

    try {
      await Promise.all(rolloutQueue.map((item) => createTaskForZone(item.zone, '5S rollout')));
      setActionMessage(`${rolloutQueue.length} filtered rollout task(s) created.`);
    } catch {
      setActionMessage('Could not create all filtered rollout tasks.');
    }
  };

  const advanceFilteredReadyStages = () => {
    if (!readyToAdvanceZones.length) {
      setActionMessage('No filtered areas are ready to advance.');
      return;
    }

    const nextStageByZoneId = new Map(
      readyToAdvanceZones
        .map((zone) => [zone.id, getStageGate(zone, showAuditControls).nextStage] as const)
        .filter((entry): entry is readonly [string, FiveSStage] => Boolean(entry[1])),
    );

    updatePlan((current) => ({
      ...current,
      zones: current.zones.map((zone) => {
        const nextStage = nextStageByZoneId.get(zone.id);
        return nextStage ? { ...zone, stage: nextStage } : zone;
      }),
    }));
    setActionMessage(`${readyToAdvanceZones.length} filtered area(s) advanced to the next 5S stage.`);
  };

  const createRedTagTasks = async () => {
    const legacyRedTagZones = (plan?.zones ?? []).filter((zone) => !zone.redTags?.length && getRedTagCount(zone) > 0);
    const taskCount = openRedTagItems.length + legacyRedTagZones.length;

    if (!taskCount) {
      setActionMessage('No red tags are currently open.');
      return;
    }

    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    try {
      await Promise.all([
        ...openRedTagItems.map(({ zone, redTag }) =>
          operationsService.createTask({
            title: `5S red tag: ${zone.code} - ${redTag.title}`,
            description: [
              `Area: ${zone.code} - ${zone.name}`,
              `Disposition: ${redTag.disposition || 'Not documented'}`,
              `Status: ${redTag.status}`,
              `Owner: ${redTag.ownerName || zone.ownerName || 'Unassigned'}`,
              `Created: ${redTag.createdAt || 'Not recorded'}`,
            ].join('\n'),
            assigneeId: redTag.ownerId || zone.ownerId,
            status: 'todo',
            priority: 'high',
            dueDate: redTag.dueDate || dueDate,
            estimatedHours: 1,
            actualHours: 0,
          }),
        ),
        ...legacyRedTagZones.map((zone) =>
          operationsService.createTask({
            title: `5S red tags: ${zone.code} - ${zone.name}`,
            description: [
              `Clear ${getRedTagCount(zone)} red tag(s).`,
              `Owner: ${zone.ownerName || 'Unassigned'}`,
              `Contents: ${zone.contents || 'Not documented'}`,
              `Standard: ${zone.standard || 'Not documented'}`,
            ].join('\n'),
            assigneeId: zone.ownerId,
            status: 'todo',
            priority: 'high',
            dueDate,
            estimatedHours: 1,
            actualHours: 0,
          }),
        ),
      ]);

      setActionMessage(`${taskCount} red-tag cleanup task(s) created.`);
    } catch {
      setActionMessage('Could not create red-tag cleanup tasks.');
    }
  };

  const createAuditDueTasks = async () => {
    if (!zonesAuditDue.length) {
      setActionMessage('No 5S audits are due right now.');
      return;
    }

    const dueDate = formatLocalDate();

    try {
      await Promise.all(
        zonesAuditDue.map((zone) =>
          operationsService.createTask({
            title: `5S audit due: ${zone.code} - ${zone.name}`,
            description: [
              `Audit frequency: ${zone.auditFrequency}`,
              `Last audit: ${zone.lastAuditAt || 'Not recorded'}`,
              `Due date: ${getAuditDueDate(zone) || 'Now'}`,
              `Owner: ${zone.ownerName || 'Unassigned'}`,
            ].join('\n'),
            assigneeId: zone.ownerId,
            status: 'todo',
            priority: Number(zone.lastAuditScore || 100) < 85 ? 'high' : 'medium',
            dueDate,
            estimatedHours: 1,
            actualHours: 0,
          }),
        ),
      );

      setActionMessage(`${zonesAuditDue.length} 5S audit task(s) created.`);
    } catch {
      setActionMessage('Could not create 5S audit tasks.');
    }
  };

  const downloadZoneLabels = () => {
    if (!plan) return;

    const csv = fiveSLayoutService.buildZoneLabelsCsv(plan);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `5s-zone-labels-${plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setActionMessage('Zone labels exported as CSV.');
  };

  const downloadAreaRegisterCsv = () => {
    if (!plan) return;

    const headers = showAuditControls
      ? ['Code', 'Area', 'Owner', 'Stage', 'Score', 'Last audit', 'Audit due', 'Red tags', 'Last cleaned', 'Next action']
      : ['Code', 'Area', 'Owner', 'Stage', 'Red tags', 'Last cleaned', 'Next action'];
    const rows = filteredZones.map((zone) => {
      const gaps = getZoneActionItems(zone, showAuditControls);

      const setupRow = [
        zone.code,
        zone.name,
        zone.ownerName || 'Unassigned',
        stageLabels[zone.stage],
        getRedTagCount(zone),
        zone.lastCleanedAt || '',
        gaps.length ? gaps[0] : 'Maintain current standard',
      ];

      return showAuditControls
        ? [
            zone.code,
            zone.name,
            zone.ownerName || 'Unassigned',
            stageLabels[zone.stage],
            zone.lastAuditScore === undefined ? '' : `${zone.lastAuditScore}%`,
            zone.lastAuditAt || '',
            getAuditDueDate(zone) || 'Now',
            getRedTagCount(zone),
            zone.lastCleanedAt || '',
            gaps.length ? gaps[0] : 'Maintain current standard',
          ]
        : setupRow;
    });
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-area-register.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setActionMessage(`Area register exported with ${filteredZones.length} row(s).`);
  };

  const downloadRolloutQueueCsv = () => {
    if (!plan) return;

    const headers = ['Code', 'Area', 'Owner', 'Stage', 'Priority', 'Due date', 'Next action', 'Open actions'];
    const rows = rolloutQueue.map((item) => {
      const gaps = getZoneActionItems(item.zone, showAuditControls);

      return [
        item.zone.code,
        item.zone.name,
        item.zone.ownerName || 'Unassigned',
        stageLabels[item.zone.stage],
        item.priority,
        item.dueDate,
        item.nextAction,
        gaps.join('; '),
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-rollout-queue.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setActionMessage(`Rollout queue exported with ${rolloutQueue.length} open action(s).`);
  };

  const downloadRedTagRegisterCsv = () => {
    if (!plan) return;

    const headers = ['Code', 'Area', 'Owner', 'Item', 'Status', 'Due date', 'Created', 'Closed', 'Disposition'];
    const rows = redTagRegister.map(({ zone, redTag }) => [
      zone.code,
      zone.name,
      redTag.ownerName || zone.ownerName || 'Unassigned',
      redTag.title,
      redTag.status,
      redTag.dueDate || '',
      redTag.createdAt || '',
      redTag.closedAt || '',
      redTag.disposition,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-red-tag-register.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setActionMessage(`Red-tag register exported with ${redTagRegister.length} item(s).`);
  };

  const downloadAuditWalkCsv = () => {
    if (!plan) return;

    const headers = ['Route', 'Code', 'Area', 'Owner', 'Frequency', 'Last audit', 'Next audit', 'Status', 'Score', 'Red tags'];
    const rows = auditWalkItems.map((item, index) => [
      index + 1,
      item.zone.code,
      item.zone.name,
      item.zone.ownerName || 'Unassigned',
      item.zone.auditFrequency,
      item.zone.lastAuditAt || '',
      item.timing.dueDate,
      item.timing.label,
      item.zone.lastAuditScore === undefined ? '' : `${item.zone.lastAuditScore}%`,
      getRedTagCount(item.zone),
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-audit-walk.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setActionMessage(`Audit walk exported with ${auditWalkItems.length} area(s).`);
  };

  const downloadPlanJson = () => {
    if (!plan) return;

    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-backup.json`;
    link.click();
    URL.revokeObjectURL(url);
    setActionMessage('Floorplan backup exported as JSON.');
  };

  const importPlanJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      const imported = JSON.parse(await file.text()) as FiveSLayoutPlan;

      if (!imported.name || !Array.isArray(imported.zones) || !Array.isArray(imported.objects)) {
        throw new Error('Invalid 5S layout backup.');
      }

      const nextPlan: FiveSLayoutPlan = {
        ...imported,
        id: plan?.id || imported.id || `imported-5s-plan-${Date.now()}`,
        organizationId: plan?.organizationId || imported.organizationId,
        site: imported.site || plan?.site || 'Workspace',
        scale: imported.scale || plan?.scale || '1 square = 1 meter',
        updatedAt: new Date().toISOString(),
      };

      const savedPlan = await fiveSLayoutService.savePlan(nextPlan);
      setPlan(savedPlan);
      setSelectedZoneId(savedPlan.zones[0]?.id || '');
      setSelectedObjectId('');
      setActionMessage(`Imported ${savedPlan.zones.length} zone(s) and ${savedPlan.objects.length} object(s).`);
    } catch {
      setActionMessage('Could not import that 5S layout backup.');
    }
  };

  const downloadFloorPlanSvg = () => {
    if (!plan || !svgRef.current) return;

    const svg = svgRef.current.cloneNode(true) as SVGSVGElement;
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', String(CANVAS_WIDTH));
    svg.setAttribute('height', String(CANVAS_HEIGHT));
    svg.querySelectorAll('[data-testid]').forEach((element) => element.removeAttribute('data-testid'));

    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-floorplan.svg`;
    link.click();
    URL.revokeObjectURL(url);
    setActionMessage('Floorplan exported as SVG.');
  };

  const printZoneLabels = () => {
    if (!plan) return;

    const labels = fiveSLayoutService.buildZoneLabelRows(plan);
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      setActionMessage('Print window could not be opened.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>5S Zone Labels</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
            .label { border: 2px solid #111827; border-radius: 8px; padding: 14px; min-height: 180px; page-break-inside: avoid; }
            .code { font-size: 32px; font-weight: 800; }
            .zone { font-size: 18px; font-weight: 700; margin-top: 4px; }
            .meta { margin-top: 8px; font-size: 13px; line-height: 1.45; }
            .standard { margin-top: 10px; border-top: 1px solid #d1d5db; padding-top: 8px; font-size: 12px; }
            @media print { body { margin: 12mm; } }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(plan.name)}</h1>
          <div class="grid">
            ${labels
              .map(
                (label) => `
                  <div class="label">
                    <div class="code">${escapeHtml(label.code)}</div>
                    <div class="zone">${escapeHtml(label.zone)}</div>
                    <div class="meta"><strong>Owner:</strong> ${escapeHtml(label.owner)}</div>
                    <div class="meta"><strong>Stage:</strong> ${escapeHtml(label.stage)}${
                      showAuditControls ? ` / <strong>Cycle:</strong> ${escapeHtml(label.auditCycle)}` : ''
                    }</div>
                    ${
                      showAuditControls
                        ? `<div class="meta"><strong>Last score:</strong> ${escapeHtml(label.lastAuditScore || '-')}</div>
                    <div class="meta"><strong>Last audit:</strong> ${escapeHtml(label.lastAuditAt || '-')}</div>`
                        : ''
                    }
                    <div class="meta"><strong>Red tags:</strong> ${escapeHtml(label.redTags)} / <strong>Cleaned:</strong> ${escapeHtml(label.lastCleaned || '-')}</div>
                    <div class="meta"><strong>Contents:</strong> ${escapeHtml(label.contents || '-')}</div>
                    <div class="standard"><strong>Standard:</strong> ${escapeHtml(label.standard || '-')}</div>
                    <div class="meta"><strong>Label:</strong> ${escapeHtml(label.labelNote || '-')}</div>
                  </div>
                `,
              )
              .join('')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setActionMessage('Zone label sheet opened for printing.');
  };

  if (loading || !plan) {
    return (
      <Card loading title="5S area setup">
        <div />
      </Card>
    );
  }

  return (
    <Card
      title="5S Area Setup"
      subtitle={`${plan.site} / ${readiness.zones} zones / ${readiness.rate}% launch ready`}
      actions={
        <>
          <Button variant="outline" size="sm" icon={Download} onClick={downloadZoneLabels} type="button">
            CSV
          </Button>
          <Button variant="outline" size="sm" icon={Download} onClick={downloadFloorPlanSvg} type="button">
            Map SVG
          </Button>
          <Button variant="outline" size="sm" icon={Download} onClick={downloadPlanJson} type="button">
            Backup
          </Button>
          <Button variant="outline" size="sm" icon={Upload} onClick={() => importInputRef.current?.click()} type="button">
            Import
          </Button>
          <Button variant="outline" size="sm" icon={Printer} onClick={printZoneLabels} type="button">
            Print
          </Button>
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={resetPlan} type="button">
            Reset
          </Button>
        </>
      }
    >
      <input ref={importInputRef} className="hidden" type="file" accept="application/json,.json" onChange={importPlanJson} />
      <input ref={backgroundInputRef} className="hidden" type="file" accept="image/*" onChange={importBackgroundImage} />
      <div className="space-y-5">
        {actionMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
            {actionMessage}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <label className="block text-sm text-gray-600 dark:text-gray-400">
            Map name
            <input
              className={fieldClass}
              value={plan.name}
              onChange={(event) => updatePlan((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label className="block text-sm text-gray-600 dark:text-gray-400">
            Site
            <input
              className={fieldClass}
              value={plan.site}
              onChange={(event) => updatePlan((current) => ({ ...current, site: event.target.value }))}
            />
          </label>
          <label className="block text-sm text-gray-600 dark:text-gray-400">
            Scale
            <input
              className={fieldClass}
              value={plan.scale}
              onChange={(event) => updatePlan((current) => ({ ...current, scale: event.target.value }))}
            />
          </label>
        </div>

        <div className="grid gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700 md:grid-cols-[auto_auto_minmax(180px,1fr)_auto]">
          <Button variant="outline" icon={Upload} onClick={() => backgroundInputRef.current?.click()} type="button">
            Blueprint
          </Button>
          <Button variant="outline" icon={Trash2} onClick={clearBackgroundImage} disabled={!plan.backgroundImage} type="button">
            Clear
          </Button>
          <label className="block text-sm text-gray-600 dark:text-gray-400">
            Blueprint opacity
            <input
              className="mt-2 w-full accent-blue-500"
              min={0.15}
              max={1}
              step={0.05}
              type="range"
              value={plan.backgroundOpacity ?? 0.55}
              onChange={(event) =>
                updatePlan((current) => ({
                  ...current,
                  backgroundOpacity: Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="flex items-center gap-2 self-end rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
            <input
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
              type="checkbox"
              checked={plan.showGrid ?? true}
              onChange={(event) => updatePlan((current) => ({ ...current, showGrid: event.target.checked }))}
            />
            Grid
          </label>
        </div>

        <div className={`grid gap-4 md:grid-cols-3 ${showAuditControls ? 'xl:grid-cols-7' : 'xl:grid-cols-5'}`}>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="text-xs text-gray-500">Zones</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{readiness.zones}</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="text-xs text-gray-500">Owners</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{readiness.withOwner}</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="text-xs text-gray-500">Contents</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{readiness.withContents}</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="text-xs text-gray-500">Standards</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{readiness.withStandard}</div>
          </div>
          <div className="rounded-lg border border-red-200 p-3 dark:border-red-900/70">
            <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              Red tags
            </div>
            <div className="mt-1 text-2xl font-semibold text-red-700 dark:text-red-300">{readiness.redTags}</div>
          </div>
          {showAuditControls && (
            <>
              <div className="rounded-lg border border-blue-200 p-3 dark:border-blue-900/70">
                <div className="text-xs text-blue-700 dark:text-blue-300">Audits due</div>
                <div className="mt-1 text-2xl font-semibold text-blue-700 dark:text-blue-300">{readiness.auditDue}</div>
              </div>
              <div className="rounded-lg border border-amber-200 p-3 dark:border-amber-900/70">
                <div className="text-xs text-amber-700 dark:text-amber-300">Risk areas</div>
                <div className="mt-1 text-2xl font-semibold text-amber-700 dark:text-amber-300">{readiness.riskAreas}</div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <ListChecks className="h-4 w-4" />
              5S launch checklist
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-xs font-medium text-gray-500">{readiness.rate}% setup ready</span>
              <Button variant="outline" size="sm" icon={AlertTriangle} onClick={createRedTagTasks} type="button">
                Red-tag tasks
              </Button>
              {showAuditControls && (
                <Button variant="outline" size="sm" icon={ClipboardList} onClick={createAuditDueTasks} type="button">
                  Audit tasks
                </Button>
              )}
              <Button variant="outline" size="sm" icon={ListChecks} onClick={createLaunchTasks} type="button">
                Create launch tasks
              </Button>
            </div>
          </div>
          <div className={`grid gap-2 ${showAuditControls ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
            {launchSteps.map((step) => (
              <div
                key={step.title}
                className="rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-gray-800 dark:text-gray-100">{step.title}</span>
                  <CheckCircle2
                    className={`h-4 w-4 flex-none ${step.complete ? 'text-green-600' : 'text-gray-300 dark:text-gray-600'}`}
                  />
                </div>
                <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{step.progress}</div>
                <div className="mt-1 truncate text-xs text-gray-500" title={step.detail}>
                  {step.detail}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700 md:grid-cols-[1fr_1fr_auto]">
          <label className="block text-sm text-gray-600 dark:text-gray-400">
            Area status
            <select className={fieldClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ZoneStatusFilter)}>
              {visibleZoneStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-gray-600 dark:text-gray-400">
            Owner
            <select className={fieldClass} value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
              <option value="all">All owners</option>
              <option value="unassigned">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <Button fullWidth variant="outline" icon={Download} onClick={downloadAreaRegisterCsv} type="button">
              Export register
            </Button>
          </div>
          <div className="text-xs text-gray-500 md:col-span-3">
            Showing {filteredZones.length} of {plan.zones.length} mapped areas. Non-matching areas are dimmed on the floorplan.
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <ClipboardList className="h-4 w-4" />
              5S rollout queue
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-xs text-gray-500">
                {rolloutQueue.length} open action(s) / {readyToAdvanceZones.length} ready
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={downloadRolloutQueueCsv}
                disabled={!rolloutQueue.length}
                type="button"
              >
                Export queue
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={ArrowRight}
                onClick={advanceFilteredReadyStages}
                disabled={!readyToAdvanceZones.length}
                type="button"
              >
                Advance ready
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={ListChecks}
                onClick={createFilteredRolloutTasks}
                disabled={!rolloutQueue.length}
                type="button"
              >
                Create queue tasks
              </Button>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {rolloutQueue.slice(0, 6).map((item) => (
              <div
                key={item.zone.id}
                className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(160px,1fr)_minmax(200px,1.4fr)_auto]"
              >
                <div>
                  <button
                    type="button"
                    className="text-left font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300"
                    onClick={() => {
                      setSelectedZoneId(item.zone.id);
                      setSelectedObjectId('');
                    }}
                  >
                    {item.zone.code} - {item.zone.name}
                  </button>
                  <div className="mt-1 text-xs text-gray-500">{item.zone.ownerName || 'Unassigned'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-800 dark:text-gray-100">{item.nextAction}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>{stageLabels[item.zone.stage]}</span>
                    <span>Due {item.dueDate}</span>
                    <span className={item.priority === 'high' ? 'font-semibold text-red-600' : 'font-semibold text-amber-600'}>
                      {item.priority}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={MousePointer2}
                    onClick={() => {
                      setSelectedZoneId(item.zone.id);
                      setSelectedObjectId('');
                    }}
                    type="button"
                  >
                    Select
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ClipboardList}
                    onClick={() => createRolloutQueueTask(item.zone)}
                    type="button"
                  >
                    Task
                  </Button>
                </div>
              </div>
            ))}
            {!rolloutQueue.length && (
              <div className="px-4 py-6 text-sm text-gray-500">Current filters have no open rollout actions.</div>
            )}
          </div>
          {rolloutQueue.length > 6 && (
            <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-gray-700">
              Showing first 6 actions. Narrow the filters or export the register to review the full queue.
            </div>
          )}
        </div>

        {showAuditControls && (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <CalendarCheck className="h-4 w-4" />
                5S audit walk
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="text-xs text-gray-500">
                  {auditWalkSummary.overdue} overdue / {auditWalkSummary.dueToday} due / {auditWalkSummary.upcoming} upcoming
                </span>
                <Button variant="outline" size="sm" icon={Download} onClick={downloadAuditWalkCsv} type="button">
                  Export walk
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={ClipboardList}
                  onClick={createAuditDueTasks}
                  disabled={!zonesAuditDue.length}
                  type="button"
                >
                  Audit tasks
                </Button>
              </div>
            </div>
            <div className="grid gap-3 border-b border-gray-200 p-4 dark:border-gray-700 md:grid-cols-4">
              <div className="rounded-lg border border-red-200 p-3 text-sm dark:border-red-900/70">
                <div className="text-xs text-red-600 dark:text-red-300">Overdue</div>
                <div className="mt-1 text-xl font-semibold text-red-700 dark:text-red-300">{auditWalkSummary.overdue}</div>
              </div>
              <div className="rounded-lg border border-blue-200 p-3 text-sm dark:border-blue-900/70">
                <div className="text-xs text-blue-600 dark:text-blue-300">Due today</div>
                <div className="mt-1 text-xl font-semibold text-blue-700 dark:text-blue-300">{auditWalkSummary.dueToday}</div>
              </div>
              <div className="rounded-lg border border-amber-200 p-3 text-sm dark:border-amber-900/70">
                <div className="text-xs text-amber-600 dark:text-amber-300">Next 7 days</div>
                <div className="mt-1 text-xl font-semibold text-amber-700 dark:text-amber-300">{auditWalkSummary.upcoming}</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                <div className="text-xs text-gray-500">Scheduled</div>
                <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{auditWalkSummary.scheduled}</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {(activeAuditWalkItems.length ? activeAuditWalkItems : auditWalkItems.slice(0, 5)).map((item, index) => (
                <div
                  key={item.zone.id}
                  className="grid gap-3 px-4 py-3 md:grid-cols-[64px_minmax(160px,1fr)_minmax(180px,1fr)_auto]"
                >
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">#{index + 1}</div>
                  <div>
                    <button
                      type="button"
                      className="text-left font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300"
                      onClick={() => {
                        setSelectedZoneId(item.zone.id);
                        setSelectedObjectId('');
                      }}
                    >
                      {item.zone.code} - {item.zone.name}
                    </button>
                    <div className="mt-1 text-xs text-gray-500">{item.zone.ownerName || 'Unassigned'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-800 dark:text-gray-100">
                      {item.timing.dueDate} / {item.zone.auditFrequency}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2 py-1 font-medium ${
                          item.timing.status === 'overdue'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                            : item.timing.status === 'due_today'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                              : item.timing.status === 'upcoming'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {item.timing.label}
                      </span>
                      <span className="text-gray-500">Last {item.zone.lastAuditAt || '-'}</span>
                      <span className="text-gray-500">
                        Score {item.zone.lastAuditScore === undefined ? '-' : `${item.zone.lastAuditScore}%`}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" icon={UserCheck} onClick={() => useZoneForAudit(item.zone)} type="button">
                      Audit
                    </Button>
                    <Button variant="outline" size="sm" icon={CheckCircle2} onClick={() => markZoneWalkedToday(item.zone)} type="button">
                      Walked
                    </Button>
                  </div>
                </div>
              ))}
              {!auditWalkItems.length && <div className="px-4 py-6 text-sm text-gray-500">No mapped areas for audit walk.</div>}
            </div>
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)_320px]">
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <MapIcon className="h-4 w-4" />
              Floorplan
            </div>
            <Button fullWidth size="sm" icon={Plus} onClick={addZone} type="button">
              Blank area
            </Button>
            <div className="mt-4">
              <div className="mb-2 text-xs font-semibold uppercase text-gray-500">Area presets</div>
              <div className="grid grid-cols-2 gap-2">
                {zoneTemplates.map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => addZoneFromTemplate(template)}
                    className="flex min-h-[54px] flex-col items-start justify-between rounded-lg border border-gray-200 px-2.5 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <span className="h-2.5 w-8 rounded-full" style={{ backgroundColor: template.color }} />
                    <span className="font-medium">{template.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 space-y-3 border-t border-gray-200 pt-3 dark:border-gray-700">
              {shapeToolGroups.map((group) => (
                <div key={group}>
                  <div className="mb-2 text-xs font-semibold uppercase text-gray-500">{group}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {shapeTools
                      .filter((tool) => tool.group === group)
                      .map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <button
                            key={tool.type}
                            type="button"
                            onClick={() => addObject(tool.type)}
                            className="flex min-h-[42px] items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                          >
                            <Icon className="h-4 w-4 flex-none" />
                            <span className="leading-tight">{tool.label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700">
              {stageCounts.map((item) => (
                <div key={item.stage} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{stageLabels[item.stage]}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{item.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700">
              <div className="mb-2 text-xs font-semibold uppercase text-gray-500">Color legend</div>
              <div className="space-y-1.5">
                {zoneColorPresets.map((preset) => (
                  <div key={preset.value} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.value }} />
                      {preset.label}
                    </span>
                    <span className="font-mono text-[10px] text-gray-400">{preset.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              role="img"
              aria-label="5S floor plan"
              className="h-[420px] w-full cursor-crosshair touch-none md:h-[520px]"
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={() => setDrag(null)}
              onPointerLeave={() => setDrag(null)}
            >
              <defs>
                <pattern id="five-s-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#d1d5db" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="white" />
              {plan.backgroundImage && (
                <image
                  href={plan.backgroundImage}
                  x="0"
                  y="0"
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  opacity={plan.backgroundOpacity ?? 0.55}
                  preserveAspectRatio="xMidYMid meet"
                />
              )}
              {(plan.showGrid ?? true) && <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#five-s-grid)" />}

              {plan.zones.map((zone) => {
                const selected = zone.id === selectedZoneId;
                const focused = filteredZoneIds.has(zone.id);
                return (
                  <g key={zone.id} opacity={focused ? 1 : 0.22}>
                    <rect
                      x={zone.x}
                      y={zone.y}
                      width={zone.width}
                      height={zone.height}
                      rx="8"
                      fill={`${zone.color}24`}
                      stroke={selected ? '#111827' : zone.color}
                      strokeWidth={selected ? 3 : 2}
                      strokeDasharray={selected ? '0' : '8 6'}
                      className="cursor-move"
                      onPointerDown={(event) => handleZonePointerDown(event, zone)}
                    />
                    <circle cx={zone.x + 24} cy={zone.y + 24} r="18" fill={zone.color} />
                    <text
                      x={zone.x + 24}
                      y={zone.y + 29}
                      textAnchor="middle"
                      className="fill-white text-[14px] font-semibold"
                    >
                      {zone.code.replace(/^\D+/, '')}
                    </text>
                    <text x={zone.x + 52} y={zone.y + 28} className="fill-gray-900 text-[15px] font-semibold">
                      {zone.name}
                    </text>
                    <text x={zone.x + 52} y={zone.y + 50} className="fill-gray-600 text-[12px]">
                      {zone.ownerName || 'No owner'}
                    </text>
                    <text x={zone.x + 18} y={zone.y + zone.height - 18} className="fill-gray-700 text-[12px]">
                      {stageLabels[zone.stage]}
                      {showAuditControls && zone.lastAuditScore !== undefined ? ` / ${zone.lastAuditScore}%` : ''}
                    </text>
                    {getRedTagCount(zone) > 0 && (
                      <g>
                        <rect
                          x={zone.x + zone.width - 64}
                          y={zone.y + 12}
                          width="52"
                          height="24"
                          rx="12"
                          fill="#dc2626"
                        />
                        <text
                          x={zone.x + zone.width - 38}
                          y={zone.y + 29}
                          textAnchor="middle"
                          className="fill-white text-[12px] font-semibold"
                        >
                          RT {getRedTagCount(zone)}
                        </text>
                      </g>
                    )}
                    {showAuditControls && isAuditDue(zone) && (
                      <g>
                        <rect
                          x={zone.x + zone.width - 68}
                          y={zone.y + 42}
                          width="56"
                          height="22"
                          rx="11"
                          fill="#2563eb"
                        />
                        <text
                          x={zone.x + zone.width - 40}
                          y={zone.y + 57}
                          textAnchor="middle"
                          className="fill-white text-[11px] font-semibold"
                        >
                          AUDIT
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {plan.objects.map((object) =>
                renderFloorPlanObject(object, object.id === selectedObjectId, (event) =>
                  handleObjectPointerDown(event, object),
                ),
              )}
            </svg>
          </div>

          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            {selectedZone ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                      <MousePointer2 className="h-4 w-4" />
                      Selected zone
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{selectedZone.code}</div>
                  </div>
                  <button
                    type="button"
                    onClick={deleteSelectedZone}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                    aria-label="Delete selected zone"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <label className="block text-sm text-gray-600 dark:text-gray-400">
                  Zone name
                  <input
                    className={fieldClass}
                    value={selectedZone.name}
                    onChange={(event) => updateZone(selectedZone.id, { name: event.target.value })}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    Code
                    <input
                      className={fieldClass}
                      value={selectedZone.code}
                      onChange={(event) => updateZone(selectedZone.id, { code: event.target.value.toUpperCase() })}
                    />
                  </label>
                  <div className="block text-sm text-gray-600 dark:text-gray-400">
                    Color
                    <div className="mt-1 grid grid-cols-4 gap-2">
                      {zoneColorPresets.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => updateZone(selectedZone.id, { color: preset.value })}
                          className={`h-9 rounded-lg border text-[10px] font-medium ${
                            selectedZone.color === preset.value
                              ? 'border-gray-900 text-gray-900 ring-2 ring-gray-900/20 dark:border-white dark:text-white'
                              : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'
                          }`}
                          style={{ backgroundColor: `${preset.value}22` }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    X
                    <input
                      className={fieldClass}
                      min={0}
                      max={CANVAS_WIDTH - selectedZone.width}
                      type="number"
                      value={Math.round(selectedZone.x)}
                      onChange={(event) =>
                        updateZone(selectedZone.id, {
                          x: clamp(Number(event.target.value), 0, CANVAS_WIDTH - selectedZone.width),
                        })
                      }
                    />
                  </label>
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    Y
                    <input
                      className={fieldClass}
                      min={0}
                      max={CANVAS_HEIGHT - selectedZone.height}
                      type="number"
                      value={Math.round(selectedZone.y)}
                      onChange={(event) =>
                        updateZone(selectedZone.id, {
                          y: clamp(Number(event.target.value), 0, CANVAS_HEIGHT - selectedZone.height),
                        })
                      }
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    Width
                    <input
                      className={fieldClass}
                      min={80}
                      max={CANVAS_WIDTH}
                      type="number"
                      value={Math.round(selectedZone.width)}
                      onChange={(event) =>
                        updateZone(selectedZone.id, {
                          width: clamp(Number(event.target.value), 80, CANVAS_WIDTH - selectedZone.x),
                        })
                      }
                    />
                  </label>
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    Height
                    <input
                      className={fieldClass}
                      min={72}
                      max={CANVAS_HEIGHT}
                      type="number"
                      value={Math.round(selectedZone.height)}
                      onChange={(event) =>
                        updateZone(selectedZone.id, {
                          height: clamp(Number(event.target.value), 72, CANVAS_HEIGHT - selectedZone.y),
                        })
                      }
                    />
                  </label>
                </div>
                <label className="block text-sm text-gray-600 dark:text-gray-400">
                  Responsible owner
                  <select className={fieldClass} value={selectedZone.ownerId || ''} onChange={(event) => handleOwnerChange(event.target.value)}>
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} / {user.position}
                      </option>
                    ))}
                  </select>
                </label>
                <div className={`grid gap-3 ${showAuditControls ? 'sm:grid-cols-2' : ''}`}>
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    5S stage
                    <select
                      className={fieldClass}
                      value={selectedZone.stage}
                      onChange={(event) => updateZone(selectedZone.id, { stage: event.target.value as FiveSStage })}
                    >
                      {stageOrder.map((stage) => (
                        <option key={stage} value={stage}>
                          {stageLabels[stage]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {showAuditControls && (
                    <label className="block text-sm text-gray-600 dark:text-gray-400">
                      Audit cycle
                      <select
                        className={fieldClass}
                        value={selectedZone.auditFrequency}
                        onChange={(event) =>
                          updateZone(selectedZone.id, {
                            auditFrequency: event.target.value as FiveSZone['auditFrequency'],
                          })
                        }
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </label>
                  )}
                </div>
                {selectedStageGate && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-gray-900 dark:text-white">Stage gate</div>
                      <div className="text-xs text-gray-500">
                        {stageLabels[selectedZone.stage]}
                        {selectedStageGate.nextStage ? ` -> ${stageLabels[selectedStageGate.nextStage]}` : ' active'}
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {selectedStageGate.items.map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-3">
                          <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                          <CheckCircle2
                            className={`h-4 w-4 flex-none ${item.complete ? 'text-green-600' : 'text-gray-300 dark:text-gray-600'}`}
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      fullWidth
                      className="mt-3"
                      variant="outline"
                      size="sm"
                      icon={ArrowRight}
                      onClick={advanceSelectedZoneStage}
                      disabled={!selectedStageGate.nextStage || !selectedStageGate.complete}
                      type="button"
                    >
                      {selectedStageGate.nextStage ? `Advance to ${stageLabels[selectedStageGate.nextStage]}` : 'Sustain active'}
                    </Button>
                  </div>
                )}
                {showAuditControls && (
                  <>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
                      <div className="text-gray-500 dark:text-gray-400">Last audit score</div>
                      <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                        {selectedZone.lastAuditScore === undefined ? '-' : `${selectedZone.lastAuditScore}%`}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Next audit: {getAuditDueDate(selectedZone) || 'Due now'}
                      </div>
                    </div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400">
                      Last audit date
                      <input
                        className={fieldClass}
                        type="date"
                        value={selectedZone.lastAuditAt || ''}
                        onChange={(event) => updateZone(selectedZone.id, { lastAuditAt: event.target.value })}
                      />
                    </label>
                  </>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    Open red tags
                    <input
                      className={fieldClass}
                      type="number"
                      value={getRedTagCount(selectedZone)}
                      readOnly
                    />
                  </label>
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    Last cleaned
                    <input
                      className={fieldClass}
                      type="date"
                      value={selectedZone.lastCleanedAt || ''}
                      onChange={(event) => updateZone(selectedZone.id, { lastCleanedAt: event.target.value })}
                    />
                  </label>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Red-tag register
                    </div>
                    <Button variant="outline" size="sm" icon={Plus} onClick={addSelectedZoneRedTag} type="button">
                      Add tag
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(selectedZone.redTags || []).map((redTag) => (
                      <div key={redTag.id} className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="text-xs text-gray-500">
                            {redTag.ownerName || selectedZone.ownerName || 'Unassigned'} / Created {redTag.createdAt || '-'}
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteSelectedZoneRedTag(redTag.id)}
                            className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                            aria-label="Delete red-tag item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400">
                          Item
                          <input
                            className={fieldClass}
                            value={redTag.title}
                            onChange={(event) => updateSelectedZoneRedTag(redTag.id, { title: event.target.value })}
                          />
                        </label>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <label className="block text-xs text-gray-600 dark:text-gray-400">
                            Status
                            <select
                              className={fieldClass}
                              value={redTag.status}
                              onChange={(event) =>
                                updateSelectedZoneRedTag(redTag.id, { status: event.target.value as FiveSRedTag['status'] })
                              }
                            >
                              {redTagStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-xs text-gray-600 dark:text-gray-400">
                            Due date
                            <input
                              className={fieldClass}
                              type="date"
                              value={redTag.dueDate || ''}
                              onChange={(event) => updateSelectedZoneRedTag(redTag.id, { dueDate: event.target.value })}
                            />
                          </label>
                        </div>
                        <label className="mt-2 block text-xs text-gray-600 dark:text-gray-400">
                          Disposition
                          <input
                            className={fieldClass}
                            value={redTag.disposition}
                            onChange={(event) => updateSelectedZoneRedTag(redTag.id, { disposition: event.target.value })}
                          />
                        </label>
                        {redTag.closedAt && <div className="mt-2 text-xs text-gray-500">Closed {redTag.closedAt}</div>}
                      </div>
                    ))}
                    {!selectedZone.redTags?.length && (
                      <div className="rounded-md border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500 dark:border-gray-700">
                        No detailed red-tag items yet.
                      </div>
                    )}
                  </div>
                </div>
                <label className="block text-sm text-gray-600 dark:text-gray-400">
                  What is stored here
                  <textarea
                    className={`${fieldClass} min-h-[72px]`}
                    value={selectedZone.contents}
                    onChange={(event) => updateZone(selectedZone.id, { contents: event.target.value })}
                  />
                </label>
                <label className="block text-sm text-gray-600 dark:text-gray-400">
                  5S standard
                  <textarea
                    className={`${fieldClass} min-h-[72px]`}
                    value={selectedZone.standard}
                    onChange={(event) => updateZone(selectedZone.id, { standard: event.target.value })}
                  />
                </label>
                <label className="block text-sm text-gray-600 dark:text-gray-400">
                  Label note
                  <input
                    className={fieldClass}
                    value={selectedZone.labelText}
                    onChange={(event) => updateZone(selectedZone.id, { labelText: event.target.value })}
                  />
                </label>
                <Button fullWidth variant="outline" icon={ListChecks} onClick={createSelectedZoneTask} type="button">
                  Create setup task
                </Button>
                <Button
                  fullWidth
                  variant="outline"
                  icon={CheckCircle2}
                  onClick={markSelectedZoneCleanedToday}
                  type="button"
                >
                  Mark cleaned today
                </Button>
                <Button fullWidth variant="outline" icon={Copy} onClick={duplicateSelectedZone} type="button">
                  Duplicate zone
                </Button>
                {showAuditControls && (
                  <Button fullWidth variant="outline" icon={UserCheck} onClick={useSelectedZoneForAudit} type="button">
                    Use as audit location
                  </Button>
                )}
              </div>
            ) : selectedObject ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                      <Move className="h-4 w-4" />
                      Selected object
                    </div>
                    <div className="mt-1 text-xs capitalize text-gray-500">{selectedObject.type}</div>
                  </div>
                  <button
                    type="button"
                    onClick={deleteSelectedObject}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                    aria-label="Delete selected object"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <label className="block text-sm text-gray-600 dark:text-gray-400">
                  Label
                  <input
                    className={fieldClass}
                    value={selectedObject.label}
                    onChange={(event) => updateObject(selectedObject.id, { label: event.target.value })}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    X
                    <input
                      className={fieldClass}
                      min={0}
                      max={CANVAS_WIDTH - selectedObject.width}
                      type="number"
                      value={Math.round(selectedObject.x)}
                      onChange={(event) =>
                        updateObject(selectedObject.id, {
                          x: clamp(Number(event.target.value), 0, CANVAS_WIDTH - selectedObject.width),
                        })
                      }
                    />
                  </label>
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    Y
                    <input
                      className={fieldClass}
                      min={0}
                      max={CANVAS_HEIGHT - selectedObject.height}
                      type="number"
                      value={Math.round(selectedObject.y)}
                      onChange={(event) =>
                        updateObject(selectedObject.id, {
                          y: clamp(Number(event.target.value), 0, CANVAS_HEIGHT - selectedObject.height),
                        })
                      }
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    Width
                    <input
                      className={fieldClass}
                      min={12}
                      max={CANVAS_WIDTH}
                      type="number"
                      value={Math.round(selectedObject.width)}
                      onChange={(event) =>
                        updateObject(selectedObject.id, {
                          width: clamp(Number(event.target.value), 12, CANVAS_WIDTH - selectedObject.x),
                        })
                      }
                    />
                  </label>
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    Height
                    <input
                      className={fieldClass}
                      min={8}
                      max={CANVAS_HEIGHT}
                      type="number"
                      value={Math.round(selectedObject.height)}
                      onChange={(event) =>
                        updateObject(selectedObject.id, {
                          height: clamp(Number(event.target.value), 8, CANVAS_HEIGHT - selectedObject.y),
                        })
                      }
                    />
                  </label>
                </div>
                <Button
                  fullWidth
                  variant="outline"
                  icon={RotateCw}
                  onClick={() =>
                    updateObject(selectedObject.id, {
                      rotation: ((selectedObject.rotation || 0) + 45) % 360,
                    })
                  }
                  type="button"
                >
                  Rotate 45
                </Button>
                <Button fullWidth variant="outline" icon={Copy} onClick={duplicateSelectedObject} type="button">
                  Duplicate object
                </Button>
              </div>
            ) : (
              <div className="flex min-h-[240px] flex-col items-center justify-center text-center text-sm text-gray-500">
                <MousePointer2 className="mb-3 h-8 w-8 text-gray-400" />
                Select or add a zone.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {stageCounts.map((item) => (
            <div key={item.stage} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{stageLabels[item.stage]}</span>
                {item.count > 0 && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
              <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{item.count}</div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <UserCheck className="h-4 w-4" />
              Owner coverage
            </div>
            <span className="text-xs text-gray-500">{ownerCoverage.length} owner groups</span>
          </div>
          <div className="grid gap-0 divide-y divide-gray-200 dark:divide-gray-700 md:grid-cols-2 md:divide-x md:divide-y-0">
            {ownerCoverage.map((owner) => (
              <button
                key={owner.id}
                type="button"
                className={`grid items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  showAuditControls ? 'grid-cols-[1fr_auto_auto_auto]' : 'grid-cols-[1fr_auto_auto]'
                }`}
                onClick={() => setOwnerFilter(owner.id)}
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{owner.name}</div>
                  {showAuditControls ? (
                    <div className="text-xs text-gray-500">
                      Avg score {owner.scoreCount ? `${Math.round(owner.scoreTotal / owner.scoreCount)}%` : '-'}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">Responsible area ownership</div>
                  )}
                </div>
                <div className="text-center text-xs text-gray-500">
                  <div className="text-base font-semibold text-gray-900 dark:text-white">{owner.zones}</div>
                  zones
                </div>
                <div className="text-center text-xs text-red-500">
                  <div className="text-base font-semibold">{owner.redTags}</div>
                  tags
                </div>
                {showAuditControls && (
                  <div className="text-center text-xs text-blue-500">
                    <div className="text-base font-semibold">{owner.auditDue}</div>
                    due
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Red-tag register
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-xs text-gray-500">
                {openRedTagItems.length} open / {redTagRegister.length} total
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={downloadRedTagRegisterCsv}
                disabled={!redTagRegister.length}
                type="button"
              >
                Export red tags
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Disposition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {redTagRegister.slice(0, 8).map(({ zone, redTag }) => (
                  <tr key={redTag.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-left font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300"
                        onClick={() => {
                          setSelectedZoneId(zone.id);
                          setSelectedObjectId('');
                        }}
                      >
                        {zone.code} - {zone.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{redTag.title}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {redTag.ownerName || zone.ownerName || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          isOpenRedTag(redTag)
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                            : 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300'
                        }`}
                      >
                        {redTag.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{redTag.dueDate || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{redTag.disposition || '-'}</td>
                  </tr>
                ))}
                {!redTagRegister.length && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>
                      No detailed red-tag items yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {redTagRegister.length > 8 && (
            <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-gray-700">
              Showing first 8 red-tag items. Export the register to review the full list.
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <ListChecks className="h-4 w-4" />
              5S area register
            </div>
            <span className="text-xs text-gray-500">
              {filteredZones.length} of {plan.zones.length} mapped areas
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Stage</th>
                  {showAuditControls && <th className="px-4 py-3">Score</th>}
                  {showAuditControls && <th className="px-4 py-3">Audit due</th>}
                  <th className="px-4 py-3">Red tags</th>
                  <th className="px-4 py-3">Cleaned</th>
                  <th className="px-4 py-3">Next action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredZones.map((zone) => {
                  const gaps = getZoneActionItems(zone, showAuditControls);

                  return (
                    <tr key={zone.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-left font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300"
                          onClick={() => {
                            setSelectedZoneId(zone.id);
                            setSelectedObjectId('');
                          }}
                        >
                          {zone.code} - {zone.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{zone.ownerName || 'Unassigned'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{stageLabels[zone.stage]}</td>
                      {showAuditControls && (
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {zone.lastAuditScore === undefined ? '-' : `${zone.lastAuditScore}%`}
                        </td>
                      )}
                      {showAuditControls && (
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {getAuditDueDate(zone) || 'Now'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{getRedTagCount(zone)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{zone.lastCleanedAt || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {gaps.length ? gaps[0] : 'Maintain current standard'}
                      </td>
                    </tr>
                  );
                })}
                {!filteredZones.length && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-gray-500" colSpan={showAuditControls ? 8 : 6}>
                      No areas match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
};

const renderFloorPlanObject = (
  object: FloorPlanObject,
  selected: boolean,
  onPointerDown: (event: React.PointerEvent<SVGGElement>) => void,
) => {
  const centerX = object.x + object.width / 2;
  const centerY = object.y + object.height / 2;
  const transform = `rotate(${object.rotation || 0} ${centerX} ${centerY})`;
  const objectLabel = object.label.length > 18 ? `${object.label.slice(0, 16)}...` : object.label;
  let shape: React.ReactNode;

  if (object.type === 'wall') {
    shape = (
      <rect
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        fill="#111827"
        transform={transform}
      />
    );
  } else if (object.type === 'door') {
    shape = (
      <g transform={transform} stroke="#111827" strokeWidth="3" fill="none">
        <line x1={object.x} y1={object.y + object.height} x2={object.x + object.width} y2={object.y + object.height} />
        <path d={`M ${object.x} ${object.y + object.height} A ${object.width} ${object.width} 0 0 1 ${object.x + object.width} ${object.y}`} />
      </g>
    );
  } else if (object.type === 'desk') {
    shape = (
      <g transform={transform}>
        <rect x={object.x} y={object.y} width={object.width} height={object.height} rx="5" fill="#f8fafc" stroke="#111827" strokeWidth="2" />
        <rect x={object.x + 12} y={object.y + 10} width={object.width - 24} height="10" fill="#dbeafe" stroke="#111827" strokeWidth="1" />
        <line x1={object.x + 18} y1={object.y + object.height - 10} x2={object.x + object.width - 18} y2={object.y + object.height - 10} stroke="#111827" strokeWidth="2" />
      </g>
    );
  } else if (object.type === 'chair') {
    shape = (
      <g transform={transform}>
        <rect x={object.x + 7} y={object.y + 9} width={object.width - 14} height={object.height - 12} rx="6" fill="#eff6ff" stroke="#111827" strokeWidth="2" />
        <line x1={object.x + 7} y1={object.y + 8} x2={object.x + object.width - 7} y2={object.y + 8} stroke="#111827" strokeWidth="3" />
        <line x1={object.x + 10} y1={object.y + object.height - 2} x2={object.x + 10} y2={object.y + object.height - 8} stroke="#111827" strokeWidth="2" />
        <line x1={object.x + object.width - 10} y1={object.y + object.height - 2} x2={object.x + object.width - 10} y2={object.y + object.height - 8} stroke="#111827" strokeWidth="2" />
      </g>
    );
  } else if (object.type === 'table') {
    shape = (
      <g transform={transform}>
        <ellipse cx={centerX} cy={centerY} rx={object.width / 2} ry={object.height / 2} fill="#f1f5f9" stroke="#111827" strokeWidth="2" />
        <circle cx={object.x + 10} cy={centerY} r="5" fill="#111827" />
        <circle cx={object.x + object.width - 10} cy={centerY} r="5" fill="#111827" />
        <circle cx={centerX} cy={object.y + 8} r="5" fill="#111827" />
        <circle cx={centerX} cy={object.y + object.height - 8} r="5" fill="#111827" />
      </g>
    );
  } else if (object.type === 'shelf') {
    shape = (
      <g transform={transform}>
        <rect x={object.x} y={object.y} width={object.width} height={object.height} fill="#fff7ed" stroke="#111827" strokeWidth="2" />
        {[1, 2, 3].map((line) => (
          <line
            key={line}
            x1={object.x}
            y1={object.y + (object.height / 4) * line}
            x2={object.x + object.width}
            y2={object.y + (object.height / 4) * line}
            stroke="#111827"
            strokeWidth="1"
          />
        ))}
      </g>
    );
  } else if (object.type === 'cabinet') {
    shape = (
      <g transform={transform}>
        <rect x={object.x} y={object.y} width={object.width} height={object.height} rx="4" fill="#f8fafc" stroke="#111827" strokeWidth="2" />
        <line x1={centerX} y1={object.y} x2={centerX} y2={object.y + object.height} stroke="#111827" strokeWidth="1.5" />
        <circle cx={centerX - 7} cy={centerY} r="2" fill="#111827" />
        <circle cx={centerX + 7} cy={centerY} r="2" fill="#111827" />
      </g>
    );
  } else if (object.type === 'printer') {
    shape = (
      <g transform={transform}>
        <rect x={object.x + 6} y={object.y} width={object.width - 12} height="16" rx="3" fill="#e5e7eb" stroke="#111827" strokeWidth="2" />
        <rect x={object.x} y={object.y + 14} width={object.width} height={object.height - 18} rx="5" fill="#f8fafc" stroke="#111827" strokeWidth="2" />
        <rect x={object.x + 10} y={object.y + object.height - 12} width={object.width - 20} height="8" fill="#dbeafe" stroke="#111827" strokeWidth="1" />
        <circle cx={object.x + object.width - 10} cy={object.y + 24} r="2.5" fill="#22c55e" />
      </g>
    );
  } else if (object.type === 'equipment') {
    shape = (
      <g transform={transform}>
        <rect x={object.x} y={object.y} width={object.width} height={object.height} rx="4" fill="#e0f2fe" stroke="#111827" strokeWidth="2" />
        <line x1={object.x + 8} y1={object.y + 8} x2={object.x + object.width - 8} y2={object.y + object.height - 8} stroke="#111827" strokeWidth="2" />
        <line x1={object.x + object.width - 8} y1={object.y + 8} x2={object.x + 8} y2={object.y + object.height - 8} stroke="#111827" strokeWidth="2" />
      </g>
    );
  } else if (object.type === 'whiteboard') {
    shape = (
      <g transform={transform}>
        <rect x={object.x} y={object.y} width={object.width} height={object.height} rx="3" fill="#ffffff" stroke="#111827" strokeWidth="2" />
        <line x1={object.x + 10} y1={object.y + object.height - 8} x2={object.x + object.width - 10} y2={object.y + object.height - 8} stroke="#60a5fa" strokeWidth="2" />
        <line x1={object.x + 12} y1={object.y + 14} x2={object.x + object.width - 18} y2={object.y + 14} stroke="#d1d5db" strokeWidth="1" />
      </g>
    );
  } else if (object.type === 'sofa') {
    shape = (
      <g transform={transform}>
        <rect x={object.x + 8} y={object.y + 8} width={object.width - 16} height={object.height - 8} rx="8" fill="#ede9fe" stroke="#111827" strokeWidth="2" />
        <rect x={object.x} y={object.y + 18} width="16" height={object.height - 18} rx="6" fill="#ede9fe" stroke="#111827" strokeWidth="2" />
        <rect x={object.x + object.width - 16} y={object.y + 18} width="16" height={object.height - 18} rx="6" fill="#ede9fe" stroke="#111827" strokeWidth="2" />
        <line x1={centerX} y1={object.y + 12} x2={centerX} y2={object.y + object.height - 2} stroke="#111827" strokeWidth="1" />
      </g>
    );
  } else if (object.type === 'plant') {
    shape = (
      <g transform={transform}>
        <rect x={object.x + 10} y={object.y + object.height - 16} width={object.width - 20} height="14" rx="3" fill="#92400e" stroke="#111827" strokeWidth="1.5" />
        <ellipse cx={centerX} cy={object.y + 16} rx={object.width / 3} ry="14" fill="#86efac" stroke="#166534" strokeWidth="1.5" />
        <ellipse cx={object.x + 13} cy={object.y + 23} rx="11" ry="16" fill="#bbf7d0" stroke="#166534" strokeWidth="1.2" />
        <ellipse cx={object.x + object.width - 13} cy={object.y + 23} rx="11" ry="16" fill="#bbf7d0" stroke="#166534" strokeWidth="1.2" />
      </g>
    );
  } else if (object.type === 'waste_bin') {
    shape = (
      <g transform={transform}>
        <path d={`M ${object.x + 6} ${object.y + 10} H ${object.x + object.width - 6} L ${object.x + object.width - 10} ${object.y + object.height - 2} H ${object.x + 10} Z`} fill="#fee2e2" stroke="#111827" strokeWidth="2" />
        <line x1={object.x + 9} y1={object.y + 5} x2={object.x + object.width - 9} y2={object.y + 5} stroke="#111827" strokeWidth="3" />
        <line x1={centerX} y1={object.y + 12} x2={centerX} y2={object.y + object.height - 8} stroke="#111827" strokeWidth="1" />
      </g>
    );
  } else {
    shape = (
      <g transform={transform}>
        <rect x={object.x} y={object.y} width={object.width} height={object.height} rx="8" fill="#ecfeff" stroke="#111827" strokeWidth="2" />
        <ellipse cx={centerX} cy={centerY} rx={object.width / 3} ry={object.height / 3} fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
        <circle cx={centerX} cy={centerY} r="4" fill="#60a5fa" />
      </g>
    );
  }

  return (
    <g
      key={object.id}
      className="cursor-move"
      data-testid={`five-s-object-${object.id}`}
      onPointerDown={onPointerDown}
    >
      {shape}
      {object.type !== 'wall' && (
        <g pointerEvents="none">
          <rect
            x={Math.max(0, object.x + object.width / 2 - 42)}
            y={Math.min(CANVAS_HEIGHT - 22, object.y + object.height + 5)}
            width="84"
            height="18"
            rx="9"
            fill="white"
            stroke="#d1d5db"
          />
          <text
            x={object.x + object.width / 2}
            y={Math.min(CANVAS_HEIGHT - 9, object.y + object.height + 18)}
            textAnchor="middle"
            className="fill-gray-700 text-[10px] font-medium"
          >
            {objectLabel}
          </text>
        </g>
      )}
      {selected && (
        <rect
          x={object.x - 4}
          y={object.y - 4}
          width={object.width + 8}
          height={object.height + 8}
          fill="none"
          stroke="#2563eb"
          strokeDasharray="6 5"
          strokeWidth="2"
          pointerEvents="none"
        />
      )}
    </g>
  );
};

export default FiveSFloorPlanSetup;
