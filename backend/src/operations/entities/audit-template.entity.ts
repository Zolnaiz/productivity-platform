import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

export enum AuditCategory {
  FIVE_S = '5s',
  SAFETY = 'safety',
  QUALITY = 'quality',
  COMPLIANCE = 'compliance',
  RISK = 'risk',
  OPERATIONAL_EXCELLENCE = 'operational_excellence',
}

@Entity('audit_templates')
@Index(['organizationId'])
@Index(['category'])
export class AuditTemplate extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column({
    type: 'enum',
    enum: AuditCategory,
    default: AuditCategory.FIVE_S,
  })
  category: AuditCategory;

  @Column({ nullable: true })
  industry?: string;

  @Column({ type: 'jsonb', default: [] })
  questions: Array<{
    id: string;
    text: string;
    type: 'score' | 'yes_no' | 'text';
    maxScore?: number;
  }>;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;
}
