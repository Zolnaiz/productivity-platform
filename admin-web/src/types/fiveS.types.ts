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
  | 'sink';

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

export interface FiveSLayoutPlan {
  id: string;
  organizationId?: string;
  name: string;
  site: string;
  scale: string;
  backgroundImage?: string;
  backgroundOpacity?: number;
  showGrid?: boolean;
  /** Absent until an organization configures its own layers. */
  auditTiers?: AuditTier[];
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
