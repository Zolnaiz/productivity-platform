import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Organization } from '../../organizations/entities/organization.entity';
import { UserRole } from '../../shared/constants';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['organizationId'])
@Index(['role'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: true })
  position?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true, name: 'profile_image_url' })
  profileImageUrl?: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ nullable: true, name: 'organization_id' })
  organizationId?: string;

  @ManyToOne(() => Organization, (organization) => organization.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column({ nullable: true, name: 'last_login' })
  lastLogin?: Date;

  @Column({ nullable: true, name: 'email_verified' })
  emailVerified: boolean;

  @Column({ nullable: true, name: 'verification_token' })
  verificationToken?: string;

  @Column({ nullable: true, name: 'reset_password_token' })
  resetPasswordToken?: string;

  @Column({ nullable: true, name: 'reset_password_expires' })
  resetPasswordExpires?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Virtual property for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Virtual property for initials
  get initials(): string {
    return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
  }

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  @BeforeInsert()
  setDefaultValues() {
    if (!this.role) {
      this.role = UserRole.USER;
    }
    if (this.isActive === undefined) {
      this.isActive = true;
    }
    if (this.emailVerified === undefined) {
      this.emailVerified = false;
    }
  }
}