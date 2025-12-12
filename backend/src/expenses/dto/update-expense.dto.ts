import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsArray,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ExpenseCategory } from '../entities/expense.entity';

export class UpdateExpenseDto {
  @ApiProperty({
    example: 'Business Trip - Tokyo',
    description: 'Expense title',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiProperty({
    example: 'Flight and accommodation for client meeting',
    description: 'Expense description',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    example: 1250.50,
    description: 'Expense amount',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiProperty({
    enum: ExpenseCategory,
    example: ExpenseCategory.TRAVEL,
    description: 'Expense category',
    required: false,
  })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiProperty({
    example: '2024-01-15',
    description: 'Expense date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date?: Date;

  @ApiProperty({
    example: 'org_123',
    description: 'Organization ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiProperty({
    example: { projectId: 'proj_123', clientId: 'client_456' },
    description: 'Expense metadata',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}