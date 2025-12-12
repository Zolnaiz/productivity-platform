import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsDateString, IsOptional, IsNotEmpty, ValidateIf } from 'class-validator';
import { ReportType } from '../../shared/entities/report.entity';

export class GenerateReportDto {
  @ApiProperty({
    description: 'Тайлангийн төрөл',
    enum: ReportType,
    example: ReportType.QUESTIONNAIRE,
  })
  @IsEnum(ReportType)
  @IsNotEmpty()
  type: ReportType;

  @ApiProperty({
    description: 'Байгууллагын ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({
    description: 'Эхлэх огноо (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'Дуусах огноо (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    description: 'Асуулгын ID (QUESTIONNAIRE төрөлд шаардлагатай)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @ValidateIf(o => o.type === ReportType.QUESTIONNAIRE)
  questionnaireId?: string;

  @ApiProperty({
    description: 'Тайлан үүсгэсэн хэрэглэгчийн ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsNotEmpty()
  generatedBy: string;

  @ApiProperty({
    description: 'Тайлангийн нэмэлт параметрүүд',
    type: Object,
    required: false,
  })
  @IsOptional()
  parameters?: Record<string, any>;
}