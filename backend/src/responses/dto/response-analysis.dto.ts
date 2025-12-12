import { ApiProperty } from '@nestjs/swagger';

export class ResponseAnalysisDto {
  @ApiProperty({
    example: 'resp_123',
    description: 'Response ID',
  })
  id: string;

  @ApiProperty({
    example: 'ques_123',
    description: 'Questionnaire ID',
  })
  questionnaireId: string;

  @ApiProperty({
    example: 'Customer Satisfaction Survey',
    description: 'Questionnaire title',
  })
  questionnaireTitle: string;

  @ApiProperty({
    example: 'user_123',
    description: 'User ID',
  })
  userId: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email',
  })
  userEmail: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Submission timestamp',
  })
  submittedAt: Date;

  @ApiProperty({
    example: 120,
    description: 'Completion time in seconds',
  })
  completionTime?: number;

  @ApiProperty({
    example: 10,
    description: 'Total questions',
  })
  totalQuestions: number;

  @ApiProperty({
    example: 8,
    description: 'Answered questions',
  })
  answeredQuestions: number;

  @ApiProperty({
    example: 80,
    description: 'Completion percentage',
  })
  completionPercentage: number;

  @ApiProperty({
    example: 45.5,
    description: 'Average text length',
  })
  averageTextLength: number;

  @ApiProperty({
    description: 'Detailed answers',
  })
  answers: Array<{
    questionId: string;
    questionText: string;
    questionType: string;
    answer: any;
    answeredAt: Date;
  }>;
}