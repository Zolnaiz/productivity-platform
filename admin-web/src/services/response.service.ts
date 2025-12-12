import { get, post, put, del } from './api';
import {
  Response,
  CreateResponseDto,
  UpdateResponseDto,
  ResponseAnalysis,
  ResponseFilter
} from '../types/response.types';

export const responseService = {
  // Бүх хариулт авах
  getAllResponses: async (params?: ResponseFilter): Promise<{
    data: Response[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    return await get('/responses', params);
  },

  // Хариулт ID-аар авах
  getResponseById: async (id: string): Promise<Response> => {
    return await get(`/responses/${id}`);
  },

  // Шинэ хариулт үүсгэх
  createResponse: async (data: CreateResponseDto): Promise<Response> => {
    return await post('/responses', data);
  },

  // Хариулт шинэчлэх
  updateResponse: async (id: string, data: UpdateResponseDto): Promise<Response> => {
    return await put(`/responses/${id}`, data);
  },

  // Хариулт устгах
  deleteResponse: async (id: string): Promise<void> => {
    return await del(`/responses/${id}`);
  },

  // Хариултын дэлгэрэнгүй мэдээлэл
  getResponseDetails: async (id: string): Promise<Response> => {
    return await get(`/responses/${id}/details`);
  },

  // Хариултын дүн шинжилгээ
  getResponseAnalysis: async (id: string): Promise<ResponseAnalysis> => {
    return await get(`/responses/${id}/analysis`);
  },

  // Олон хариултын дүн шинжилгээ
  getBulkAnalysis: async (responseIds: string[]): Promise<any> => {
    return await post('/responses/bulk-analysis', { responseIds });
  },

  // Хариулт шалгах
  validateResponse: async (id: string): Promise<{ valid: boolean; errors: string[] }> => {
    return await get(`/responses/${id}/validate`);
  },

  // Хариулт баталгаажуулах
  verifyResponse: async (id: string): Promise<Response> => {
    return await put(`/responses/${id}/verify`);
  },

  // Хариултын төлөв өөрчлөх
  changeResponseStatus: async (
    id: string,
    status: string,
    notes?: string
  ): Promise<Response> => {
    return await put(`/responses/${id}/status`, { status, notes });
  },

  // Хариултанд сэтгэгдэл нэмэх
  addCommentToResponse: async (
    responseId: string,
    comment: string
  ): Promise<Response> => {
    return await post(`/responses/${responseId}/comments`, { comment });
  },

  // Хариултын сэтгэгдлийг устгах
  deleteCommentFromResponse: async (
    responseId: string,
    commentId: string
  ): Promise<void> => {
    return await del(`/responses/${responseId}/comments/${commentId}`);
  },

  // Хариултанд файл хавсаргах
  attachFileToResponse: async (
    responseId: string,
    file: File
  ): Promise<Response> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await post(`/responses/${responseId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Хариултын файлыг устгах
  deleteFileFromResponse: async (
    responseId: string,
    fileId: string
  ): Promise<void> => {
    return await del(`/responses/${responseId}/attachments/${fileId}`);
  },

  // Хариултыг экспортлох
  exportResponses: async (
    params?: ResponseFilter,
    format: 'csv' | 'excel' | 'pdf' = 'excel'
  ): Promise<Blob> => {
    const response = await get('/responses/export', { ...params, format }, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Олон хариулт устгах
  deleteMultipleResponses: async (ids: string[]): Promise<void> => {
    return await post('/responses/bulk-delete', { ids });
  },

  // Хариултыг судалгаанд хуваалцах
  shareResponse: async (id: string, settings: {
    public?: boolean;
    expirationDate?: string;
    password?: string;
  }): Promise<{ shareUrl: string }> => {
    return await post(`/responses/${id}/share`, settings);
  },

  // Хариултын статистик
  getResponseStatistics: async (params?: {
    startDate?: string;
    endDate?: string;
    organizationId?: string;
    questionnaireId?: string;
  }): Promise<any> => {
    return await get('/responses/statistics', params);
  },

  // Хариултын тренд анализ
  getResponseTrends: async (params: {
    startDate: string;
    endDate: string;
    interval: 'day' | 'week' | 'month';
    questionnaireId?: string;
    organizationId?: string;
  }): Promise<any> => {
    return await get('/responses/trends', params);
  },

  // Хариултын харьцуулалт
  compareResponses: async (params: {
    responseIds: string[];
    criteria: string[];
  }): Promise<any> => {
    return await post('/responses/compare', params);
  },
};