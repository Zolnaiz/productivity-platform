import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

/**
 * The few paragraphs that head a month's report: what the month was, in
 * words.
 *
 * The report is figures; the people reading it at a review want to be told
 * what the figures mean. A draft can be written by Claude from the month's
 * figures, but it is only a draft: it becomes the month's summary when a
 * manager has read it, changed what needs changing, and approved it.
 */
@Entity('monthly_summaries')
@Index(['organizationId', 'period'], { unique: true })
export class MonthlySummary extends BaseEntity {
  @Column({ name: 'organization_id' })
  organizationId: string;

  /** YYYY-MM. */
  @Column({ length: 7 })
  period: string;

  @Column({ type: 'text', default: '' })
  text: string;

  /** Whether the text as it stands was drafted by AI and not yet rewritten by a person. */
  @Column({ name: 'ai_drafted', type: 'boolean', default: false })
  aiDrafted: boolean;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy?: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;
}
