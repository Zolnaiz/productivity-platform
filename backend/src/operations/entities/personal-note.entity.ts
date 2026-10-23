import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

/**
 * A person's own note. Kept on the server so it follows them to another
 * browser or device; read and changed by its author only.
 */
@Entity('personal_notes')
@Index(['organizationId', 'userId'])
export class PersonalNote extends BaseEntity {
  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ length: 60, default: '' })
  tag: string;
}
