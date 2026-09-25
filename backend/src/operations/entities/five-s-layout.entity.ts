import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

@Entity('five_s_layouts')
@Index(['organizationId'])
export class FiveSLayout extends BaseEntity {
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column({ default: '5S area map' })
  name: string;

  @Column({ default: 'Workspace' })
  site: string;

  /**
   * Which floor of that site this plan is of.
   *
   * Empty for a single-storey place, where saying "ground floor" is noise. An
   * organization has as many layouts as it has floors, so this and `site`
   * together are how somebody tells one plan from another.
   */
  @Column({ default: '' })
  floor: string;

  @Column({ default: '1 square = 1 meter' })
  scale: string;

  @Column({ name: 'background_image', type: 'text', default: '' })
  backgroundImage: string;

  @Column({ name: 'background_opacity', type: 'float', default: 0.55 })
  backgroundOpacity: number;

  @Column({ name: 'show_grid', type: 'boolean', default: true })
  showGrid: boolean;

  /**
   * Whether dragging snaps to the grid — which is not the same question as
   * whether the grid is drawn, though one checkbox used to answer both.
   */
  @Column({ name: 'snap_to_grid', type: 'boolean', default: true })
  snapToGrid: boolean;

  /** Whether every wall carries its length, rather than only the one in hand. */
  @Column({ name: 'show_dimensions', type: 'boolean', default: false })
  showDimensions: boolean;

  /**
   * The layers this organization audits in, declared once for the whole plan.
   *
   * Empty means the defaults — operator daily, supervisor weekly, manager
   * monthly — which is what every plan ran on until now, because the field
   * existed in the browser's types and was never stored. A plant that checks
   * on a different rhythm, or calls its layers something else, can say so.
   */
  /**
   * Spaghetti diagrams: the paths people and parts take through the areas.
   *
   * Points in canvas units, like everything else on the plan, so a route
   * drawn before a recalibration is worth the new number afterwards.
   */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  routes: Array<{
    id: string;
    name: string;
    colour: string;
    points: Array<{ x: number; y: number }>;
    subject?: string;
  }>;

  @Column({ type: 'jsonb', name: 'audit_tiers', default: () => "'[]'" })
  auditTiers: Array<{
    tier: number;
    name: string;
    role?: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    templateId?: string;
  }>;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  zones: Record<string, any>[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  objects: Record<string, any>[];

  /**
   * The wall graph: corners, the walls between them, and the openings cut into
   * those walls.
   *
   * Rooms are not stored. They are whatever the walls close in, worked out when
   * the plan is drawn, because storing them too would be a second copy of the
   * same fact and the two would part company the first time a corner moved.
   */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  corners: Record<string, any>[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  walls: Record<string, any>[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  openings: Record<string, any>[];

  /**
   * Names for rooms. A room is not stored, so its name is a point with words
   * on it, and the room it names is whichever one that point falls inside.
   */
  @Column({ name: 'room_labels', type: 'jsonb', default: () => "'[]'" })
  roomLabels: Record<string, any>[];

  /**
   * How many metres one canvas unit covers. Null on plans drawn before the
   * scale was a number, which is not the same as a plan measured at zero.
   */
  @Column({ name: 'metres_per_unit', type: 'float', nullable: true })
  metresPerUnit?: number;
}
