import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { Response } from './response.entity';
import { Expense } from '../../expenses/entities/expense.entity';

export enum QuestionnaireStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum QuestionnaireType {
  SURVEY = 'survey',
  QUIZ = 'quiz',
  EVALUATION = 'evaluation',
  FEEDBACK = 'feedback',
}

@Entity('questionnaires')
@Index(['organizationId', 'status'])
@Index(['createdBy', 'createdAt'])
@Index(['type', 'isActive'])
export class Questionnaire extends BaseEntity {
  @ApiProperty({ description: 'Асуулгын гарчиг' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ description: 'Асуулгын тайлбар', nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Асуулгын төрөл', enum: QuestionnaireType, default: QuestionnaireType.SURVEY })
  @Column({ type: 'enum', enum: QuestionnaireType, default: QuestionnaireType.SURVEY })
  type: QuestionnaireType;

  @ApiProperty({ description: 'Асуулгын статус', enum: QuestionnaireStatus, default: QuestionnaireStatus.DRAFT })
  @Column({ type: 'enum', enum: QuestionnaireStatus, default: QuestionnaireStatus.DRAFT })
  status: QuestionnaireStatus;

  @ApiProperty({ description: 'Идэвхтэй эсэх', default: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Асуултууд (JSON массив)' })
  @Column({ type: 'json' })
  questions: Array<{
    id: string;
    text: string;
    type: 'text' | 'multiple_choice' | 'single_choice' | 'rating' | 'scale' | 'date';
    options?: string[];
    required: boolean;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    weight?: number;
  }>;

  @ApiProperty({ description: 'Хугацаа (минут)', nullable: true })
  @Column({ type: 'integer', nullable: true })
  timeLimit?: number;

  @ApiProperty({ description: 'Эхлэх огноо', nullable: true })
  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @ApiProperty({ description: 'Дуусах огноо', nullable: true })
  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @ApiProperty({ description: 'Онооны систем', type: 'json', nullable: true })
  @Column({ type: 'json', nullable: true })
  scoring?: {
    passingScore?: number;
    maxScore: number;
    criteria?: Array<{
      questionId: string;
      weight: number;
      correctAnswers?: string[];
    }>;
  };

  @ApiProperty({ description: 'Хариултын тоо', default: 0 })
  @Column({ type: 'integer', default: 0 })
  responseCount: number;

  @ApiProperty({ description: 'Дундаж оноо', nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  averageScore?: number;

  @ApiProperty({ description: 'Хамаарах байгууллагын ID' })
  @Column({ type: 'uuid' })
  organizationId: string;

  @ApiProperty({ description: 'Асуулга үүсгэсэн хэрэглэгчийн ID' })
  @Column({ type: 'uuid' })
  createdBy: string;

  @ApiProperty({ description: 'Тохиргоо (JSON)' })
  @Column({ type: 'json', default: {} })
  settings: Record<string, any>;

  // Relationships
  @ManyToOne(() => Organization, (organization) => organization.questionnaires)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => User, (user) => user.createdQuestionnaires)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => Response, (response) => response.questionnaire)
  responses: Response[];

  @OneToMany(() => Expense, (expense) => expense.questionnaire)
  expenses: Expense[];
}