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
}
