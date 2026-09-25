import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

@Entity('time_entries')
@Index(['organizationId'])
@Index(['userId'])
@Index(['workDate'])
@Index(['workLogId'], { unique: true })
export class TimeEntry extends BaseEntity {
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ type: 'uuid', name: 'project_id', nullable: true })
  projectId?: string;

  @Column({ type: 'uuid', name: 'task_id', nullable: true })
  taskId?: string;

  /** The daily narrative whose hours this entry measures, when paired. */
  @Column({ type: 'uuid', name: 'work_log_id', nullable: true })
  workLogId?: string;

  @Column({ type: 'date', name: 'work_date' })
  workDate: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'started_at' })
  startedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'ended_at' })
  endedAt?: Date;

  @Column({ type: 'numeric', precision: 8, scale: 2, default: 0 })
  hours: number;

  @Column({ type: 'text', nullable: true })
  note?: string;
}
