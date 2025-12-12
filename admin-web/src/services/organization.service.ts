import { get, post, put, del, patch } from './api';
import { 
  Organization, 
  CreateOrganizationDto, 
  UpdateOrganizationDto,
  OrganizationStats 
} from '../types/organization.types';

export const organizationService = {
  // Бүх байгууллага авах
  getAllOrganizations: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    data: Organization[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    return await get('/organizations', params);
  },

  // Байгууллага ID-аар авах
  getOrganizationById: async (id: string): Promise<Organization> => {
    return await get(`/organizations/${id}`);
  },

  // Шинэ байгууллага үүсгэх
  createOrganization: async (data: CreateOrganizationDto): Promise<Organization> => {
    return await post('/organizations', data);
  },

  // Байгууллага шинэчлэх
  updateOrganization: async (id: string, data: UpdateOrganizationDto): Promise<Organization> => {
    return await put(`/organizations/${id}`, data);
  },

  // Байгууллага устгах
  deleteOrganization: async (id: string): Promise<void> => {
    return await del(`/organizations/${id}`);
  },

  // Байгууллагын статистик авах
  getOrganizationStats: async (id: string): Promise<OrganizationStats> => {
    return await get(`/organizations/${id}/stats`);
  },

  // Байгууллагад хэрэглэгч нэмэх
  addUserToOrganization: async (
    organizationId: string,
    userId: string,
    role?: string
  ): Promise<void> => {
    return await post(`/organizations/${organizationId}/users`, { userId, role });
  },

  // Байгууллагын хэрэглэгч хасах
  removeUserFromOrganization: async (
    organizationId: string,
    userId: string
  ): Promise<void> => {
    return await del(`/organizations/${organizationId}/users/${userId}`);
  },

  // Байгууллагын хэрэглэгчдийн жагсаалт
  getOrganizationUsers: async (
    organizationId: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
    }
  ): Promise<{
    data: any[];
    total: number;
  }> => {
    return await get(`/organizations/${organizationId}/users`, params);
  },

  // Байгууллагын судалгаанууд
  getOrganizationQuestionnaires: async (
    organizationId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
    }
  ): Promise<{
    data: any[];
    total: number;
  }> => {
    return await get(`/organizations/${organizationId}/questionnaires`, params);
  },

  // Байгууллагын зардлууд
  getOrganizationExpenses: async (
    organizationId: string,
    params?: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      category?: string;
    }
  ): Promise<{
    data: any[];
    total: number;
  }> => {
    return await get(`/organizations/${organizationId}/expenses`, params);
  },

  // Байгууллагын тайлангууд
  getOrganizationReports: async (
    organizationId: string,
    params?: {
      page?: number;
      limit?: number;
      type?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    data: any[];
    total: number;
  }> => {
    return await get(`/organizations/${organizationId}/reports`, params);
  },

  // Байгууллагын тохиргоо шинэчлэх
  updateOrganizationSettings: async (
    organizationId: string,
    settings: Record<string, any>
  ): Promise<Organization> => {
    return await patch(`/organizations/${organizationId}/settings`, settings);
  },

  // Байгууллагын үйл ажиллагааны лог
  getOrganizationActivityLog: async (
    organizationId: string,
    params?: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      userId?: string;
      action?: string;
    }
  ): Promise<{
    data: any[];
    total: number;
  }> => {
    return await get(`/organizations/${organizationId}/activity-log`, params);
  },
};