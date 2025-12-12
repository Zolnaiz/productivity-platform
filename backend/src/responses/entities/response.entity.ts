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
  BeforeInsert,
} from 'typeorm';
import { Questionnaire } from '../../questionnaires/entities/questionnaire.entity';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('responses')
@Index(['questionnaireId'])
@Index(['userId'])
@Index(['organizationId'])
@Index(['submittedAt'])
export class Response {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'questionnaire_id' })
  questionnaireId: string;

  @ManyToOne(() => Questionnaire, (questionnaire) => questionnaire.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'questionnaire_id' })
  questionnaire?: Questionnaire;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column('jsonb', { default: [] })
  answers: Array<{
    questionId: string;
    value: any;
    answeredAt: Date;
  }>;

  @Column({ nullable: true, name: 'completion_time' })
  completionTime?: number; // in seconds

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'submitted_at' })
  submittedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @BeforeInsert()
  setDefaultValues() {
    if (!this.submittedAt) {
      this.submittedAt = new Date();
    }
    if (!this.answers) {
      this.answers = [];
    }
  }

  // Virtual property for completion percentage
  get completionPercentage(): number {
    if (!this.questionnaire?.questions?.length) return 0;
    return (this.answers.length / this.questionnaire.questions.length) * 100;
  }

  // Helper method to add an answer
  addAnswer(questionId: string, value: any) {
    if (!this.answers) {
      this.answers = [];
    }

    this.answers.push({
      questionId,
      value,
      answeredAt: new Date(),
    });
  }

  // Helper method to get answer for a specific question
  getAnswer(questionId: string): any {
    const answer = this.answers.find((a) => a.questionId === questionId);
    return answer?.value;
  }

  // Helper method to check if a question was answered
  hasAnswer(questionId: string): boolean {
    return this.answers.some((a) => a.questionId === questionId);
  }
}