import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

export enum ExpenseCategory {
  TOOLS = 'tools',
  TRAVEL = 'travel',
  MATERIALS = 'materials',
  SOFTWARE = 'software',
  OTHER = 'other',
}

export enum ExpenseStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('expenses')
@Index(['organizationId'])
@Index(['projectId'])
@Index(['status'])
export class ExpenseItem extends BaseEntity {
  @Column()
  title: string;

  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column({ type: 'uuid', name: 'project_id', nullable: true })
  projectId?: string;

  @Column({
    type: 'enum',
    enum: ExpenseCategory,
    default: ExpenseCategory.OTHER,
  })
  category: ExpenseCategory;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ExpenseStatus,
    default: ExpenseStatus.SUBMITTED,
  })
  status: ExpenseStatus;

  @Column({ type: 'date', name: 'expense_date' })
  expenseDate: string;

  @Column({ name: 'submitted_by', nullable: true })
  submittedBy?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;
}
