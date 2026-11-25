/**
 * Projects, tasks, the daily work log, time entries, daily goals and expenses:
 * what a person's day is recorded in.
 */
import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { ExpenseCategory, ExpenseStatus } from '../entities/expense.entity';
import { ProjectStatus } from '../entities/project.entity';
import { TaskSource, TaskStatus } from '../entities/task.entity';
import { EmptyIsAbsent, OrganizationScopedDto } from './shared.dto';

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

  @EmptyIsAbsent()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @EmptyIsAbsent()
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

  @EmptyIsAbsent()
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

  /** Why the area fell short, for a fix an audit raised. */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rootCause?: string;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class CreateWorkLogDto extends OrganizationScopedDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @EmptyIsAbsent()
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
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @EmptyIsAbsent()
  @IsOptional()
  @IsDateString()
  workDate?: string;

  @EmptyIsAbsent()
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @EmptyIsAbsent()
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

  @EmptyIsAbsent()
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class UpdateDailyGoalDto extends PartialType(CreateDailyGoalDto) {}

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

  @EmptyIsAbsent()
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
