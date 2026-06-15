export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  ORGANIZATION_ADMIN = 'organization_admin',
  MANAGER = 'manager',
  USER = 'user',
  VIEWER = 'viewer'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

export enum ExpenseCategory {
  TRAVEL = 'travel',
  MEALS = 'meals',
  EQUIPMENT = 'equipment',
  SOFTWARE = 'software',
  TRAINING = 'training',
  OTHER = 'other'
}

export enum ExpenseStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid'
}

export enum QuestionnaireType {
  SURVEY = 'survey',
  ASSESSMENT = 'assessment',
  FEEDBACK = 'feedback',
  EVALUATION = 'evaluation'
}

export enum QuestionnaireStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
