import { FiveSLayoutPlan, FiveSZone, FloorPlanObject, FloorPlanObjectType } from '../types/fiveS.types';
import { get, getStoredAccessToken, isDemoMode, patch, shouldUseDemoFallback } from './api';

const storageKey = 'productivity-demo-5s-layout';
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
  scale: '1 square = 1 meter',
  backgroundImage: '',
  backgroundOpacity: 0.55,
  showGrid: true,
  zones: defaultZones,
  objects: defaultObjects,
  updatedAt: now(),
};

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

const withoutServerFields = (plan: FiveSLayoutPlan) => {
  const payload = {
    name: plan.name,
    site: plan.site,
    scale: plan.scale,
    backgroundImage: plan.backgroundImage || '',
    backgroundOpacity: plan.backgroundOpacity ?? 0.55,
    showGrid: plan.showGrid ?? true,
    zones: plan.zones,
    objects: plan.objects,
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
});

const withDefaultLayoutWhenEmpty = (plan: FiveSLayoutPlan): FiveSLayoutPlan => {
  if (plan.zones?.length || plan.objects?.length) {
    return normalizePlan({
      ...plan,
      zones: plan.zones || [],
      objects: plan.objects || [],
    });
  }

  return normalizePlan({
    ...defaultPlan,
    id: plan.id,
    organizationId: plan.organizationId,
    name: plan.name || defaultPlan.name,
    site: plan.site || defaultPlan.site,
    scale: plan.scale || defaultPlan.scale,
    backgroundImage: plan.backgroundImage || defaultPlan.backgroundImage,
    backgroundOpacity: plan.backgroundOpacity ?? defaultPlan.backgroundOpacity,
    showGrid: plan.showGrid ?? defaultPlan.showGrid,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt || now(),
  });
};

const readPlan = () => {
  const stored = localStorage.getItem(storageKey);

  if (stored) {
    try {
      return normalizePlan(JSON.parse(stored) as FiveSLayoutPlan);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }

  localStorage.setItem(storageKey, JSON.stringify(defaultPlan));
  return normalizePlan(defaultPlan);
};

const savePlan = (plan: FiveSLayoutPlan) => {
  const nextPlan = {
    ...plan,
    updatedAt: now(),
  };
  localStorage.setItem(storageKey, JSON.stringify(nextPlan));
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

const objectDefaults: Record<FloorPlanObjectType, Omit<FloorPlanObject, 'id' | 'type'>> = {
  wall: { label: 'Wall', x: 410, y: 254, width: 160, height: 10 },
  door: { label: 'Door', x: 410, y: 254, width: 74, height: 18 },
  desk: { label: 'Desk', x: 410, y: 254, width: 86, height: 52 },
  chair: { label: 'Chair', x: 410, y: 254, width: 34, height: 34 },
  table: { label: 'Table', x: 410, y: 254, width: 92, height: 70 },
  shelf: { label: 'Shelf', x: 410, y: 254, width: 132, height: 42 },
  cabinet: { label: 'Cabinet', x: 410, y: 254, width: 72, height: 58 },
  printer: { label: 'Printer', x: 410, y: 254, width: 54, height: 44 },
  equipment: { label: 'Equipment', x: 410, y: 254, width: 58, height: 46 },
  whiteboard: { label: 'Whiteboard', x: 410, y: 254, width: 120, height: 48 },
  sofa: { label: 'Sofa', x: 410, y: 254, width: 110, height: 48 },
  plant: { label: 'Plant', x: 410, y: 254, width: 38, height: 46 },
  waste_bin: { label: 'Waste bin', x: 410, y: 254, width: 34, height: 42 },
  sink: { label: 'Sink', x: 410, y: 254, width: 58, height: 42 },
};

const createObject = (type: FloorPlanObjectType): FloorPlanObject => ({
  ...objectDefaults[type],
  id: `${type}-${Date.now()}`,
  type,
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
  getPlan: () =>
    fallback<FiveSLayoutPlan>(
      async () => withDefaultLayoutWhenEmpty(await get<FiveSLayoutPlan>('/five-s-layout')),
      readPlan,
    ),
  savePlan: (plan: FiveSLayoutPlan) =>
    fallback<FiveSLayoutPlan>(
      async () => patch<FiveSLayoutPlan>('/five-s-layout', withoutServerFields(plan)),
      () => savePlan(plan),
    ).then(normalizePlan),
  resetPlan: async () => {
    localStorage.setItem(storageKey, JSON.stringify({ ...defaultPlan, updatedAt: now() }));
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
