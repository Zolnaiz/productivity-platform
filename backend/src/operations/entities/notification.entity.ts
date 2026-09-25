import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

/**
 * What produced a notification.
 *
 * The same shape as a task's source, and for the same reason: an event that
 * happens again — the scheduler running twice in a morning, two replicas at
 * six o'clock — must not reach somebody twice.
 */
export enum NotificationKind {
  TASK_ASSIGNED = 'task_assigned',
}

/**
 * Something somebody needs to be told.
 *
 * The application raised work and told nobody. The scheduler creates an audit
 * task at six in the morning and a red-tag decision when a hold runs out, and
 * both sat in a list waiting to be found — which is the difference between
 * work being delivered and work being discovered, usually late.
 *
 * A notification is addressed to one person, carries where to go to act on it,
 * and remembers whether it has been read. It is not a copy of the work: the
 * task is the work, and this says it exists.
 */
@Entity('notifications')
@Index(['organizationId'])
@Index(['userId', 'readAt'])
@Index(['userId', 'sourceType', 'sourceId'], { unique: true })
export class Notification extends BaseEntity {
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  /** Who is being told. */
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', default: NotificationKind.TASK_ASSIGNED })
  kind: NotificationKind;

  /**
   * What happened, in the words of the thing it happened to.
   *
   * The task's own title rather than a sentence assembled here: a notification
   * that says something different from the work it points at is a notification
   * people learn to distrust.
   */
  @Column()
  title: string;

  /**
   * The title again, as a key and its parts. See `WorkTask.titleKey`.
   *
   * An inbox is read in the reader's own language or it is not read.
   */
  @Column({ name: 'title_key', nullable: true })
  titleKey?: string;

  @Column({ type: 'jsonb', name: 'title_params', default: {} })
  titleParams: Record<string, string | number>;

  @Column({ type: 'text', default: '' })
  body: string;

  /** Where to go to act on it. */
  @Column({ default: '/tasks' })
  link: string;

  @Column({ type: 'varchar', name: 'source_type', nullable: true })
  sourceType?: string;

  /**
   * The record inside that source. Together with the recipient this is unique,
   * so one event reaches one person once however many times it is raised.
   */
  @Column({ name: 'source_id', nullable: true })
  sourceId?: string;

  /** Null until it has been read. */
  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date | null;
}
