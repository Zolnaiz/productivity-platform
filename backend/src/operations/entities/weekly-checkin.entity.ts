import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

/**
 * One person's week in three parts: what they got done, what they plan
 * next, and what is in their way.
 *
 * The monthly report is counted from tasks and hours, which say how much
 * was done and nothing of what got in the way. Weekdone's PPP - progress,
 * plans, problems - is the few lines that say it, written on Friday in two
 * minutes, and the "problems" are what a manager most needs and least
 * often hears.
 */
@Entity('weekly_checkins')
@Index(['organizationId', 'week'])
@Index(['userId', 'week'], { unique: true })
export class WeeklyCheckin extends BaseEntity {
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column({ name: 'user_id' })
  userId: string;

  /** The Monday the week starts on, YYYY-MM-DD. */
  @Column({ type: 'date' })
  week: string;

  @Column({ type: 'text', default: '' })
  progress: string;

  @Column({ type: 'text', default: '' })
  plans: string;

  @Column({ type: 'text', default: '' })
  problems: string;
}
