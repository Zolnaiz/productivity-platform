import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

export enum AssessmentType {
  SURVEY = 'survey',
  INSPECTION = 'inspection',
  QUALITY = 'quality',
  SAFETY = 'safety',
  FEEDBACK = 'feedback',
}

export enum AssessmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('assessment_templates')
@Index(['organizationId'])
@Index(['status'])
@Index(['type'])
export class AssessmentTemplate extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column({
    type: 'enum',
    enum: AssessmentType,
    default: AssessmentType.INSPECTION,
  })
  type: AssessmentType;

  @Column({
    type: 'enum',
    enum: AssessmentStatus,
    default: AssessmentStatus.DRAFT,
  })
  status: AssessmentStatus;

  @Column({ default: 'General' })
  industry: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  questions: Array<{
    id: string;
    text: string;
    type: 'score' | 'yes_no' | 'text';
    maxScore?: number;
  }>;
}
