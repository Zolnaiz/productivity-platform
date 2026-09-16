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

  @Column({ default: '1 square = 1 meter' })
  scale: string;

  @Column({ name: 'background_image', type: 'text', default: '' })
  backgroundImage: string;

  @Column({ name: 'background_opacity', type: 'float', default: 0.55 })
  backgroundOpacity: number;

  @Column({ name: 'show_grid', type: 'boolean', default: true })
  showGrid: boolean;

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
   * How many metres one canvas unit covers. Null on plans drawn before the
   * scale was a number, which is not the same as a plan measured at zero.
   */
  @Column({ name: 'metres_per_unit', type: 'float', nullable: true })
  metresPerUnit?: number;
}
