import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AssessmentResponseStatus } from '../entities/assessment-response.entity';
import { AssessmentStatus, AssessmentType } from '../entities/assessment-template.entity';
import { AuditCategory } from '../entities/audit-template.entity';
import { ExpenseCategory, ExpenseStatus } from '../entities/expense.entity';
import { ProjectStatus } from '../entities/project.entity';
import { TaskSource, TaskStatus } from '../entities/task.entity';
import { UserRole } from '../../shared/constants';

class ChecklistQuestionDto {
  @IsString()
  id: string;

  @IsString()
  text: string;

  @IsIn(['score', 'yes_no', 'text'])
  type: 'score' | 'yes_no' | 'text';

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;
}

class ChecklistAnswerDto {
  @IsString()
  questionId: string;

  @IsDefined()
  value: string | number | boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

class OrganizationScopedDto {
  @IsOptional()
  @IsString()
  organizationId?: string;
}

class FiveSRedTagDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  disposition: string;

  @IsIn(['open', 'review', 'disposed', 'returned'])
  status: 'open' | 'review' | 'disposed' | 'returned';

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  createdAt?: string;

  @IsOptional()
  @IsString()
  closedAt?: string;
}

class FiveSZoneDto {
  @IsString()
  id: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  color: string;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsString()
  contents: string;

  @IsString()
  standard: string;

  @IsString()
  labelText: string;

  @IsIn(['sort', 'set_in_order', 'shine', 'standardize', 'sustain'])
  stage: 'sort' | 'set_in_order' | 'shine' | 'standardize' | 'sustain';

  @IsIn(['daily', 'weekly', 'monthly'])
  auditFrequency: 'daily' | 'weekly' | 'monthly';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  lastAuditScore?: number;

  @IsOptional()
  @IsString()
  lastAuditAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  redTagCount?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FiveSRedTagDto)
  redTags?: FiveSRedTagDto[];

  @IsOptional()
  @IsString()
  lastCleanedAt?: string;
}

export const FLOOR_PLAN_OBJECT_TYPES = [
  'wall',
  'door',
  'desk',
  'chair',
  'table',
  'shelf',
  'cabinet',
  'printer',
  'equipment',
  'whiteboard',
  'sofa',
  'plant',
  'waste_bin',
  'sink',
  'pallet',
  'racking',
  'workbench',
] as const;

export type FloorPlanObjectType = (typeof FLOOR_PLAN_OBJECT_TYPES)[number];

class FloorPlanObjectDto {
  @IsString()
  id: string;

  // Every type the editor can place. The list used to stop at six, so a plan
  // containing a chair, a cabinet, a printer, a whiteboard, a sofa, a plant, a
  // bin or a sink was refused outright by the validation pipe — the object was
  // placeable and unsaveable.
  @IsIn(FLOOR_PLAN_OBJECT_TYPES)
  type: FloorPlanObjectType;

  @IsString()
  label: string;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsOptional()
  @IsNumber()
  rotation?: number;
}

export class CreateProjectDto extends OrganizationScopedDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class CreateTaskDto extends OrganizationScopedDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  reporterId?: string;

  /** What produced this task — a red tag, an audit run, an improvement record. */
  @IsOptional()
  @IsEnum(TaskSource)
  sourceType?: TaskSource;

  /** The record inside that source. Not a UUID: 5S ids live in the plan's JSON. */
  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualHours?: number;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class CreateWorkLogDto extends OrganizationScopedDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsDateString()
  logDate?: string;

  @IsString()
  summary: string;

  @IsOptional()
  @IsString()
  blockers?: string;

  @IsOptional()
  @IsString()
  nextSteps?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hours?: number;
}

export class CreateTimeEntryDto extends OrganizationScopedDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsDateString()
  workDate?: string;

  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hours?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateDailyGoalDto extends OrganizationScopedDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class UpdateDailyGoalDto extends PartialType(CreateDailyGoalDto) {}

/**
 * A point where walls meet.
 *
 * Corners are shared by every wall that ends on them, which is what makes
 * dragging one move the whole junction instead of leaving a gap.
 */
class PlanCornerDto {
  @IsString()
  id: string;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

class PlanWallDto {
  @IsString()
  id: string;

  @IsString()
  from: string;

  @IsString()
  to: string;

  @IsNumber()
  @Min(0)
  thickness: number;
}

/** A door or window, which belongs to a wall rather than to the floor. */
class PlanOpeningDto {
  @IsString()
  id: string;

  @IsString()
  wallId: string;

  @IsIn(['door', 'double_door', 'window'])
  kind: 'door' | 'double_door' | 'window';

  @IsNumber()
  @Min(0)
  offset: number;

  @IsNumber()
  @Min(0)
  width: number;

  @IsOptional()
  @IsIn(['from', 'to'])
  hinge?: 'from' | 'to';

  @IsOptional()
  @IsBoolean()
  flip?: boolean;
}

/** A room's name, as a point inside it. */
class PlanRoomLabelDto {
  @IsString()
  id: string;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsString()
  name: string;
}

/**
 * A red tag raised from the floor.
 *
 * Two fields, because somebody is typing this on a phone next to the thing
 * they are tagging. Everything else about the tag is the server's.
 */
export class CreateRedTagDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  disposition?: string;
}

/** A new plan: everything else about it is drawn afterwards. */
/**
 * One layer of a layered audit.
 *
 * `role` is what decides who its task lands on, so it is checked against the
 * platform's own role names rather than accepted as free text — a layer asking
 * for "supervisor" would silently match nobody.
 */
class AuditTierDto {
  @IsNumber()
  @Min(1)
  @Max(9)
  tier: number;

  @IsString()
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsIn(['daily', 'weekly', 'monthly'])
  frequency: 'daily' | 'weekly' | 'monthly';

  @IsOptional()
  @IsUUID()
  templateId?: string;
}

class PlanPointDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

/** One path through the area, in canvas units. */
class PlanRouteDto {
  @IsString()
  id: string;

  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(32)
  colour: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanPointDto)
  points: PlanPointDto[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subject?: string;
}

export class CreateFiveSLayoutDto extends OrganizationScopedDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  site?: string;

  @IsOptional()
  @IsString()
  floor?: string;
}

export class UpsertFiveSLayoutDto extends OrganizationScopedDto {
  @IsString()
  name: string;

  @IsString()
  site: string;

  /** Which floor of that site. Empty for a single-storey place. */
  @IsOptional()
  @IsString()
  floor?: string;

  @IsString()
  scale: string;

  @IsOptional()
  @IsString()
  backgroundImage?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  backgroundOpacity?: number;

  @IsOptional()
  @IsBoolean()
  showGrid?: boolean;

  @IsOptional()
  @IsBoolean()
  snapToGrid?: boolean;

  @IsOptional()
  @IsBoolean()
  showDimensions?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FiveSZoneDto)
  zones: FiveSZoneDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FloorPlanObjectDto)
  objects: FloorPlanObjectDto[];

  // Optional because a plan saved by an older client has no wall graph, and
  // that has to keep working rather than being rejected.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanCornerDto)
  corners?: PlanCornerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanWallDto)
  walls?: PlanWallDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanOpeningDto)
  openings?: PlanOpeningDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanRoomLabelDto)
  roomLabels?: PlanRoomLabelDto[];

  /**
   * How many metres one canvas unit covers.
   *
   * Everything the plan is worth beyond decoration rests on it: area per zone,
   * red tags per square metre, printing to scale. A zero would make every
   * length and area zero without saying so, hence the exclusive minimum.
   */
  @IsOptional()
  @IsNumber()
  @Min(0.000001)
  metresPerUnit?: number;

  /**
   * The audit layers, or none to keep the defaults.
   *
   * Optional for the same reason as the wall graph: a plan saved by an older
   * client does not send them, and rejecting it would break saving to fix
   * configuring.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuditTierDto)
  auditTiers?: AuditTierDto[];

  /** Spaghetti diagrams. Optional, like the wall graph, for older clients. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanRouteDto)
  routes?: PlanRouteDto[];
}

/**
 * A department: its name, who answers for it, and what it is for.
 *
 * Nothing about its people or its areas is set from here — a person's
 * department is a field on the person and a zone's is a field on the zone, so
 * membership is changed where the member is rather than by posting a list.
 */
/**
 * What people have filled in against the 5S standard.
 *
 * Deliberately a free-shaped object: it holds an improvement register, red-tag
 * cards, assessment scores and checklist ticks, all of which the browser
 * composes. What matters at this boundary is that it is an object and that it
 * cannot carry the standard itself — a checklist tick must not be able to move
 * the goalposts it is ticked against.
 */
export class SaveFiveSGuidelineRecordsDto extends OrganizationScopedDto {
  @IsObject()
  records: Record<string, unknown>;
}

/**
 * The 5S standard an organization works to.
 *
 * Free-shaped for the same reason the records are: the browser composes the
 * cadence, the labelling rules, the criteria and the checklists, and what
 * matters at this boundary is that it is an object and that it cannot carry
 * the records — a change of standard must not be able to rewrite what people
 * filled in against the old one.
 */
export class SaveFiveSGuidelineContentDto extends OrganizationScopedDto {
  @IsObject()
  content: Record<string, unknown>;
}

/** A name for a snapshot — "before the racking moved". Optional. */
export class KeepLayoutVersionDto extends OrganizationScopedDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;
}

export class CreateDepartmentDto extends OrganizationScopedDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  focusArea?: string;
}

export class UpdateDepartmentDto extends OrganizationScopedDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  focusArea?: string;
}

export class CreateAuditTemplateDto extends OrganizationScopedDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AuditCategory)
  category?: AuditCategory;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistQuestionDto)
  questions?: ChecklistQuestionDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateAuditRunDto extends OrganizationScopedDto {
  @IsUUID()
  templateId: string;

  @IsOptional()
  @IsString()
  auditorId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  /** Zone ids come from the floor plan JSON, not the database, so not a UUID. */
  @IsOptional()
  @IsString()
  zoneId?: string;

  /** Which layer of the audit this was. Absent for an unlayered audit. */
  @IsOptional()
  @IsNumber()
  @Min(1)
  tier?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistAnswerDto)
  answers?: ChecklistAnswerDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateAssessmentTemplateDto extends OrganizationScopedDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AssessmentType)
  type?: AssessmentType;

  @IsOptional()
  @IsEnum(AssessmentStatus)
  status?: AssessmentStatus;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistQuestionDto)
  questions?: ChecklistQuestionDto[];
}

export class UpdateAssessmentTemplateDto extends PartialType(CreateAssessmentTemplateDto) {}

export class CreateAssessmentResponseDto extends OrganizationScopedDto {
  @IsUUID()
  templateId: string;

  @IsOptional()
  @IsString()
  respondentId?: string;

  @IsOptional()
  @IsString()
  respondent?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsEnum(AssessmentResponseStatus)
  status?: AssessmentResponseStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistAnswerDto)
  answers?: ChecklistAnswerDto[];

  @IsOptional()
  @IsDateString()
  submittedAt?: string;
}

export class UpdateAssessmentResponseDto extends PartialType(CreateAssessmentResponseDto) {}

export class CreateExpenseDto extends OrganizationScopedDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  submittedBy?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
