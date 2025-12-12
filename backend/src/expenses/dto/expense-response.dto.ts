import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { ExpenseCategory, ExpenseStatus } from '../../shared/entities/expense.entity';

export class ExpenseResponseDto {
  @ApiProperty({
    description: 'Зардлын ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Зардлын нэр',
    example: 'Цахилгаан төлбөр',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Зардлын дэлгэрэнгүй мэдээлэл',
    example: '2024 оны 1-р сарын цахилгаан төлбөр',
    required: false,
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Зардлын дүн',
    example: 150000,
    minimum: 0,
  })
  @Expose()
  amount: number;

  @ApiProperty({
    description: 'Зардлын төрөл',
    enum: ExpenseCategory,
    example: ExpenseCategory.UTILITY,
  })
  @Expose()
  category: ExpenseCategory;

  @ApiProperty({
    description: 'Зардлын төлөв',
    enum: ExpenseStatus,
    example: ExpenseStatus.PAID,
    default: ExpenseStatus.PENDING,
  })
  @Expose()
  status: ExpenseStatus;

  @ApiProperty({
    description: 'Зардлын огноо',
    example: '2024-01-15',
  })
  @Expose()
  @Transform(({ value }) => value.toISOString().split('T')[0])
  expenseDate: Date;

  @ApiProperty({
    description: 'Зардлыг төлсөн огноо',
    example: '2024-01-20',
    required: false,
  })
  @Expose()
  @Transform(({ value }) => value ? value.toISOString().split('T')[0] : null)
  paidDate?: Date;

  @ApiProperty({
    description: 'Хүлээн авагчийн нэр',
    example: 'Дархан цахилгаан түгээх',
  })
  @Expose()
  recipientName: string;

  @ApiProperty({
    description: 'Хүлээн авагчийн дансны дугаар',
    example: '5000123456789',
    required: false,
  })
  @Expose()
  recipientAccount?: string;

  @ApiProperty({
    description: 'Зардлын нэхэмжлэх/баримтын дугаар',
    example: 'INV-2024-001',
    required: false,
  })
  @Expose()
  invoiceNumber?: string;

  @ApiProperty({
    description: 'Зардлын файл хавсралтууд',
    example: ['invoice.pdf', 'receipt.jpg'],
    required: false,
    type: [String],
  })
  @Expose()
  attachments?: string[];

  @ApiProperty({
    description: 'Холбогдох асуулгын ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @Expose()
  questionnaireId?: string;

  @ApiProperty({
    description: 'Хамааралтай байгууллагын ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Expose()
  organizationId: string;

  @ApiProperty({
    description: 'Зардлыг үүсгэсэн хэрэглэгчийн ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @Expose()
  createdBy: string;

  @ApiProperty({
    description: 'Зардлыг баталгаажуулсан хэрэглэгчийн ID',
    example: '123e4567-e89b-12d3-a456-426614174004',
    required: false,
  })
  @Expose()
  approvedBy?: string;

  @ApiProperty({
    description: 'Үүсгэсэн огноо',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Сүүлд шинэчлэгдсэн огноо',
    example: '2024-01-20T14:45:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'Холбогдох асуулгын мэдээлэл',
    type: Object,
    required: false,
  })
  @Expose()
  questionnaire?: {
    id: string;
    title: string;
    description?: string;
  };

  @ApiProperty({
    description: 'Хамааралтай байгууллагын мэдээлэл',
    type: Object,
  })
  @Expose()
  organization?: {
    id: string;
    name: string;
    email?: string;
  };

  @ApiProperty({
    description: 'Үүсгэсэн хэрэглэгчийн мэдээлэл',
    type: Object,
  })
  @Expose()
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty({
    description: 'Баталгаажуулсан хэрэглэгчийн мэдээлэл',
    type: Object,
    required: false,
  })
  @Expose()
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class ExpenseListResponseDto {
  @ApiProperty({
    description: 'Зардлын жагсаалт',
    type: [ExpenseResponseDto],
  })
  @Expose()
  expenses: ExpenseResponseDto[];

  @ApiProperty({
    description: 'Нийт зардлын тоо',
    example: 150,
  })
  @Expose()
  total: number;

  @ApiProperty({
    description: 'Нийт зардлын дүн',
    example: 4500000,
  })
  @Expose()
  totalAmount: number;

  @ApiProperty({
    description: 'Одоогийн хуудас',
    example: 1,
  })
  @Expose()
  page: number;

  @ApiProperty({
    description: 'Хуудасны хэмжээ',
    example: 10,
  })
  @Expose()
  limit: number;

  @ApiProperty({
    description: 'Нийт хуудасны тоо',
    example: 15,
  })
  @Expose()
  totalPages: number;
}

export class ExpenseSummaryDto {
  @ApiProperty({
    description: 'Төрөл тус бүрийн нийт дүн',
    type: Object,
    example: {
      [ExpenseCategory.UTILITY]: 150000,
      [ExpenseCategory.SALARY]: 3000000,
      [ExpenseCategory.OFFICE_SUPPLIES]: 500000,
    },
  })
  @Expose()
  amountByCategory: Record<ExpenseCategory, number>;

  @ApiProperty({
    description: 'Төлөв тус бүрийн тоо',
    type: Object,
    example: {
      [ExpenseStatus.PENDING]: 5,
      [ExpenseStatus.PAID]: 45,
      [ExpenseStatus.REJECTED]: 2,
    },
  })
  @Expose()
  countByStatus: Record<ExpenseStatus, number>;

  @ApiProperty({
    description: 'Сар бүрийн нийт дүн',
    type: Object,
    example: {
      '2024-01': 1500000,
      '2024-02': 1800000,
      '2024-03': 1200000,
    },
  })
  @Expose()
  amountByMonth: Record<string, number>;

  @ApiProperty({
    description: 'Нийт зардлын дүн',
    example: 4500000,
  })
  @Expose()
  totalAmount: number;

  @ApiProperty({
    description: 'Нийт зардлын тоо',
    example: 52,
  })
  @Expose()
  totalCount: number;
}