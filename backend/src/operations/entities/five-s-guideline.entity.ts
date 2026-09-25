import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

/**
 * One organization's 5S register: what it has written down, and what it has
 * filled in.
 *
 * The registers — the improvement record, the red-tag implementation cards,
 * the assessment scores, the checklist progress — lived in the browser that
 * typed them. A 5S improvement register is the memory of a programme: what was
 * found, who decided what, whether it worked. Keeping it in one person's
 * browser means the programme's memory is lost when they get a new laptop, and
 * nobody else ever sees it.
 *
 * One row per organization. `records` is what people fill in; `content` is the
 * standard they fill it in against — the cadence, the labelling rules, the
 * assessment criteria, the checklists. Separate columns because they are
 * written by different people at different rates, and a single document would
 * have an operator's checklist tick overwriting an administrator's edit of the
 * standard.
 */
@Entity('five_s_guidelines')
@Index(['organizationId'])
export class FiveSGuideline extends BaseEntity {
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  /** The standard: cadence, labelling rules, criteria, checklists. */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  content: Record<string, unknown>;

  /** What people have filled in against it. */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  records: Record<string, unknown>;
}
