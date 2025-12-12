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

export class AttachmentDto {
  @ApiProperty({
    example: 'receipt.jpg',
    description: 'Attachment file name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'https://example.com/receipts/receipt123.jpg',
    description: 'Attachment URL',
  })
  @IsString()
  url: string;

  @ApiProperty({
    example: 'image/jpeg',
    description: 'Attachment MIME type',
    required: false,
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiProperty({
    example: 1024000,
    description: 'Attachment size in bytes',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  size?: number;
}

export class CreateExpenseDto {
  @ApiProperty({
    example: 'Business Trip - Tokyo',
    description: 'Expense title',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

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
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    enum: ExpenseCategory,
    example: ExpenseCategory.TRAVEL,
    description: 'Expense category',
  })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({
    example: '2024-01-15',
    description: 'Expense date',
  })
  @IsDateString()
  date: Date;

  @ApiProperty({
    example: 'org_123',
    description: 'Organization ID',
  })
  @IsUUID()
  organizationId: string;

  @ApiProperty({
    type: [AttachmentDto],
    description: 'Expense attachments',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @ApiProperty({
    example: { projectId: 'proj_123', clientId: 'client_456' },
    description: 'Expense metadata',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}