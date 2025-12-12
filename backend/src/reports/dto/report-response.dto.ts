import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { ReportType, ReportStatus } from '../../shared/entities/report.entity';

export class ReportResponseDto {
  @ApiProperty({
    description: 'Тайлангийн ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Тайлангийн төрөл',
    enum: ReportType,
    example: ReportType.QUESTIONNAIRE,
  })
  @Expose()
  type: ReportType;

  @ApiProperty({
    description: 'Тайлангийн гарчиг',
    example: '2024 оны 1-р сарын асуулгын тайлан',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Тайлангийн тайлбар',
    example: 'Нийт 150 хэрэглэгчийн хариултын дүн шинжилгээ',
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'Тайлангийн өгөгдөл (JSON)',
    type: Object,
  })
  @Expose()
  data: any;

  @ApiProperty({
    description: 'Тайлангийн статус',
    enum: ReportStatus,
    example: ReportStatus.COMPLETED,
  })
  @Expose()
  status: ReportStatus;

  @ApiProperty({
    description: 'Байгууллагын ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Expose()
  organizationId: string;

  @ApiProperty({
    description: 'Холбогдох асуулгын ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @Expose()
  questionnaireId?: string;

  @ApiProperty({
    description: 'Тайлан үүсгэсэн хэрэглэгчийн ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @Expose()
  generatedById: string;

  @ApiProperty({
    description: 'Тайлангийн параметрүүд',
    type: Object,
    required: false,
  })
  @Expose()
  parameters?: Record<string, any>;

  @ApiProperty({
    description: 'Тайланг экспортолсон огноо',
    example: '2024-01-31T10:30:00.000Z',
    required: false,
  })
  @Expose()
  exportedAt?: Date;

  @ApiProperty({
    description: 'Үүсгэсэн огноо',
    example: '2024-01-31T10:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Сүүлд шинэчлэгдсэн огноо',
    example: '2024-01-31T10:30:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'Байгууллагын мэдээлэл',
    type: Object,
  })
  @Expose()
  organization?: {
    id: string;
    name: string;
    email?: string;
  };

  @ApiProperty({
    description: 'Тайлан үүсгэсэн хэрэглэгчийн мэдээлэл',
    type: Object,
  })
  @Expose()
  generatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

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
}

export class ReportListResponseDto {
  @ApiProperty({
    description: 'Тайлангийн жагсаалт',
    type: [ReportResponseDto],
  })
  @Expose()
  reports: ReportResponseDto[];

  @ApiProperty({
    description: 'Нийт тайлангийн тоо',
    example: 150,
  })
  @Expose()
  total: number;

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

export class QuickReportResponseDto {
  @ApiProperty({
    description: 'Түргэн тайлангийн мэдээлэл',
    type: Object,
  })
  @Expose()
  data: any;

  @ApiProperty({
    description: 'Тайлан үүсгэсэн огноо',
    example: '2024-01-31T10:30:00.000Z',
  })
  @Expose()
  generatedAt: Date;

  @ApiProperty({
    description: 'Тайлангийн параметрүүд',
    type: Object,
  })
  @Expose()
  parameters: {
    startDate?: string;
    endDate?: string;
    organizationId?: string;
    category?: string;
  };
}

export class DashboardSummaryDto {
  @ApiProperty({
    description: 'Нийт статистик',
    type: Object,
    example: {
      questionnaires: 50,
      expenses: 200,
      responses: 1500,
      totalExpenseAmount: 5000000,
    },
  })
  @Expose()
  totals: {
    questionnaires: number;
    expenses: number;
    responses: number;
    totalExpenseAmount: number;
  };

  @ApiProperty({
    description: 'Сүүлийн үйл ажиллагаа',
    type: Object,
  })
  @Expose()
  recentActivity: {
    recentExpenses: any[];
    topQuestionnaires: any[];
    recentResponses: any[];
  };

  @ApiProperty({
    description: 'График, диаграммын өгөгдөл',
    type: Object,
  })
  @Expose()
  charts: {
    monthlyExpenses: Record<string, number>;
    expenseByCategory: Record<string, any>;
    responseTrends: Record<string, number>;
  };
}