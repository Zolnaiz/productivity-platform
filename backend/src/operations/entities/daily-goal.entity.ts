import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

@Entity('daily_goals')
@Index(['organizationId'])
@Index(['userId'])
@Index(['date'])
@Index(['completed'])
export class DailyGoal extends BaseEntity {
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column()
  title: string;

  @Column({ type: 'date', name: 'goal_date' })
  date: string;

  @Column({ type: 'boolean', default: false })
  completed: boolean;
}
