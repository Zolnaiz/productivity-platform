import { get, post, put, del } from './api';
import {
  Questionnaire,
  CreateQuestionnaireDto,
  UpdateQuestionnaireDto,
  Question,
  QuestionnaireResponse,
  QuestionnaireStats
} from '../types/questionnaire.types';

export const questionnaireService = {
  // Бүх судалгаа авах
  getAllQuestionnaires: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    organizationId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    data: Questionnaire[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    return await get('/questionnaires', params);
  },

  // Судалгаа ID-аар авах
  getQuestionnaireById: async (id: string): Promise<Questionnaire> => {
    return await get(`/questionnaires/${id}`);
  },

  // Шинэ судалгаа үүсгэх
  createQuestionnaire: async (data: CreateQuestionnaireDto): Promise<Questionnaire> => {
    return await post('/questionnaires', data);
  },

  // Судалгаа шинэчлэх
  updateQuestionnaire: async (id: string, data: UpdateQuestionnaireDto): Promise<Questionnaire> => {
    return await put(`/questionnaires/${id}`, data);
  },

  // Судалгаа устгах
  deleteQuestionnaire: async (id: string): Promise<void> => {
    return await del(`/questionnaires/${id}`);
  },

  // Судалгааны асуултууд авах
  getQuestions: async (questionnaireId: string): Promise<Question[]> => {
    return await get(`/questionnaires/${questionnaireId}/questions`);
  },

  // Судалгаанд асуулт нэмэх
  addQuestion: async (questionnaireId: string, question: Omit<Question, 'id'>): Promise<Question> => {
    return await post(`/questionnaires/${questionnaireId}/questions`, question);
  },

  // Асуулт шинэчлэх
  updateQuestion: async (
    questionnaireId: string,
    questionId: string,
    question: Partial<Question>
  ): Promise<Question> => {
    return await put(`/questionnaires/${questionnaireId}/questions/${questionId}`, question);
  },

  // Асуулт устгах
  deleteQuestion: async (questionnaireId: string, questionId: string): Promise<void> => {
    return await del(`/questionnaires/${questionnaireId}/questions/${questionId}`);
  },

  // Судалгааны асуултуудын дарааллыг өөрчлөх
  reorderQuestions: async (
    questionnaireId: string,
    questionOrder: string[]
  ): Promise<void> => {
    return await put(`/questionnaires/${questionnaireId}/questions/reorder`, { questionOrder });
  },

  // Судалгааны статистик авах
  getQuestionnaireStats: async (id: string): Promise<QuestionnaireStats> => {
    return await get(`/questionnaires/${id}/stats`);
  },

  // Судалгаа идэвхжүүлэх/идэвхгүйжүүлэх
  toggleQuestionnaireStatus: async (id: string, active: boolean): Promise<Questionnaire> => {
    return await put(`/questionnaires/${id}/status`, { active });
  },

  // Судалгааг хуваалцах
  shareQuestionnaire: async (
    id: string,
    settings: {
      public?: boolean;
      allowAnonymous?: boolean;
      requireLogin?: boolean;
      expirationDate?: string;
    }
  ): Promise<{ shareUrl: string }> => {
    return await post(`/questionnaires/${id}/share`, settings);
  },

  // Судалгааны хариултууд авах
  getQuestionnaireResponses: async (
    questionnaireId: string,
    params?: {
      page?: number;
      limit?: number;
      userId?: string;
      organizationId?: string;
      startDate?: string;
      endDate?: string;
      completed?: boolean;
    }
  ): Promise<{
    data: QuestionnaireResponse[];
    total: number;
  }> => {
    return await get(`/questionnaires/${questionnaireId}/responses`, params);
  },

  // Судалгааны хариултын дэлгэрэнгүй
  getResponseDetails: async (
    questionnaireId: string,
    responseId: string
  ): Promise<QuestionnaireResponse> => {
    return await get(`/questionnaires/${questionnaireId}/responses/${responseId}`);
  },

  // Судалгааны дүн шинжилгээ
  getQuestionnaireAnalysis: async (id: string): Promise<any> => {
    return await get(`/questionnaires/${id}/analysis`);
  },

  // Судалгааг дуурайлган хийх
  duplicateQuestionnaire: async (id: string): Promise<Questionnaire> => {
    return await post(`/questionnaires/${id}/duplicate`);
  },

  // Судалгааг экспортлох
  exportQuestionnaire: async (
    id: string,
    format: 'csv' | 'excel' | 'pdf'
  ): Promise<Blob> => {
    const response = await get(`/questionnaires/${id}/export`, { format }, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Судалгааг импортлох
  importQuestionnaire: async (file: File): Promise<Questionnaire> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await post('/questionnaires/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};