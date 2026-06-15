import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}

@Entity('work_tasks')
@Index(['organizationId'])
@Index(['projectId'])
@Index(['assigneeId'])
@Index(['status'])
export class WorkTask extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column({ type: 'uuid', name: 'project_id', nullable: true })
  projectId?: string;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId?: string;

  @Column({ name: 'reporter_id', nullable: true })
  reporterId?: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({ default: 'medium' })
  priority: string;

  @Column({ type: 'date', nullable: true, name: 'due_date' })
  dueDate?: string;

  @Column({ type: 'numeric', precision: 8, scale: 2, default: 0, name: 'estimated_hours' })
  estimatedHours: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, default: 0, name: 'actual_hours' })
  actualHours: number;
}
