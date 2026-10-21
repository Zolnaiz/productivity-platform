import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

export enum FeedbackKind {
  BUG = 'bug',
  SUGGESTION = 'suggestion',
  QUESTION = 'question',
}

/**
 * "Send feedback" from inside the application: a fault, a suggestion or a
 * question about the product itself, kept where an administrator reads it.
 * Not the idea box - that is for improving the work, this is for improving
 * the tool.
 */
@Entity('feedback_messages')
@Index(['organizationId', 'createdAt'])
export class FeedbackMessage extends BaseEntity {
  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'author_id' })
  authorId: string;

  @Column({ type: 'varchar', length: 20, default: FeedbackKind.SUGGESTION })
  kind: FeedbackKind;

  @Column({ type: 'text' })
  message: string;

  /** The page it was sent from, so a fault report says where. */
  @Column({ length: 200, default: '' })
  page: string;

  /** Set when an administrator has read it. */
  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date | null;
}
