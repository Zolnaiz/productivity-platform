import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ExpenseCategory } from '../../expenses/entities/expense.entity';

export class ReportFilterDto {
  @ApiProperty({
    description: 'Байгууллагын ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @ApiProperty({
    description: 'Эхлэх огноо (YYYY-MM-DD)',
    example: '2024-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Дуусах огноо (YYYY-MM-DD)',
    example: '2024-01-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Зардлын төрөл',
    enum: ExpenseCategory,
    required: false,
  })
  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: ExpenseCategory;

  @ApiProperty({
    description: 'Тайлангийн төрөл',
    example: 'questionnaire',
    required: false,
  })
  @IsOptional()
  reportType?: string;

  @ApiProperty({
    description: 'Хуудасны дугаар',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Хуудасны хэмжээ',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({
    description: 'Эрэмбэлэх талбар',
    example: 'createdAt',
    required: false,
  })
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Эрэмбэлэх чиглэл',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    required: false,
  })
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}