export interface Organization {
  id: string;
  name: string;
  code: string;
  description?: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  size?: string;
  settings: OrganizationSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSettings {
  theme?: string;
  language?: string;
  timezone?: string;
  dateFormat?: string;
  currency?: string;
  features?: Record<string, boolean>;
  limits?: {
    maxUsers?: number;
    maxStorage?: number;
    maxQuestionnaires?: number;
  };
}

export interface OrganizationStats {
  totalUsers: number;
  activeUsers: number;
  totalQuestionnaires: number;
  activeQuestionnaires: number;
  totalResponses: number;
  totalExpenses: number;
  totalReports: number;
  storageUsed: number;
  storageLimit: number;
}

export interface CreateOrganizationDto {
  name: string;
  code: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  size?: string;
  settings?: Partial<OrganizationSettings>;
}

export interface UpdateOrganizationDto {
  name?: string;
  code?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  size?: string;
  settings?: Partial<OrganizationSettings>;
  isActive?: boolean;
}

export interface OrganizationFilter {
  search?: string;
  isActive?: boolean;
  industry?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrganizationActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}