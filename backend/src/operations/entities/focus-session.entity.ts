import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { numericColumn } from '../../shared/entities/numeric-column';

/** One finished Pomodoro / focus block, kept on the server so it follows its owner. */
@Entity('focus_sessions')
@Index(['organizationId', 'userId', 'sessionDate'])
export class FocusSession extends BaseEntity {
  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'numeric', precision: 6, scale: 1, default: 0, transformer: numericColumn })
  minutes: number;

  /** The day it was done, YYYY-MM-DD, on the organization's calendar. */
  @Column({ name: 'session_date', type: 'date' })
  sessionDate: string;
}
