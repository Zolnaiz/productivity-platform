import { FiveSLayoutPlan, FiveSRedTag, FiveSZone, FloorPlanObject, FloorPlanObjectType } from '../types/fiveS.types';
import { withSyncedRedTags } from '../components/fives/floorPlanRules';
import { pruneOpenings } from '../components/fives/floorPlanOpenings';
import { del, get, getStoredAccessToken, isDemoMode, patch, post, shouldUseDemoFallback } from './api';
import { readDemoPlans, replaceDemoPlan, writeDemoPlans } from './demoPlanStore';

type ApiEnvelope<T> = T | { data: T; success?: boolean };

const now = () => new Date().toISOString();

const defaultZones: FiveSZone[] = [
  {
    id: 'zone-1',
    code: 'A01',
    name: 'Reception',
    color: '#38bdf8',
    x: 52,
    y: 48,
    width: 214,
    height: 132,
    ownerId: 'u1',
    ownerName: 'Demo Owner',
    // The area answers to a department as well as to a person: the name on
    // a zone is who to ask today, the department is what outlives them.
    departmentId: 'd1',
    contents: 'Visitor desk, waiting chairs, incoming document tray',
    standard: 'Front desk clear, visitor chairs aligned, documents sorted before 17:00.',
    labelText: 'Reception - owner visible at desk',
    stage: 'set_in_order',
    auditFrequency: 'daily',
    lastAuditScore: 88,
    lastAuditAt: '2026-06-24',
    redTagCount: 0,
    redTags: [],
    lastCleanedAt: '2026-06-24',
  },
  {
    id: 'zone-2',
    code: 'A02',
    name: 'Workstations',
    color: '#22c55e',
    x: 304,
    y: 48,
    width: 318,
    height: 204,
    ownerId: 'u3',
    ownerName: 'Employee User',
    departmentId: 'd1',
    contents: 'Employee desks, laptops, printers, shared stationery',
    standard: 'Only active work items on desks, cables tied, shared items returned to labeled shelf.',
    labelText: 'Desk standard photo and cable labels required',
    stage: 'shine',
    auditFrequency: 'weekly',
    lastAuditScore: 82,
    lastAuditAt: '2026-06-17',
    redTagCount: 2,
    redTags: [
      {
        id: 'redtag-zone-2-1',
        title: 'Unlabeled cable bundle',
        disposition: 'Label and route under desk tray',
        status: 'open',
        ownerId: 'u3',
        ownerName: 'Employee User',
        dueDate: '2026-06-27',
        createdAt: '2026-06-24',
      },
      {
        id: 'redtag-zone-2-2',
        title: 'Expired printer cartridge box',
        disposition: 'Move to disposal bin',
        status: 'review',
        ownerId: 'u3',
        ownerName: 'Employee User',
        dueDate: '2026-06-26',
        createdAt: '2026-06-24',
      },
    ],
    lastCleanedAt: '2026-06-21',
  },
  {
    id: 'zone-3',
    code: 'A03',
    name: 'Storage',
    color: '#f59e0b',
    x: 52,
    y: 230,
    width: 214,
    height: 170,
    ownerId: 'u2',
    ownerName: 'Quality Manager',
    departmentId: 'd2',
    contents: 'Office supplies, cleaning tools, spare labels, PPE',
    standard: 'Every shelf position labeled, min/max stock marked, red-tag box checked weekly.',
    labelText: 'Shelf labels + red-tag area',
    stage: 'sort',
    auditFrequency: 'weekly',
    lastAuditScore: 74,
    lastAuditAt: '2026-06-12',
    redTagCount: 5,
    redTags: [
      {
        id: 'redtag-zone-3-1',
        title: 'Unowned supply box',
        disposition: 'Identify owner or dispose',
        status: 'open',
        ownerId: 'u2',
        ownerName: 'Quality Manager',
        dueDate: '2026-06-26',
        createdAt: '2026-06-24',
      },
      {
        id: 'redtag-zone-3-2',
        title: 'Duplicate cleaning tools',
        disposition: 'Keep one set, relocate extras',
        status: 'open',
        ownerId: 'u2',
        ownerName: 'Quality Manager',
        dueDate: '2026-06-28',
        createdAt: '2026-06-24',
      },
      {
        id: 'redtag-zone-3-3',
        title: 'No min/max label on PPE shelf',
        disposition: 'Create shelf label',
        status: 'review',
        ownerId: 'u2',
        ownerName: 'Quality Manager',
        dueDate: '2026-06-27',
        createdAt: '2026-06-24',
      },
      {
        id: 'redtag-zone-3-4',
        title: 'Old event materials',
        disposition: 'Dispose after manager approval',
        status: 'open',
        ownerId: 'u2',
        ownerName: 'Quality Manager',
        dueDate: '2026-06-29',
        createdAt: '2026-06-24',
      },
      {
        id: 'redtag-zone-3-5',
        title: 'Unclear spare label stock',
        disposition: 'Sort by label type',
        status: 'open',
        ownerId: 'u2',
        ownerName: 'Quality Manager',
        dueDate: '2026-06-28',
        createdAt: '2026-06-24',
      },
    ],
    lastCleanedAt: '2026-06-18',
  },
  {
    id: 'zone-4',
    code: 'A04',
    name: 'Meeting room',
    color: '#a855f7',
    x: 660,
    y: 48,
    width: 186,
    height: 164,
    ownerId: 'u1',
    ownerName: 'Demo Owner',
    contents: 'Meeting table, chairs, screen, whiteboard markers',
    standard: 'Table clear after each meeting, markers tested, chairs reset to six positions.',
    labelText: 'Meeting reset standard',
    stage: 'standardize',
    auditFrequency: 'weekly',
    lastAuditScore: 91,
    lastAuditAt: '2026-06-23',
    redTagCount: 0,
    redTags: [],
    lastCleanedAt: '2026-06-23',
  },
  {
    id: 'zone-5',
    code: 'A05',
    name: 'Break area',
    color: '#ef4444',
    x: 304,
    y: 300,
    width: 238,
    height: 120,
    ownerId: 'u2',
    ownerName: 'Quality Manager',
    contents: 'Coffee machine, sink, fridge, waste bins',
    standard: 'Counters wiped, food labeled, waste bins emptied, spill response kit visible.',
    labelText: 'Food and cleaning labels',
    stage: 'sustain',
    auditFrequency: 'daily',
    lastAuditScore: 86,
    lastAuditAt: '2026-06-22',
    redTagCount: 1,
    redTags: [
      {
        id: 'redtag-zone-5-1',
        title: 'Unlabeled food container',
        disposition: 'Dispose if owner is not found',
        status: 'open',
        ownerId: 'u2',
        ownerName: 'Quality Manager',
        dueDate: '2026-06-25',
        createdAt: '2026-06-24',
      },
    ],
    lastCleanedAt: '2026-06-22',
  },
];

const defaultObjects: FloorPlanObject[] = [
  { id: 'wall-1', type: 'wall', label: 'Outer wall', x: 32, y: 28, width: 838, height: 10 },
  { id: 'wall-2', type: 'wall', label: 'Outer wall', x: 32, y: 448, width: 838, height: 10 },
  { id: 'wall-3', type: 'wall', label: 'Outer wall', x: 32, y: 28, width: 10, height: 430 },
  { id: 'wall-4', type: 'wall', label: 'Outer wall', x: 860, y: 28, width: 10, height: 430 },
  { id: 'wall-5', type: 'wall', label: 'Storage partition', x: 276, y: 220, width: 10, height: 208 },
  { id: 'wall-6', type: 'wall', label: 'Meeting partition', x: 638, y: 38, width: 10, height: 190 },
  { id: 'door-1', type: 'door', label: 'Main door', x: 112, y: 438, width: 72, height: 18 },
  { id: 'door-2', type: 'door', label: 'Meeting door', x: 640, y: 214, width: 64, height: 18 },
  { id: 'desk-1', type: 'desk', label: 'Desk row', x: 338, y: 88, width: 92, height: 52 },
  { id: 'desk-2', type: 'desk', label: 'Desk row', x: 470, y: 88, width: 92, height: 52 },
  { id: 'desk-3', type: 'desk', label: 'Desk row', x: 338, y: 166, width: 92, height: 52 },
  { id: 'desk-4', type: 'desk', label: 'Desk row', x: 470, y: 166, width: 92, height: 52 },
  { id: 'shelf-1', type: 'shelf', label: 'Supply shelf', x: 78, y: 260, width: 150, height: 46 },
  { id: 'shelf-2', type: 'shelf', label: 'PPE shelf', x: 78, y: 326, width: 150, height: 46 },
  { id: 'table-1', type: 'table', label: 'Meeting table', x: 706, y: 86, width: 92, height: 72 },
  { id: 'equipment-1', type: 'equipment', label: 'Printer', x: 566, y: 286, width: 54, height: 44 },
  { id: 'equipment-2', type: 'equipment', label: 'Coffee', x: 334, y: 330, width: 54, height: 44 },
];

const defaultPlan: FiveSLayoutPlan = {
  id: 'default-5s-office-plan',
  name: 'Office 5S launch map',
  site: 'Demo Operations Workspace',
  floor: '1st floor',
  scale: '1 square = 1 meter',
  backgroundImage: '',
  backgroundOpacity: 0.55,
  showGrid: true,
  zones: defaultZones,
  objects: defaultObjects,
  updatedAt: now(),
};

/**
 * The demo's second building.
 *
 * A plan per floor, a site per building and the switcher between them are
 * among the most-worked-on parts of this application, and none of it could be
 * seen in the demo, which held exactly one plan. Somebody evaluating the
 * product concluded it did one floor of one building.
 *
 * Deliberately small: two areas and no furniture. It exists to show that a
 * second plan is a real thing with its own zones, its own audits and its own
 * line in the monthly report, not to be a second drawing to admire.
 */
const defaultWarehousePlan: FiveSLayoutPlan = {
  id: 'default-5s-warehouse-plan',
  name: 'Warehouse 5S map',
  site: 'Demo Warehouse',
  floor: 'Ground floor',
  scale: '1 square = 1 meter',
  backgroundImage: '',
  backgroundOpacity: 0.55,
  showGrid: true,
  zones: [
    {
      id: 'zone-w1',
      code: 'B01',
      name: 'Goods in',
      color: '#f97316',
      x: 60,
      y: 60,
      width: 300,
      height: 180,
      ownerId: 'u3',
      ownerName: 'Employee User',
      departmentId: 'd1',
      contents: 'Incoming pallets, hand scanner, wrapping station',
      standard: 'Pallets squared to the floor marking, aisle kept clear, scanner returned to its dock.',
      labelText: 'Goods in - pallets on the marked squares',
      stage: 'set_in_order',
      auditFrequency: 'weekly',
      lastAuditScore: 76,
      lastAuditAt: '2026-06-18',
      redTagCount: 0,
      redTags: [],
      lastCleanedAt: '2026-06-18',
    },
    {
      id: 'zone-w2',
      code: 'B02',
      name: 'Racking aisle 1',
      color: '#0ea5e9',
      x: 400,
      y: 60,
      width: 260,
      height: 320,
      ownerId: 'u2',
      ownerName: 'Quality Manager',
      departmentId: 'd2',
      contents: 'Racking bays 1-8, picking trolley',
      standard: 'Every bay labelled, nothing stored on the floor, trolley parked at the end of the aisle.',
      labelText: 'Aisle 1 - nothing on the floor',
      stage: 'sort',
      auditFrequency: 'monthly',
      redTagCount: 0,
      redTags: [],
      lastCleanedAt: '',
    },
  ] as FiveSZone[],
  objects: [],
  updatedAt: now(),
};

/** What a browser with no demo plans is seeded with. */
const defaultPlans = (): FiveSLayoutPlan[] => [defaultPlan, defaultWarehousePlan];

const unwrap = <T>(response: ApiEnvelope<T>): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }

  return response as T;
};

const hasRealAccessToken = () => Boolean(getStoredAccessToken()) && !isDemoMode();

const resolveDemoData = <T>(demoData: T | (() => T)): T =>
  typeof demoData === 'function' ? (demoData as () => T)() : demoData;

const fallback = async <T>(request: () => Promise<ApiEnvelope<T>>, demoData: T | (() => T)): Promise<T> => {
  if (!hasRealAccessToken()) {
    return resolveDemoData(demoData);
  }

  try {
    return unwrap(await request());
  } catch {
    if (!shouldUseDemoFallback()) {
      throw new Error('Backend request failed and demo fallback is disabled in production.');
    }
    return resolveDemoData(demoData);
  }
};

/**
 * What the server is told.
 *
 * The wall graph and the scale were missing from this list while the editor
 * was learning to draw walls, find rooms and measure in metres — so a plan
 * drawn against a real backend was complete on screen and empty again after a
 * reload, silently, because the fields were dropped on the way out rather than
 * refused.
 */
const withoutServerFields = (plan: FiveSLayoutPlan) => {
  const payload = {
    name: plan.name,
    site: plan.site,
    floor: plan.floor ?? '',
    scale: plan.scale,
    backgroundImage: plan.backgroundImage || '',
    backgroundOpacity: plan.backgroundOpacity ?? 0.55,
    showGrid: plan.showGrid ?? true,
    zones: plan.zones,
    objects: plan.objects,
    corners: plan.corners ?? [],
    walls: plan.walls ?? [],
    openings: plan.openings ?? [],
    roomLabels: plan.roomLabels ?? [],
    ...(plan.metresPerUnit ? { metresPerUnit: plan.metresPerUnit } : {}),
  };

  return payload;
};

const isOpenRedTag = (status: string | undefined) => status === 'open' || status === 'review';

const normalizeZoneRedTags = (zone: FiveSZone) => {
  if (zone.redTags?.length) {
    return zone.redTags;
  }

  return Array.from({ length: zone.redTagCount ?? 0 }, (_, index) => ({
    id: `legacy-redtag-${zone.id}-${index + 1}`,
    title: `Red-tag item ${index + 1}`,
    disposition: 'Document disposition',
    status: 'open' as const,
    ownerId: zone.ownerId,
    ownerName: zone.ownerName,
    dueDate: '',
    createdAt: '',
  }));
};

const normalizePlan = (plan: FiveSLayoutPlan): FiveSLayoutPlan => ({
  ...plan,
  backgroundImage: plan.backgroundImage || '',
  backgroundOpacity: plan.backgroundOpacity ?? 0.55,
  showGrid: plan.showGrid ?? true,
  snapToGrid: plan.snapToGrid ?? true,
  showDimensions: plan.showDimensions ?? false,
  zones: (plan.zones || []).map((zone) => {
    const redTags = normalizeZoneRedTags(zone);

    return {
      ...zone,
      lastAuditAt: zone.lastAuditAt || '',
      redTagCount: redTags.length ? redTags.filter((redTag) => isOpenRedTag(redTag.status)).length : zone.redTagCount ?? 0,
      redTags,
      lastCleanedAt: zone.lastCleanedAt || '',
    };
  }),
  objects: plan.objects || [],
  corners: plan.corners || [],
  walls: plan.walls || [],
  // Openings whose wall has gone are dropped on the way in: a door that
  // outlives its wall draws nowhere and can never be reached to delete.
  openings: pruneOpenings(plan.openings || [], plan.walls || []),
  roomLabels: plan.roomLabels || [],
});

/**
 * An organization's own plan, left empty when it is empty.
 *
 * This used to substitute a pre-drawn sample office whenever the plan had no
 * zones — so somebody signing up for the first time was shown a building that
 * was not theirs, with areas named Reception and Workstations, and their first
 * job was working out that none of it was real and deleting it. An empty plan
 * is not a problem to paper over; it is what a new workspace is, and the
 * editor now offers a blueprint import, a blank plan or a named template
 * instead of pretending the question is already answered.
 *
 * Demo mode still has its sample plan. That is what demo mode is for, and it
 * says so on the sign-in screen.
 */
const withOwnLayout = (plan: FiveSLayoutPlan): FiveSLayoutPlan =>
  normalizePlan({
    ...plan,
    zones: plan.zones || [],
    objects: plan.objects || [],
    updatedAt: plan.updatedAt || now(),
  });

/** Every plan the demo holds, seeded the first time anybody looks. */
const readPlans = (): FiveSLayoutPlan[] => {
  const stored = readDemoPlans<FiveSLayoutPlan & Record<string, unknown>>();

  if (stored?.length) {
    return stored.map(normalizePlan);
  }

  return writeDemoPlans(defaultPlans()).map(normalizePlan);
};

/**
 * One plan by id, or the first when nothing is asked for.
 *
 * A label printed for an area names the plan it is on, so opening it has to
 * find that plan rather than whichever is stored first — the same rule the
 * server follows.
 */
const readPlan = (id?: string) => {
  const plans = readPlans();

  return (id && plans.find((plan) => plan.id === id)) || plans[0];
};

const savePlan = (plan: FiveSLayoutPlan) => {
  const nextPlan = { ...plan, updatedAt: now() };
  const plans = readPlans();
  const known = plans.some((candidate) => candidate.id === nextPlan.id);

  writeDemoPlans(known ? replaceDemoPlan(plans, nextPlan) : [...plans, nextPlan]);

  return normalizePlan(nextPlan);
};

const nextZoneCode = (zones: FiveSZone[]) => {
  const maxNumber = zones.reduce((max, zone) => {
    const value = Number(zone.code.replace(/^\D+/, ''));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `A${String(maxNumber + 1).padStart(2, '0')}`;
};

const colorOptions = ['#38bdf8', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6', '#64748b'];

const createZone = (zones: FiveSZone[]): FiveSZone => {
  const index = zones.length;
  return {
    id: `zone-${Date.now()}`,
    code: nextZoneCode(zones),
    name: 'New 5S area',
    color: colorOptions[index % colorOptions.length],
    x: 80 + (index % 4) * 36,
    y: 70 + (index % 3) * 32,
    width: 190,
    height: 118,
    contents: '',
    standard: '',
    labelText: '',
    stage: 'sort',
    auditFrequency: 'weekly',
  };
};

const objectLabels: Record<FloorPlanObjectType, string> = {
  wall: 'Wall',
  door: 'Door',
  desk: 'Desk',
  chair: 'Chair',
  table: 'Meeting table',
  shelf: 'Shelf',
  cabinet: 'Cabinet',
  pallet: 'Pallet',
  racking: 'Racking bay',
  workbench: 'Workbench',
  printer: 'Printer',
  equipment: 'Equipment',
  whiteboard: 'Whiteboard',
  sofa: 'Sofa',
  plant: 'Plant',
  waste_bin: 'Waste bin',
  sink: 'Sink',
};

/** What a legacy type with no real size falls back to. */
const LEGACY_SIZE = { width: 120, height: 40 };

/**
 * A new object, at the size the caller says it is.
 *
 * The size used to live here, in canvas pixels: a desk was 86 by 52 because
 * that looked about right. Nothing could be checked against anything — not
 * whether four of them fit along a wall, not whether a pallet truck could get
 * between two benches. The catalogue now holds real dimensions in metres and
 * the editor converts them through the plan's own scale, which is the only
 * place that knows what the scale is.
 */
const createObject = (
  type: FloorPlanObjectType,
  placement?: { x: number; y: number; width: number; height: number },
): FloorPlanObject => ({
  id: `${type}-${Date.now()}`,
  type,
  label: objectLabels[type] ?? type,
  x: placement?.x ?? 410,
  y: placement?.y ?? 254,
  width: placement?.width ?? LEGACY_SIZE.width,
  height: placement?.height ?? LEGACY_SIZE.height,
});

const zoneLabelHeaders = [
  'Code',
  'Zone',
  'Owner',
  'Stage',
  'Audit cycle',
  'Last audit score',
  'Last audited',
  'Red tags',
  'Last cleaned',
  'Contents',
  'Standard',
  'Label note',
];

const escapeCsvCell = (value: string | number | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const buildZoneLabelRows = (plan: FiveSLayoutPlan) =>
  plan.zones.map((zone) => ({
    // The id travels with the row so a printed label can carry a code that
    // opens this zone and not another one with the same letter on it.
    id: zone.id,
    code: zone.code,
    zone: zone.name,
    owner: zone.ownerName || 'Unassigned',
    stage: zone.stage,
    auditCycle: zone.auditFrequency,
    lastAuditScore: zone.lastAuditScore === undefined ? '' : `${zone.lastAuditScore}%`,
    lastAuditAt: zone.lastAuditAt || '',
    redTags: zone.redTagCount ?? 0,
    lastCleaned: zone.lastCleanedAt || '',
    contents: zone.contents,
    standard: zone.standard,
    labelNote: zone.labelText,
  }));

const buildZoneLabelsCsv = (plan: FiveSLayoutPlan) => {
  const rows = buildZoneLabelRows(plan);
  return [
    zoneLabelHeaders.map(escapeCsvCell).join(','),
    ...rows.map((row) =>
      [
        row.code,
        row.zone,
        row.owner,
        row.stage,
        row.auditCycle,
        row.lastAuditScore,
        row.lastAuditAt,
        row.redTags,
        row.lastCleaned,
        row.contents,
        row.standard,
        row.labelNote,
      ]
        .map(escapeCsvCell)
        .join(','),
    ),
  ].join('\n');
};

export const fiveSLayoutService = {
  /**
   * Every plan the organization has â€” one per floor of one per building.
   *
   * Demo mode has the one it keeps in the browser: a demo with two floors
   * would be inventing a building nobody has.
   */
  getPlans: () =>
    fallback<FiveSLayoutPlan[]>(
      async () => (await get<FiveSLayoutPlan[]>('/five-s-layouts')).map(withOwnLayout),
      readPlans,
    ),

  createPlan: (plan: { name: string; site: string; floor?: string }) =>
    fallback<FiveSLayoutPlan>(
      async () => withOwnLayout(await post<FiveSLayoutPlan>('/five-s-layouts', plan)),
      () => {
        // A real second plan rather than a pretend one: the demo holds a list,
        // so a floor somebody adds here is a floor they can then draw on.
        const added = normalizePlan({
          ...defaultPlan,
          id: `demo-plan-${Date.now()}`,
          name: plan.name,
          site: plan.site,
          floor: plan.floor ?? '',
          zones: [],
          objects: [],
          updatedAt: now(),
        });

        writeDemoPlans([...readPlans(), added]);

        return added;
      },
    ),

  deletePlan: (id: string) =>
    fallback<{ id: string; deleted: boolean }>(
      () => del<{ id: string; deleted: boolean }>(`/five-s-layouts/${id}`),
      () => {
        const plans = readPlans();

        // Never the last one: an organization with no plan has nowhere to put
        // an area, and the editor would have nothing to open.
        if (plans.length <= 1 || !plans.some((plan) => plan.id === id)) {
          return { id, deleted: false };
        }

        writeDemoPlans(plans.filter((plan) => plan.id !== id));

        return { id, deleted: true };
      },
    ),

  /**
   * Raises a red tag on one zone, from wherever somebody is standing.
   *
   * Its own route rather than a plan save: whoever finds the clutter may say
   * so without being able to redraw the building, and the server decides the
   * id, the status and the date.
   */
  addRedTag: (planId: string, zoneId: string, tag: { title: string; disposition?: string }) =>
    fallback<FiveSRedTag>(
      () => post<FiveSRedTag>(`/five-s-layouts/${planId}/zones/${zoneId}/red-tags`, tag),
      () => {
        const plan = readPlan(planId);
        const raised: FiveSRedTag = {
          id: `redtag-${Date.now()}`,
          title: tag.title.trim(),
          disposition: tag.disposition?.trim() ?? '',
          status: 'open',
          createdAt: now(),
        };

        savePlan({
          ...plan,
          zones: plan.zones.map((zone) =>
            zone.id === zoneId
              ? { ...zone, ...withSyncedRedTags([...(zone.redTags ?? []), raised]) }
              : zone,
          ),
        });

        return raised;
      },
    ),

  /**
   * Records that an area was cleaned, today.
   *
   * The date comes back from the server rather than being decided here: a
   * browser's clock is whatever the machine says it is, and this date is what
   * the audit schedule and the monthly report read.
   */
  markCleaned: (planId: string, zoneId: string) =>
    fallback<{ zoneId: string; lastCleanedAt: string }>(
      () =>
        post<{ zoneId: string; lastCleanedAt: string }>(
          `/five-s-layouts/${planId}/zones/${zoneId}/cleaned`,
          {},
        ),
      () => {
        const plan = readPlan(planId);
        const lastCleanedAt = now().slice(0, 10);

        savePlan({
          ...plan,
          zones: plan.zones.map((zone) => (zone.id === zoneId ? { ...zone, lastCleanedAt } : zone)),
        });

        return { zoneId, lastCleanedAt };
      },
    ),

  getPlan: (id?: string) =>
    fallback<FiveSLayoutPlan>(
      async () => withOwnLayout(await get<FiveSLayoutPlan>(id ? `/five-s-layout?id=${id}` : '/five-s-layout')),
      () => readPlan(id),
    ),

  savePlan: (plan: FiveSLayoutPlan) =>
    fallback<FiveSLayoutPlan>(
      async () =>
        // By id when the plan has one, so a building with several floors saves
        // the floor being edited rather than whichever comes back first.
        plan.id && !plan.id.startsWith('default-')
          ? patch<FiveSLayoutPlan>(`/five-s-layouts/${plan.id}`, withoutServerFields(plan))
          : patch<FiveSLayoutPlan>('/five-s-layout', withoutServerFields(plan)),
      () => savePlan(plan),
    ).then(normalizePlan),
  resetPlan: async () => {
    writeDemoPlans(defaultPlans().map((plan) => ({ ...plan, updatedAt: now() })));
    const plan = readPlan();

    if (!hasRealAccessToken()) {
      return plan;
    }

    return fallback<FiveSLayoutPlan>(
      async () => patch<FiveSLayoutPlan>('/five-s-layout', withoutServerFields(plan)),
      plan,
    ).then(normalizePlan);
  },
  createZone,
  createObject,
  buildZoneLabelRows,
  buildZoneLabelsCsv,
};
