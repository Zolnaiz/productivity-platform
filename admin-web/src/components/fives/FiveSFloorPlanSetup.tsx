import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AUDIT_PASSING_SCORE,
  AUDIT_URGENT_SCORE,
  auditBandFor,
  auditBands,
} from '../charts/palette';
import {
  AlertTriangle,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndVertical,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  Minus,
  Plus as PlusIcon,
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
  Redo2,
  RotateCcw,
  RotateCw,
  Square,
  Table,
  Trash2,
  Undo2,
  Upload,
  UserCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../common/Button';
import Card from '../common/Card';
import PhotoEvidence from '../common/PhotoEvidence';
import ZoneHistory from './ZoneHistory';
import AuditTiers from './AuditTiers';
import HoldingArea from './HoldingArea';
import { holdDatesFor } from './holdingRules';
import { formatLocalDate, getAuditDueDate, isAuditDue } from './auditSchedule';
import {
  ZoneStatusFilter,
  buildZoneTaskPayload,
  getDateFromToday,
  getZoneTaskDueDate,
  getZoneTaskPriority,
  isOpenRedTag,
  getAuditWalkStatus,
  getRedTagCount,
  getStageGate,
  getZoneActionItems,
  matchesZoneStatus,
  nextPinSpot,
  pinPosition,
  redTagStatusLabel,
  redTagStatusOptions,
  stageLabels,
  stageOrder,
  withSyncedRedTags,
  zoneStatusOptions,
  PIN_RADIUS,
} from './floorPlanRules';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GRID_SIZE,
  ResizeCorner,
  capturePointer,
  clamp,
  resizeBox,
  resizeCorners,
  snapToGrid,
} from './floorPlanGeometry';
import { AuditWalkStatus, escapeCsvCell, escapeHtml } from './floorPlanFormats';
import {
  FULL_VIEW,
  Viewport,
  distanceInView,
  panBy,
  pointInView,
  MAX_ZOOM,
  toViewBox,
  viewAround,
  zoomAt,
  zoomByStep,
  zoomOf,
} from './floorPlanViewport';
import {
  AlignEdge,
  DistributeAxis,
  alignSelection,
  distributeSelection,
  isClickSizedMarquee,
  marqueeHits,
  moveSelection,
  normaliseMarquee,
  selectionBounds,
  toggleSelection,
} from './floorPlanSelection';
import { copyName, duplicateZones, nextZoneCode } from './floorPlanClipboard';
import { OrderMove, canReorder, reorder } from './floorPlanOrder';

/** Steps of undo kept in memory. Fifty is far more than anyone reaches for. */
const HISTORY_LIMIT = 50;

/**
 * How long a settled plan waits before being saved.
 *
 * A pointer drag fires an update per frame. Without this the editor sent a
 * PATCH per frame, and their responses could land out of order.
 */
const SAVE_DEBOUNCE_MS = 600;
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
import { TeamUser, memberName } from '../../types/people.types';



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
  const [history, setHistory] = useState<FiveSLayoutPlan[]>([]);
  const [future, setFuture] = useState<FiveSLayoutPlan[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  /**
   * 'plan' paints each zone the colour someone chose for it — right while
   * laying the map out. 'condition' paints it by its last audit score, which
   * is what a manager wants: one glance showing where to walk today.
   */
  const { t } = useTranslation();
  const [colorMode, setColorMode] = useState<'plan' | 'condition'>('plan');
  /** Which part of the plan the pane is showing. */
  const [view, setView] = useState<Viewport>(FULL_VIEW);
  /** A pan in progress, in client pixels, so the delta can be measured. */
  const panRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  /**
   * Everything selected, newest last.
   *
   * `selectedZoneId` stays as the one the properties panel describes — a
   * panel showing four zones at once would have nothing to say. This is what
   * the group operations work on, and the two are kept in step: the primary
   * is always the last entry here.
   */
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  /**
   * Areas copied with Ctrl+C, held until something else is copied.
   *
   * Kept in the component rather than the system clipboard: these are records,
   * not text, and reading the system clipboard needs a permission prompt that
   * would interrupt the one gesture this exists to make quick.
   */
  const [clipboard, setClipboard] = useState<FiveSZone[]>([]);
  /**
   * An open right-click menu, positioned in client pixels.
   *
   * Client rather than canvas coordinates because it is an HTML overlay on
   * top of the SVG: it must stay where the pointer was even as the plan is
   * zoomed or panned underneath it.
   */
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  /** A rubber band being dragged, in canvas coordinates. */
  const [marquee, setMarquee] = useState<{ x: number; y: number; width: number; height: number } | null>(
    null,
  );
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedObjectId, setSelectedObjectId] = useState('');
  const [statusFilter, setStatusFilter] = useState<ZoneStatusFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [drag, setDrag] = useState<
    | { kind: 'zone'; zoneId: string; offsetX: number; offsetY: number }
    | { kind: 'object'; objectId: string; offsetX: number; offsetY: number }
    | { kind: 'redTag'; zoneId: string; redTagId: string; offsetX: number; offsetY: number }
    | { kind: 'resize-zone'; zoneId: string; corner: ResizeCorner }
    | { kind: 'resize-object'; objectId: string; corner: ResizeCorner }
    | { kind: 'group'; startX: number; startY: number; origin: Record<string, { x: number; y: number }> }
    | null
  >(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const pendingPlanRef = useRef<FiveSLayoutPlan | null>(null);
  const shortcutHandlerRef = useRef<((event: KeyboardEvent) => void) | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([fiveSLayoutService.getPlan(), peopleService.getMembers()])
      .then(([layoutPlan, teamUsers]) => {
        if (!active) return;
        setPlan(layoutPlan);
        // A zone owner has to be somebody who can still sign in.
        setUsers(teamUsers.filter((member) => member.isActive));
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

  // Never leave a coalesced edit unsaved when the page is closed or the
  // component goes away.
  useEffect(() => {
    const flushOnHide = () => {
      const pending = pendingPlanRef.current;
      if (pending) {
        pendingPlanRef.current = null;
        void fiveSLayoutService.savePlan(pending);
      }
    };

    window.addEventListener('pagehide', flushOnHide);

    return () => {
      window.removeEventListener('pagehide', flushOnHide);
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      flushOnHide();
    };
  }, []);

  const selectedZone = useMemo(
    () => plan?.zones.find((zone) => zone.id === selectedZoneId),
    [plan, selectedZoneId],
  );

  const selectedObject = useMemo(
    () => plan?.objects.find((object) => object.id === selectedObjectId),
    [plan, selectedObjectId],
  );

  /** The box around everything selected, for the group outline. */
  const selectionOutline = useMemo(
    () => selectionBounds((plan?.zones ?? []).filter((zone) => selectedZoneIds.includes(zone.id))),
    [plan, selectedZoneIds],
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

  // A drag updates the plan on every pointer frame. Persisting each one would
  // fire a request per frame against a real backend, and late responses could
  // land out of order, so coalesce writes and only send the settled plan.
  const flushPlanSave = () => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const pending = pendingPlanRef.current;
    pendingPlanRef.current = null;

    if (pending) void fiveSLayoutService.savePlan(pending);
  };

  const cancelPlanSave = () => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    pendingPlanRef.current = null;
  };

  const commitPlan = (nextPlan: FiveSLayoutPlan) => {
    setPlan(nextPlan);
    pendingPlanRef.current = nextPlan;

    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(flushPlanSave, SAVE_DEBOUNCE_MS);
  };

  const updatePlan = (
    buildPlan: (current: FiveSLayoutPlan) => FiveSLayoutPlan,
    options?: { skipHistory?: boolean },
  ) => {
    if (!plan) return;

    const nextPlan = {
      ...buildPlan(plan),
      updatedAt: new Date().toISOString(),
    };

    if (!options?.skipHistory) {
      setHistory((entries) => [...entries.slice(-(HISTORY_LIMIT - 1)), plan]);
      setFuture([]);
    }

    commitPlan(nextPlan);
  };

  const undo = () => {
    if (!plan || !history.length) return;

    const previous = history[history.length - 1];
    setHistory((entries) => entries.slice(0, -1));
    setFuture((entries) => [plan, ...entries.slice(0, HISTORY_LIMIT - 1)]);
    commitPlan(previous);
    setActionMessage('Undid the last floorplan change.');
  };

  const redo = () => {
    if (!plan || !future.length) return;

    const [next, ...rest] = future;
    setFuture(rest);
    setHistory((entries) => [...entries.slice(-(HISTORY_LIMIT - 1)), plan]);
    commitPlan(next);
    setActionMessage('Redid the last undone change.');
  };

  const updateZone = (zoneId: string, patch: Partial<FiveSZone>, options?: { skipHistory?: boolean }) => {
    updatePlan(
      (current) => ({
        ...current,
        zones: current.zones.map((zone) => (zone.id === zoneId ? { ...zone, ...patch } : zone)),
      }),
      options,
    );
  };

  const updateObject = (
    objectId: string,
    patch: Partial<FloorPlanObject>,
    options?: { skipHistory?: boolean },
  ) => {
    updatePlan(
      (current) => ({
        ...current,
        objects: current.objects.map((object) => (object.id === objectId ? { ...object, ...patch } : object)),
      }),
      options,
    );
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

  /**
   * Removes everything selected, not only the one the panel describes.
   *
   * Deleting the primary and silently leaving the other three outlined is the
   * behaviour people report as "it did not delete them".
   */
  const deleteSelectedZone = () => {
    const removing = selectedZoneIds.length ? selectedZoneIds : selectedZone ? [selectedZone.id] : [];
    if (!removing.length) return;

    updatePlan((current) => {
      const zones = current.zones.filter((zone) => !removing.includes(zone.id));
      setSelectedZoneIds([]);
      setSelectedZoneId(zones[0]?.id || '');
      return { ...current, zones };
    });
  };

  /**
   * Adds copies of some areas to the plan and selects them.
   *
   * Codes and names are worked out against the plan as it grows, not as it
   * was, so copying three areas at once does not give all three the same code.
   */
  const addCopies = (source: FiveSZone[]) => {
    if (!source.length || !plan) return;

    const growing = [...plan.zones];
    const copies = duplicateZones(source, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }, 28, (zone, index) => {
      const identity = {
        id: `zone-${Date.now()}-${index}`,
        code: nextZoneCode(growing),
        name: copyName(zone.name, growing),
      };

      growing.push({ ...zone, ...identity });
      return identity;
    });

    updatePlan((current) => ({ ...current, zones: [...current.zones, ...copies] }));
    setSelectedZoneIds(copies.map((zone) => zone.id));
    setSelectedZoneId(copies[copies.length - 1].id);
    setSelectedObjectId('');
    setActionMessage(`${copies.length} area(s) copied.`);
  };

  /**
   * Moves the selected object through the stacking order.
   *
   * SVG draws in array order, so this reorders the array and nothing else. A
   * move with nowhere to go returns the same array, and this notices, so the
   * button at the top of the stack does not fill the undo history with
   * nothing.
   */
  const reorderSelectedObject = (move: OrderMove) => {
    if (!selectedObject || !plan) return;

    const objects = reorder(plan.objects, selectedObject.id, move);
    if (objects === plan.objects) return;

    updatePlan((current) => ({ ...current, objects }));
    setActionMessage(`${selectedObject.label} moved ${move === 'front' || move === 'forward' ? 'forward' : 'back'}.`);
  };

  /**
   * Opens the menu, selecting whatever was right-clicked first.
   *
   * Right-clicking something outside the selection replaces it, the way every
   * editor does — acting on something the pointer is not over is how people
   * delete the wrong thing.
   */
  const openContextMenu = (event: React.MouseEvent, target?: { zone?: FiveSZone; object?: FloorPlanObject }) => {
    event.preventDefault();
    event.stopPropagation();

    if (target?.zone && !selectedZoneIds.includes(target.zone.id)) {
      setSelectedZoneIds([target.zone.id]);
      setSelectedZoneId(target.zone.id);
      setSelectedObjectId('');
    }

    if (target?.object) {
      setSelectedObjectId(target.object.id);
      setSelectedZoneIds([]);
      setSelectedZoneId('');
    }

    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  /** Runs a menu action and closes the menu, so it never stays open over a change. */
  const runFromMenu = (action: () => void) => {
    action();
    setContextMenu(null);
  };

  /** Everything selected, in plan order rather than the order it was clicked. */
  const selectedZones = () =>
    (plan?.zones ?? []).filter((zone) => selectedZoneIds.includes(zone.id) || zone.id === selectedZoneId);

  const duplicateSelectedZone = () => addCopies(selectedZones());

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
    const previousPlan = plan;
    // Drop any coalesced write so it cannot land after the reset and undo it.
    cancelPlanSave();
    const nextPlan = await fiveSLayoutService.resetPlan();

    if (previousPlan) {
      setHistory((entries) => [...entries.slice(-(HISTORY_LIMIT - 1)), previousPlan]);
      setFuture([]);
    }

    setPlan(nextPlan);
    setSelectedZoneId(nextPlan.zones[0]?.id || '');
    setSelectedObjectId('');
    setActionMessage('Floorplan reset to the starting layout. Undo restores your version.');
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

  // A pointer drag fires many move events; record one history entry for the whole gesture.
  const beginDragHistory = () => {
    if (!plan) return;
    setHistory((entries) => [...entries.slice(-(HISTORY_LIMIT - 1)), plan]);
    setFuture([]);
  };

  const handleZonePointerDown = (event: React.PointerEvent<SVGRectElement>, zone: FiveSZone) => {
    if (!svgRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    capturePointer(event);
    // Through the current view: measuring against the whole canvas put the
    // grab point somewhere else entirely the moment anybody zoomed in.
    const point = pointInView(view, svgRef.current.getBoundingClientRect(), event.clientX, event.clientY);

    const additive = event.shiftKey || event.ctrlKey || event.metaKey;
    // Grabbing something already in the selection drags the whole group; that
    // is what makes a multi-selection worth having. A plain click on anything
    // else starts again with just that one.
    const inSelection = selectedZoneIds.includes(zone.id);
    const next = additive || inSelection ? toggleSelection(selectedZoneIds, zone.id, true) : [zone.id];

    setSelectedZoneIds(additive || !inSelection ? next : selectedZoneIds);
    setSelectedZoneId(zone.id);
    setSelectedObjectId('');
    beginDragHistory();

    const group = (inSelection ? selectedZoneIds : []).filter((id) => id !== zone.id);

    if (group.length) {
      const moving = [zone.id, ...group];
      setDrag({
        kind: 'group',
        startX: point.x,
        startY: point.y,
        origin: Object.fromEntries(
          (plan?.zones ?? [])
            .filter((item) => moving.includes(item.id))
            .map((item) => [item.id, { x: item.x, y: item.y }]),
        ),
      });
      return;
    }

    setDrag({
      kind: 'zone',
      zoneId: zone.id,
      offsetX: point.x - zone.x,
      offsetY: point.y - zone.y,
    });
  };

  /**
   * A rubber band over empty canvas.
   *
   * Starting one does not clear the selection immediately: a plain click that
   * turns out not to be a drag clears it on release instead, so a band that
   * misses everything and a click on nothing behave the same way.
   */
  const startMarquee = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    capturePointer(event);
    const point = pointInView(view, svgRef.current.getBoundingClientRect(), event.clientX, event.clientY);

    marqueeStartRef.current = point;
    setMarquee({ x: point.x, y: point.y, width: 0, height: 0 });
  };

  const endMarquee = (additive: boolean) => {
    const band = marquee;
    marqueeStartRef.current = null;
    setMarquee(null);

    if (!band) return;

    if (isClickSizedMarquee(band)) {
      // A click on nothing, not a drag.
      setSelectedZoneIds([]);
      setSelectedZoneId('');
      setSelectedObjectId('');
      return;
    }

    const hits = marqueeHits(plan?.zones ?? [], band);
    const next = additive ? [...new Set([...selectedZoneIds, ...hits])] : hits;

    setSelectedZoneIds(next);
    setSelectedZoneId(next[next.length - 1] ?? '');
    setSelectedObjectId('');
  };

  /** Moves everything selected together, and keeps the group on the canvas. */
  const dragGroup = (
    drag: { startX: number; startY: number; origin: Record<string, { x: number; y: number }> },
    point: { x: number; y: number },
  ) => {
    const items = (plan?.zones ?? [])
      .filter((zone) => drag.origin[zone.id])
      .map((zone) => ({ ...zone, ...drag.origin[zone.id] }));

    const moves = moveSelection(items, point.x - drag.startX, point.y - drag.startY, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    });

    updatePlan(
      (current) => ({
        ...current,
        zones: current.zones.map((zone) => (moves[zone.id] ? { ...zone, ...moves[zone.id] } : zone)),
      }),
      { skipHistory: true },
    );
  };

  /** Lines up or spreads out whatever is selected. */
  const arrangeSelection = (action: { align: AlignEdge } | { distribute: DistributeAxis }) => {
    const items = (plan?.zones ?? []).filter((zone) => selectedZoneIds.includes(zone.id));
    const moves =
      'align' in action ? alignSelection(items, action.align) : distributeSelection(items, action.distribute);

    if (!Object.keys(moves).length) return;

    updatePlan((current) => ({
      ...current,
      zones: current.zones.map((zone) => (moves[zone.id] ? { ...zone, ...moves[zone.id] } : zone)),
    }));

    setActionMessage(
      'align' in action
        ? `${items.length} areas aligned.`
        : `${items.length} areas spaced evenly.`,
    );
  };

  const handleRedTagPointerDown = (
    event: React.PointerEvent<SVGGElement>,
    zone: FiveSZone,
    redTag: FiveSRedTag,
    index: number,
  ) => {
    if (!svgRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    capturePointer(event);

    const point = pointInView(view, svgRef.current.getBoundingClientRect(), event.clientX, event.clientY);
    const spot = pinPosition(zone, redTag, index);

    setSelectedZoneId(zone.id);
    setSelectedObjectId('');
    setDrag({
      kind: 'redTag',
      zoneId: zone.id,
      redTagId: redTag.id,
      offsetX: point.x - spot.x,
      offsetY: point.y - spot.y,
    });
  };

  const handleResizePointerDown = (
    event: React.PointerEvent<SVGRectElement>,
    corner: ResizeCorner,
    target: { kind: 'zone'; id: string } | { kind: 'object'; id: string },
  ) => {
    event.preventDefault();
    event.stopPropagation();
    capturePointer(event);
    beginDragHistory();

    setDrag(
      target.kind === 'zone'
        ? { kind: 'resize-zone', zoneId: target.id, corner }
        : { kind: 'resize-object', objectId: target.id, corner },
    );
  };

  const handleObjectPointerDown = (event: React.PointerEvent<SVGGElement>, object: FloorPlanObject) => {
    if (!svgRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    capturePointer(event);
    // Through the current view: measuring against the whole canvas put the
    // grab point somewhere else entirely the moment anybody zoomed in.
    const point = pointInView(view, svgRef.current.getBoundingClientRect(), event.clientX, event.clientY);

    setSelectedZoneId('');
    setSelectedObjectId(object.id);
    beginDragHistory();
    setDrag({
      kind: 'object',
      objectId: object.id,
      offsetX: point.x - object.x,
      offsetY: point.y - object.y,
    });
  };

  /**
   * Space holds the pan gesture, the way it does in a drawing tool.
   *
   * Registered on the window rather than the canvas because the canvas is an
   * SVG that does not take focus, and a person reaches for space while looking
   * at the plan rather than after clicking it. Repeat events are ignored so
   * holding the key does not churn state sixty times a second.
   */
  useEffect(() => {
    const target = (event: KeyboardEvent) => event.target;

    const down = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return;
      const focused = target(event);
      if (focused instanceof Element && focused.closest('input, textarea, select, button, [contenteditable="true"]')) {
        return;
      }

      event.preventDefault();
      setSpaceHeld(true);
    };

    const up = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      setSpaceHeld(false);
      panRef.current = null;
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  /**
   * Wheel to zoom, at the pointer.
   *
   * Attached by hand rather than with React's `onWheel`, which registers a
   * *passive* listener: `preventDefault` inside one does nothing, the browser
   * says so in the console, and the page scrolls away underneath while you are
   * trying to zoom. Only a listener registered with `passive: false` can hold
   * the page still. jsdom does not enforce passive, so this was found by
   * opening the plan rather than by a test.
   *
   * A trackpad pinch arrives here as `ctrl+wheel`, so it needs no separate
   * handling — the same code zooms for both.
   *
   * `view` is read through a ref so the listener is not torn down and rebuilt
   * on every zoom, which would drop wheel events mid-gesture.
   */
  const viewRef = useRef(view);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  /**
   * Held in state rather than read from the ref, so the listener below is
   * attached when the element actually mounts.
   *
   * Keying that effect on `plan` was not enough: the canvas also waits on
   * `loading`, which clears in a separate update, so the effect could run with
   * the ref still null and never run again. Whether the wheel worked then came
   * down to which state landed first.
   */
  const [canvasNode, setCanvasNode] = useState<SVGSVGElement | null>(null);

  useEffect(() => {
    const canvas = canvasNode;
    if (!canvas) return undefined;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const focus = pointInView(viewRef.current, rect, event.clientX, event.clientY);
      // A fixed ratio per notch, so in and back out lands where it started.
      const factor = event.deltaY < 0 ? 1.2 : 1 / 1.2;

      setView((current) => zoomAt(current, factor, focus.x, focus.y));
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [canvasNode]);

  /** Middle button, or space held: the two ways a canvas is expected to pan. */
  const startPanIfRequested = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 1 && !spaceHeld) return false;

    event.preventDefault();
    capturePointer(event);
    panRef.current = { clientX: event.clientX, clientY: event.clientY };
    return true;
  };

  const endPan = () => {
    panRef.current = null;
  };

  /** Frames one area, for jumping to it from the list rather than hunting. */
  const focusZone = (zone: FiveSZone) => {
    setSelectedZoneId(zone.id);
    setSelectedObjectId('');
    setView(viewAround(zone));
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    // A pan is a drag of the paper itself, so it runs before — and instead of —
    // anything that moves a zone.
    if (panRef.current) {
      const rect = event.currentTarget.getBoundingClientRect();
      const moved = distanceInView(
        view,
        rect,
        event.clientX - panRef.current.clientX,
        event.clientY - panRef.current.clientY,
      );

      panRef.current = { clientX: event.clientX, clientY: event.clientY };
      setView((current) => panBy(current, moved.x, moved.y));
      return;
    }

    if (marqueeStartRef.current) {
      const corner = pointInView(
        view,
        event.currentTarget.getBoundingClientRect(),
        event.clientX,
        event.clientY,
      );

      setMarquee(normaliseMarquee(marqueeStartRef.current, corner));
      return;
    }

    if (!drag || !plan) return;
    const point = pointInView(view, event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);

    if (drag.kind === 'group') {
      dragGroup(drag, point);
      return;
    }
    const snap = (plan.showGrid ?? true) && !event.altKey;
    const snappedPoint = { x: snapToGrid(point.x, snap), y: snapToGrid(point.y, snap) };

    if (drag.kind === 'resize-zone') {
      const zone = plan.zones.find((item) => item.id === drag.zoneId);
      if (!zone) return;

      updateZone(zone.id, resizeBox(zone, drag.corner, snappedPoint.x, snappedPoint.y, 80, 72), {
        skipHistory: true,
      });
      return;
    }

    if (drag.kind === 'resize-object') {
      const object = plan.objects.find((item) => item.id === drag.objectId);
      if (!object) return;

      updateObject(object.id, resizeBox(object, drag.corner, snappedPoint.x, snappedPoint.y, 12, 8), {
        skipHistory: true,
      });
      return;
    }

    if (drag.kind === 'zone') {
      const zone = plan.zones.find((item) => item.id === drag.zoneId);
      if (!zone) return;

      updateZone(
        zone.id,
        {
          x: Math.round(clamp(snapToGrid(point.x - drag.offsetX, snap), 12, CANVAS_WIDTH - zone.width - 12)),
          y: Math.round(clamp(snapToGrid(point.y - drag.offsetY, snap), 12, CANVAS_HEIGHT - zone.height - 12)),
        },
        { skipHistory: true },
      );
      return;
    }

    if (drag.kind === 'redTag') {
      const zone = plan.zones.find((item) => item.id === drag.zoneId);
      if (!zone) return;

      // A tag's position means "where in this area", so a pin cannot be
      // dragged out of the zone it belongs to.
      const x = Math.round(
        clamp(point.x - drag.offsetX, zone.x + PIN_RADIUS, zone.x + zone.width - PIN_RADIUS),
      );
      const y = Math.round(
        clamp(point.y - drag.offsetY, zone.y + PIN_RADIUS, zone.y + zone.height - PIN_RADIUS),
      );

      updateZone(zone.id, {
        redTags: (zone.redTags || []).map((item) =>
          item.id === drag.redTagId ? { ...item, x, y } : item,
        ),
      });
      return;
    }

    const object = plan.objects.find((item) => item.id === drag.objectId);
    if (!object) return;

    updateObject(
      object.id,
      {
        x: Math.round(clamp(snapToGrid(point.x - drag.offsetX, snap), 8, CANVAS_WIDTH - object.width - 8)),
        y: Math.round(clamp(snapToGrid(point.y - drag.offsetY, snap), 8, CANVAS_HEIGHT - object.height - 8)),
      },
      { skipHistory: true },
    );
  };

  /**
   * Records the decision made in the holding-area review.
   *
   * Works on any zone, not just the selected one — the list is organization
   * wide, and making someone select a zone first would be busywork.
   */
  const decideHeldItem = (zoneId: string, redTagId: string, status: FiveSRedTag['status']) => {
    const zone = plan?.zones.find((item) => item.id === zoneId);
    if (!zone) return;

    updateZone(zone.id, {
      redTags: (zone.redTags || []).map((redTag) =>
        redTag.id === redTagId
          ? { ...redTag, status, closedAt: redTag.closedAt || formatLocalDate() }
          : redTag,
      ),
    });

    setActionMessage(
      status === 'disposed'
        ? `Disposed of an item held in ${zone.code}.`
        : `Returned an item held in ${zone.code}.`,
    );
  };

  const handleShortcutKey = (event: KeyboardEvent) => {
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]')) return;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      redo();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
      const copying = selectedZones();
      if (!copying.length) return;

      event.preventDefault();
      setClipboard(copying);
      setActionMessage(`${copying.length} area(s) copied to the clipboard.`);
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
      if (!clipboard.length) return;

      event.preventDefault();
      addCopies(clipboard);
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
      if (!selectedZones().length) return;

      // Duplicate in place rather than through the clipboard, so it does not
      // quietly replace whatever somebody copied earlier.
      event.preventDefault();
      duplicateSelectedZone();
      return;
    }

    if (!selectedZone && !selectedObject && !selectedZoneIds.length) return;

    if (event.key === 'Escape') {
      setContextMenu(null);
      setSelectedZoneIds([]);
      setSelectedZoneId('');
      setSelectedObjectId('');
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      if (selectedZone) deleteSelectedZone();
      else deleteSelectedObject();
      return;
    }

    const nudge: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const direction = nudge[event.key];
    if (!direction) return;

    event.preventDefault();
    const step = event.shiftKey ? GRID_SIZE : 1;
    const [dx, dy] = [direction[0] * step, direction[1] * step];

    if (selectedZoneIds.length > 1) {
      // The group is clamped as one shape, so hitting an edge does not squash
      // the arrangement together.
      const items = (plan?.zones ?? []).filter((zone) => selectedZoneIds.includes(zone.id));
      const moves = moveSelection(items, dx, dy, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT });

      updatePlan((current) => ({
        ...current,
        zones: current.zones.map((zone) => (moves[zone.id] ? { ...zone, ...moves[zone.id] } : zone)),
      }));
      return;
    }

    if (selectedZone) {
      updateZone(selectedZone.id, {
        x: Math.round(clamp(selectedZone.x + dx, 12, CANVAS_WIDTH - selectedZone.width - 12)),
        y: Math.round(clamp(selectedZone.y + dy, 12, CANVAS_HEIGHT - selectedZone.height - 12)),
      });
      return;
    }

    if (selectedObject) {
      updateObject(selectedObject.id, {
        x: Math.round(clamp(selectedObject.x + dx, 8, CANVAS_WIDTH - selectedObject.width - 8)),
        y: Math.round(clamp(selectedObject.y + dy, 8, CANVAS_HEIGHT - selectedObject.height - 8)),
      });
    }
  };

  // Keep the handler current without re-registering the listener on every
  // render: a layout effect updates the ref during commit, so a keypress can
  // never be handled by a closure from a stale render.
  useLayoutEffect(() => {
    shortcutHandlerRef.current = handleShortcutKey;
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => shortcutHandlerRef.current?.(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const handleOwnerChange = (ownerId: string) => {
    if (!selectedZone) return;
    const owner = users.find((user) => user.id === ownerId);
    updateZone(selectedZone.id, {
      ownerId: owner?.id,
      ownerName: owner ? memberName(owner) : '',
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
    const spot = nextPinSpot(selectedZone, redTags.length);
    const redTag: FiveSRedTag = {
      id: `redtag-${Date.now()}`,
      title: 'New red-tag item',
      disposition: 'Decide disposition',
      status: 'open',
      x: spot.x,
      y: spot.y,
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

    const isTerminal = (status: FiveSRedTag['status']) =>
      status === 'disposed' || status === 'returned';

    const redTags = (selectedZone.redTags || []).map((redTag) => {
      if (redTag.id !== redTagId) return redTag;

      const next = { ...redTag, ...patch };

      // `closedAt` is touched only when the status itself changes. Finishing
      // the cleanup task sets it while the status is still 'open' — awaiting a
      // disposition — and editing any other field must not wipe that.
      if (patch.status === undefined) {
        return next;
      }

      if (isTerminal(patch.status)) {
        return { ...next, closedAt: next.closedAt || formatLocalDate() };
      }

      // Moving an item to review means it has gone to the holding area, and
      // the wait is the whole point — so the clock starts here.
      if (patch.status === 'review') {
        return { ...next, ...(holdDatesFor(next) ?? {}) };
      }

      // Moving a tag back from a terminal status is a deliberate reopen.
      return isTerminal(redTag.status) ? { ...next, closedAt: '' } : next;
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
            sourceType: 'five_s_red_tag',
            sourceId: redTag.id,
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
            sourceType: 'five_s_red_tag',
            sourceId: zone.id,
            status: 'todo',
            priority: 'high',
            dueDate,
            estimatedHours: 1,
            actualHours: 0,
          }),
        ),
      ]);

      setActionMessage(`${taskCount} red tag(s) now have a cleanup task.`);
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
            sourceType: 'audit_run',
            sourceId: `due-${zone.id}`,
            status: 'todo',
            priority: Number(zone.lastAuditScore || 100) < AUDIT_PASSING_SCORE ? 'high' : 'medium',
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

      // Drop any coalesced write so it cannot land after the import.
      cancelPlanSave();

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
          <Button
            variant="outline"
            size="sm"
            icon={Undo2}
            onClick={undo}
            disabled={!history.length}
            title="Undo (Ctrl+Z)"
            type="button"
          >
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Redo2}
            onClick={redo}
            disabled={!future.length}
            title="Redo (Ctrl+Shift+Z)"
            type="button"
          >
            Redo
          </Button>
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
          <label className="flex items-center gap-2 self-end rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
            <input
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
              type="checkbox"
              checked={colorMode === 'condition'}
              onChange={(event) => setColorMode(event.target.checked ? 'condition' : 'plan')}
            />
            Colour by audit score
          </label>
        </div>

        {colorMode === 'condition' && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300">
            {(
              [
                ['good', `Passing (${AUDIT_PASSING_SCORE}%+)`],
                ['watch', `Below pass (${AUDIT_URGENT_SCORE}–${AUDIT_PASSING_SCORE - 1}%)`],
                ['poor', `Needs attention (under ${AUDIT_URGENT_SCORE}%)`],
                ['none', 'Not audited yet'],
              ] as const
            ).map(([band, label]) => (
              <span key={band} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: auditBands[band] }}
                  aria-hidden="true"
                />
                {label}
              </span>
            ))}
          </div>
        )}

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
                  {memberName(user)}
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
            <div className="mt-4 max-h-[420px] space-y-4 overflow-y-auto pr-1 md:max-h-[520px]">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase text-gray-500">Area presets</div>
                <div className="grid grid-cols-2 gap-2">
                  {zoneTemplates.map((template) => (
                    <button
                      key={template.name}
                      type="button"
                      onClick={() => addZoneFromTemplate(template)}
                      className="flex min-h-[54px] flex-col items-start justify-between rounded-lg border border-gray-200 px-2.5 py-2 text-left text-xs text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <span className="h-2.5 w-8 rounded-full" style={{ backgroundColor: template.color }} />
                      <span className="font-medium">{template.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3 border-t border-gray-200 pt-3 dark:border-gray-700">
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
                              className="flex min-h-[42px] items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-2 text-left text-xs text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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
              <div className="space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700">
                {stageCounts.map((item) => (
                  <div key={item.stage} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{stageLabels[item.stage]}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{item.count}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                <div className="mb-2 text-xs font-semibold uppercase text-gray-500">Color legend</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {zoneColorPresets.map((preset) => (
                    <div key={preset.value} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <span className="h-3 w-3 flex-none rounded-full" style={{ backgroundColor: preset.value }} />
                      {preset.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950">
            {/*
              The zoom controls sit on the canvas rather than in the toolbar
              across the room, because they are used while looking at the plan.
            */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={t('fiveS.zoomOut')}
                  title={t('fiveS.zoomOut')}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  disabled={zoomOf(view) <= 1}
                  onClick={() => setView((current) => zoomByStep(current, 1 / 1.4))}
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span
                  className="min-w-[3.5rem] text-center font-mono text-xs tabular-nums text-gray-600 dark:text-gray-300"
                  aria-live="polite"
                  aria-label={t('fiveS.zoomLevel')}
                >
                  {Math.round(zoomOf(view) * 100)}%
                </span>
                <button
                  type="button"
                  aria-label={t('fiveS.zoomIn')}
                  title={t('fiveS.zoomIn')}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  disabled={zoomOf(view) >= MAX_ZOOM}
                  onClick={() => setView((current) => zoomByStep(current, 1.4))}
                >
                  <PlusIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="ml-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  disabled={zoomOf(view) === 1}
                  onClick={() => setView(FULL_VIEW)}
                >
                  {t('fiveS.fitToPlan')}
                </button>
                {selectedZone && (
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                    onClick={() => focusZone(selectedZone)}
                  >
                    {t('fiveS.zoomToSelection')}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('fiveS.canvasHint')}</p>
            </div>

            {/*
              Only while several areas are selected: alignment of one area
              against itself does nothing, and a row of buttons that never do
              anything is worse than no row at all.
            */}
            {selectedZoneIds.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-blue-50/40 px-3 py-2 dark:border-gray-700 dark:bg-blue-950/20">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {t('fiveS.selectedCount', { count: selectedZoneIds.length })}
                </span>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ['left', AlignLeft],
                      ['centre', AlignCenterHorizontal],
                      ['right', AlignRight],
                      ['top', AlignStartVertical],
                      ['middle', AlignCenterVertical],
                      ['bottom', AlignEndVertical],
                    ] as Array<[AlignEdge, typeof AlignLeft]>
                  ).map(([edge, Icon]) => (
                    <button
                      key={edge}
                      type="button"
                      aria-label={t(`fiveS.align.${edge}`)}
                      title={t(`fiveS.align.${edge}`)}
                      className="rounded-md border border-gray-300 p-1.5 text-gray-700 hover:bg-white dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                      onClick={() => arrangeSelection({ align: edge })}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ['horizontal', 'fiveS.distribute.horizontal'],
                      ['vertical', 'fiveS.distribute.vertical'],
                    ] as Array<[DistributeAxis, string]>
                  ).map(([axis, label]) => (
                    <button
                      key={axis}
                      type="button"
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-white disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                      disabled={selectedZoneIds.length < 3}
                      onClick={() => arrangeSelection({ distribute: axis })}
                    >
                      {t(label)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/*
              An HTML overlay rather than SVG: it needs to sit above the canvas
              at a fixed size whatever the zoom, and it has to be reachable by
              keyboard, which SVG shapes are not.
            */}
            {contextMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} aria-hidden="true" />
                <div
                  role="menu"
                  aria-label={t('fiveS.canvasMenu')}
                  className="fixed z-50 min-w-[13rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
                  style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                  {(
                    [
                      {
                        label: t('fiveS.menu.duplicate'),
                        hint: 'Ctrl+D',
                        enabled: Boolean(selectedZone),
                        run: duplicateSelectedZone,
                      },
                      {
                        label: t('fiveS.menu.copy'),
                        hint: 'Ctrl+C',
                        enabled: Boolean(selectedZone),
                        run: () => setClipboard(selectedZones()),
                      },
                      {
                        label: t('fiveS.menu.paste'),
                        hint: 'Ctrl+V',
                        enabled: clipboard.length > 0,
                        run: () => addCopies(clipboard),
                      },
                      {
                        label: t('fiveS.menu.zoomTo'),
                        enabled: Boolean(selectedZone),
                        run: () => selectedZone && focusZone(selectedZone),
                      },
                      {
                        label: t('fiveS.menu.bringForward'),
                        enabled: Boolean(
                          selectedObject && plan && canReorder(plan.objects, selectedObject.id, 'forward'),
                        ),
                        run: () => reorderSelectedObject('forward'),
                      },
                      {
                        label: t('fiveS.menu.bringToFront'),
                        enabled: Boolean(
                          selectedObject && plan && canReorder(plan.objects, selectedObject.id, 'front'),
                        ),
                        run: () => reorderSelectedObject('front'),
                      },
                      {
                        label: t('fiveS.menu.sendBackward'),
                        enabled: Boolean(
                          selectedObject && plan && canReorder(plan.objects, selectedObject.id, 'backward'),
                        ),
                        run: () => reorderSelectedObject('backward'),
                      },
                      {
                        label: t('fiveS.menu.sendToBack'),
                        enabled: Boolean(
                          selectedObject && plan && canReorder(plan.objects, selectedObject.id, 'back'),
                        ),
                        run: () => reorderSelectedObject('back'),
                      },
                      {
                        label: t('fiveS.menu.delete'),
                        hint: 'Del',
                        destructive: true,
                        enabled: Boolean(selectedZone || selectedObject),
                        run: () => (selectedObject ? deleteSelectedObject() : deleteSelectedZone()),
                      },
                    ] as Array<{
                      label: string;
                      hint?: string;
                      destructive?: boolean;
                      enabled: boolean;
                      run: () => void;
                    }>
                  ).map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      disabled={!item.enabled}
                      className={`flex w-full items-center justify-between gap-6 px-3 py-1.5 text-left text-sm disabled:opacity-35 ${
                        item.destructive
                          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => runFromMenu(item.run)}
                    >
                      <span>{item.label}</span>
                      {item.hint && <span className="font-mono text-[11px] text-gray-400">{item.hint}</span>}
                    </button>
                  ))}
                </div>
              </>
            )}

            <svg
              ref={(node) => {
                svgRef.current = node;
                setCanvasNode(node);
              }}
              viewBox={toViewBox(view)}
              role="img"
              aria-label="5S floor plan"
              className={`h-[420px] w-full touch-none md:h-[520px] ${
                spaceHeld || panRef.current ? 'cursor-grab' : 'cursor-crosshair'
              }`}
              onContextMenu={(event) => openContextMenu(event)}
              onPointerDown={(event) => {
                setContextMenu(null);
                if (startPanIfRequested(event)) return;

                if (event.target === event.currentTarget || (event.target as SVGElement).dataset.canvasBackground) {
                  startMarquee(event);
                }
              }}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={(event) => {
                endPan();
                endMarquee(event.shiftKey || event.ctrlKey || event.metaKey);
                setDrag(null);
              }}
              onPointerLeave={() => {
                endPan();
                endMarquee(false);
                setDrag(null);
              }}
            >
              <defs>
                <pattern id="five-s-grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                  <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#d1d5db" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect data-canvas-background="true" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="white" />
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
              {(plan.showGrid ?? true) && (
                <rect
                  data-canvas-background="true"
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  fill="url(#five-s-grid)"
                />
              )}

              {plan.zones.map((zone) => {
                // Every zone in the selection is outlined; the primary one — the
                // one the properties panel describes — is outlined solid.
                const selected = selectedZoneIds.includes(zone.id) || zone.id === selectedZoneId;
                const primary = zone.id === selectedZoneId;
                const focused = filteredZoneIds.has(zone.id);
                // In condition mode the colour carries the audit score, so it
                // stops being decoration and starts being the reading.
                const paint =
                  colorMode === 'condition'
                    ? auditBands[auditBandFor(zone.lastAuditScore)]
                    : zone.color;
                return (
                  <g key={zone.id} opacity={focused ? 1 : 0.22}>
                    <rect
                      x={zone.x}
                      y={zone.y}
                      width={zone.width}
                      height={zone.height}
                      rx="8"
                      fill={`${paint}24`}
                      stroke={selected ? '#111827' : paint}
                      strokeWidth={selected ? 3 : 2}
                      strokeDasharray={primary ? '0' : selected ? '4 3' : '8 6'}
                      className="cursor-move"
                      onPointerDown={(event) => handleZonePointerDown(event, zone)}
                      onContextMenu={(event) => openContextMenu(event, { zone })}
                    />
                    <circle cx={zone.x + 24} cy={zone.y + 24} r="18" fill={paint} />
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
                      {/* The score is printed whenever it exists, so colour is
                          never the only thing carrying the reading. */}
                      {zone.lastAuditScore !== undefined ? ` / ${zone.lastAuditScore}%` : ''}
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
                    {/*
                      A pin per open red tag. Position is information — which
                      corner of the area the item is actually in — so the tags
                      are draggable within their own zone.
                    */}
                    {(zone.redTags || [])
                      .map((redTag, index) => ({ redTag, spot: pinPosition(zone, redTag, index), index }))
                      .filter(({ redTag }) => isOpenRedTag(redTag))
                      .map(({ redTag, spot, index }) => (
                        <g
                          key={redTag.id}
                          className="cursor-grab"
                          onPointerDown={(event) => handleRedTagPointerDown(event, zone, redTag, index)}
                        >
                          <title>{`${redTag.title} - ${redTagStatusLabel(redTag.status)}`}</title>
                          <circle
                            cx={spot.x}
                            cy={spot.y}
                            r={PIN_RADIUS}
                            fill={auditBands.poor}
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                          <text
                            x={spot.x}
                            y={spot.y + 4}
                            textAnchor="middle"
                            className="fill-white text-[10px] font-semibold"
                          >
                            {index + 1}
                          </text>
                        </g>
                      ))}
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
              {/*
                Drawn after the zones so it sits on top, and `pointer-events`
                off so the band never swallows the release that ends it.
              */}
              {selectionOutline && selectedZoneIds.length > 1 && (
                <rect
                  x={selectionOutline.x - 4}
                  y={selectionOutline.y - 4}
                  width={selectionOutline.width + 8}
                  height={selectionOutline.height + 8}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  pointerEvents="none"
                />
              )}

              {marquee && (
                <rect
                  x={marquee.x}
                  y={marquee.y}
                  width={marquee.width}
                  height={marquee.height}
                  fill="#2563eb18"
                  stroke="#2563eb"
                  strokeWidth="1"
                  pointerEvents="none"
                />
              )}


              {plan.objects.map((object) => (
                <g key={object.id} onContextMenu={(event) => openContextMenu(event, { object })}>
                  {renderFloorPlanObject(object, object.id === selectedObjectId, (event) =>
                    handleObjectPointerDown(event, object),
                  )}
                </g>
              ))}

              {(selectedZone || selectedObject) &&
                (() => {
                  const box = selectedZone ?? selectedObject;
                  if (!box) return null;

                  return resizeCorners.map(({ corner, cursor }) => {
                    const cx = corner === 'nw' || corner === 'sw' ? box.x : box.x + box.width;
                    const cy = corner === 'nw' || corner === 'ne' ? box.y : box.y + box.height;

                    return (
                      <rect
                        key={corner}
                        data-testid={`five-s-resize-${corner}`}
                        x={cx - 6}
                        y={cy - 6}
                        width="12"
                        height="12"
                        rx="2"
                        fill="#ffffff"
                        stroke="#2563eb"
                        strokeWidth="2"
                        style={{ cursor }}
                        onPointerDown={(event) =>
                          handleResizePointerDown(
                            event,
                            corner,
                            selectedZone
                              ? { kind: 'zone', id: selectedZone.id }
                              : { kind: 'object', id: selectedObject!.id },
                          )
                        }
                      />
                    );
                  });
                })()}
            </svg>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-700">
              <span>Drag to move</span>
              <span>Corner handles resize</span>
              <span>Arrows nudge / Shift+arrows jump</span>
              <span>Delete removes</span>
              <span>Esc deselects</span>
              <span>Ctrl+Z undoes</span>
              {(plan.showGrid ?? true) && <span>Alt disables grid snap</span>}
            </div>
          </div>

          <div className="max-h-[480px] overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700 md:max-h-[580px]">
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
                        {memberName(user)} / {user.position}
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
                        <div className="mt-3">
                          {/* A red tag is a claim until there is a picture of
                              the item, and a fix is unproven until the after
                              shot sits beside the before one. */}
                          <PhotoEvidence
                            ownerType="five_s_red_tag"
                            ownerId={redTag.id}
                            kinds={['before', 'after']}
                            label={t('photos.evidenceLabel')}
                          />
                        </div>
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
                {/* How the area has actually been scoring. Audit runs reference
                    their zone, so this history exists for the first time. */}
                <ZoneHistory zone={selectedZone} />

                <AuditTiers zone={selectedZone} tiers={plan.auditTiers} />

                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <HoldingArea
                    zones={plan.zones}
                    onDecide={decideHeldItem}
                    onSelectZone={setSelectedZoneId}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('photos.standard')}</div>
                  {/* A written standard describes the state; the photograph is
                      what an auditor actually compares the area against. */}
                  <PhotoEvidence
                    ownerType="five_s_zone"
                    ownerId={selectedZone.id}
                    kinds={['standard']}
                    label={t('photos.standard')}
                  />
                </div>
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
