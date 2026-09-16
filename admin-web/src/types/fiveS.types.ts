export type FiveSStage = 'sort' | 'set_in_order' | 'shine' | 'standardize' | 'sustain';

export type FloorPlanObjectType =
  | 'wall'
  | 'door'
  | 'desk'
  | 'chair'
  | 'table'
  | 'shelf'
  | 'cabinet'
  | 'printer'
  | 'equipment'
  | 'whiteboard'
  | 'sofa'
  | 'plant'
  | 'waste_bin'
  | 'sink'
  | 'pallet'
  | 'racking'
  | 'workbench';

export type FiveSRedTagStatus = 'open' | 'review' | 'disposed' | 'returned';

export interface FiveSRedTag {
  id: string;
  title: string;
  /**
   * Where on the floor plan the item is, in canvas coordinates.
   *
   * Position is information: "the pallet by the north door" is a different
   * finding from "the pallet by the bench". Optional, because tags recorded
   * before pins existed have none and are placed when first dragged.
   */
  x?: number;
  y?: number;
  disposition: string;
  status: FiveSRedTagStatus;
  ownerId?: string;
  ownerName?: string;
  dueDate?: string;
  createdAt?: string;
  /**
   * When the item was moved to the red-tag holding area.
   *
   * In practice a tagged item is taken out of the work area and parked
   * somewhere visible for a month or two while its use is watched. Status
   * `review` is that state; these dates say how long it has left.
   */
  heldAt?: string;
  holdUntil?: string;
  closedAt?: string;
}

export interface FiveSZone {
  id: string;
  code: string;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  ownerId?: string;
  ownerName?: string;
  contents: string;
  standard: string;
  labelText: string;
  stage: FiveSStage;
  auditFrequency: 'daily' | 'weekly' | 'monthly';
  lastAuditScore?: number;
  lastAuditAt?: string;
  /**
   * The first score this zone ever received. Frozen by the server so later
   * improvement is measurable rather than merely visible.
   */
  /**
   * What each layer of a layered audit last found here, keyed by tier number.
   *
   * The layers run on their own clocks, so a zone can be up to date for the
   * operator and overdue for the manager at once.
   */
  tierAudits?: Record<string, { lastAuditAt?: string; lastAuditScore?: number }>;
  baselineScore?: number;
  baselineAt?: string;
  redTagCount?: number;
  redTags?: FiveSRedTag[];
  lastCleanedAt?: string;
}

export interface FloorPlanObject {
  id: string;
  type: FloorPlanObjectType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

/** One layer of a layered process audit. Declared per organization. */
export interface AuditTier {
  tier: number;
  name: string;
  role?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  templateId?: string;
}

/** A point where walls meet. */
export interface PlanCorner {
  id: string;
  x: number;
  y: number;
}

export interface PlanWall {
  id: string;
  from: string;
  to: string;
  /** In canvas units: outer walls are drawn thicker than partitions. */
  thickness: number;
}

/**
 * A door or a window: a hole in a wall, not a thing standing on the floor.
 *
 * It belongs to a wall and is measured along it, so moving a corner carries
 * its doors with it. Stored among the objects it would float free of the wall
 * again, which is the mistake the wall graph exists to correct.
 */
export interface PlanOpening {
  id: string;
  wallId: string;
  kind: 'door' | 'double_door' | 'window';
  /** The centre of the opening, in canvas units from the wall's `from` end. */
  offset: number;
  width: number;
  hinge?: 'from' | 'to';
  flip?: boolean;
}

/**
 * A room's name: a point with words on it.
 *
 * Rooms are not stored — they are whatever the walls close in — so there is
 * nothing to hang a name on. The room a name belongs to is whichever room its
 * point falls inside, which is also why moving a wall keeps the name in the
 * room and knocking the room through leaves the name standing on open floor.
 */
export interface PlanRoomLabel {
  id: string;
  x: number;
  y: number;
  name: string;
}

export interface FiveSLayoutPlan {
  id: string;
  organizationId?: string;
  name: string;
  site: string;
  /**
   * Free text describing the scale, kept for plans drawn before the scale
   * became a number. Nothing computes with it.
   *
   * @deprecated Read `metresPerUnit`.
   */
  scale: string;
  /**
   * How many metres one canvas unit covers.
   *
   * The whole of a floor plan's usefulness beyond decoration rests on this:
   * area per zone, red tags per square metre, printing to scale, and one day a
   * spaghetti diagram reporting a walking distance in metres. Absent on plans
   * drawn before it existed, which are read at one grid square to the metre —
   * what their free-text `scale` already claimed.
   */
  metresPerUnit?: number;
  backgroundImage?: string;
  backgroundOpacity?: number;
  showGrid?: boolean;
  /**
   * Whether a drag snaps to the grid.
   *
   * Separate from `showGrid` because they are separate questions, though one
   * checkbox used to answer both: turning the grid off to look at the plan also
   * turned off snapping without saying so.
   */
  snapToGrid?: boolean;
  /** Whether every wall carries its length, not only the one being drawn. */
  showDimensions?: boolean;
  /** Absent until an organization configures its own layers. */
  auditTiers?: AuditTier[];
  /**
   * The corners walls meet at. Shared, so dragging one moves every wall on it.
   */
  corners?: PlanCorner[];
  /**
   * The walls of the building.
   *
   * Rooms are not stored: they are whatever the walls close in, worked out
   * from the wall graph whenever the plan is drawn. Storing them as well would
   * be a second copy of the same fact, and the two would part company the
   * first time somebody moved a corner.
   */
  walls?: PlanWall[];
  /** Doors and windows, each cut into one of the walls above. */
  openings?: PlanOpening[];
  /** Names for rooms, each a point inside the room it names. */
  roomLabels?: PlanRoomLabel[];
  zones: FiveSZone[];
  objects: FloorPlanObject[];
  createdAt?: string;
  updatedAt: string;
}

export type FiveSImprovementStatus = 'open' | 'in_progress' | 'management_review' | 'closed';

export interface FiveSImprovementRecord {
  id: string;
  area: string;
  responsible: string;
  recordDate: string;
  whenObserved: string;
  duration: string;
  symptomLoss: string;
  rootCause: string;
  teamDecision: string;
  actionPlan: string;
  managementDecision: string;
  status: FiveSImprovementStatus;
}

export type FiveSImplementationReason = 'defective' | 'unused' | 'excess' | 'unnecessary';

export type FiveSImplementationStatus = 'identified' | 'review' | 'approved' | 'removed' | 'returned';

export interface FiveSImplementationCard {
  id: string;
  tagType: '1C' | '2C' | '3C';
  itemNumber: string;
  quantity: string;
  itemName: string;
  reason: FiveSImplementationReason;
  department: string;
  date: string;
  owner: string;
  decision: string;
  status: FiveSImplementationStatus;
}

export interface FiveSAssessmentScore {
  id: string;
  score: number;
  note: string;
}

export interface FiveSChecklistProgress {
  id: string;
  done: boolean;
  note: string;
}

export interface FiveSGuidelineState {
  improvements: FiveSImprovementRecord[];
  implementationCards: FiveSImplementationCard[];
  assessmentScores: FiveSAssessmentScore[];
  checklistProgress: FiveSChecklistProgress[];
  updatedAt: string;
}
