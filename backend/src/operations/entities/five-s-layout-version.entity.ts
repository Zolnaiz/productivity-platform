import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

/**
 * What a floor plan looked like on a given day.
 *
 * An audit from March scored the building as it stood in March. The plan is a
 * living document — walls move, areas are merged, a zone is retired — so by
 * June that score is attached to a drawing that no longer exists, and nobody
 * reading the history can tell whether an area improved or was simply redrawn.
 *
 * A snapshot is the whole plan as it was, because the plan is one document and
 * a version of half of it would answer nothing. One per plan per day: the
 * editor saves on a debounce, so a version per save would be thousands of
 * copies of a drawing that changed by one pixel, and a day is the grain at
 * which somebody actually asks "what did this look like".
 */
@Entity('five_s_layout_versions')
@Index(['organizationId'])
@Index(['layoutId'])
export class FiveSLayoutVersion extends BaseEntity {
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column({ name: 'layout_id' })
  layoutId: string;

  /** The day this snapshot is of, as YYYY-MM-DD. One per plan per day. */
  @Column({ name: 'taken_on', type: 'date' })
  takenOn: string;

  /** Who was editing when it was taken. Absent for one the system took. */
  @Column({ name: 'taken_by', nullable: true })
  takenBy?: string;

  /** A name somebody gave it — "before the racking moved". */
  @Column({ nullable: true })
  label?: string;

  /** The plan as it stood: zones, objects, walls, everything. */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  snapshot: Record<string, unknown>;
}
