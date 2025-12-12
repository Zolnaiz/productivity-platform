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

export class UpdateAnswerDto {
  @ApiProperty({
    example: 'q_123',
    description: 'Question ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  questionId?: string;

  @ApiProperty({
    example: 'Very Satisfied',
    description: 'Answer value',
    required: false,
  })
  @IsOptional()
  value?: any;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Answer timestamp',
    required: false,
  })
  @IsOptional()
  answeredAt?: Date;
}

export class UpdateResponseDto {
  @ApiProperty({
    example: 'ques_123',
    description: 'Questionnaire ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  questionnaireId?: string;

  @ApiProperty({
    type: [UpdateAnswerDto],
    description: 'List of answers',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAnswerDto)
  answers?: UpdateAnswerDto[];

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