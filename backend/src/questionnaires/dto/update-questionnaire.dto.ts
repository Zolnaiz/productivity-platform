import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsEnum,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '../entities/questionnaire.entity';

export class UpdateQuestionDto {
  @ApiProperty({
    example: 'How satisfied are you with our service?',
    description: 'Question text',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  text?: string;

  @ApiProperty({
    enum: QuestionType,
    example: QuestionType.RATING,
    description: 'Question type',
    required: false,
  })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiProperty({
    example: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
    description: 'Answer options (for choice questions)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty({
    example: true,
    description: 'Whether the question is required',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiProperty({
    example: 'Please rate from 1 to 5',
    description: 'Placeholder text',
    required: false,
  })
  @IsOptional()
  @IsString()
  placeholder?: string;

  @ApiProperty({
    example: 1,
    description: 'Minimum value (for number/rating questions)',
    required: false,
  })
  @IsOptional()
  minValue?: number;

  @ApiProperty({
    example: 5,
    description: 'Maximum value (for number/rating questions)',
    required: false,
  })
  @IsOptional()
  maxValue?: number;
}

export class UpdateQuestionnaireDto {
  @ApiProperty({
    example: 'Customer Satisfaction Survey',
    description: 'Questionnaire title',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiProperty({
    example: 'Survey to measure customer satisfaction with our services',
    description: 'Questionnaire description',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    example: 'org_123',
    description: 'Organization ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiProperty({
    type: [UpdateQuestionDto],
    description: 'List of questions',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuestionDto)
  questions?: UpdateQuestionDto[];

  @ApiProperty({
    example: '2024-12-31T23:59:59.999Z',
    description: 'Expiration date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @ApiProperty({
    example: true,
    description: 'Whether the questionnaire is active',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: ['tag1', 'tag2'],
    description: 'Questionnaire tags',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    example: { allowAnonymous: true, requireLogin: false },
    description: 'Questionnaire settings',
    required: false,
  })
  @IsOptional()
  settings?: Record<string, any>;
}