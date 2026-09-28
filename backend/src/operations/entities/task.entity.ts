import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { numericColumn } from '../../shared/entities/numeric-column';

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
  IDEA = 'idea',
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

  /**
   * The same title as a key and its parts, for a reader in another language.
   *
   * `title` stays the assembled English sentence: it is what a CSV export, an
   * email and any client that has never heard of these columns will show. A
   * client that knows the key words it itself, so "Tier 1 5S audit due: A03 -
   * Storage" reads in Mongolian to somebody working in Mongolian.
   *
   * Empty for a task somebody typed — their own words need no translating.
   */
  @Column({ name: 'title_key', nullable: true })
  titleKey?: string;

  @Column({ type: 'jsonb', name: 'title_params', default: {} })
  titleParams: Record<string, string | number>;

  @Column({ type: 'text', nullable: true })
  description?: string;

  /** The description as a key and its parts, as `titleKey` is for the title. */
  @Column({ name: 'description_key', nullable: true })
  descriptionKey?: string;

  @Column({ type: 'jsonb', name: 'description_params', default: {} })
  descriptionParams: Record<string, string | number>;

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

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
    name: 'estimated_hours',
    transformer: numericColumn,
  })
  estimatedHours: number;

  @Column({
    type: 'numeric',
    precision: 8,
    scale: 2,
    default: 0,
    name: 'actual_hours',
    transformer: numericColumn,
  })
  actualHours: number;

  /**
   * When the task was moved to done, and nothing when it is not done.
   *
   * Without it the only thing a report could say about a finished task was
   * its status today, so a March report read in May counted the work finished
   * in April as March's, and a task reopened in May quietly vanished from
   * March. Set by the server on the transition, never by the caller: a
   * completion date anybody could type is not evidence of anything.
   */
  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt?: Date | null;
}
