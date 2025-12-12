import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { Questionnaire } from './questionnaire.entity';

export enum ReportType {
  QUESTIONNAIRE = 'questionnaire',
  EXPENSE = 'expense',
  COMBINED = 'combined',
  CUSTOM = 'custom',
}

export enum ReportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPORTED = 'exported',
}

@Entity('reports')
@Index(['organizationId', 'type'])
@Index(['generatedById', 'createdAt'])
@Index(['status', 'exportedAt'])
export class Report extends BaseEntity {
  @ApiProperty({ description: 'Тайлангийн төрөл', enum: ReportType })
  @Column({ type: 'enum', enum: ReportType })
  type: ReportType;

  @ApiProperty({ description: 'Тайлангийн гарчиг' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ description: 'Тайлангийн тайлбар', nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Тайлангийн өгөгдөл (JSON)' })
  @Column({ type: 'json' })
  data: any;

  @ApiProperty({ description: 'Тайлангийн статус', enum: ReportStatus, default: ReportStatus.PENDING })
  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @ApiProperty({ description: 'Экспортолсон зам (PDF, Excel)', nullable: true })
  @Column({ type: 'varchar', length: 500, nullable: true })
  exportPath?: string;

  @ApiProperty({ description: 'Экспортолсон формат', nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  exportFormat?: string;

  @ApiProperty({ description: 'Экспортолсон огноо', nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  exportedAt?: Date;

  @ApiProperty({ description: 'Тайлангийн параметрүүд (JSON)', nullable: true })
  @Column({ type: 'json', nullable: true })
  parameters?: Record<string, any>;

  @ApiProperty({ description: 'Хамаарах байгууллагын ID' })
  @Column({ type: 'uuid' })
  organizationId: string;

  @ApiProperty({ description: 'Холбогдох асуулгын ID', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  questionnaireId?: string;

  @ApiProperty({ description: 'Тайлан үүсгэсэн хэрэглэгчийн ID' })
  @Column({ type: 'uuid' })
  generatedById: string;

  @ApiProperty({ description: 'Алдааны мэдээлэл', nullable: true })
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  // Relationships
  @ManyToOne(() => Organization, (organization) => organization.reports)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => User, (user) => user.generatedReports)
  @JoinColumn({ name: 'generatedById' })
  generatedBy: User;

  @ManyToOne(() => Questionnaire, { nullable: true })
  @JoinColumn({ name: 'questionnaireId' })
  questionnaire?: Questionnaire;
}