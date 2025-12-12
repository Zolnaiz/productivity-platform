import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { Questionnaire } from './questionnaire.entity';

export enum ResponseStatus {
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('responses')
@Index(['questionnaireId', 'userId'])
@Index(['organizationId', 'submittedAt'])
@Index(['status', 'score'])
export class Response extends BaseEntity {
  @ApiProperty({ description: 'Хариулт өгсөн хэрэглэгчийн ID' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Хамаарах асуулгын ID' })
  @Column({ type: 'uuid' })
  questionnaireId: string;

  @ApiProperty({ description: 'Байгууллагын ID' })
  @Column({ type: 'uuid' })
  organizationId: string;

  @ApiProperty({ description: 'Хариултууд (JSON)' })
  @Column({ type: 'json' })
  answers: Array<{
    questionId: string;
    answer: any;
    score?: number;
    comment?: string;
  }>;

  @ApiProperty({ description: 'Нийт оноо', nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score?: number;

  @ApiProperty({ description: 'Максимум оноо', nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxScore?: number;

  @ApiProperty({ description: 'Хувь (%)', nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage?: number;

  @ApiProperty({ description: 'Хариултын статус', enum: ResponseStatus, default: ResponseStatus.IN_PROGRESS })
  @Column({ type: 'enum', enum: ResponseStatus, default: ResponseStatus.IN_PROGRESS })
  status: ResponseStatus;

  @ApiProperty({ description: 'Илгээсэн огноо', nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @ApiProperty({ description: 'Шалгасан огноо', nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @ApiProperty({ description: 'Шалгасан хэрэглэгчийн ID', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  reviewedBy?: string;

  @ApiProperty({ description: 'Тайлбар', nullable: true })
  @Column({ type: 'text', nullable: true })
  comments?: string;

  @ApiProperty({ description: 'Өөрчлөлтийн түүх (JSON)', nullable: true })
  @Column({ type: 'json', nullable: true })
  revisionHistory?: Array<{
    timestamp: Date;
    action: string;
    changes: any;
    userId: string;
  }>;

  @ApiProperty({ description: 'Нэмэлт өгөгдөл (JSON)', nullable: true })
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Relationships
  @ManyToOne(() => User, (user) => user.responses)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Questionnaire, (questionnaire) => questionnaire.responses)
  @JoinColumn({ name: 'questionnaireId' })
  questionnaire: Questionnaire;

  @ManyToOne(() => Organization, (organization) => organization.responses)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer?: User;
}