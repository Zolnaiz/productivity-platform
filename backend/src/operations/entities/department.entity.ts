import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

/**
 * A part of an organization that owns people and areas.
 *
 * It existed as a page with a browser-local list behind it, which the page
 * admitted in a notice. The open question was never how to store a name — it
 * was what a department owns, and the answer the customer gave is: the people
 * in it, and the 5S areas it is responsible for.
 *
 * That is what makes a department worth having here. A 5S programme is run by
 * whoever owns the floor, and until now an area's responsibility stopped at
 * one person's name: when they left, the area belonged to nobody, and nothing
 * could say how a department as a whole was scoring.
 *
 * A zone's department is a field in the floor plan's JSON rather than a
 * foreign key, the same as every other zone attribute — the plan is one
 * document and splitting one attribute out of it would buy nothing.
 */
@Entity('departments')
@Index(['organizationId'])
export class Department extends BaseEntity {
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column()
  name: string;

  /**
   * The person answerable for it, as a user id.
   *
   * Nullable because a department can exist between managers, which is a real
   * state and not an error — an area still has to be audited while the post is
   * being filled.
   */
  @Column({ name: 'manager_id', nullable: true })
  managerId?: string;

  /** What this department is for, in its own words. Shown on its card. */
  @Column({ name: 'focus_area', type: 'text', nullable: true })
  focusArea?: string;
}
