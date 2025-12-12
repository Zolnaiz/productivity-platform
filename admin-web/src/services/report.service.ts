import { get, post, put, del } from './api';
import {
  Report,
  CreateReportDto,
  UpdateReportDto,
  ReportFilter,
  ReportTemplate,
  ReportType
} from '../types/report.types';

export const reportService = {
  // Бүх тайлан авах
  getAllReports: async (params?: ReportFilter): Promise<{
    data: Report[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    return await get('/reports', params);
  },

  // Тайлан ID-аар авах
  getReportById: async (id: string): Promise<Report> => {
    return await get(`/reports/${id}`);
  },

  // Шинэ тайлан үүсгэх
  createReport: async (data: CreateReportDto): Promise<Report> => {
    return await post('/reports', data);
  },

  // Тайлан шинэчлэх
  updateReport: async (id: string, data: UpdateReportDto): Promise<Report> => {
    return await put(`/reports/${id}`, data);
  },

  // Тайлан устгах
  deleteReport: async (id: string): Promise<void> => {
    return await del(`/reports/${id}`);
  },

  // Тайлан үүсгэх
  generateReport: async (type: ReportType, params: {
    startDate: string;
    endDate: string;
    organizationId?: string;
    questionnaireId?: string;
    userId?: string;
    format?: string;
    options?: Record<string, any>;
  }): Promise<Report> => {
    return await post('/reports/generate', { type, ...params });
  },

  // Тайлангийн төрлүүд
  getReportTypes: async (): Promise<ReportType[]> => {
    return await get('/reports/types');
  },

  // Тайлангийн загварууд
  getTemplates: async (params?: {
    type?: string;
    organizationId?: string;
  }): Promise<ReportTemplate[]> => {
    return await get('/reports/templates', params);
  },

  // Шинэ загвар үүсгэх
  createTemplate: async (template: Omit<ReportTemplate, 'id'>): Promise<ReportTemplate> => {
    return await post('/reports/templates', template);
  },

  // Загвар шинэчлэх
  updateTemplate: async (id: string, template: Partial<ReportTemplate>): Promise<ReportTemplate> => {
    return await put(`/reports/templates/${id}`, template);
  },

  // Загвар устгах
  deleteTemplate: async (id: string): Promise<void> => {
    return await del(`/reports/templates/${id}`);
  },

  // Тайланг дуурайлган хийх
  duplicateReport: async (id: string): Promise<Report> => {
    return await post(`/reports/${id}/duplicate`);
  },

  // Тайланг экспортлох
  exportReport: async (
    id: string,
    format: 'pdf' | 'excel' | 'csv' | 'html'
  ): Promise<Blob> => {
    const response = await get(`/reports/${id}/export`, { format }, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Тайланг харах
  previewReport: async (id: string): Promise<{ html: string }> => {
    return await get(`/reports/${id}/preview`);
  },

  // Тайланг хуваалцах
  shareReport: async (id: string, settings: {
    public?: boolean;
    expirationDate?: string;
    password?: string;
    email?: string[];
    message?: string;
  }): Promise<{ shareUrl: string }> => {
    return await post(`/reports/${id}/share`, settings);
  },

  // Тайлангийн статистик
  getReportStatistics: async (params?: {
    startDate?: string;
    endDate?: string;
    organizationId?: string;
    type?: string;
  }): Promise<any> => {
    return await get('/reports/statistics', params);
  },

  // Автомат тайлангийн тохиргоо
  getScheduleSettings: async (): Promise<any> => {
    return await get('/reports/schedule');
  },

  // Автомат тайлангийн тохиргоо хийх
  setScheduleSettings: async (settings: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    recipients: string[];
    reportType: string;
    organizationId?: string;
  }): Promise<any> => {
    return await post('/reports/schedule', settings);
  },

  // Тайланг хадгалах
  saveReportAsTemplate: async (id: string, name: string): Promise<ReportTemplate> => {
    return await post(`/reports/${id}/save-as-template`, { name });
  },

  // Тайланг хэвлэх
  printReport: async (id: string): Promise<Blob> => {
    const response = await get(`/reports/${id}/print`, {}, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Тайлангийн үндсэн үзүүлэлтүүд
  getKPIs: async (params: {
    startDate: string;
    endDate: string;
    organizationId?: string;
  }): Promise<any> => {
    return await get('/reports/kpis', params);
  },

  // Тайлангийн түүх
  getReportHistory: async (
    reportId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{
    data: any[];
    total: number;
  }> => {
    return await get(`/reports/${reportId}/history`, params);
  },

  // Тайлангийн хэрэглэгчийн тохиргоо
  getUserReportSettings: async (): Promise<any> => {
    return await get('/reports/user-settings');
  },

  // Тайлангийн хэрэглэгчийн тохиргоо хадгалах
  saveUserReportSettings: async (settings: any): Promise<any> => {
    return await post('/reports/user-settings', settings);
  },

  // Тайлангийн мэдэгдэл
  subscribeToReport: async (
    reportId: string,
    settings: {
      notifyOnUpdate: boolean;
      notifyOnComment: boolean;
      email: boolean;
      push: boolean;
    }
  ): Promise<void> => {
    return await post(`/reports/${reportId}/subscribe`, settings);
  },

  // Тайлангийн мэдэгдлээс гарах
  unsubscribeFromReport: async (reportId: string): Promise<void> => {
    return await del(`/reports/${reportId}/subscribe`);
  },

  // Тайлангийн дүн шинжилгээ
  analyzeReports: async (params: {
    reportIds: string[];
    compareBy: string[];
  }): Promise<any> => {
    return await post('/reports/analyze', params);
  },
};