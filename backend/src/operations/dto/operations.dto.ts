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
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { AssessmentResponseStatus } from '../entities/assessment-response.entity';
import { AssessmentStatus, AssessmentType } from '../entities/assessment-template.entity';
import { AuditCategory } from '../entities/audit-template.entity';
import { ExpenseCategory, ExpenseStatus } from '../entities/expense.entity';
import { ProjectStatus } from '../entities/project.entity';
import { TaskStatus } from '../entities/task.entity';

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

class FloorPlanObjectDto {
  @IsString()
  id: string;

  @IsIn(['wall', 'door', 'desk', 'shelf', 'equipment', 'table'])
  type: 'wall' | 'door' | 'desk' | 'shelf' | 'equipment' | 'table';

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

export class UpsertFiveSLayoutDto extends OrganizationScopedDto {
  @IsString()
  name: string;

  @IsString()
  site: string;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FiveSZoneDto)
  zones: FiveSZoneDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FloorPlanObjectDto)
  objects: FloorPlanObjectDto[];
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
