import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

/**
 * One asking of the SUS questionnaire (measure K7) in an organization: opened
 * by an administrator - at the end of a pilot, or before and after a change -
 * and closed when enough people have answered. While it is open, everybody is
 * asked on the home page, on the web and on the phone.
 *
 * At most one round is open at a time; the migration enforces it with a
 * partial unique index, so two administrators opening one at once get one.
 */
@Entity('sus_rounds')
@Index(['organizationId', 'createdAt'])
export class SusRound extends BaseEntity {
  @Column({ name: 'organization_id' })
  organizationId: string;

  /** What the round is for, as the administrator named it: "End of pilot", say. */
  @Column({ length: 120 })
  title: string;

  @Column({ name: 'opened_by' })
  openedBy: string;

  /** Null while answers are taken. */
  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt?: Date | null;
}

/**
 * One person's answers to one round: the ten statements of Appendix B, each
 * 1-5, in order. The score is not stored - it is the answers, run through
 * `susScore` (sus.ts), so the two can never disagree.
 *
 * Kept per person only so the same person answers once (and may change their
 * answers while the round is open). Nobody reads them one by one: the results
 * are totals, and only from three respondents up.
 */
@Entity('sus_responses')
@Index(['roundId', 'userId'], { unique: true })
export class SusResponse extends BaseEntity {
  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'round_id', type: 'uuid' })
  roundId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'smallint', array: true })
  answers: number[];
}
