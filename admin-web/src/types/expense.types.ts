import { EXPENSE_STATUS } from '../utils/constants';

export type ExpenseStatus = typeof EXPENSE_STATUS[keyof typeof EXPENSE_STATUS];

export interface Expense {
  id: string;
  code: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  categoryId: string;
  category?: ExpenseCategory;
  organizationId: string;
  organization?: Organization;
  userId: string;
  user?: User;
  projectId?: string;
  project?: Project;
  date: Date;
  status: ExpenseStatus;
  paymentMethod?: string;
  receiptNumber?: string;
  attachments: FileInfo[];
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  paidBy?: string;
  paidAt?: Date;
  paymentReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  code: string;
  organizationId?: string;
  isActive: boolean;
  parentId?: string;
  children?: ExpenseCategory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  organizationId: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseDto {
  title: string;
  description?: string;
  amount: number;
  currency: string;
  categoryId: string;
  organizationId: string;
  projectId?: string;
  date: Date;
  paymentMethod?: string;
  receiptNumber?: string;
  attachments?: File[];
  notes?: string;
}

export interface UpdateExpenseDto {
  title?: string;
  description?: string;
  amount?: number;
  categoryId?: string;
  projectId?: string;
  date?: Date;
  paymentMethod?: string;
  receiptNumber?: string;
  status?: ExpenseStatus;
  reviewNotes?: string;
}

export interface ExpenseStats {
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
  byCategory: Record<string, { count: number; amount: number }>;
  byStatus: Record<ExpenseStatus, { count: number; amount: number }>;
  byMonth: Record<string, { count: number; amount: number }>;
  byUser: Record<string, { count: number; amount: number }>;
}

export interface ExpenseFilter {
  search?: string;
  organizationId?: string;
  userId?: string;
  projectId?: string;
  categoryId?: string;
  status?: ExpenseStatus;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  reviewed?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExpenseReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalExpenses: number;
    totalAmount: number;
    approvedAmount: number;
    pendingAmount: number;
    rejectedAmount: number;
  };
  details: Expense[];
  analysis: {
    topCategories: Array<{ category: string; amount: number; percentage: number }>;
    topProjects: Array<{ project: string; amount: number; percentage: number }>;
    topUsers: Array<{ user: string; amount: number; percentage: number }>;
    trends: Array<{ period: string; amount: number; count: number }>;
  };
}

export interface Budget {
  id: string;
  name: string;
  description?: string;
  organizationId?: string;
  projectId?: string;
  categoryId?: string;
  amount: number;
  period: BudgetPeriod;
  spent: number;
  remaining: number;
  status: 'active' | 'exceeded' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetPeriod {
  type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
}

export interface Forecast {
  period: {
    startDate: Date;
    endDate: Date;
  };
  predictedAmount: number;
  confidence: number;
  factors: Array<{
    name: string;
    impact: 'positive' | 'negative';
    magnitude: number;
    description: string;
  }>;
  recommendations: string[];
}