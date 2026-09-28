import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

/**
 * Where an idea stands. It is submitted by whoever had it, reviewed by
 * somebody who runs the work, and - if taken up - becomes a task, then is
 * put in place.
 */
export enum IdeaStatus {
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  DECLINED = 'declined',
  DONE = 'done',
}

/**
 * An improvement somebody on the floor thought of.
 *
 * Continuous improvement lives on the ideas of the people doing the work,
 * and the 5S improvement register was a table a manager filled in at a desk:
 * nobody on a shift could put an idea in it, see what became of it, or be
 * thanked for it. KaiNexus and Rever are built around exactly this loop -
 * submitted from a phone with a photograph, reviewed, turned into work, and
 * closed with what it achieved.
 */
@Entity('ideas')
@Index(['organizationId'])
@Index(['authorId'])
@Index(['status'])
export class Idea extends BaseEntity {
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column({ name: 'author_id', nullable: true })
  authorId?: string;

  @Column({ length: 200 })
  title: string;

  /** What is wrong now and what would be better, in the author's words. */
  @Column({ type: 'text', default: '' })
  description: string;

  /** Where, in words: "the dock", "A03 - Storage". */
  @Column({ length: 200, default: '' })
  area: string;

  /** What it would save or improve, as the author sees it. */
  @Column({ type: 'text', default: '' })
  benefit: string;

  @Column({ type: 'varchar', length: 20, default: IdeaStatus.SUBMITTED })
  status: IdeaStatus;

  @Column({ name: 'reviewer_id', nullable: true })
  reviewerId?: string;

  /** Why it was taken up or not, said to the author. */
  @Column({ name: 'review_note', type: 'text', default: '' })
  reviewNote: string;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date | null;

  /** The work it became, once approved. */
  @Column({ name: 'task_id', nullable: true })
  taskId?: string;
}
