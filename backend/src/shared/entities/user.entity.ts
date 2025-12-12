import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';

import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { Response } from './response.entity';
import { Expense } from './expense.entity';
import { Report } from './report.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORGANIZATION_ADMIN = 'organization_admin',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User extends BaseEntity {
  @ApiProperty({
    description: 'Имэйл хаяг',
    example: 'user@example.com',
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    description: 'Хэрэглэгчийн нэр',
    example: 'johndoe',
  })
  @Column({ unique: true })
  username: string;

  @ApiProperty({
    description: 'Бүтэн нэр',
    example: 'John Doe',
  })
  @Column()
  fullName: string;

  @ApiProperty({
    description: 'Нууц үг (hash хийгдсэн)',
    writeOnly: true,
  })
  @Exclude()
  @Column()
  password: string;

  @ApiProperty({
    description: 'Хэрэглэгчийн үүрэг',
    enum: UserRole,
    example: UserRole.USER,
  })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Хэрэглэгчийн статус',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'Сүүлийн нэвтрэлтийн огноо',
    example: '2024-12-14T10:30:00.000Z',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @ApiProperty({
    description: 'Утасны дугаар',
    example: '+976 9911 2233',
    required: false,
  })
  @Column({ nullable: true })
  phoneNumber: string;

  @ApiProperty({
    description: 'Профайл зурагны URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @Column({ nullable: true })
  avatarUrl: string;

  @ApiProperty({
    description: 'Имэйл баталгаажсан эсэх',
    example: true,
    default: false,
  })
  @Column({ default: false })
  emailVerified: boolean;

  @ApiProperty({
    description: '2FA идэвхтэй эсэх',
    example: false,
    default: false,
  })
  @Column({ default: false })
  twoFactorEnabled: boolean;

  @ApiProperty({
    description: 'Нэвтрэх оролдлогуудын тоо',
    example: 0,
    default: 0,
  })
  @Column({ default: 0 })
  loginAttempts: number;

  @ApiProperty({
    description: 'Түгжээтэй дуусах огноо',
    example: '2024-12-14T11:30:00.000Z',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date;

  @ApiProperty({
    description: 'Тохиргоонууд',
    example: { language: 'mn', theme: 'light' },
    required: false,
  })
  @Column({ type: 'json', nullable: true })
  preferences: Record<string, any>;

  // Relations
  @ApiProperty({
    description: 'Байгууллага',
    type: () => Organization,
  })
  @ManyToOne(() => Organization, (organization) => organization.users, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  organization: Organization;

  @ApiProperty({
    description: 'Хариултууд',
    type: () => [Response],
  })
  @OneToMany(() => Response, (response) => response.user)
  responses: Response[];

  @ApiProperty({
    description: 'Зардал',
    type: () => [Expense],
  })
  @OneToMany(() => Expense, (expense) => expense.user)
  expenses: Expense[];

  @ApiProperty({
    description: 'Үүсгэсэн асуулгууд',
    type: () => [Report],
  })
  @OneToMany(() => Report, (report) => report.createdBy)
  createdReports: Report[];

  // Methods
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  incrementLoginAttempts() {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 минут
    }
  }

  resetLoginAttempts() {
    this.loginAttempts = 0;
    this.lockedUntil = null;
  }

  isLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date();
  }

  verifyEmail() {
    this.emailVerified = true;
    this.status = UserStatus.ACTIVE;
  }

  suspend() {
    this.status = UserStatus.SUSPENDED;
  }

  activate() {
    this.status = UserStatus.ACTIVE;
  }

  updateLastLogin() {
    this.lastLoginAt = new Date();
    this.resetLoginAttempts();
  }

  toJSON() {
    const { password, ...rest } = this;
    return rest;
  }

  // Utility methods
  get isSuperAdmin(): boolean {
    return this.role === UserRole.SUPER_ADMIN;
  }

  get isOrganizationAdmin(): boolean {
    return this.role === UserRole.ORGANIZATION_ADMIN;
  }

  get isRegularUser(): boolean {
    return this.role === UserRole.USER;
  }

  get isActiveUser(): boolean {
    return this.status === UserStatus.ACTIVE && this.isActive;
  }

  get displayName(): string {
    return this.fullName || this.username;
  }

  get initials(): string {
    const parts = this.fullName.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return this.fullName[0]?.toUpperCase() || this.username[0]?.toUpperCase() || 'U';
  }
}