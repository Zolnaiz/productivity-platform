import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

export enum ProjectStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('projects')
@Index(['organizationId'])
@Index(['status'])
export class Project extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column({ name: 'owner_id', nullable: true })
  ownerId?: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNED,
  })
  status: ProjectStatus;

  @Column({ default: 'medium' })
  priority: string;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'date', nullable: true, name: 'start_date' })
  startDate?: string;

  @Column({ type: 'date', nullable: true, name: 'due_date' })
  dueDate?: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  budget: number;
}
