import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

@Entity('work_logs')
@Index(['organizationId'])
@Index(['userId'])
@Index(['logDate'])
export class WorkLog extends BaseEntity {
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ name: 'project_id', nullable: true })
  projectId?: string;

  @Column({ name: 'task_id', nullable: true })
  taskId?: string;

  @Column({ type: 'date', name: 'log_date' })
  logDate: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text', nullable: true })
  blockers?: string;

  @Column({ type: 'text', nullable: true, name: 'next_steps' })
  nextSteps?: string;

  @Column({ type: 'numeric', precision: 8, scale: 2, default: 0 })
  hours: number;
}
