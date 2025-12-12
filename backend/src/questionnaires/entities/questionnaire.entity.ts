import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  SINGLE_CHOICE = 'single_choice',
  TEXT = 'text',
  RATING = 'rating',
  DATE = 'date',
  NUMBER = 'number',
}

@Entity('questionnaires')
@Index(['organizationId'])
@Index(['createdBy'])
@Index(['isActive'])
export class Questionnaire {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, (organization) => organization.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column('jsonb', { default: [] })
  questions: Array<{
    id: string;
    text: string;
    type: QuestionType;
    options?: string[];
    isRequired: boolean;
    placeholder?: string;
    minValue?: number;
    maxValue?: number;
  }>;

  @Column({ default: 0, name: 'response_count' })
  responseCount: number;

  @Column({ nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column('jsonb', { nullable: true })
  settings?: Record<string, any>;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'created_by' })
  createdByUser?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Virtual property for total questions
  get totalQuestions(): number {
    return this.questions?.length || 0;
  }

  // Virtual property to check if questionnaire is expired
  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return this.expiresAt < new Date();
  }

  // Virtual property to check if questionnaire is open (active and not expired)
  get isOpen(): boolean {
    return this.isActive && !this.isExpired;
  }

  @BeforeInsert()
  setDefaultValues() {
    if (!this.questions) {
      this.questions = [];
    }
    if (this.isActive === undefined) {
      this.isActive = true;
    }
    if (this.responseCount === undefined) {
      this.responseCount = 0;
    }
  }

  @BeforeUpdate()
  updateTimestamps() {
    this.updatedAt = new Date();
  }

  // Helper method to add a question
  addQuestion(question: {
    text: string;
    type: QuestionType;
    options?: string[];
    isRequired?: boolean;
    placeholder?: string;
    minValue?: number;
    maxValue?: number;
  }) {
    if (!this.questions) {
      this.questions = [];
    }

    const questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.questions.push({
      id: questionId,
      text: question.text,
      type: question.type,
      options: question.options || [],
      isRequired: question.isRequired || false,
      placeholder: question.placeholder,
      minValue: question.minValue,
      maxValue: question.maxValue,
    });
  }

  // Helper method to remove a question
  removeQuestion(questionId: string) {
    if (this.questions) {
      this.questions = this.questions.filter((q) => q.id !== questionId);
    }
  }

  // Helper method to update a question
  updateQuestion(
    questionId: string,
    updates: Partial<{
      text: string;
      type: QuestionType;
      options: string[];
      isRequired: boolean;
      placeholder: string;
      minValue: number;
      maxValue: number;
    }>,
  ) {
    if (this.questions) {
      const questionIndex = this.questions.findIndex((q) => q.id === questionId);
      if (questionIndex !== -1) {
        this.questions[questionIndex] = {
          ...this.questions[questionIndex],
          ...updates,
        };
      }
    }
  }
}