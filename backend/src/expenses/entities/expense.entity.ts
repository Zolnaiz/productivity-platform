import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../shared/entities/base.entity';
import { User } from '../../shared/entities/user.entity';
import { Organization } from '../../shared/entities/organization.entity';
import { Questionnaire } from '../../shared/entities/questionnaire.entity';

export enum ExpenseCategory {
  SALARY = 'salary',
  UTILITY = 'utility',
  RENT = 'rent',
  OFFICE_SUPPLIES = 'office_supplies',
  MARKETING = 'marketing',
  TRAVEL = 'travel',
  EQUIPMENT = 'equipment',
  SOFTWARE = 'software',
  TRAINING = 'training',
  OTHER = 'other',
}

export enum ExpenseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('expenses')
@Index(['organizationId', 'expenseDate'])
@Index(['status', 'expenseDate'])
@Index(['category', 'organizationId'])
export class Expense extends BaseEntity {
  @ApiProperty({ description: 'Зардлын нэр' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Зардлын дэлгэрэнгүй мэдээлэл', nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Зардлын дүн' })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @ApiProperty({ description: 'Зардлын төрөл', enum: ExpenseCategory })
  @Column({ type: 'enum', enum: ExpenseCategory })
  category: ExpenseCategory;

  @ApiProperty({ description: 'Зардлын төлөв', enum: ExpenseStatus, default: ExpenseStatus.PENDING })
  @Column({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.PENDING })
  status: ExpenseStatus;

  @ApiProperty({ description: 'Зардлын огноо' })
  @Column({ type: 'date' })
  expenseDate: Date;

  @ApiProperty({ description: 'Зардлыг төлсөн огноо', nullable: true })
  @Column({ type: 'date', nullable: true })
  paidDate?: Date;

  @ApiProperty({ description: 'Хүлээн авагчийн нэр' })
  @Column({ type: 'varchar', length: 255 })
  recipientName: string;

  @ApiProperty({ description: 'Хүлээн авагчийн дансны дугаар', nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  recipientAccount?: string;

  @ApiProperty({ description: 'Зардлын нэхэмжлэх/баримтын дугаар', nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  invoiceNumber?: string;

  @ApiProperty({ description: 'Зардлын файл хавсралтууд', type: 'json', nullable: true })
  @Column({ type: 'json', nullable: true })
  attachments?: string[];

  @ApiProperty({ description: 'Холбогдох асуулгын ID', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  questionnaireId?: string;

  @ApiProperty({ description: 'Хамааралтай байгууллагын ID' })
  @Column({ type: 'uuid' })
  organizationId: string;

  @ApiProperty({ description: 'Зардлыг үүсгэсэн хэрэглэгчийн ID' })
  @Column({ type: 'uuid' })
  createdBy: string;

  @ApiProperty({ description: 'Зардлыг баталгаажуулсан хэрэглэгчийн ID', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  // Relationships
  @ManyToOne(() => Organization, (organization) => organization.expenses)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => User, (user) => user.createdExpenses)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @ManyToOne(() => User, (user) => user.approvedExpenses, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approver?: User;

  @ManyToOne(() => Questionnaire, (questionnaire) => questionnaire.expenses, { nullable: true })
  @JoinColumn({ name: 'questionnaireId' })
  questionnaire?: Questionnaire;
}