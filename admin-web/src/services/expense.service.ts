import { get, post, put, del } from './api';
import {
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseCategory,
  ExpenseFilter,
  ExpenseStats
} from '../types/expense.types';

export const expenseService = {
  // Бүх зардал авах
  getAllExpenses: async (params?: ExpenseFilter): Promise<{
    data: Expense[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    return await get('/expenses', params);
  },

  // Зардал ID-аар авах
  getExpenseById: async (id: string): Promise<Expense> => {
    return await get(`/expenses/${id}`);
  },

  // Шинэ зардал үүсгэх
  createExpense: async (data: CreateExpenseDto): Promise<Expense> => {
    return await post('/expenses', data);
  },

  // Зардал шинэчлэх
  updateExpense: async (id: string, data: UpdateExpenseDto): Promise<Expense> => {
    return await put(`/expenses/${id}`, data);
  },

  // Зардал устгах
  deleteExpense: async (id: string): Promise<void> => {
    return await del(`/expenses/${id}`);
  },

  // Зардлын ангилал авах
  getCategories: async (): Promise<ExpenseCategory[]> => {
    return await get('/expenses/categories');
  },

  // Шинэ ангилал үүсгэх
  createCategory: async (category: Omit<ExpenseCategory, 'id'>): Promise<ExpenseCategory> => {
    return await post('/expenses/categories', category);
  },

  // Ангилал шинэчлэх
  updateCategory: async (id: string, category: Partial<ExpenseCategory>): Promise<ExpenseCategory> => {
    return await put(`/expenses/categories/${id}`, category);
  },

  // Ангилал устгах
  deleteCategory: async (id: string): Promise<void> => {
    return await del(`/expenses/categories/${id}`);
  },

  // Зардлын статистик авах
  getExpenseStats: async (params?: {
    startDate?: string;
    endDate?: string;
    organizationId?: string;
    categoryId?: string;
    userId?: string;
  }): Promise<ExpenseStats> => {
    return await get('/expenses/stats', params);
  },

  // Зардлын тайлан
  getExpenseReport: async (params: {
    startDate: string;
    endDate: string;
    organizationId?: string;
    categoryId?: string;
    groupBy?: 'day' | 'week' | 'month' | 'category' | 'user';
  }): Promise<any> => {
    return await get('/expenses/report', params);
  },

  // Зардал баталгаажуулах
  approveExpense: async (id: string, notes?: string): Promise<Expense> => {
    return await put(`/expenses/${id}/approve`, { notes });
  },

  // Зардал татгалзах
  rejectExpense: async (id: string, reason: string): Promise<Expense> => {
    return await put(`/expenses/${id}/reject`, { reason });
  },

  // Зардал буцаах
  returnExpense: async (id: string, notes: string): Promise<Expense> => {
    return await put(`/expenses/${id}/return`, { notes });
  },

  // Зардлын төлөв өөрчлөх
  changeExpenseStatus: async (
    id: string,
    status: string,
    notes?: string
  ): Promise<Expense> => {
    return await put(`/expenses/${id}/status`, { status, notes });
  },

  // Зардалд файл хавсаргах
  attachFileToExpense: async (
    expenseId: string,
    file: File
  ): Promise<Expense> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await post(`/expenses/${expenseId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Зардлын файлыг устгах
  deleteFileFromExpense: async (
    expenseId: string,
    fileId: string
  ): Promise<void> => {
    return await del(`/expenses/${expenseId}/attachments/${fileId}`);
  },

  // Зардлыг экспортлох
  exportExpenses: async (
    params?: ExpenseFilter,
    format: 'csv' | 'excel' | 'pdf' = 'excel'
  ): Promise<Blob> => {
    const response = await get('/expenses/export', { ...params, format }, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Олон зардал устгах
  deleteMultipleExpenses: async (ids: string[]): Promise<void> => {
    return await post('/expenses/bulk-delete', { ids });
  },

  // Зардлын төсөв
  getBudget: async (params: {
    organizationId?: string;
    year?: number;
    month?: number;
  }): Promise<any> => {
    return await get('/expenses/budget', params);
  },

  // Төсөв тогтоох
  setBudget: async (data: {
    organizationId?: string;
    year: number;
    month: number;
    amount: number;
    categoryId?: string;
  }): Promise<any> => {
    return await post('/expenses/budget', data);
  },

  // Зардлын төлөвлөгөө
  getExpenseForecast: async (params: {
    organizationId?: string;
    months: number;
    basedOn?: 'history' | 'budget' | 'both';
  }): Promise<any> => {
    return await get('/expenses/forecast', params);
  },

  // Зардлын дүн шинжилгээ
  analyzeExpenses: async (params: {
    startDate: string;
    endDate: string;
    organizationId?: string;
  }): Promise<any> => {
    return await get('/expenses/analysis', params);
  },

  // Зардлыг дубликат шалгах
  checkForDuplicates: async (expense: CreateExpenseDto): Promise<{
    isDuplicate: boolean;
    similarExpenses?: Expense[];
  }> => {
    return await post('/expenses/check-duplicate', expense);
  },
};