// Re-export all types
export * from './user.types';
export * from './organization.types';
export * from './questionnaire.types';
export * from './response.types';
export * from './expense.types';
export * from './report.types';

// Common types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

export interface FilterOption {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

export interface DateRange {
  startDate: Date | string;
  endDate: Date | string;
}

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}