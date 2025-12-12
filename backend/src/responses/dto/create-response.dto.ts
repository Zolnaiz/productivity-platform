import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  IsObject,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AnswerDto {
  @ApiProperty({
    example: 'q_123',
    description: 'Question ID',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    example: 'Very Satisfied',
    description: 'Answer value',
  })
  value: any;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Answer timestamp',
    required: false,
  })
  @IsOptional()
  answeredAt?: Date;
}

export class CreateResponseDto {
  @ApiProperty({
    example: 'ques_123',
    description: 'Questionnaire ID',
  })
  @IsUUID()
  questionnaireId: string;

  @ApiProperty({
    type: [AnswerDto],
    description: 'List of answers',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @ApiProperty({
    example: 30000,
    description: 'Completion time in milliseconds',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  completionTime?: number;

  @ApiProperty({
    example: { device: 'mobile', browser: 'Chrome' },
    description: 'Response metadata',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}