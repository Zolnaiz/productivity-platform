import { REPORT_TYPES } from '../utils/constants';

export type ReportType = typeof REPORT_TYPES[keyof typeof REPORT_TYPES];

export interface Report {
  id: string;
  title: string;
  description?: string;
  type: ReportType;
  organizationId: string;
  organization?: Organization;
  createdBy: string;
  user?: User;
  data: ReportData;
  filters: ReportFilters;
  format: 'pdf' | 'excel' | 'csv' | 'html';
  status: 'generating' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  generationTime?: number; // in milliseconds
  scheduled?: boolean;
  scheduleId?: string;
  isPublic: boolean;
  sharedWith: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportData {
  summary: any;
  details: any[];
  charts: ReportChart[];
  tables: ReportTable[];
  metrics: ReportMetric[];
}

export interface ReportChart {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area';
  title: string;
  data: any[];
  options: any;
}

export interface ReportTable {
  id: string;
  title: string;
  columns: string[];
  data: any[];
  options: any;
}

export interface ReportMetric {
  id: string;
  title: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  format?: string;
}

export interface ReportFilters {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  organizationId?: string;
  userId?: string;
  questionnaireId?: string;
  expenseCategoryId?: string;
  projectId?: string;
  status?: string;
  customFilters?: Record<string, any>;
}

export interface CreateReportDto {
  title: string;
  description?: string;
  type: ReportType;
  organizationId: string;
  filters: ReportFilters;
  format?: 'pdf' | 'excel' | 'csv' | 'html';
  scheduled?: boolean;
  schedule?: ReportSchedule;
  isPublic?: boolean;
  sharedWith?: string[];
  tags?: string[];
}

export interface UpdateReportDto {
  title?: string;
  description?: string;
  filters?: Partial<ReportFilters>;
  isPublic?: boolean;
  sharedWith?: string[];
  tags?: string[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  organizationId?: string;
  settings: ReportTemplateSettings;
  isPublic: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportTemplateSettings {
  layout: ReportLayout;
  sections: ReportSection[];
  charts: ReportChartConfig[];
  tables: ReportTableConfig[];
  metrics: ReportMetricConfig[];
  styles: ReportStyles;
}

export interface ReportLayout {
  type: 'single' | 'two-column' | 'three-column';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ReportSection {
  id: string;
  type: 'header' | 'summary' | 'chart' | 'table' | 'metrics' | 'footer';
  title?: string;
  content?: any;
  order: number;
}

export interface ReportChartConfig {
  id: string;
  type: string;
  dataSource: string;
  title: string;
  options: any;
}

export interface ReportTableConfig {
  id: string;
  dataSource: string;
  title: string;
  columns: string[];
  options: any;
}

export interface ReportMetricConfig {
  id: string;
  dataSource: string;
  title: string;
  calculation: string;
  format: string;
}

export interface ReportStyles {
  theme: 'light' | 'dark' | 'corporate';
  colors: string[];
  fontFamily: string;
  fontSize: number;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm
  recipients: string[];
  enabled: boolean;
}

export interface ReportFilter {
  search?: string;
  type?: ReportType;
  organizationId?: string;
  createdBy?: string;
  status?: string;
  scheduled?: boolean;
  isPublic?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportStats {
  totalReports: number;
  byType: Record<ReportType, number>;
  byStatus: Record<string, number>;
  byMonth: Record<string, number>;
  averageGenerationTime: number;
  totalFileSize: number;
}