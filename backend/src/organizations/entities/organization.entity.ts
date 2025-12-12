import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('organizations')
@Index(['name'], { unique: true })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true, name: 'logo_url' })
  logoUrl?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true, name: 'contact_email' })
  contactEmail?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column('simple-array', { nullable: true })
  features?: string[];

  @Column('jsonb', { nullable: true })
  settings?: Record<string, any>;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Virtual property for user count
  get userCount(): number {
    return this.users?.length || 0;
  }
}