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
  disposition: string;
  status: FiveSRedTagStatus;
  ownerId?: string;
  ownerName?: string;
  dueDate?: string;
  createdAt?: string;
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

export interface FiveSLayoutPlan {
  id: string;
  organizationId?: string;
  name: string;
  site: string;
  scale: string;
  backgroundImage?: string;
  backgroundOpacity?: number;
  showGrid?: boolean;
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
