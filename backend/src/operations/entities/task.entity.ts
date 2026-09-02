import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

/**
 * What produced this task, when it was not created by hand.
 *
 * A 5S finding already carries an owner and a due date — it is a task wearing
 * a different name. Recording where a task came from is what lets the work
 * appear in someone's list without losing its way back to the finding, and
 * what stops the same finding raising a second task every time the button is
 * pressed.
 */
export enum TaskSource {
  RED_TAG = 'five_s_red_tag',
  AUDIT_RUN = 'audit_run',
  IMPROVEMENT = 'five_s_improvement',
}

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
@Index(['sourceType', 'sourceId'])
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

  @Column({ type: 'varchar', name: 'source_type', nullable: true })
  sourceType?: TaskSource;

  /**
   * Identifies the record inside its source. Red tag and zone ids live in the
   * floor plan's JSON rather than a table, so this is a plain string and not a
   * foreign key — the source can disappear, and the task survives it.
   */
  @Column({ name: 'source_id', nullable: true })
  sourceId?: string;

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
