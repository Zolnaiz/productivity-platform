import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

@Entity('audit_runs')
@Index(['organizationId'])
@Index(['templateId'])
@Index(['auditorId'])
export class AuditRun extends BaseEntity {
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column({ name: 'template_id' })
  templateId: string;

  @Column({ name: 'auditor_id', nullable: true })
  auditorId?: string;

  @Column({ name: 'project_id', nullable: true })
  projectId?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'jsonb', default: [] })
  answers: Array<{
    questionId: string;
    value: string | number | boolean;
    note?: string;
  }>;

  @Column({ type: 'numeric', precision: 8, scale: 2, default: 0 })
  score: number;

  @Column({ default: 'draft' })
  status: string;
}
