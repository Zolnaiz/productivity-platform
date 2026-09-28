import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

/**
 * A manager's walk on the floor: where they went, what they saw, what they
 * asked, and the work it gave rise to.
 *
 * An audit scores an area against its checklist; a gemba walk is the other
 * half of leader standard work - going to where the work is done, looking,
 * and asking the people doing it. Tervene tracks it the same way: a target
 * a week for each manager, and each walk's follow-ups turned into work.
 */
@Entity('gemba_walks')
@Index(['organizationId', 'walkedOn'])
@Index(['walkerId'])
export class GembaWalk extends BaseEntity {
  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'walker_id' })
  walkerId: string;

  /** The day walked, YYYY-MM-DD. */
  @Column({ name: 'walked_on', type: 'date' })
  walkedOn: string;

  @Column({ name: 'zone_id', nullable: true })
  zoneId?: string;

  /** Where, in words. */
  @Column({ length: 200, default: '' })
  area: string;

  @Column({ type: 'text', default: '' })
  observations: string;

  /** What was asked of the people doing the work, and what they said. */
  @Column({ type: 'text', default: '' })
  conversations: string;

  /** The follow-ups, each with the task it became. */
  @Column({ name: 'follow_ups', type: 'jsonb', default: () => "'[]'::jsonb" })
  followUps: Array<{ title: string; taskId?: string; assigneeId?: string }>;
}
