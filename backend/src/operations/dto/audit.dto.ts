/**
 * Audit checklists and the runs walked against them, and the assessment forms and
 * their responses.
 */
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsDefined, IsEnum, IsIn, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { AssessmentResponseStatus } from '../entities/assessment-response.entity';
import { AssessmentStatus, AssessmentType } from '../entities/assessment-template.entity';
import { AuditCategory } from '../entities/audit-template.entity';
import { EmptyIsAbsent, OrganizationScopedDto } from './shared.dto';

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

  @EmptyIsAbsent()
  @IsOptional()
  @IsDateString()
  submittedAt?: string;
}

export class UpdateAssessmentResponseDto extends PartialType(CreateAssessmentResponseDto) {}
