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
import AuditTierSettings from './AuditTierSettings';
import HoldingArea from './HoldingArea';
import FloorPlanStart from './FloorPlanStart';
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
  ZoneAction,
  getZoneActionItems,
  matchesZoneStatus,
  nextPinSpot,
  pinPosition,
  redTagStatusKey,
  redTagStatusOptions,
  stageKeys,
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
import { catalogue, catalogueGroups, catalogueItem, sizeForType } from './floorPlanCatalogue';
import { dropSpot, placeAgainstWall } from './floorPlanPlacement';
import { labelIn, nameRoom } from './floorPlanRooms';
import { qrPath, zoneUrl } from './zoneLink';
import { CanvasColours, canvasColours, strokeInk, tint } from './floorPlanTheme';
import { useTheme } from '../../contexts/ThemeContext';
import { crossesAWall, perHundredSquareMetres, roomForZone, zoneCoverage } from './floorPlanZones';
import { summariseRooms, zonesInNoRoom } from './floorPlanRoomSummary';
import {
  addRoutePoint,
  isDrawnRoute,
  nextRouteName,
  routeLabelAnchor,
  routeLegs,
  routeLength,
  routePoints,
} from './floorPlanRoutes';
import { OrderMove, canReorder, reorder } from './floorPlanOrder';
import {
  areaInMetres,
  areaOf,
  calibrate,
  formatArea,
  formatLength,
  formatSize,
  niceBarLength,
  scaleOf,
  toMetres,
  toUnits,
} from './floorPlanScale';
import {
  Point,
  cornerAt,
  cornerNear,
  detectRooms,
  mergeCorners,
  moveCorner,
  endsOf,
  roomCentre,
  roomKey,
  roomPath,
  snapToAngle,
  wallLength,
  wallsOn,
} from './floorPlanWalls';
import {
  Opening,
  OpeningKind,
  clampOffset,
  defaultWidth,
  doorSwing,
  openingGeometry,
  projectOntoWall,
  wallAtPoint,
  wallCanHold,
  wallSegments,
} from './floorPlanOpenings';

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
import { Department } from '../../types/people.types';
import {
  FiveSLayoutPlan,
  FiveSRedTag,
  FiveSStage,
  FiveSZone,
  FloorPlanObject,
  FloorPlanObjectType,
  PlanPoint,
} from '../../types/fiveS.types';
import { TeamUser, memberName } from '../../types/people.types';



/**
 * The palette, drawn from the catalogue.
 *
 * It used to carry a Wall and a Door of its own: black rectangles that looked
 * like a building and were not one. Nothing closed a room, nothing had an
 * area, and a door drawn that way was a picture of a door over a solid wall.
 * Both are tools now — walls are drawn and openings are cut — and leaving the
 * old pair in the palette would leave two ways to draw a wall, one of which
 * quietly does nothing.
 *
 * Old plans still containing them keep drawing them; they simply cannot be
 * added any more.
 */
const shapeIcons: Partial<Record<FloorPlanObjectType, React.ComponentType<{ className?: string }>>> = {
  desk: Table,
  chair: Move,
  table: ClipboardList,
  sofa: Square,
  shelf: Package,
  cabinet: Package,
  pallet: Package,
  racking: Package,
  workbench: Table,
  printer: Printer,
  equipment: Move,
  whiteboard: Square,
  plant: Plus,
  waste_bin: Trash2,
  sink: Square,
};


const zoneColorPresets = [
  { label: 'Front', value: '#38bdf8' },
  { label: 'Work', value: '#22c55e' },
  { label: 'Storage', value: '#f59e0b' },
  { label: 'Meeting', value: '#a855f7' },
  { label: 'Break', value: '#ef4444' },
  { label: 'Shared', value: '#14b8a6' },
  { label: 'Support', value: '#64748b' },
];

/**
 * The area presets, named by key rather than by an English string.
 *
 * A Mongolian workspace was being offered buttons called Reception and
 * Workstations, and the areas they created came out with English names that
 * somebody then had to retype. The preset's `key` is what the palette and the
 * new area are both named from.
 */
const zoneTemplates: Array<
  Pick<FiveSZone, 'color' | 'width' | 'height' | 'contents' | 'standard' | 'labelText' | 'stage'> & { key: string }
> = [
  {
    key: 'reception',
    color: '#38bdf8',
    width: 210,
    height: 126,
    contents: 'Visitor desk, waiting chairs, incoming document tray',
    standard: 'Front desk clear, visitor chairs aligned, incoming documents sorted daily.',
    labelText: 'Reception owner and visitor standard visible',
    stage: 'set_in_order',
  },
  {
    key: 'workstations',
    color: '#22c55e',
    width: 310,
    height: 190,
    contents: 'Employee desks, laptops, stationery, shared printer access',
    standard: 'Only active work items on desks, cables tied, shared items returned to labeled place.',
    labelText: 'Desk standard photo and cable labels',
    stage: 'shine',
  },
  {
    key: 'storage',
    color: '#f59e0b',
    width: 220,
    height: 160,
    contents: 'Office supplies, PPE, spare labels, cleaning tools',
    standard: 'Shelf positions labeled, min/max stock visible, red-tag box checked weekly.',
    labelText: 'Shelf labels and red-tag location',
    stage: 'sort',
  },
  {
    key: 'meetingRoom',
    color: '#a855f7',
    width: 190,
    height: 150,
    contents: 'Meeting table, chairs, screen, whiteboard markers',
    standard: 'Table clear after each meeting, chairs reset, markers tested.',
    labelText: 'Meeting reset standard',
    stage: 'standardize',
  },
  {
    key: 'breakArea',
    color: '#ef4444',
    width: 220,
    height: 120,
    contents: 'Coffee machine, sink, fridge, waste bins',
    standard: 'Counters wiped, food labeled, waste bins emptied, spill kit visible.',
    labelText: 'Food and cleaning labels',
    stage: 'shine',
  },
  {
    key: 'archive',
    color: '#14b8a6',
    width: 210,
    height: 132,
    contents: 'Document folders, binders, archive boxes',
    standard: 'Folder names follow naming rule, archive index visible, obsolete documents red-tagged.',
    labelText: 'Archive index and folder color rule',
    stage: 'set_in_order',
  },
  {
    key: 'walkway',
    color: '#64748b',
    width: 260,
    height: 86,
    contents: 'Common passage, emergency route, shared access',
    standard: 'Walkway clear, emergency route visible, no temporary storage.',
    labelText: 'Keep clear',
    stage: 'standardize',
  },
];

/**
 * Colours for the paths, in order.
 *
 * Several routes on one plan is the point of the exercise — the operator's
 * walk against the trolley's — so they have to be told apart at a glance, and
 * the first one drawn must not change colour when the second is added.
 */
const routeColours = ['#ef4444', '#2563eb', '#16a34a', '#a855f7', '#f59e0b', '#0891b2'];

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
  const [departments, setDepartments] = useState<Department[]>([]);
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

    Promise.all([
      fiveSLayoutService.getPlans(),
      peopleService.getMembers(),
      peopleService.getDepartments(),
    ])
      .then(([layoutPlans, teamUsers, teamDepartments]) => {
        if (!active) return;
        const layoutPlan = layoutPlans[0];
        setPlans(layoutPlans);
        setPlan(layoutPlan);
        // A zone owner has to be somebody who can still sign in.
        setUsers(teamUsers.filter((member) => member.isActive));
        setDepartments(teamDepartments);
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

  /**
   * A calibration line being drawn, in canvas coordinates.
   *
   * This is how an imported building drawing gets its real size: draw along
   * something whose length somebody has measured, then say what it is.
   * Everything already on the plan resizes with it, so calibrating after
   * drawing does not mean drawing again.
   */
  const [calibration, setCalibration] = useState<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    done?: boolean;
  } | null>(null);
  const [calibrationMetres, setCalibrationMetres] = useState('10');
  /** While on, a drag on the canvas measures instead of selecting. */
  const [calibrationMode, setCalibrationMode] = useState(false);

  /**
   * Which tool the pointer is holding.
   *
   * The editor had no modes at all: buttons added things and a drag always
   * meant "select or move". Drawing a wall needs the drag to mean something
   * else, and a person needs to be able to see which it currently means —
   * guessing from what happens is how a tool feels unpredictable.
   */
  const [tool, setTool] = useState<'select' | 'wall' | 'door' | 'window' | 'route'>('select');
  /**
   * The route being drawn, point by point.
   *
   * A spaghetti diagram is drawn the way it is walked: click where the person
   * starts, click each place they go, and finish where they stop. Held apart
   * from the plan until it is finished, so an abandoned half-route leaves
   * nothing behind.
   */
  const [drawingRoute, setDrawingRoute] = useState<PlanPoint[]>([]);
  /** Set once somebody has chosen how to begin, so the choice is not asked twice. */
  const [started, setStarted] = useState(false);
  /**
   * Every plan the organization has, and which one is on the canvas.
   *
   * A building has a plan per floor. The list is what lets somebody move
   * between them; the canvas only ever holds one, because a floor plan showing
   * two floors at once is a drawing of nowhere.
   */
  const [plans, setPlans] = useState<FiveSLayoutPlan[]>([]);
  /** A wall being drawn, from a fixed corner to wherever the pointer is. */
  const [drawingWall, setDrawingWall] = useState<{ from: Point; to: Point } | null>(null);
  /**
   * The door or window being worked on.
   *
   * Selected separately from zones and objects because it is neither: it is a
   * hole in a wall, and the things you do to it — move it along the wall, hang
   * it on the other jamb, swing it the other way — are its own.
   */
  const [selectedOpeningId, setSelectedOpeningId] = useState('');
  /** An opening being slid along its wall. */
  const [openingDrag, setOpeningDrag] = useState<string>('');
  /**
   * A corner being dragged, and the corner it would join if let go.
   *
   * The second half is what makes closing a room possible: dropping a corner on
   * another means they are the same point, and until the drop is made the one
   * it would join is shown so nobody has to guess whether it will take.
   */
  const [cornerDrag, setCornerDrag] = useState<{ id: string; over: string } | null>(null);
  /**
   * The room being worked on, identified by the corners it runs through.
   *
   * Rooms have no id: they are found afresh from the walls on every redraw, so
   * the only thing that stays the same across one is the set of corners the
   * room runs through.
   */
  const [selectedRoomKey, setSelectedRoomKey] = useState('');
  const selectedOpening = useMemo(
    () => (plan?.openings ?? []).find((opening) => opening.id === selectedOpeningId),
    [plan, selectedOpeningId],
  );

  /**
   * An action, in the reader's language.
   *
   * The rules module says what is missing — an owner, a standard, three red
   * tags — as a key and its numbers. This is the only place that turns one
   * into a sentence, so the register, the queue and a task raised from either
   * cannot word the same finding differently.
   */
  const actionText = (action: ZoneAction) => {
    const params = action.params ?? {};
    const stageParam = params.stageKey ? { stage: t(`fiveS.stage.${params.stageKey}`) } : {};
    const gateParam = params.gateKey ? { item: t(`fiveS.gate.${params.gateKey}`) } : {};

    return t(`fiveS.action.${action.key}`, { ...params, ...stageParam, ...gateParam });
  };

  const nextActionText = (actions: ZoneAction[]) =>
    actions.length ? actionText(actions[0]) : t('fiveS.action.maintain');

  /** How many metres one canvas unit covers, for everything that shows a size. */
  const metresPerUnit = scaleOf(plan);

  /**
   * The colours the plan is drawn in, which follow the application's theme.
   *
   * The plan used to be white with black walls whatever the rest of the page
   * was doing, so at night it was the brightest thing on screen.
   */
  const { isDarkMode } = useTheme();
  const colours = canvasColours(isDarkMode);

  /**
   * The rooms the walls close in.
   *
   * Worked out from the wall graph on every change rather than stored: a room
   * is a consequence of where the walls are, and keeping a second copy would
   * mean the two parting company the first time somebody moved a corner.
   */
  const rooms = useMemo(
    () => detectRooms(plan?.walls ?? [], plan?.corners ?? []),
    [plan?.walls, plan?.corners],
  );

  /**
   * Where the selected zone sits in the building.
   *
   * None of this is stored: the room a zone is in is the room its middle is
   * in, worked out when it is needed. A zone that kept its own copy of which
   * room it was in would be wrong the first time somebody moved a wall.
   */
  const selectedZonePlace = useMemo(() => {
    if (!selectedZone) return null;

    const room = roomForZone(rooms, selectedZone);
    const coverage = zoneCoverage(selectedZone, room, metresPerUnit);

    return {
      room,
      roomName: room ? labelIn(room, plan?.roomLabels ?? [])?.name ?? '' : '',
      coverage,
      split: crossesAWall(selectedZone, plan?.walls ?? [], plan?.corners ?? []),
      tagDensity: perHundredSquareMetres(getRedTagCount(selectedZone), coverage.area),
    };
  }, [selectedZone, rooms, plan, metresPerUnit]);

  /**
   * What each room adds up to.
   *
   * A room is the level people manage at: it has a door, a name, somebody
   * responsible for it, and a floor you can stand in the middle of. Until the
   * plan had rooms the only thing above a zone was the whole site.
   */
  const roomSummaries = useMemo(
    () => summariseRooms(rooms, plan?.zones ?? [], plan?.roomLabels ?? [], metresPerUnit),
    [rooms, plan, metresPerUnit],
  );

  const strayZones = useMemo(
    () => zonesInNoRoom(rooms, plan?.zones ?? []),
    [rooms, plan],
  );

  const selectedRoom = useMemo(
    () => rooms.find((room) => roomKey(room) === selectedRoomKey) ?? null,
    [rooms, selectedRoomKey],
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
            nextAction: nextActionText(gaps),
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
    setActionMessage(t('fiveS.ui.msgUndone'));
  };

  const redo = () => {
    if (!plan || !future.length) return;

    const [next, ...rest] = future;
    setFuture(rest);
    setHistory((entries) => [...entries.slice(-(HISTORY_LIMIT - 1)), plan]);
    commitPlan(next);
    setActionMessage(t('fiveS.ui.msgRedone'));
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
    const { key, ...shape } = template;
    const zone = {
      ...baseZone,
      ...shape,
      name: t(`fiveS.preset.${key}`),
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

  /**
   * Adds one of the catalogue's things, at the size it really is.
   *
   * The size comes from the catalogue in metres and is converted through this
   * plan's scale, so a desk is 1.6 m wide on a plan calibrated from a blueprint
   * and 1.6 m wide on one drawn from scratch. It lands in the middle of what is
   * on screen rather than at a fixed point on the canvas, because a desk
   * appearing somewhere nobody is looking is indistinguishable from nothing
   * happening.
   */
  const addObject = (type: FloorPlanObjectType) => {
    const size = sizeForType(type, metresPerUnit);
    const object = fiveSLayoutService.createObject(
      type,
      size ? { ...dropSpot(view, size), ...size } : undefined,
    );

    updatePlan((current) => ({
      ...current,
      objects: [...current.objects, object],
    }));
    setSelectedZoneId('');
    setSelectedOpeningId('');
    setSelectedObjectId(object.id);
    setActionMessage(
      size
        ? t('fiveS.objectAdded', {
            label: object.label,
            size: formatSize({ width: size.width, height: size.height }, metresPerUnit),
          })
        : `${object.label} added to the floorplan.`,
    );
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

  const startCalibration = () => {
    setCalibration(null);
    setCalibrationMode(true);
  };

  /** Applies the measured line, rescaling the whole plan with it. */
  const applyCalibration = () => {
    if (!calibration) return;

    const pixels = Math.hypot(calibration.to.x - calibration.from.x, calibration.to.y - calibration.from.y);
    const next = calibrate(pixels, Number(calibrationMetres));

    if (!next) {
      setActionMessage(t('fiveS.ui.msgCalibrateHint'));
      return;
    }

    updatePlan((current) => ({ ...current, metresPerUnit: next }));
    setCalibration(null);
    setCalibrationMode(false);
    setActionMessage(
      `Plan calibrated: it is now ${toMetres(CANVAS_WIDTH, next).toFixed(1)} m across.`,
    );
  };

  /**
   * Starts or continues a run of walls.
   *
   * Walls are drawn end to end: releasing one leaves the pointer holding the
   * next, because a room is four walls and making somebody start each of them
   * separately is four times the work for no reason. Escape or switching tool
   * ends the run.
   */
  const placeWallPoint = (rawPoint: Point, straighten: boolean) => {
    if (!plan) return;

    const corners = plan.corners ?? [];
    const existing = cornerAt(corners, rawPoint);
    const point = existing ? { x: existing.x, y: existing.y } : rawPoint;

    if (!drawingWall) {
      setDrawingWall({ from: point, to: point });
      return;
    }

    const end = existing
      ? point
      : snapToAngle(drawingWall.from, point, straighten);

    // Nothing to draw: the pointer never left where it started.
    if (Math.hypot(end.x - drawingWall.from.x, end.y - drawingWall.from.y) < 4) {
      setDrawingWall(null);
      return;
    }

    updatePlan((current) => {
      const withCorners = [...(current.corners ?? [])];

      const idFor = (candidate: Point) => {
        const found = cornerAt(withCorners, candidate);
        if (found) return found.id;

        const made = { id: `corner-${Date.now()}-${withCorners.length}`, x: candidate.x, y: candidate.y };
        withCorners.push(made);
        return made.id;
      };

      const fromId = idFor(drawingWall.from);
      const toId = idFor(end);

      return {
        ...current,
        corners: withCorners,
        walls: [
          ...(current.walls ?? []),
          { id: `wall-${Date.now()}-${(current.walls ?? []).length}`, from: fromId, to: toId, thickness: 10 },
        ],
      };
    });

    // Carry on from where this wall ended.
    setDrawingWall({ from: end, to: end });
  };

  /**
   * Moves the canvas to another floor.
   *
   * The edit in flight is flushed first: switching away with a coalesced save
   * still pending would write this floor's zones onto the one being opened.
   */
  const openPlan = async (id: string) => {
    if (!id || id === plan?.id) return;

    flushPlanSave();
    setLoading(true);

    try {
      const opened = await fiveSLayoutService.getPlan(id);
      setPlan(opened);
      setPlans((current) => current.map((item) => (item.id === opened.id ? opened : item)));
      setSelectedZoneId(opened.zones[0]?.id || '');
      setSelectedObjectId('');
      setSelectedOpeningId('');
      setSelectedRoomKey('');
      setStarted(false);
      setView(FULL_VIEW);
    } finally {
      setLoading(false);
    }
  };

  const addPlan = async () => {
    flushPlanSave();

    const created = await fiveSLayoutService.createPlan({
      name: t('fiveS.planNewName'),
      site: plan?.site || t('fiveS.planNewSite'),
      floor: '',
    });

    // A workspace that keeps a single plan — the demo does — hands back the
    // one it has. Appending it would put the same plan in the list twice and
    // make switching between the two copies look broken.
    if (plans.some((item) => item.id === created.id)) {
      setActionMessage(t('fiveS.planSingleOnly'));
      return;
    }

    setPlans((current) => [...current, created]);
    setPlan(created);
    setSelectedZoneId('');
    setSelectedObjectId('');
    setStarted(false);
    setActionMessage(t('fiveS.planAdded'));
  };

  /**
   * Removes the plan on the canvas.
   *
   * Refused when it is the only one: a workspace with no plan at all has
   * nothing to draw on, and the editor would have to invent one back — which
   * is how somebody's building quietly becomes a blank sheet.
   */
  const removePlan = async () => {
    if (!plan || plans.length < 2) {
      setActionMessage(t('fiveS.planLastOne'));
      return;
    }

    const removed = await fiveSLayoutService.deletePlan(plan.id);

    if (!removed.deleted) {
      setActionMessage(t('fiveS.planRemoveFailed'));
      return;
    }

    const remaining = plans.filter((item) => item.id !== plan.id);
    setPlans(remaining);
    setPlan(remaining[0]);
    setActionMessage(t('fiveS.planRemoved'));
  };

  const stopDrawingWall = () => setDrawingWall(null);

  /**
   * Keeps the route that was drawn, and forgets the one that was not.
   *
   * Two points and some distance between them: a single click that started a
   * route somebody then thought better of is not a path anybody walked, and it
   * would sit in the register at nought metres for ever.
   */
  const finishRoute = () => {
    setDrawingRoute((points) => {
      if (isDrawnRoute(points)) {
        updatePlan((current) => ({
          ...current,
          routes: [
            ...(current.routes ?? []),
            {
              id: `route-${Date.now()}`,
              name: nextRouteName(current.routes ?? [], t('fiveS.routeName')),
              colour: routeColours[(current.routes ?? []).length % routeColours.length],
              points,
            },
          ],
        }));
      }

      return [];
    });
  };

  const removeRoute = (routeId: string) =>
    updatePlan((current) => ({
      ...current,
      routes: (current.routes ?? []).filter((route) => route.id !== routeId),
    }));

  const renameRoute = (routeId: string, name: string) =>
    updatePlan((current) => ({
      ...current,
      routes: (current.routes ?? []).map((route) =>
        route.id === routeId ? { ...route, name } : route,
      ),
    }));

  /**
   * Names the selected room.
   *
   * The name is stored as a point in the middle of the room rather than
   * against the room itself, because there is no room to store it against —
   * move a wall and the name stays where it was put, inside the room it
   * describes.
   */
  const renameSelectedRoom = (name: string) => {
    if (!selectedRoom) return;

    updatePlan((current) => ({
      ...current,
      roomLabels: nameRoom(
        current.roomLabels ?? [],
        selectedRoom,
        name,
        () => `room-label-${Date.now()}`,
      ),
    }));
  };

  /**
   * Drags a corner, which drags every wall that ends on it.
   *
   * This is the gesture a plan is actually adjusted with: a room is the wrong
   * size, so you pull the corner. Redrawing both walls instead loses their
   * openings, their thickness, and any rooms they were part of.
   */
  const dragCornerTo = (id: string, rawPoint: Point, straighten: boolean) => {
    if (!plan) return;

    const point = {
      x: snapToGrid(rawPoint.x, straighten),
      y: snapToGrid(rawPoint.y, straighten),
    };
    const over = cornerNear(plan.corners ?? [], point, id);

    setCornerDrag({ id, over: over?.id ?? '' });
    updatePlan((current) => ({ ...current, corners: moveCorner(current.corners ?? [], id, point) }), {
      skipHistory: true,
    });
  };

  /**
   * Lets go of a corner, joining it to another if it was dropped on one.
   *
   * Two corners a pixel apart is the commonest way a hand-drawn plan quietly
   * fails: nothing encloses, no area ever appears, and there is nothing on
   * screen to say why. Dropping one on the other is how a person says they are
   * the same point, so it has to actually make them one.
   */
  const dropCorner = () => {
    const dragging = cornerDrag;
    setCornerDrag(null);
    if (!dragging?.over || !plan) return;

    updatePlan((current) => {
      const merged = mergeCorners(
        current.corners ?? [],
        current.walls ?? [],
        dragging.id,
        dragging.over,
      );

      return {
        ...current,
        corners: merged.corners,
        walls: merged.walls,
        // A door on a wall that gave way belongs on the wall that stayed;
        // dropping it with the wall would lose an entrance without a word.
        openings: (current.openings ?? []).flatMap((opening) => {
          const replacement = merged.replaced[opening.wallId];
          if (replacement === undefined) return [opening];

          return replacement ? [{ ...opening, wallId: replacement }] : [];
        }),
      };
    });
    setActionMessage(t('fiveS.cornersJoined'));
  };

  /**
   * Puts a door or a window into the wall somebody pointed at.
   *
   * Pointing at the wall is the whole gesture: an opening belongs to a wall, so
   * asking which wall and how far along it would be asking somebody to measure
   * from a corner they have not decided is the first one. A click that misses
   * every wall says so rather than dropping a door on the floor.
   */
  const placeOpening = (point: Point, kind: OpeningKind) => {
    if (!plan) return;

    const hit = wallAtPoint(plan.walls ?? [], plan.corners ?? [], point, 20);

    if (!hit) {
      setActionMessage(t('fiveS.openingNoWall'));
      return;
    }

    const width = defaultWidth(kind, metresPerUnit);
    const length = wallLength(hit.wall, plan.corners ?? []);

    // A door wider than the wall it is in would be a wall-shaped hole.
    if (!wallCanHold(length, width)) {
      setActionMessage(t('fiveS.openingTooShort', { length: formatLength(toMetres(length, metresPerUnit)) }));
      return;
    }

    const opening: Opening = {
      id: `opening-${Date.now()}`,
      wallId: hit.wall.id,
      kind,
      offset: clampOffset(hit.offset, width, length),
      width,
    };

    updatePlan((current) => ({ ...current, openings: [...(current.openings ?? []), opening] }));
    setSelectedOpeningId(opening.id);
    setActionMessage(
      t('fiveS.openingPlaced', {
        kind: t(`fiveS.opening_${kind}`),
        size: formatLength(toMetres(width, metresPerUnit)),
      }),
    );
  };

  const updateOpening = (id: string, change: Partial<Opening>) =>
    updatePlan((current) => ({
      ...current,
      openings: (current.openings ?? []).map((opening) =>
        opening.id === id ? { ...opening, ...change } : opening,
      ),
    }));

  const deleteSelectedOpening = () => {
    if (!selectedOpening) return;

    updatePlan((current) => ({
      ...current,
      openings: (current.openings ?? []).filter((opening) => opening.id !== selectedOpening.id),
    }));
    setSelectedOpeningId('');
    setActionMessage(t('fiveS.openingRemoved', { kind: t(`fiveS.opening_${selectedOpening.kind}`) }));
  };

  /** Slides an opening along the wall it is in; it cannot leave that wall. */
  const dragOpeningTo = (id: string, point: Point) => {
    const opening = (plan?.openings ?? []).find((candidate) => candidate.id === id);
    const wall = (plan?.walls ?? []).find((candidate) => candidate.id === opening?.wallId);
    if (!opening || !wall) return;

    const hit = projectOntoWall(point, wall, plan?.corners ?? []);
    if (!hit) return;

    updateOpening(id, { offset: clampOffset(hit.offset, opening.width, wallLength(wall, plan?.corners ?? [])) });
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
    setActionMessage(t('fiveS.ui.msgReset'));
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
    setActionMessage(t('fiveS.ui.msgBlueprintCleared'));
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

    if (cornerDrag) {
      dragCornerTo(
        cornerDrag.id,
        pointInView(view, event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY),
        (plan?.snapToGrid ?? true) && !event.altKey,
      );
      return;
    }

    if (openingDrag) {
      dragOpeningTo(
        openingDrag,
        pointInView(view, event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY),
      );
      return;
    }

    if (tool === 'wall' && drawingWall) {
      const point = pointInView(view, event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
      const corner = cornerAt(plan?.corners ?? [], point);

      setDrawingWall({
        ...drawingWall,
        to: corner
          ? { x: corner.x, y: corner.y }
          : snapToAngle(drawingWall.from, point, !event.altKey),
      });
      return;
    }

    if (calibration && !calibration.done) {
      setCalibration({
        ...calibration,
        to: pointInView(view, event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY),
      });
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
    const snap = (plan.snapToGrid ?? true) && !event.altKey;
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

    const moved = {
      x: Math.round(clamp(snapToGrid(point.x - drag.offsetX, snap), 8, CANVAS_WIDTH - object.width - 8)),
      y: Math.round(clamp(snapToGrid(point.y - drag.offsetY, snap), 8, CANVAS_HEIGHT - object.height - 8)),
    };

    /*
      Things that stand against a wall go flush and square to it when they are
      dragged near one. Doing that by hand means nudging until it looks right
      and rotating until it looks right, and it is never quite either — which
      is how a plan ends up with a bench half a degree off and a 40 mm gap
      behind it nobody meant to draw. Alt holds it off, the same key that
      already means "no snapping".
    */
    const against =
      catalogueItem(object.type)?.againstWall && !event.altKey
        ? placeAgainstWall({ ...object, ...moved }, plan.walls ?? [], plan.corners ?? [])
        : null;

    updateObject(
      object.id,
      against
        ? { x: Math.round(against.x), y: Math.round(against.y), rotation: against.rotation }
        : moved,
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

    if (!selectedZone && !selectedObject && !selectedOpening && !selectedZoneIds.length) return;

    if (event.key === 'Escape') {
      setContextMenu(null);
      stopDrawingWall();
      // Escape abandons the route rather than keeping it: a half-drawn walk
      // is not a measurement, and the gesture for "I have finished" is the
      // double-click that ends it.
      setDrawingRoute([]);
      setSelectedZoneIds([]);
      setSelectedZoneId('');
      setSelectedObjectId('');
      setSelectedOpeningId('');
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      if (selectedZone) deleteSelectedZone();
      else if (selectedOpening) deleteSelectedOpening();
      else deleteSelectedObject();
      return;
    }

    // An opening moves along its wall, not across the canvas, so the arrow
    // nudges below — which move a box in x and y — are not its gesture.
    if (selectedOpening && !selectedZone && !selectedObject) return;

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
    setActionMessage(
      t('fiveS.ui.msgAdvanced', {
        code: selectedZone.code,
        stage: t(`fiveS.stage.${stageKeys[selectedStageGate.nextStage]}`),
      }),
    );
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
      setActionMessage(t('fiveS.ui.msgLaunchTasksFailed'));
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
      setActionMessage(t('fiveS.ui.msgNoRolloutActions'));
      return;
    }

    try {
      await Promise.all(rolloutQueue.map((item) => createTaskForZone(item.zone, '5S rollout')));
      setActionMessage(`${rolloutQueue.length} filtered rollout task(s) created.`);
    } catch {
      setActionMessage(t('fiveS.ui.msgRolloutTasksFailed'));
    }
  };

  const advanceFilteredReadyStages = () => {
    if (!readyToAdvanceZones.length) {
      setActionMessage(t('fiveS.ui.msgNoneReady'));
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
      setActionMessage(t('fiveS.ui.msgNoOpenRedTags'));
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
              `Owner: ${zone.ownerName || t('fiveS.ui.unassigned')}`,
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
      setActionMessage(t('fiveS.ui.msgRedTagTasksFailed'));
    }
  };

  const createAuditDueTasks = async () => {
    if (!zonesAuditDue.length) {
      setActionMessage(t('fiveS.ui.msgNoAuditsDue'));
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
              `Owner: ${zone.ownerName || t('fiveS.ui.unassigned')}`,
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
      setActionMessage(t('fiveS.ui.msgAuditTasksFailed'));
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
    setActionMessage(t('fiveS.ui.msgLabelsCsv'));
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
        gaps.length ? gaps[0].label : 'Maintain current standard',
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
            gaps.length ? gaps[0].label : 'Maintain current standard',
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
        gaps.map((gap) => gap.label).join('; '),
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
    setActionMessage(t('fiveS.ui.msgBackupExported'));
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
      setActionMessage(t('fiveS.ui.msgImportFailed'));
    }
  };

  const downloadFloorPlanSvg = () => {
    if (!plan || !svgRef.current) return;

    const svg = svgRef.current.cloneNode(true) as SVGSVGElement;
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', String(CANVAS_WIDTH));
    svg.setAttribute('height', String(CANVAS_HEIGHT));
    svg.querySelectorAll('[data-testid]').forEach((element) => element.removeAttribute('data-testid'));

    /*
      A plan leaving the editor is going onto white paper, whatever theme it
      was drawn in. Exporting the night colours would hand somebody a file
      that prints as a black rectangle — and the dark set exists for looking
      at a screen, not for the wall of a plant.
    */
    if (isDarkMode) {
      const day = canvasColours(false);
      svg.querySelectorAll('[data-canvas-background]').forEach((element) => {
        if (element.getAttribute('fill') === colours.paper) element.setAttribute('fill', day.paper);
      });
      svg.querySelectorAll('[stroke], [fill]').forEach((element) => {
        if (element.getAttribute('stroke') === colours.ink) element.setAttribute('stroke', day.ink);
        if (element.getAttribute('fill') === colours.ink) element.setAttribute('fill', day.ink);
        if (element.getAttribute('stroke') === colours.grid) element.setAttribute('stroke', day.grid);
        if (element.getAttribute('stroke') === colours.measure) element.setAttribute('stroke', day.measure);
        if (element.getAttribute('stroke') === colours.paper) element.setAttribute('stroke', day.paper);
      });
    }

    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-floorplan.svg`;
    link.click();
    URL.revokeObjectURL(url);
    setActionMessage(t('fiveS.ui.msgSvgExported'));
  };

  const printZoneLabels = () => {
    if (!plan) return;

    const labels = fiveSLayoutService.buildZoneLabelRows(plan);
    /*
      A square per label, pointing at that zone's page. It is drawn as an SVG
      path in module units and scaled by the sheet, so it stays crisp however
      large the label is printed — a raster at screen resolution does not.

      The address comes from the browser the sheet is printed from, which is
      the address the people who will scan it can reach. A label printed from
      a laptop on the plant network that points at `localhost` is a label that
      works for exactly one person.
    */
    const codes = new Map(
      plan.zones.map((zone) => [
        zone.id,
        qrPath(zoneUrl(window.location.origin, plan.id, zone.id)),
      ]),
    );
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      setActionMessage(t('fiveS.ui.msgPrintFailed'));
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
            .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
            .qr { width: 96px; height: 96px; flex: none; }
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
                    <div class="head">
                      <div>
                        <div class="code">${escapeHtml(label.code)}</div>
                        <div class="zone">${escapeHtml(label.zone)}</div>
                      </div>
                      ${
                        codes.has(label.id)
                          ? `<svg class="qr" viewBox="0 0 ${codes.get(label.id)!.size} ${
                              codes.get(label.id)!.size
                            }" shape-rendering="crispEdges" role="img" aria-label="${escapeHtml(label.code)}">
                              <rect width="${codes.get(label.id)!.size}" height="${
                                codes.get(label.id)!.size
                              }" fill="#ffffff"/>
                              <path d="${codes.get(label.id)!.path}" fill="#111827"/>
                            </svg>`
                          : ''
                      }
                    </div>
                    <div class="meta"><strong>${t('fiveS.ui.labelOwner')}</strong> ${escapeHtml(label.owner)}</div>
                    <div class="meta"><strong>${t('fiveS.ui.labelStage')}</strong> ${escapeHtml(label.stage)}${
                      showAuditControls ? ` / <strong>${t('fiveS.ui.labelCycle')}</strong> ${escapeHtml(label.auditCycle)}` : ''
                    }</div>
                    ${
                      showAuditControls
                        ? `<div class="meta"><strong>${t('fiveS.ui.labelLastScore')}</strong> ${escapeHtml(label.lastAuditScore || '-')}</div>
                    <div class="meta"><strong>${t('fiveS.ui.labelLastAudit')}</strong> ${escapeHtml(label.lastAuditAt || '-')}</div>`
                        : ''
                    }
                    <div class="meta"><strong>${t('fiveS.ui.labelRedTags')}</strong> ${escapeHtml(label.redTags)} / <strong>${t('fiveS.ui.labelCleaned')}</strong> ${escapeHtml(label.lastCleaned || '-')}</div>
                    <div class="meta"><strong>${t('fiveS.ui.labelContents')}</strong> ${escapeHtml(label.contents || '-')}</div>
                    <div class="standard"><strong>${t('fiveS.ui.labelStandard')}</strong> ${escapeHtml(label.standard || '-')}</div>
                    <div class="meta"><strong>${t('fiveS.ui.labelLabel')}</strong> ${escapeHtml(label.labelNote || '-')}</div>
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
    setActionMessage(t('fiveS.ui.msgLabelsPrint'));
  };

  if (loading || !plan) {
    return (
      <Card loading title={t('fiveS.title')}>
        <div />
      </Card>
    );
  }

  /**
   * A plan with nothing on it is a new workspace, not a broken one.
   *
   * It used to be filled with a sample office nobody asked for. The question
   * is asked instead — and only while the plan really is empty, so it never
   * appears in front of work somebody has already done.
   */
  if (!started && !plan.zones.length && !plan.objects.length && !(plan.walls ?? []).length) {
    return (
      <Card title={t('fiveS.title')}>
        <FloorPlanStart
          onBlank={() => setStarted(true)}
          onTemplate={(template) => {
            updatePlan((current) => ({
              ...current,
              corners: template.corners,
              walls: template.walls,
            }));
            setStarted(true);
            setTool('wall');
          }}
          onBlueprint={(dataUrl) => {
            // Straight into calibrating: a traced drawing is worth nothing
            // until the plan knows what one of its walls measures.
            updatePlan((current) => ({ ...current, backgroundImage: dataUrl, backgroundOpacity: 0.55 }));
            setStarted(true);
            setTool('select');
            setCalibrationMode(true);
          }}
        />
      </Card>
    );
  }

  return (
    <Card
      title={t('fiveS.title')}
      subtitle={t('fiveS.setupSubtitle', {
        site: plan.site,
        zones: readiness.zones,
        rate: readiness.rate,
      })}
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            icon={Undo2}
            onClick={undo}
            disabled={!history.length}
            title={t('fiveS.ui.undoTitle')}
            type="button"
          >
            {t('fiveS.ui.undo')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Redo2}
            onClick={redo}
            disabled={!future.length}
            title={t('fiveS.ui.redoTitle')}
            type="button"
          >
            {t('fiveS.ui.redo')}
          </Button>
          <Button variant="outline" size="sm" icon={Download} onClick={downloadZoneLabels} type="button">
            CSV
          </Button>
          <Button variant="outline" size="sm" icon={Download} onClick={downloadFloorPlanSvg} type="button">
            {t('fiveS.ui.mapSvg')}
          </Button>
          <Button variant="outline" size="sm" icon={Download} onClick={downloadPlanJson} type="button">
            {t('fiveS.ui.backup')}
          </Button>
          <Button variant="outline" size="sm" icon={Upload} onClick={() => importInputRef.current?.click()} type="button">
            {t('fiveS.ui.import')}
          </Button>
          <Button variant="outline" size="sm" icon={Printer} onClick={printZoneLabels} type="button">
            {t('fiveS.ui.print')}
          </Button>
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={resetPlan} type="button">
            {t('fiveS.ui.reset')}
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
          {/*
            Which floor is on the canvas. A building has a plan per floor, and
            without this the editor could only ever open the first one — which
            is what it did when an organization was allowed exactly one plan.
          */}
          <label className="block text-sm text-gray-600 dark:text-gray-400">
            {t('fiveS.planPicker')}
            <div className="mt-1 flex gap-2">
              <select
                className={fieldClass}
                value={plan.id}
                onChange={(event) => void openPlan(event.target.value)}
              >
                {plans.map((item) => (
                  <option key={item.id} value={item.id}>
                    {[item.site, item.floor, item.name].filter(Boolean).join(' · ')}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label={t('fiveS.planAdd')}
                title={t('fiveS.planAdd')}
                className="rounded-lg border border-gray-300 px-3 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                onClick={() => void addPlan()}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={t('fiveS.planRemove')}
                title={t('fiveS.planRemove')}
                disabled={plans.length < 2}
                className="rounded-lg border border-gray-300 px-3 text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                onClick={() => void removePlan()}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </label>

          <label className="block text-sm text-gray-600 dark:text-gray-400">
            {t('fiveS.floorName')}
            <input
              className={fieldClass}
              value={plan.floor ?? ''}
              placeholder={t('fiveS.floorPlaceholder')}
              onChange={(event) => updatePlan((current) => ({ ...current, floor: event.target.value }))}
            />
          </label>

          <label className="block text-sm text-gray-600 dark:text-gray-400">
            {t('fiveS.mapName')}
            <input
              className={fieldClass}
              value={plan.name}
              onChange={(event) => updatePlan((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label className="block text-sm text-gray-600 dark:text-gray-400">
            {t('fiveS.siteName')}
            <input
              className={fieldClass}
              value={plan.site}
              onChange={(event) => updatePlan((current) => ({ ...current, site: event.target.value }))}
            />
          </label>
          {/*
            The scale used to be free text — `1 square = 1 meter`, a note to
            the reader that no code could act on. It is a number now, and
            everything that shows a size reads it.
          */}
          <label className="block text-sm text-gray-600 dark:text-gray-400">
            {t('fiveS.planWidth')}
            <input
              className={fieldClass}
              min={1}
              step={0.5}
              type="number"
              value={Number(toMetres(CANVAS_WIDTH, metresPerUnit).toFixed(1))}
              onChange={(event) => {
                const metres = Number(event.target.value);
                if (!(metres > 0)) return;

                // Said as the width of the whole plan, because that is a
                // number somebody knows about their building. One unit in
                // metres is not.
                updatePlan((current) => ({ ...current, metresPerUnit: metres / CANVAS_WIDTH }));
              }}
            />
            <span className="mt-1 block text-xs text-gray-500">
              {t('fiveS.planSize', {
                width: toMetres(CANVAS_WIDTH, metresPerUnit).toFixed(1),
                height: toMetres(CANVAS_HEIGHT, metresPerUnit).toFixed(1),
              })}
            </span>
          </label>
        </div>

        <div className="grid gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700 md:grid-cols-[auto_auto_minmax(180px,1fr)_auto]">
          <Button variant="outline" icon={Upload} onClick={() => backgroundInputRef.current?.click()} type="button">
            {t('fiveS.ui.blueprint')}
          </Button>
          <Button variant="outline" icon={Trash2} onClick={clearBackgroundImage} disabled={!plan.backgroundImage} type="button">
            {t('fiveS.ui.clear')}
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
              checked={colorMode === 'condition'}
              onChange={(event) => setColorMode(event.target.checked ? 'condition' : 'plan')}
            />
            {t('fiveS.ui.colourByScore')}
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
            <div className="text-xs text-gray-500">{t('fiveS.ui.zones')}</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{readiness.zones}</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="text-xs text-gray-500">{t('fiveS.ui.owners')}</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{readiness.withOwner}</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="text-xs text-gray-500">{t('fiveS.ui.contents')}</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{readiness.withContents}</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="text-xs text-gray-500">{t('fiveS.ui.standards')}</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{readiness.withStandard}</div>
          </div>
          <div className="rounded-lg border border-red-200 p-3 dark:border-red-900/70">
            <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t('fiveS.ui.redTags')}
            </div>
            <div className="mt-1 text-2xl font-semibold text-red-700 dark:text-red-300">{readiness.redTags}</div>
          </div>
          {showAuditControls && (
            <>
              <div className="rounded-lg border border-blue-200 p-3 dark:border-blue-900/70">
                <div className="text-xs text-blue-700 dark:text-blue-300">{t('fiveS.ui.auditsDue')}</div>
                <div className="mt-1 text-2xl font-semibold text-blue-700 dark:text-blue-300">{readiness.auditDue}</div>
              </div>
              <div className="rounded-lg border border-amber-200 p-3 dark:border-amber-900/70">
                <div className="text-xs text-amber-700 dark:text-amber-300">{t('fiveS.ui.riskAreas')}</div>
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
                {t('fiveS.ui.redTagTasks')}
              </Button>
              {showAuditControls && (
                <Button variant="outline" size="sm" icon={ClipboardList} onClick={createAuditDueTasks} type="button">
                  {t('fiveS.ui.auditTasks')}
                </Button>
              )}
              <Button variant="outline" size="sm" icon={ListChecks} onClick={createLaunchTasks} type="button">
                {t('fiveS.ui.createLaunchTasks')}
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
                  {t(`fiveS.filter.${option.key}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-gray-600 dark:text-gray-400">
            Owner
            <select className={fieldClass} value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
              <option value="all">{t('fiveS.ui.allOwners')}</option>
              <option value="unassigned">{t('fiveS.ui.unassigned')}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {memberName(user)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <Button fullWidth variant="outline" icon={Download} onClick={downloadAreaRegisterCsv} type="button">
              {t('fiveS.ui.exportRegister')}
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
                {t('fiveS.ui.exportQueue')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={ArrowRight}
                onClick={advanceFilteredReadyStages}
                disabled={!readyToAdvanceZones.length}
                type="button"
              >
                {t('fiveS.ui.advanceReady')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={ListChecks}
                onClick={createFilteredRolloutTasks}
                disabled={!rolloutQueue.length}
                type="button"
              >
                {t('fiveS.ui.createQueueTasks')}
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
                  <div className="mt-1 text-xs text-gray-500">{item.zone.ownerName || t('fiveS.ui.unassigned')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-800 dark:text-gray-100">{item.nextAction}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>{t(`fiveS.stage.${stageKeys[item.zone.stage]}`)}</span>
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
                    {t('fiveS.ui.select')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ClipboardList}
                    onClick={() => createRolloutQueueTask(item.zone)}
                    type="button"
                  >
                    {t('fiveS.ui.task')}
                  </Button>
                </div>
              </div>
            ))}
            {!rolloutQueue.length && (
              <div className="px-4 py-6 text-sm text-gray-500">{t('fiveS.ui.noRolloutActions')}</div>
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
                  {t('fiveS.ui.exportWalk')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={ClipboardList}
                  onClick={createAuditDueTasks}
                  disabled={!zonesAuditDue.length}
                  type="button"
                >
                  {t('fiveS.ui.auditTasks')}
                </Button>
              </div>
            </div>
            <div className="grid gap-3 border-b border-gray-200 p-4 dark:border-gray-700 md:grid-cols-4">
              <div className="rounded-lg border border-red-200 p-3 text-sm dark:border-red-900/70">
                <div className="text-xs text-red-600 dark:text-red-300">{t('fiveS.ui.overdue')}</div>
                <div className="mt-1 text-xl font-semibold text-red-700 dark:text-red-300">{auditWalkSummary.overdue}</div>
              </div>
              <div className="rounded-lg border border-blue-200 p-3 text-sm dark:border-blue-900/70">
                <div className="text-xs text-blue-600 dark:text-blue-300">{t('fiveS.ui.dueToday')}</div>
                <div className="mt-1 text-xl font-semibold text-blue-700 dark:text-blue-300">{auditWalkSummary.dueToday}</div>
              </div>
              <div className="rounded-lg border border-amber-200 p-3 text-sm dark:border-amber-900/70">
                <div className="text-xs text-amber-600 dark:text-amber-300">{t('fiveS.ui.next7Days')}</div>
                <div className="mt-1 text-xl font-semibold text-amber-700 dark:text-amber-300">{auditWalkSummary.upcoming}</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                <div className="text-xs text-gray-500">{t('fiveS.ui.scheduled')}</div>
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
                    <div className="mt-1 text-xs text-gray-500">{item.zone.ownerName || t('fiveS.ui.unassigned')}</div>
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
                        {t(`fiveS.walk.${item.timing.status}`, {
                          days: Math.abs(item.timing.daysUntil),
                        })}
                      </span>
                      <span className="text-gray-500">
                        {t('fiveS.ui.labelLastAudit')} {item.zone.lastAuditAt || '-'}
                      </span>
                      <span className="text-gray-500">
                        {t('fiveS.ui.colScore')}{' '}
                        {item.zone.lastAuditScore === undefined ? '-' : `${item.zone.lastAuditScore}%`}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" icon={UserCheck} onClick={() => useZoneForAudit(item.zone)} type="button">
                      {t('fiveS.ui.audit')}
                    </Button>
                    <Button variant="outline" size="sm" icon={CheckCircle2} onClick={() => markZoneWalkedToday(item.zone)} type="button">
                      {t('fiveS.ui.walked')}
                    </Button>
                  </div>
                </div>
              ))}
              {!auditWalkItems.length && <div className="px-4 py-6 text-sm text-gray-500">{t('fiveS.ui.noAreasForWalk')}</div>}
            </div>
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)_320px]">
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <MapIcon className="h-4 w-4" />
              {t('fiveS.ui.floorplan')}
            </div>
            <Button fullWidth size="sm" icon={Plus} onClick={addZone} type="button">
              {t('fiveS.ui.blankArea')}
            </Button>
            <div className="mt-4 max-h-[420px] space-y-4 overflow-y-auto pr-1 md:max-h-[520px]">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase text-gray-500">{t('fiveS.ui.areaPresets')}</div>
                <div className="grid grid-cols-2 gap-2">
                  {zoneTemplates.map((template) => (
                    <button
                      key={template.key}
                      type="button"
                      onClick={() => addZoneFromTemplate(template)}
                      className="flex min-h-[54px] flex-col items-start justify-between rounded-lg border border-gray-200 px-2.5 py-2 text-left text-xs text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <span className="h-2.5 w-8 rounded-full" style={{ backgroundColor: template.color }} />
                      <span className="font-medium">{t(`fiveS.preset.${template.key}`)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                {/*
                  Each thing says what it measures. A person choosing between a
                  desk and a workbench for a 3 m wall can see which one fits
                  before placing it, and a size on the button is also the plain
                  statement that these are real dimensions rather than shapes.
                */}
                {catalogueGroups.map((group) => (
                  <div key={group}>
                    <div className="mb-2 text-xs font-semibold uppercase text-gray-500">
                      {t(`fiveS.catalogueGroup.${group}`)}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {catalogue
                        .filter((item) => item.group === group)
                        .map((item) => {
                          const Icon = shapeIcons[item.type] ?? Square;

                          return (
                            <button
                              key={item.type}
                              type="button"
                              onClick={() => addObject(item.type)}
                              className="flex min-h-[42px] items-start gap-2 rounded-lg border border-gray-200 px-2.5 py-2 text-left text-xs text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                              <Icon className="mt-0.5 h-4 w-4 flex-none" />
                              <span className="leading-tight">
                                {t(`fiveS.object.${item.type}`)}
                                <span className="block text-[10px] tabular-nums text-gray-500 dark:text-gray-400">
                                  {item.metres.width} × {item.metres.depth} m
                                </span>
                              </span>
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
                    <span className="text-gray-500">{t(`fiveS.stage.${stageKeys[item.stage]}`)}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{item.count}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                <div className="mb-2 text-xs font-semibold uppercase text-gray-500">{t('fiveS.ui.colorLegend')}</div>
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
              <div className="flex items-center gap-2">
                {/*
                  A mode, shown rather than guessed at. Without this the same
                  drag meant "move something" and "draw a wall" depending on
                  state nobody could see.
                */}
                <div role="radiogroup" aria-label={t('fiveS.tools')} className="flex gap-0.5 rounded-md border border-gray-300 p-0.5 dark:border-gray-600">
                  {(
                    [
                      ['select', t('fiveS.toolSelect')],
                      ['wall', t('fiveS.toolWall')],
                      ['door', t('fiveS.toolDoor')],
                      ['window', t('fiveS.toolWindow')],
                      ['route', t('fiveS.toolRoute')],
                    ] as Array<['select' | 'wall' | 'door' | 'window' | 'route', string]>
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      data-testid={`tool-${value}`}
                      aria-checked={tool === value}
                      className={`rounded px-2 py-1 text-xs ${
                        tool === value
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => {
                        stopDrawingWall();
                        finishRoute();
                        setTool(value);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {/*
                  Three separate questions, which one checkbox called "Grid"
                  used to answer at once: turning the grid off to look at the
                  plan also turned snapping off, silently, and the next thing
                  dragged landed a few millimetres out with nothing to say why.
                */}
                <div className="flex gap-0.5 rounded-md border border-gray-300 p-0.5 dark:border-gray-600">
                  {(
                    [
                      ['showGrid', t('fiveS.toggleGrid'), plan.showGrid ?? true],
                      ['snapToGrid', t('fiveS.toggleSnap'), plan.snapToGrid ?? true],
                      ['showDimensions', t('fiveS.toggleDimensions'), plan.showDimensions ?? false],
                    ] as Array<['showGrid' | 'snapToGrid' | 'showDimensions', string, boolean]>
                  ).map(([field, label, on]) => (
                    <button
                      key={field}
                      type="button"
                      aria-pressed={on}
                      className={`rounded px-2 py-1 text-xs ${
                        on
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => updatePlan((current) => ({ ...current, [field]: !on }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={`rounded-md border px-2 py-1 text-xs ${
                    calibrationMode
                      ? 'border-red-400 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => (calibrationMode ? setCalibrationMode(false) : startCalibration())}
                >
                  {calibrationMode ? t('fiveS.calibrateCancel') : t('fiveS.calibrate')}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('fiveS.canvasHint')}</p>
              </div>
            </div>

            {/*
              Shown only while measuring. The length is asked for after the
              line is drawn rather than before, because nobody knows which wall
              they are going to use until they are looking at the drawing.
            */}
            {calibrationMode && (
              <div className="flex flex-wrap items-center gap-2 border-b border-red-200 bg-red-50/60 px-3 py-2 dark:border-red-900 dark:bg-red-950/20">
                <span className="text-xs text-red-800 dark:text-red-300">
                  {calibration?.done ? t('fiveS.calibrateLength') : t('fiveS.calibrateDraw')}
                </span>
                {calibration?.done && (
                  <>
                    <input
                      autoFocus
                      className="w-24 rounded-md border border-red-300 px-2 py-1 text-sm dark:border-red-800 dark:bg-gray-900"
                      min={0.1}
                      step={0.1}
                      type="number"
                      aria-label={t('fiveS.calibrateLength')}
                      value={calibrationMetres}
                      onChange={(event) => setCalibrationMetres(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && applyCalibration()}
                    />
                    <span className="text-xs text-red-800 dark:text-red-300">m</span>
                    <button
                      type="button"
                      className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                      onClick={applyCalibration}
                    >
                      {t('fiveS.calibrateApply')}
                    </button>
                  </>
                )}
              </div>
            )}

            {/*
              Only while several areas are selected: alignment of one area
              against itself does nothing, and a row of buttons that never do
              anything is worse than no row at all.
            */}
            {/*
              A selected room: what it measures, and what it is called.
              The area is not editable and never will be — it is the
              consequence of where the walls are, and a room whose area could
              be typed would be a room that disagreed with its own drawing.
            */}
            {selectedRoom && (
              <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-blue-50/40 px-3 py-2 dark:border-gray-700 dark:bg-blue-950/20">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {t('fiveS.room')}
                </span>
                <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                  {t('fiveS.roomName')}
                  <input
                    className="w-48 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
                    value={labelIn(selectedRoom, plan.roomLabels ?? [])?.name ?? ''}
                    placeholder={t('fiveS.roomNamePlaceholder')}
                    onChange={(event) => renameSelectedRoom(event.target.value)}
                  />
                </label>
                <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                  {formatArea(areaInMetres(selectedRoom.area, metresPerUnit))}
                </span>
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-white dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  onClick={() => setSelectedRoomKey('')}
                >
                  {t('fiveS.roomDone')}
                </button>
              </div>
            )}
            {/*
              What a selected door or window can be told, in the units it is
              actually specified in. A door is ordered at 900 mm, so that is
              what this asks for — not a percentage of a wall or a number of
              pixels, which nobody can check against anything.
            */}
            {selectedOpening && (
              <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-blue-50/40 px-3 py-2 dark:border-gray-700 dark:bg-blue-950/20">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {t(`fiveS.opening_${selectedOpening.kind}`)}
                </span>
                <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                  {t('fiveS.openingWidth')}
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm tabular-nums dark:border-gray-600 dark:bg-gray-900"
                    value={Number(toMetres(selectedOpening.width, metresPerUnit).toFixed(2))}
                    onChange={(event) => {
                      const metres = Number(event.target.value);
                      if (!Number.isFinite(metres) || metres <= 0) return;

                      const wall = (plan.walls ?? []).find((candidate) => candidate.id === selectedOpening.wallId);
                      const length = wall ? wallLength(wall, plan.corners ?? []) : 0;
                      const width = toUnits(metres, metresPerUnit);

                      // Refused rather than clamped: silently narrowing a door
                      // somebody has measured is worse than not taking it.
                      if (!wallCanHold(length, width)) {
                        setActionMessage(
                          t('fiveS.openingTooShort', {
                            length: formatLength(toMetres(length, metresPerUnit)),
                          }),
                        );
                        return;
                      }

                      updateOpening(selectedOpening.id, {
                        width,
                        offset: clampOffset(selectedOpening.offset, width, length),
                      });
                    }}
                  />
                  m
                </label>
                {selectedOpening.kind !== 'window' && (
                  <>
                    <button
                      type="button"
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-white dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                      onClick={() =>
                        updateOpening(selectedOpening.id, {
                          hinge: selectedOpening.hinge === 'to' ? 'from' : 'to',
                        })
                      }
                    >
                      {t('fiveS.openingHinge')}
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-white dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                      onClick={() => updateOpening(selectedOpening.id, { flip: !selectedOpening.flip })}
                    >
                      {t('fiveS.openingSide')}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                  onClick={deleteSelectedOpening}
                >
                  {t('fiveS.openingRemove')}
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('fiveS.openingDragHint')}</span>
              </div>
            )}
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
              onDoubleClick={() => {
                // The end of a walk: the last click placed the final point.
                if (tool === 'route') finishRoute();
              }}
              onPointerDown={(event) => {
                setContextMenu(null);
                if (startPanIfRequested(event)) return;

                if (tool === 'wall' && svgRef.current) {
                  placeWallPoint(
                    pointInView(view, svgRef.current.getBoundingClientRect(), event.clientX, event.clientY),
                    !event.altKey,
                  );
                  return;
                }

                if (tool === 'route' && svgRef.current) {
                  const point = pointInView(
                    view,
                    svgRef.current.getBoundingClientRect(),
                    event.clientX,
                    event.clientY,
                  );

                  setDrawingRoute((points) => addRoutePoint(points, point));
                  return;
                }

                if ((tool === 'door' || tool === 'window') && svgRef.current) {
                  placeOpening(
                    pointInView(view, svgRef.current.getBoundingClientRect(), event.clientX, event.clientY),
                    tool === 'door' && event.altKey ? 'double_door' : tool,
                  );
                  return;
                }

                if (calibrationMode && svgRef.current) {
                  const point = pointInView(
                    view,
                    svgRef.current.getBoundingClientRect(),
                    event.clientX,
                    event.clientY,
                  );

                  capturePointer(event);
                  setCalibration({ from: point, to: point });
                  return;
                }

                if (event.target === event.currentTarget || (event.target as SVGElement).dataset.canvasBackground) {
                  startMarquee(event);
                }
              }}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={(event) => {
                endPan();
                setOpeningDrag('');
                dropCorner();

                if (tool === 'wall' && drawingWall) {
      const point = pointInView(view, event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
      const corner = cornerAt(plan?.corners ?? [], point);

      setDrawingWall({
        ...drawingWall,
        to: corner
          ? { x: corner.x, y: corner.y }
          : snapToAngle(drawingWall.from, point, !event.altKey),
      });
      return;
    }

    if (calibration && !calibration.done) {
                  setCalibration({ ...calibration, done: true });
                  return;
                }

                endMarquee(event.shiftKey || event.ctrlKey || event.metaKey);
                setDrag(null);
              }}
              onPointerLeave={() => {
                endPan();
                setOpeningDrag('');
                dropCorner();
                endMarquee(false);
                setDrag(null);
              }}
            >
              <defs>
                <pattern id="five-s-grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                  <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke={colours.grid} strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect
                data-canvas-background="true"
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                fill={colours.paper}
              />
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

              {/*
                Rooms first, then walls, then everything else: a room is the
                floor and has to sit under what stands on it.
              */}
              {rooms.map((room) => {
                const key = roomKey(room);
                const selected = key === selectedRoomKey;
                const label = labelIn(room, plan.roomLabels ?? []);
                const centre = roomCentre(room);

                return (
                  <g key={key}>
                    {/*
                      The floor is clickable, which is how a room gets named:
                      there is nowhere else to click that means "this room".
                      It stays behind everything, so a zone or a desk standing
                      on it is still what a click on them means.
                    */}
                    <path
                      d={roomPath(room)}
                      fill={selected ? `${colours.roomSelected}20` : colours.roomFill}
                      stroke={selected ? colours.roomSelected : 'none'}
                      strokeWidth={selected ? 1.5 : 0}
                      className={tool === 'select' ? 'cursor-pointer' : 'cursor-crosshair'}
                      data-testid={`five-s-room-${key}`}
                      aria-label={label?.name || t('fiveS.roomUnnamed')}
                      onPointerDown={(event) => {
                        if (tool !== 'select') return;

                        event.stopPropagation();
                        setSelectedZoneId('');
                        setSelectedObjectId('');
                        setSelectedOpeningId('');
                        setSelectedRoomKey(key);
                      }}
                    />
                    <text
                      x={label?.x ?? centre.x}
                      y={label?.y ?? centre.y}
                      textAnchor="middle"
                      className="fill-gray-600 font-medium dark:fill-gray-200"
                      style={{ fontSize: view.width * 0.02 }}
                      pointerEvents="none"
                    >
                      {label?.name ?? ''}
                    </text>
                    <text
                      x={label?.x ?? centre.x}
                      y={(label?.y ?? centre.y) + view.height * (label ? 0.034 : 0)}
                      textAnchor="middle"
                      className="fill-gray-500 tabular-nums dark:fill-gray-400"
                      style={{ fontSize: view.width * 0.018 }}
                      pointerEvents="none"
                    >
                      {formatArea(areaInMetres(room.area, metresPerUnit))}
                    </text>
                  </g>
                );
              })}

              {(plan.walls ?? []).map((wall) => {
                const ends = endsOf(wall, plan.corners ?? []);
                if (!ends) return null;

                return (
                  <g key={wall.id}>
                    {/*
                      The pieces left standing either side of the openings, not
                      one line with a door drawn over it: a door that does not
                      remove wall is a picture of a door.
                    */}
                    {wallSegments(wall, plan.corners ?? [], plan.openings ?? []).map((segment, index) => (
                      <line
                        key={`${wall.id}-${index}`}
                        x1={segment.from.x}
                        y1={segment.from.y}
                        x2={segment.to.x}
                        y2={segment.to.y}
                        stroke={colours.ink}
                        strokeWidth={wall.thickness}
                        strokeLinecap="butt"
                      />
                    ))}
                    {/*
                      Only while the wall tool is in hand. Every wall labelled
                      all the time buries the plan under its own measurements.
                    */}
                    {(tool === 'wall' || (plan.showDimensions ?? false)) && (
                      <text
                        x={(ends.from.x + ends.to.x) / 2}
                        y={(ends.from.y + ends.to.y) / 2 - view.height * 0.016}
                        textAnchor="middle"
                        className="fill-gray-600 tabular-nums dark:fill-gray-300"
                        style={{ fontSize: view.width * 0.016 }}
                        pointerEvents="none"
                      >
                        {formatLength(toMetres(wallLength(wall, plan.corners ?? []), metresPerUnit))}
                      </text>
                    )}
                  </g>
                );
              })}

              {/*
                The paths people and parts take. Drawn over the walls because
                a route that disappears behind a partition is a route nobody
                can follow, and dashed so it reads as a movement rather than
                as something built.
              */}
              {(plan.routes ?? []).map((route) => {
                const anchor = routeLabelAnchor(route.points ?? []);

                return (
                  <g key={route.id} pointerEvents="none">
                    <polyline
                      points={routePoints(route.points ?? [])}
                      fill="none"
                      stroke={route.colour}
                      strokeWidth={Math.max(2, view.width * 0.004)}
                      strokeDasharray={`${view.width * 0.012} ${view.width * 0.008}`}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.9}
                    />
                    {(route.points ?? []).map((point, index) => (
                      <circle
                        key={`${route.id}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={Math.max(2, view.width * 0.004)}
                        fill={route.colour}
                      />
                    ))}
                    {anchor && (
                      <text
                        x={anchor.x}
                        y={anchor.y - view.height * 0.012}
                        textAnchor="middle"
                        className="tabular-nums"
                        fill={route.colour}
                        style={{ fontSize: view.width * 0.016 }}
                      >
                        {`${route.name} · ${formatLength(routeLength(route, metresPerUnit))}`}
                      </text>
                    )}
                  </g>
                );
              })}

              {/*
                The one being drawn, so somebody can see what they have walked
                so far and how long it is before they commit to it.
              */}
              {drawingRoute.length > 0 && (
                <g pointerEvents="none">
                  <polyline
                    points={routePoints(drawingRoute)}
                    fill="none"
                    stroke={routeColours[(plan.routes ?? []).length % routeColours.length]}
                    strokeWidth={Math.max(2, view.width * 0.004)}
                    strokeDasharray={`${view.width * 0.012} ${view.width * 0.008}`}
                  />
                  {drawingRoute.map((point, index) => (
                    <circle
                      key={`drawing-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r={Math.max(2, view.width * 0.004)}
                      fill={routeColours[(plan.routes ?? []).length % routeColours.length]}
                    />
                  ))}
                  {drawingRoute.length > 1 && (
                    <text
                      x={drawingRoute[drawingRoute.length - 1].x}
                      y={drawingRoute[drawingRoute.length - 1].y - view.height * 0.016}
                      textAnchor="middle"
                      className="tabular-nums"
                      fill={routeColours[(plan.routes ?? []).length % routeColours.length]}
                      style={{ fontSize: view.width * 0.016 }}
                    >
                      {formatLength(routeLength({ points: drawingRoute }, metresPerUnit))}
                    </text>
                  )}
                </g>
              )}

              {/*
                Doors and windows, in the gaps their walls were cut for them.
                A door carries the quarter circle its leaf sweeps, which is the
                one drawing convention here that is a fact about the floor: the
                square metre it covers is not floor anything can stand on.
              */}
              {(plan.openings ?? []).map((opening) => {
                const wall = (plan.walls ?? []).find((candidate) => candidate.id === opening.wallId);
                const geometry = wall ? openingGeometry(opening, wall, plan.corners ?? []) : null;
                if (!wall || !geometry) return null;

                const selected = opening.id === selectedOpeningId;
                const jamb = wall.thickness;
                const swing = opening.kind === 'window' ? null : doorSwing(opening, geometry);

                return (
                  <g key={opening.id}>
                    {/* The reveal: the wall's depth shown at each jamb. */}
                    <line
                      x1={geometry.start.x}
                      y1={geometry.start.y}
                      x2={geometry.end.x}
                      y2={geometry.end.y}
                      stroke={selected ? '#2563eb' : '#94a3b8'}
                      strokeWidth={opening.kind === 'window' ? jamb * 0.45 : 1.2}
                      pointerEvents="none"
                    />
                    {opening.kind === 'window' && (
                      <line
                        x1={geometry.start.x}
                        y1={geometry.start.y}
                        x2={geometry.end.x}
                        y2={geometry.end.y}
                        stroke={colours.paper}
                        strokeWidth={jamb * 0.15}
                        pointerEvents="none"
                      />
                    )}
                    {swing && (
                      <>
                        <line
                          x1={swing.hinge.x}
                          y1={swing.hinge.y}
                          x2={swing.tip.x}
                          y2={swing.tip.y}
                          stroke={selected ? '#2563eb' : '#1f2937'}
                          strokeWidth={2}
                          pointerEvents="none"
                        />
                        <path
                          d={swing.path}
                          fill="none"
                          stroke={selected ? '#2563eb' : '#94a3b8'}
                          strokeWidth={1}
                          strokeDasharray="4 3"
                          pointerEvents="none"
                        />
                      </>
                    )}
                    {/*
                      A hit target as wide as the wall is thick. Aiming at a
                      one-pixel line is not a thing anybody should have to do.
                    */}
                    <line
                      x1={geometry.start.x}
                      y1={geometry.start.y}
                      x2={geometry.end.x}
                      y2={geometry.end.y}
                      stroke="transparent"
                      strokeWidth={Math.max(jamb * 1.6, 12)}
                      className={tool === 'select' ? 'cursor-move' : 'cursor-crosshair'}
                      aria-label={t(`fiveS.opening_${opening.kind}`)}
                      onPointerDown={(event) => {
                        if (tool !== 'select') return;

                        event.stopPropagation();
                        capturePointer(event);
                        setSelectedZoneId('');
                        setSelectedObjectId('');
                        setSelectedOpeningId(opening.id);
                        beginDragHistory();
                        setOpeningDrag(opening.id);
                      }}
                    />
                    {selected && (
                      <text
                        x={geometry.centre.x}
                        y={geometry.centre.y - view.height * 0.016}
                        textAnchor="middle"
                        className="fill-blue-600 tabular-nums"
                        style={{ fontSize: view.width * 0.016 }}
                        pointerEvents="none"
                      >
                        {formatLength(toMetres(opening.width, metresPerUnit))}
                      </text>
                    )}
                  </g>
                );
              })}

              {/*
                Corners are handles, not decoration. Dragging one moves every
                wall that ends on it, and dropping it on another joins them —
                which is how a room that never quite closed gets closed.
              */}
              {(plan.corners ?? []).map((corner) => {
                const dragging = cornerDrag?.id === corner.id;
                const joining = Boolean(dragging && cornerDrag?.over) || cornerDrag?.over === corner.id;

                return (
                  <g key={corner.id}>
                    <circle
                      cx={corner.x}
                      cy={corner.y}
                      r={joining ? 9 : 5}
                      fill={joining ? colours.roomSelected : colours.ink}
                      pointerEvents="none"
                    />
                    <circle
                      cx={corner.x}
                      cy={corner.y}
                      r={14}
                      fill="transparent"
                      className={tool === 'select' ? 'cursor-move' : 'cursor-crosshair'}
                      aria-label={t('fiveS.corner')}
                      data-testid={`five-s-corner-${corner.id}`}
                      onPointerDown={(event) => {
                        if (tool !== 'select') return;

                        event.stopPropagation();
                        capturePointer(event);
                        setSelectedZoneId('');
                        setSelectedObjectId('');
                        setSelectedOpeningId('');
                        beginDragHistory();
                        setCornerDrag({ id: corner.id, over: '' });
                      }}
                    />
                    {/*
                      While a corner is moving, the walls on it say how long
                      they now are. Dragging blind and measuring afterwards is
                      how a room ends up 30 mm out.
                    */}
                    {dragging &&
                      wallsOn(plan.walls ?? [], corner.id).map((wall) => {
                        const ends = endsOf(wall, plan.corners ?? []);
                        if (!ends) return null;

                        return (
                          <text
                            key={wall.id}
                            x={(ends.from.x + ends.to.x) / 2}
                            y={(ends.from.y + ends.to.y) / 2 - view.height * 0.016}
                            textAnchor="middle"
                            className="fill-blue-600 tabular-nums"
                            style={{ fontSize: view.width * 0.016 }}
                            pointerEvents="none"
                          >
                            {formatLength(toMetres(wallLength(wall, plan.corners ?? []), metresPerUnit))}
                          </text>
                        );
                      })}
                  </g>
                );
              })}

              {/*
                The wall being drawn, with its length beside it. Seeing the
                measurement while dragging is the difference between drawing a
                room and drawing a shape and measuring it afterwards.
              */}
              {drawingWall && (
                <g pointerEvents="none">
                  <line
                    x1={drawingWall.from.x}
                    y1={drawingWall.from.y}
                    x2={drawingWall.to.x}
                    y2={drawingWall.to.y}
                    stroke="#2563eb"
                    strokeWidth={10}
                    strokeLinecap="square"
                    opacity={0.7}
                  />
                  <text
                    x={(drawingWall.from.x + drawingWall.to.x) / 2}
                    y={(drawingWall.from.y + drawingWall.to.y) / 2 - view.height * 0.02}
                    textAnchor="middle"
                    className="fill-blue-700 font-semibold tabular-nums"
                    style={{ fontSize: view.width * 0.02 }}
                  >
                    {formatLength(
                      toMetres(
                        Math.hypot(
                          drawingWall.to.x - drawingWall.from.x,
                          drawingWall.to.y - drawingWall.from.y,
                        ),
                        metresPerUnit,
                      ),
                    )}
                  </text>
                </g>
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
                      stroke={selected ? colours.ink : paint}
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
                    <text x={zone.x + 52} y={zone.y + 28} className="fill-gray-900 text-[15px] font-semibold dark:fill-gray-100">
                      {zone.name}
                    </text>
                    <text x={zone.x + 52} y={zone.y + 50} className="fill-gray-600 text-[12px] dark:fill-gray-400">
                      {zone.ownerName || 'No owner'}
                    </text>
                    {/*
                      The size, on the area itself. A floor plan whose parts
                      cannot say how large they are is a drawing; this is what
                      makes a 5S score comparable across rooms and red tags
                      per square metre a number rather than a wish.
                    */}
                    <text
                      x={zone.x + zone.width - 14}
                      y={zone.y + 26}
                      textAnchor="end"
                      className="fill-gray-500 text-[11px] tabular-nums"
                    >
                      {formatSize(zone, metresPerUnit)}
                    </text>
                    <text
                      x={zone.x + zone.width - 14}
                      y={zone.y + 42}
                      textAnchor="end"
                      className="fill-gray-500 text-[11px] font-medium tabular-nums"
                    >
                      {formatArea(areaOf(zone, metresPerUnit))}
                    </text>
                    <text x={zone.x + 18} y={zone.y + zone.height - 18} className="fill-gray-700 text-[12px]">
                      {t(`fiveS.stage.${stageKeys[zone.stage]}`)}
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
                          <title>{`${redTag.title} - ${t(`fiveS.redTagStatus.${redTagStatusKey(redTag.status)}`)}`}</title>
                          <circle
                            cx={spot.x}
                            cy={spot.y}
                            r={PIN_RADIUS}
                            fill={auditBands.poor}
                            stroke={colours.paper}
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
                          {t('fiveS.ui.badgeAudit')}
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

              {/*
                A scale bar, pinned to the corner of the view rather than to
                the plan, so it stays put while the plan moves under it. It is
                the one thing that makes a printed or screenshotted plan
                measurable by somebody who was not the person who drew it.
              */}
              {(() => {
                const metres = niceBarLength(toMetres(view.width, metresPerUnit));
                const barUnits = toUnits(metres, metresPerUnit);
                const left = view.x + view.width * 0.02;
                const bottom = view.y + view.height * 0.96;
                const tick = view.height * 0.014;

                return (
                  <g pointerEvents="none">
                    <line
                      x1={left}
                      y1={bottom}
                      x2={left + barUnits}
                      y2={bottom}
                      stroke={colours.measure}
                      strokeWidth={view.width * 0.002}
                    />
                    <line x1={left} y1={bottom - tick} x2={left} y2={bottom + tick} stroke={colours.measure} strokeWidth={view.width * 0.002} />
                    <line
                      x1={left + barUnits}
                      y1={bottom - tick}
                      x2={left + barUnits}
                      y2={bottom + tick}
                      stroke={colours.measure}
                      strokeWidth={view.width * 0.002}
                    />
                    <text
                      x={left + barUnits / 2}
                      y={bottom - tick * 1.6}
                      textAnchor="middle"
                      className="fill-gray-600 font-medium tabular-nums"
                      style={{ fontSize: view.width * 0.016 }}
                    >
                      {formatLength(metres)}
                    </text>
                  </g>
                );
              })()}

              {calibration && (
                <g pointerEvents="none">
                  <line
                    x1={calibration.from.x}
                    y1={calibration.from.y}
                    x2={calibration.to.x}
                    y2={calibration.to.y}
                    stroke="#dc2626"
                    strokeWidth={view.width * 0.003}
                  />
                  <circle cx={calibration.from.x} cy={calibration.from.y} r={view.width * 0.005} fill="#dc2626" />
                  <circle cx={calibration.to.x} cy={calibration.to.y} r={view.width * 0.005} fill="#dc2626" />
                </g>
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
                  {renderFloorPlanObject(
                    object,
                    object.id === selectedObjectId,
                    (event) => handleObjectPointerDown(event, object),
                    colours,
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
                        fill={colours.paper}
                        stroke={colours.roomSelected}
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
              <span>{t('fiveS.ui.hintDrag')}</span>
              <span>{t('fiveS.ui.hintCorners')}</span>
              <span>{t('fiveS.ui.hintArrows')}</span>
              <span>{t('fiveS.ui.hintDelete')}</span>
              <span>{t('fiveS.ui.hintEsc')}</span>
              <span>{t('fiveS.ui.hintUndo')}</span>
              {(plan.snapToGrid ?? true) && <span>{t('fiveS.ui.hintAlt')}</span>}
            </div>
          </div>

          <div className="max-h-[480px] overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700 md:max-h-[580px]">
            {selectedZone ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                      <MousePointer2 className="h-4 w-4" />
                      {t('fiveS.ui.selectedZone')}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{selectedZone.code}</div>
                  </div>
                  <button
                    type="button"
                    onClick={deleteSelectedZone}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                    aria-label={t('fiveS.ui.deleteSelectedZone')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/*
                  Where this area actually is. A zone used to be a rectangle
                  floating in an abstract canvas: it knew nothing about the
                  place it was describing, so it could not be compared with
                  another zone, in this building or any other.
                */}
                {selectedZonePlace && (
                  <div
                    data-testid="five-s-zone-place"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs dark:border-gray-700"
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-600 dark:text-gray-300">
                      <span className="font-medium">
                        {selectedZonePlace.room
                          ? selectedZonePlace.roomName || t('fiveS.roomUnnamed')
                          : t('fiveS.zoneOutsideRooms')}
                      </span>
                      <span className="tabular-nums">{formatArea(selectedZonePlace.coverage.area)}</span>
                      {selectedZonePlace.coverage.share !== null && (
                        <span className="tabular-nums text-gray-500 dark:text-gray-400">
                          {t('fiveS.zoneShare', {
                            share: Math.round(selectedZonePlace.coverage.share * 100),
                          })}
                        </span>
                      )}
                    </div>
                    {selectedZonePlace.tagDensity !== null && getRedTagCount(selectedZone) > 0 && (
                      <div className="mt-1 tabular-nums text-gray-500 dark:text-gray-400">
                        {t('fiveS.zoneTagDensity', { density: selectedZonePlace.tagDensity.toFixed(1) })}
                      </div>
                    )}
                    {/*
                      A zone drawn across a wall is two places with one name:
                      nobody can walk it as one area, audit it as one, or own
                      it as one. Better said now than noticed on the day.
                    */}
                    {selectedZonePlace.split && (
                      <div className="mt-1 flex items-start gap-1 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="mt-0.5 h-3 w-3 flex-none" aria-hidden="true" />
                        <span>{t('fiveS.zoneCrossesWall')}</span>
                      </div>
                    )}
                  </div>
                )}

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
                  {/*
                    Metres, not canvas units. `Width: 200` was two hundred of
                    nothing; a person setting up an area knows it is six metres
                    across and has no idea what two hundred means.
                  */}
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    {t('fiveS.widthMetres')}
                    <input
                      className={fieldClass}
                      min={0.5}
                      step={0.1}
                      type="number"
                      value={Number(toMetres(selectedZone.width, metresPerUnit).toFixed(1))}
                      onChange={(event) =>
                        updateZone(selectedZone.id, {
                          width: clamp(
                            toUnits(Number(event.target.value), metresPerUnit),
                            80,
                            CANVAS_WIDTH - selectedZone.x,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    {t('fiveS.heightMetres')}
                    <input
                      className={fieldClass}
                      min={0.5}
                      step={0.1}
                      type="number"
                      value={Number(toMetres(selectedZone.height, metresPerUnit).toFixed(1))}
                      onChange={(event) =>
                        updateZone(selectedZone.id, {
                          height: clamp(
                            toUnits(Number(event.target.value), metresPerUnit),
                            72,
                            CANVAS_HEIGHT - selectedZone.y,
                          ),
                        })
                      }
                    />
                  </label>
                </div>
                <label className="block text-sm text-gray-600 dark:text-gray-400">
                  {t('fiveS.ui.responsibleOwner')}
                  <select className={fieldClass} value={selectedZone.ownerId || ''} onChange={(event) => handleOwnerChange(event.target.value)}>
                    <option value="">{t('fiveS.ui.unassigned')}</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {memberName(user)} / {user.position}
                      </option>
                    ))}
                  </select>
                </label>
                {/*
                  Who still answers for this area when that person moves on. A
                  name on a zone is who to ask today; a department is what the
                  responsibility survives in.
                */}
                <label className="block text-sm text-gray-600 dark:text-gray-400">
                  {t('fiveS.ui.responsibleDepartment')}
                  <select
                    className={fieldClass}
                    value={selectedZone.departmentId || ''}
                    onChange={(event) =>
                      updateZone(selectedZone.id, { departmentId: event.target.value || undefined })
                    }
                  >
                    <option value="">{t('fiveS.ui.unassigned')}</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
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
                          {t(`fiveS.stage.${stageKeys[stage]}`)}
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
                        <option value="daily">{t('fiveS.ui.daily')}</option>
                        <option value="weekly">{t('fiveS.ui.weekly')}</option>
                        <option value="monthly">{t('fiveS.ui.monthly')}</option>
                      </select>
                    </label>
                  )}
                </div>
                {selectedStageGate && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-gray-900 dark:text-white">{t('fiveS.ui.stageGate')}</div>
                      <div className="text-xs text-gray-500">
                        {t(`fiveS.stage.${stageKeys[selectedZone.stage]}`)}
                        {selectedStageGate.nextStage
                          ? ` → ${t(`fiveS.stage.${stageKeys[selectedStageGate.nextStage]}`)}`
                          : ` ${t('fiveS.ui.stageActive')}`}
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
                      {selectedStageGate.nextStage
                        ? t('fiveS.ui.advanceTo', {
                            stage: t(`fiveS.stage.${stageKeys[selectedStageGate.nextStage]}`),
                          })
                        : t('fiveS.ui.sustainActive')}
                    </Button>
                  </div>
                )}
                {showAuditControls && (
                  <>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
                      <div className="text-gray-500 dark:text-gray-400">{t('fiveS.ui.lastAuditScore')}</div>
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
                      {t('fiveS.ui.redTagRegister')}
                    </div>
                    <Button variant="outline" size="sm" icon={Plus} onClick={addSelectedZoneRedTag} type="button">
                      {t('fiveS.ui.addTag')}
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
                            aria-label={t('fiveS.ui.deleteRedTag')}
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
                                  {t(`fiveS.redTagStatus.${option.key}`)}
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

                {/*
                  And what those layers are. They were read from the plan and
                  could not be changed, so every organization ran on the
                  defaults whatever its own practice was.
                */}
                <AuditTierSettings
                  tiers={plan.auditTiers}
                  onChange={(auditTiers) => updatePlan((current) => ({ ...current, auditTiers }))}
                />

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
                  {t('fiveS.ui.createSetupTask')}
                </Button>
                <Button
                  fullWidth
                  variant="outline"
                  icon={CheckCircle2}
                  onClick={markSelectedZoneCleanedToday}
                  type="button"
                >
                  {t('fiveS.ui.markCleaned')}
                </Button>
                <Button fullWidth variant="outline" icon={Copy} onClick={duplicateSelectedZone} type="button">
                  {t('fiveS.ui.duplicateZone')}
                </Button>
                {showAuditControls && (
                  <Button fullWidth variant="outline" icon={UserCheck} onClick={useSelectedZoneForAudit} type="button">
                    {t('fiveS.ui.useAsAuditLocation')}
                  </Button>
                )}
              </div>
            ) : selectedObject ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                      <Move className="h-4 w-4" />
                      {t('fiveS.ui.selectedObject')}
                    </div>
                    <div className="mt-1 text-xs capitalize text-gray-500">{selectedObject.type}</div>
                  </div>
                  <button
                    type="button"
                    onClick={deleteSelectedObject}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                    aria-label={t('fiveS.ui.deleteSelectedObject')}
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
                {/*
                  In metres, because that is what the thing measures. These
                  read 65 and 26 until now — canvas units, a number with no
                  meaning outside this one drawing, which nobody could check
                  against a tape measure or a supplier's page.
                */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    {t('fiveS.widthMetres')}
                    <input
                      className={fieldClass}
                      min={0.1}
                      step={0.1}
                      type="number"
                      value={Number(toMetres(selectedObject.width, metresPerUnit).toFixed(2))}
                      onChange={(event) => {
                        const metres = Number(event.target.value);
                        if (!Number.isFinite(metres) || metres <= 0) return;

                        updateObject(selectedObject.id, {
                          width: clamp(toUnits(metres, metresPerUnit), 4, CANVAS_WIDTH - selectedObject.x),
                        });
                      }}
                    />
                  </label>
                  <label className="block text-sm text-gray-600 dark:text-gray-400">
                    {t('fiveS.heightMetres')}
                    <input
                      className={fieldClass}
                      min={0.1}
                      step={0.1}
                      type="number"
                      value={Number(toMetres(selectedObject.height, metresPerUnit).toFixed(2))}
                      onChange={(event) => {
                        const metres = Number(event.target.value);
                        if (!Number.isFinite(metres) || metres <= 0) return;

                        updateObject(selectedObject.id, {
                          height: clamp(toUnits(metres, metresPerUnit), 4, CANVAS_HEIGHT - selectedObject.y),
                        });
                      }}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatSize({ width: selectedObject.width, height: selectedObject.height }, metresPerUnit)}
                </p>
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
                  {t('fiveS.ui.rotate45')}
                </Button>
                <Button fullWidth variant="outline" icon={Copy} onClick={duplicateSelectedObject} type="button">
                  {t('fiveS.ui.duplicateObject')}
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
              {t('fiveS.ui.ownerCoverage')}
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
                    <div className="text-xs text-gray-500">{t('fiveS.ui.responsibleOwnership')}</div>
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
              {t('fiveS.ui.redTagRegister')}
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
                {t('fiveS.ui.exportRedTags')}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3">{t('fiveS.ui.colArea')}</th>
                  <th className="px-4 py-3">{t('fiveS.ui.colItem')}</th>
                  <th className="px-4 py-3">{t('fiveS.ui.owner')}</th>
                  <th className="px-4 py-3">{t('fiveS.ui.colStatus')}</th>
                  <th className="px-4 py-3">{t('fiveS.ui.colDue')}</th>
                  <th className="px-4 py-3">{t('fiveS.ui.colDisposition')}</th>
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

        {/*
          The spaghetti diagrams, and what they cost in metres.

          The total is what gets quoted at a review; the longest leg is what
          gets fixed, because eighty metres made of one long walk is a
          different problem from eighty made of sixteen short ones — and only
          the first is worth a trolley.
        */}
        {Boolean((plan.routes ?? []).length) && (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {t('fiveS.routeRegister')}
              </div>
              <span className="text-xs text-gray-500">
                {t('fiveS.routeTotal', {
                  length: formatLength(
                    (plan.routes ?? []).reduce(
                      (total, route) => total + routeLength(route, metresPerUnit),
                      0,
                    ),
                  ),
                })}
              </span>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {(plan.routes ?? []).map((route) => {
                const legs = routeLegs(route, metresPerUnit);
                const longest = legs.reduce(
                  (worst, leg) => (leg.metres > worst ? leg.metres : worst),
                  0,
                );

                return (
                  <li key={route.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: route.colour }}
                      aria-hidden="true"
                    />
                    <input
                      className="min-w-[8rem] flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-gray-900 hover:border-gray-300 focus:border-gray-400 dark:text-white dark:hover:border-gray-600"
                      aria-label={t('fiveS.routeNameOf', { name: route.name })}
                      value={route.name}
                      onChange={(event) => renameRoute(route.id, event.target.value)}
                    />
                    <span className="tabular-nums text-sm text-gray-700 dark:text-gray-200">
                      {formatLength(routeLength(route, metresPerUnit))}
                    </span>
                    <span className="tabular-nums text-xs text-gray-500">
                      {t('fiveS.routeLongestLeg', { length: formatLength(longest) })}
                    </span>
                    <button
                      type="button"
                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 dark:border-gray-600 dark:text-gray-300"
                      aria-label={t('fiveS.routeRemove', { name: route.name })}
                      onClick={() => removeRoute(route.id)}
                    >
                      {t('common.delete')}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/*
          The rooms, and what is happening in each. This is the level a plant
          manager walks and talks in — "how is goods-in doing" — and it could
          not be asked at all until the plan had rooms to ask it of.
        */}
        {Boolean(rooms.length) && (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <MapIcon className="h-4 w-4" />
                {t('fiveS.roomRegister')}
              </div>
              <span className="text-xs text-gray-500">
                {t('fiveS.roomRegisterCount', { count: rooms.length })}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3">{t('fiveS.room')}</th>
                    <th className="px-4 py-3">{t('fiveS.roomFloor')}</th>
                    <th className="px-4 py-3">{t('fiveS.roomMapped')}</th>
                    <th className="px-4 py-3">{t('fiveS.roomAreas')}</th>
                    {showAuditControls && <th className="px-4 py-3">{t('fiveS.roomScore')}</th>}
                    <th className="px-4 py-3">{t('fiveS.roomTags')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {roomSummaries.map((summary) => (
                    <tr key={summary.key} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {summary.name || (
                          <span className="text-gray-400 dark:text-gray-500">{t('fiveS.roomUnnamed')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-300">
                        {formatArea(summary.area)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-300">
                        {summary.coverage === null ? '-' : `${Math.round(summary.coverage * 100)}%`}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-300">
                        {summary.zones.length}
                        {summary.unowned > 0 && (
                          <span className="ml-1 text-amber-600 dark:text-amber-400">
                            {t('fiveS.roomUnowned', { count: summary.unowned })}
                          </span>
                        )}
                      </td>
                      {showAuditControls && (
                        <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-300">
                          {summary.averageScore === null
                            ? t('fiveS.roomNeverAudited')
                            : `${Math.round(summary.averageScore)}%`}
                        </td>
                      )}
                      <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-300">
                        {summary.openRedTags}
                        {summary.tagDensity !== null && summary.openRedTags > 0 && (
                          <span className="ml-1 text-gray-400 dark:text-gray-500">
                            {t('fiveS.roomPerHundred', { density: summary.tagDensity.toFixed(1) })}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/*
                    Areas in no room at all, said out loud rather than dropped
                    from every total: either the walls round them have not been
                    drawn, or they are somewhere nobody has accounted for.
                  */}
                  {Boolean(strayZones.length) && (
                    <tr className="bg-amber-50/40 dark:bg-amber-950/10">
                      <td className="px-4 py-3 text-amber-800 dark:text-amber-300" colSpan={showAuditControls ? 6 : 5}>
                        {t('fiveS.roomStrayZones', {
                          count: strayZones.length,
                          names: strayZones.map((zone) => zone.code).join(', '),
                        })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
                  <th className="px-4 py-3">{t('fiveS.ui.colArea')}</th>
                  <th className="px-4 py-3">{t('fiveS.ui.owner')}</th>
                  <th className="px-4 py-3">{t('fiveS.ui.stage')}</th>
                  {showAuditControls && <th className="px-4 py-3">{t('fiveS.ui.colScore')}</th>}
                  {showAuditControls && <th className="px-4 py-3">{t('fiveS.ui.colAuditDue')}</th>}
                  <th className="px-4 py-3">{t('fiveS.ui.redTags')}</th>
                  <th className="px-4 py-3">{t('fiveS.ui.colCleaned')}</th>
                  <th className="px-4 py-3">{t('fiveS.ui.colNextAction')}</th>
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
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{zone.ownerName || t('fiveS.ui.unassigned')}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t(`fiveS.stage.${stageKeys[zone.stage]}`)}</td>
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
                        {nextActionText(gaps)}
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

/**
 * The box each thing's artwork is drawn in.
 *
 * The drawings are full of fixed insets — a bin's lid 5 units in, a desk's
 * monitor 12 — which were tuned when every object was about ninety units
 * across. Now that a chair is 0.5 m and a plan can be calibrated to anything,
 * those insets would turn inside out: a rectangle inset by 10 on each side of a
 * 12-unit chair has a width of −8, and SVG simply does not draw it.
 *
 * So each drawing keeps its own box, at the proportions it was drawn for, and
 * is scaled into whatever the object actually measures. The artwork is then
 * never asked to be smaller than its own detail.
 */
const ARTWORK_BOX: Partial<Record<FloorPlanObjectType, { width: number; height: number }>> = {
  wall: { width: 160, height: 10 },
  door: { width: 74, height: 18 },
  desk: { width: 86, height: 52 },
  chair: { width: 34, height: 34 },
  table: { width: 92, height: 70 },
  shelf: { width: 132, height: 42 },
  cabinet: { width: 72, height: 58 },
  pallet: { width: 90, height: 60 },
  racking: { width: 120, height: 50 },
  workbench: { width: 100, height: 45 },
  printer: { width: 54, height: 44 },
  equipment: { width: 58, height: 46 },
  whiteboard: { width: 120, height: 48 },
  sofa: { width: 110, height: 48 },
  plant: { width: 38, height: 46 },
  waste_bin: { width: 34, height: 42 },
  sink: { width: 58, height: 42 },
};

const renderFloorPlanObject = (
  object: FloorPlanObject,
  selected: boolean,
  onPointerDown: (event: React.PointerEvent<SVGGElement>) => void,
  colours: CanvasColours,
) => {
  const centerX = object.x + object.width / 2;
  const centerY = object.y + object.height / 2;
  const art = { x: 0, y: 0, ...(ARTWORK_BOX[object.type] ?? { width: object.width, height: object.height }) };
  const artCentreX = art.width / 2;
  const artCentreY = art.height / 2;
  // Read right to left: draw in the artwork's own box, squeeze it into the size
  // this object really is, move it into place, and turn it where it points.
  const transform = [
    `rotate(${object.rotation || 0} ${centerX} ${centerY})`,
    `translate(${object.x} ${object.y})`,
    `scale(${art.width ? object.width / art.width : 1} ${art.height ? object.height / art.height : 1})`,
  ].join(' ');
  const objectLabel = object.label.length > 18 ? `${object.label.slice(0, 16)}...` : object.label;
  let shape: React.ReactNode;

  if (object.type === 'wall') {
    shape = (
      <rect
        x={art.x}
        y={art.y}
        width={art.width}
        height={art.height}
        fill={tint('#111827', colours)}
        transform={transform}
      />
    );
  } else if (object.type === 'door') {
    shape = (
      <g transform={transform} stroke={strokeInk('#111827', colours)} strokeWidth="3" fill="none">
        <line x1={art.x} y1={art.y + art.height} x2={art.x + art.width} y2={art.y + art.height} />
        <path d={`M ${art.x} ${art.y + art.height} A ${art.width} ${art.width} 0 0 1 ${art.x + art.width} ${art.y}`} />
      </g>
    );
  } else if (object.type === 'desk') {
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} rx="5" fill={tint('#f8fafc', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <rect x={art.x + 12} y={art.y + 10} width={art.width - 24} height="10" fill={tint('#dbeafe', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="1" />
        <line x1={art.x + 18} y1={art.y + art.height - 10} x2={art.x + art.width - 18} y2={art.y + art.height - 10} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
      </g>
    );
  } else if (object.type === 'chair') {
    shape = (
      <g transform={transform}>
        <rect x={art.x + 7} y={art.y + 9} width={art.width - 14} height={art.height - 12} rx="6" fill={tint('#eff6ff', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <line x1={art.x + 7} y1={art.y + 8} x2={art.x + art.width - 7} y2={art.y + 8} stroke={strokeInk('#111827', colours)} strokeWidth="3" />
        <line x1={art.x + 10} y1={art.y + art.height - 2} x2={art.x + 10} y2={art.y + art.height - 8} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <line x1={art.x + art.width - 10} y1={art.y + art.height - 2} x2={art.x + art.width - 10} y2={art.y + art.height - 8} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
      </g>
    );
  } else if (object.type === 'table') {
    shape = (
      <g transform={transform}>
        <ellipse cx={artCentreX} cy={artCentreY} rx={art.width / 2} ry={art.height / 2} fill={tint('#f1f5f9', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <circle cx={art.x + 10} cy={artCentreY} r="5" fill={tint('#111827', colours)} />
        <circle cx={art.x + art.width - 10} cy={artCentreY} r="5" fill={tint('#111827', colours)} />
        <circle cx={artCentreX} cy={art.y + 8} r="5" fill={tint('#111827', colours)} />
        <circle cx={artCentreX} cy={art.y + art.height - 8} r="5" fill={tint('#111827', colours)} />
      </g>
    );
  } else if (object.type === 'shelf') {
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} fill={tint('#fff7ed', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        {[1, 2, 3].map((line) => (
          <line
            key={line}
            x1={art.x}
            y1={art.y + (art.height / 4) * line}
            x2={art.x + art.width}
            y2={art.y + (art.height / 4) * line}
            stroke={strokeInk('#111827', colours)}
            strokeWidth="1"
          />
        ))}
      </g>
    );
  } else if (object.type === 'cabinet') {
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} rx="4" fill={tint('#f8fafc', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <line x1={artCentreX} y1={art.y} x2={artCentreX} y2={art.y + art.height} stroke={strokeInk('#111827', colours)} strokeWidth="1.5" />
        <circle cx={artCentreX - 7} cy={artCentreY} r="2" fill={tint('#111827', colours)} />
        <circle cx={artCentreX + 7} cy={artCentreY} r="2" fill={tint('#111827', colours)} />
      </g>
    );
  } else if (object.type === 'printer') {
    shape = (
      <g transform={transform}>
        <rect x={art.x + 6} y={art.y} width={art.width - 12} height="16" rx="3" fill={tint('#e5e7eb', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <rect x={art.x} y={art.y + 14} width={art.width} height={art.height - 18} rx="5" fill={tint('#f8fafc', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <rect x={art.x + 10} y={art.y + art.height - 12} width={art.width - 20} height="8" fill={tint('#dbeafe', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="1" />
        <circle cx={art.x + art.width - 10} cy={art.y + 24} r="2.5" fill={tint('#22c55e', colours)} />
      </g>
    );
  } else if (object.type === 'equipment') {
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} rx="4" fill={tint('#e0f2fe', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <line x1={art.x + 8} y1={art.y + 8} x2={art.x + art.width - 8} y2={art.y + art.height - 8} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <line x1={art.x + art.width - 8} y1={art.y + 8} x2={art.x + 8} y2={art.y + art.height - 8} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
      </g>
    );
  } else if (object.type === 'whiteboard') {
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} rx="3" fill={tint('#ffffff', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <line x1={art.x + 10} y1={art.y + art.height - 8} x2={art.x + art.width - 10} y2={art.y + art.height - 8} stroke={strokeInk('#60a5fa', colours)} strokeWidth="2" />
        <line x1={art.x + 12} y1={art.y + 14} x2={art.x + art.width - 18} y2={art.y + 14} stroke={strokeInk('#d1d5db', colours)} strokeWidth="1" />
      </g>
    );
  } else if (object.type === 'sofa') {
    shape = (
      <g transform={transform}>
        <rect x={art.x + 8} y={art.y + 8} width={art.width - 16} height={art.height - 8} rx="8" fill={tint('#ede9fe', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <rect x={art.x} y={art.y + 18} width="16" height={art.height - 18} rx="6" fill={tint('#ede9fe', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <rect x={art.x + art.width - 16} y={art.y + 18} width="16" height={art.height - 18} rx="6" fill={tint('#ede9fe', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <line x1={artCentreX} y1={art.y + 12} x2={artCentreX} y2={art.y + art.height - 2} stroke={strokeInk('#111827', colours)} strokeWidth="1" />
      </g>
    );
  } else if (object.type === 'plant') {
    shape = (
      <g transform={transform}>
        <rect x={art.x + 10} y={art.y + art.height - 16} width={art.width - 20} height="14" rx="3" fill={tint('#92400e', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="1.5" />
        <ellipse cx={artCentreX} cy={art.y + 16} rx={art.width / 3} ry="14" fill={tint('#86efac', colours)} stroke={strokeInk('#166534', colours)} strokeWidth="1.5" />
        <ellipse cx={art.x + 13} cy={art.y + 23} rx="11" ry="16" fill={tint('#bbf7d0', colours)} stroke={strokeInk('#166534', colours)} strokeWidth="1.2" />
        <ellipse cx={art.x + art.width - 13} cy={art.y + 23} rx="11" ry="16" fill={tint('#bbf7d0', colours)} stroke={strokeInk('#166534', colours)} strokeWidth="1.2" />
      </g>
    );
  } else if (object.type === 'waste_bin') {
    shape = (
      <g transform={transform}>
        <path d={`M ${art.x + 6} ${art.y + 10} H ${art.x + art.width - 6} L ${art.x + art.width - 10} ${art.y + art.height - 2} H ${art.x + 10} Z`} fill={tint('#fee2e2', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <line x1={art.x + 9} y1={art.y + 5} x2={art.x + art.width - 9} y2={art.y + 5} stroke={strokeInk('#111827', colours)} strokeWidth="3" />
        <line x1={artCentreX} y1={art.y + 12} x2={artCentreX} y2={art.y + art.height - 8} stroke={strokeInk('#111827', colours)} strokeWidth="1" />
      </g>
    );
  } else if (object.type === 'pallet') {
    // Drawn as the deck boards, because that is how a pallet reads on a plan
    // and because the thing being shown is its footprint: 1.2 by 0.8 m of
    // floor that is either free or is not.
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} fill={tint('#fef3c7', colours)} stroke={strokeInk('#92400e', colours)} strokeWidth="2" />
        {[0.22, 0.5, 0.78].map((along) => (
          <line
            key={along}
            x1={art.x + 4}
            y1={art.y + art.height * along}
            x2={art.x + art.width - 4}
            y2={art.y + art.height * along}
            stroke={strokeInk('#92400e', colours)}
            strokeWidth="3"
          />
        ))}
      </g>
    );
  } else if (object.type === 'racking') {
    // One bay, with its uprights: the aisle in front of it is what the drawing
    // is really about.
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} fill={tint('#e5e7eb', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        {[1 / 3, 2 / 3].map((along) => (
          <line
            key={along}
            x1={art.x + art.width * along}
            y1={art.y}
            x2={art.x + art.width * along}
            y2={art.y + art.height}
            stroke={strokeInk('#111827', colours)}
            strokeWidth="2"
          />
        ))}
        <line x1={art.x} y1={art.y + art.height / 2} x2={art.x + art.width} y2={art.y + art.height / 2} stroke={strokeInk('#9ca3af', colours)} strokeWidth="1.5" />
      </g>
    );
  } else if (object.type === 'workbench') {
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} rx="2" fill={tint('#f1f5f9', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <rect x={art.x} y={art.y} width={art.width} height={art.height * 0.22} fill={tint('#cbd5e1', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="1" />
        <line x1={art.x + art.width * 0.1} y1={art.y + art.height - 4} x2={art.x + art.width * 0.9} y2={art.y + art.height - 4} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
      </g>
    );
  } else {
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} rx="8" fill={tint('#ecfeff', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <ellipse cx={artCentreX} cy={artCentreY} rx={art.width / 3} ry={art.height / 3} fill={tint('#ffffff', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="1.5" />
        <circle cx={artCentreX} cy={artCentreY} r="4" fill={tint('#60a5fa', colours)} />
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
          {/*
            The pill behind an object's name is paper, so at night the name
            sits on the sheet rather than on a white sticker.
          */}
          <rect
            x={Math.max(0, object.x + object.width / 2 - 42)}
            y={Math.min(CANVAS_HEIGHT - 22, object.y + object.height + 5)}
            width="84"
            height="18"
            rx="9"
            fill={colours.paper}
            stroke={colours.grid}
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
