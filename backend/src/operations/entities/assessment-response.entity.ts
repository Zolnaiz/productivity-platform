import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

export enum AssessmentResponseStatus {
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  REJECTED = 'rejected',
}

@Entity('assessment_responses')
@Index(['organizationId'])
@Index(['templateId'])
@Index(['status'])
export class AssessmentResponse extends BaseEntity {
  @Column({ type: 'uuid', name: 'template_id' })
  templateId: string;

  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column({ name: 'respondent_id', nullable: true })
  respondentId?: string;

  @Column({ default: 'Anonymous' })
  respondent: string;

  @Column({ default: 'General' })
  department: string;

  @Column({
    type: 'enum',
    enum: AssessmentResponseStatus,
    default: AssessmentResponseStatus.SUBMITTED,
  })
  status: AssessmentResponseStatus;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  answers: Array<{
    questionId: string;
    value: string | number | boolean;
    note?: string;
  }>;

  @Column({ type: 'timestamptz', nullable: true, name: 'submitted_at' })
  submittedAt?: Date;
}
