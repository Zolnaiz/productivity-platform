import { Entity, Column, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Questionnaire } from './questionnaire.entity';
import { Response } from './response.entity';
import { Expense } from '../../expenses/entities/expense.entity';
import { Report } from './report.entity';

export enum OrganizationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

@Entity('organizations')
@Index(['email'], { unique: true })
@Index(['taxNumber'], { unique: true })
@Index(['status', 'createdAt'])
export class Organization extends BaseEntity {
  @ApiProperty({ description: 'Байгууллагын нэр' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Байгууллагын и-мэйл' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @ApiProperty({ description: 'Утасны дугаар' })
  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @ApiProperty({ description: 'Хаяг' })
  @Column({ type: 'text' })
  address: string;

  @ApiProperty({ description: 'Байгууллагын тайлбар', nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Татварын дугаар' })
  @Column({ type: 'varchar', length: 20, unique: true })
  taxNumber: string;

  @ApiProperty({ description: 'Байгууллагын лого', nullable: true })
  @Column({ type: 'varchar', length: 500, nullable: true })
  logo?: string;

  @ApiProperty({ description: 'Вебсайт', nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @ApiProperty({ description: 'Байгууллагын төлөв', enum: OrganizationStatus, default: OrganizationStatus.PENDING })
  @Column({ type: 'enum', enum: OrganizationStatus, default: OrganizationStatus.PENDING })
  status: OrganizationStatus;

  @ApiProperty({ description: 'Үйл ажиллагааны салбар' })
  @Column({ type: 'varchar', length: 100 })
  industry: string;

  @ApiProperty({ description: 'Ажилчдын тоо' })
  @Column({ type: 'integer' })
  employeeCount: number;

  @ApiProperty({ description: 'Эрх бүхий хүний нэр' })
  @Column({ type: 'varchar', length: 255 })
  contactPersonName: string;

  @ApiProperty({ description: 'Эрх бүхий хүний албан тушаал' })
  @Column({ type: 'varchar', length: 100 })
  contactPersonPosition: string;

  @ApiProperty({ description: 'Тохиргоо (JSON)' })
  @Column({ type: 'json', default: {} })
  settings: Record<string, any>;

  // Relationships
  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => Questionnaire, (questionnaire) => questionnaire.organization)
  questionnaires: Questionnaire[];

  @OneToMany(() => Response, (response) => response.organization)
  responses: Response[];

  @OneToMany(() => Expense, (expense) => expense.organization)
  expenses: Expense[];

  @OneToMany(() => Report, (report) => report.organization)
  reports: Report[];
}