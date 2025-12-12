import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '../entities/questionnaire.entity';

export class QuestionResponseDto {
  @ApiProperty({
    example: 'ques_123',
    description: 'Question ID',
  })
  id: string;

  @ApiProperty({
    example: 'How satisfied are you with our service?',
    description: 'Question text',
  })
  text: string;

  @ApiProperty({
    enum: QuestionType,
    example: QuestionType.RATING,
    description: 'Question type',
  })
  type: QuestionType;

  @ApiProperty({
    example: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
    description: 'Answer options',
  })
  options?: string[];

  @ApiProperty({
    example: true,
    description: 'Whether the question is required',
  })
  isRequired: boolean;

  @ApiProperty({
    example: 'Please rate from 1 to 5',
    description: 'Placeholder text',
  })
  placeholder?: string;

  @ApiProperty({
    example: 1,
    description: 'Minimum value',
  })
  minValue?: number;

  @ApiProperty({
    example: 5,
    description: 'Maximum value',
  })
  maxValue?: number;
}

export class QuestionnaireResponseDto {
  @ApiProperty({
    example: 'ques_123',
    description: 'Questionnaire ID',
  })
  id: string;

  @ApiProperty({
    example: 'Customer Satisfaction Survey',
    description: 'Questionnaire title',
  })
  title: string;

  @ApiProperty({
    example: 'Survey to measure customer satisfaction with our services',
    description: 'Questionnaire description',
  })
  description?: string;

  @ApiProperty({
    example: 'org_123',
    description: 'Organization ID',
  })
  organizationId: string;

  @ApiProperty({
    type: [QuestionResponseDto],
    description: 'List of questions',
  })
  questions: QuestionResponseDto[];

  @ApiProperty({
    example: 150,
    description: 'Number of responses',
  })
  responseCount: number;

  @ApiProperty({
    example: '2024-12-31T23:59:59.999Z',
    description: 'Expiration date',
  })
  expiresAt?: Date;

  @ApiProperty({
    example: true,
    description: 'Whether the questionnaire is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: ['tag1', 'tag2'],
    description: 'Questionnaire tags',
  })
  tags?: string[];

  @ApiProperty({
    example: { allowAnonymous: true, requireLogin: false },
    description: 'Questionnaire settings',
  })
  settings?: Record<string, any>;

  @ApiProperty({
    example: 'user_123',
    description: 'Created by user ID',
  })
  createdBy: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Created by user name',
  })
  createdByName?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}