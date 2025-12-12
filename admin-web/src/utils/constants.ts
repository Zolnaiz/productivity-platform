// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    ROLES: '/users/roles',
    PERMISSIONS: '/users/permissions',
  },
  ORGANIZATIONS: {
    BASE: '/organizations',
    STATS: '/organizations/stats',
    USERS: '/organizations/users',
    QUESTIONNAIRES: '/organizations/questionnaires',
    EXPENSES: '/organizations/expenses',
    REPORTS: '/organizations/reports',
  },
  QUESTIONNAIRES: {
    BASE: '/questionnaires',
    QUESTIONS: '/questionnaires/questions',
    RESPONSES: '/questionnaires/responses',
    ANALYSIS: '/questionnaires/analysis',
    EXPORT: '/questionnaires/export',
    IMPORT: '/questionnaires/import',
  },
  RESPONSES: {
    BASE: '/responses',
    ANALYSIS: '/responses/analysis',
    BULK_ANALYSIS: '/responses/bulk-analysis',
    EXPORT: '/responses/export',
    VALIDATE: '/responses/validate',
    VERIFY: '/responses/verify',
  },
  EXPENSES: {
    BASE: '/expenses',
    CATEGORIES: '/expenses/categories',
    STATS: '/expenses/stats',
    REPORT: '/expenses/report',
    BUDGET: '/expenses/budget',
    FORECAST: '/expenses/forecast',
    ANALYSIS: '/expenses/analysis',
    EXPORT: '/expenses/export',
  },
  REPORTS: {
    BASE: '/reports',
    GENERATE: '/reports/generate',
    TEMPLATES: '/reports/templates',
    TYPES: '/reports/types',
    EXPORT: '/reports/export',
    PREVIEW: '/reports/preview',
    SCHEDULE: '/reports/schedule',
    KPIS: '/reports/kpis',
    ANALYSIS: '/reports/analyze',
  },
};

// User roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// User permissions
export const USER_PERMISSIONS = {
  // User management
  CREATE_USER: 'create_user',
  VIEW_USERS: 'view_users',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  
  // Organization management
  CREATE_ORGANIZATION: 'create_organization',
  VIEW_ORGANIZATIONS: 'view_organizations',
  EDIT_ORGANIZATION: 'edit_organization',
  DELETE_ORGANIZATION: 'delete_organization',
  
  // Questionnaire management
  CREATE_QUESTIONNAIRE: 'create_questionnaire',
  VIEW_QUESTIONNAIRES: 'view_questionnaires',
  EDIT_QUESTIONNAIRE: 'edit_questionnaire',
  DELETE_QUESTIONNAIRE: 'delete_questionnaire',
  
  // Response management
  VIEW_RESPONSES: 'view_responses',
  EDIT_RESPONSE: 'edit_response',
  DELETE_RESPONSE: 'delete_response',
  
  // Expense management
  CREATE_EXPENSE: 'create_expense',
  VIEW_EXPENSES: 'view_expenses',
  EDIT_EXPENSE: 'edit_expense',
  DELETE_EXPENSE: 'delete_expense',
  APPROVE_EXPENSE: 'approve_expense',
  
  // Report management
  CREATE_REPORT: 'create_report',
  VIEW_REPORTS: 'view_reports',
  EDIT_REPORT: 'edit_report',
  DELETE_REPORT: 'delete_report',
  GENERATE_REPORT: 'generate_report',
  
  // System
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
} as const;

export type UserPermission = typeof USER_PERMISSIONS[keyof typeof USER_PERMISSIONS];

// Questionnaire statuses
export const QUESTIONNAIRE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

export type QuestionnaireStatus = typeof QUESTIONNAIRE_STATUS[keyof typeof QUESTIONNAIRE_STATUS];

// Response statuses
export const RESPONSE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ResponseStatus = typeof RESPONSE_STATUS[keyof typeof RESPONSE_STATUS];

// Expense statuses
export const EXPENSE_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
} as const;

export type ExpenseStatus = typeof EXPENSE_STATUS[keyof typeof EXPENSE_STATUS];

// Report types
export const REPORT_TYPES = {
  FINANCIAL: 'financial',
  OPERATIONAL: 'operational',
  PERFORMANCE: 'performance',
  ANALYTICAL: 'analytical',
  SUMMARY: 'summary',
  DETAILED: 'detailed',
} as const;

export type ReportType = typeof REPORT_TYPES[keyof typeof REPORT_TYPES];

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm',
  FULL_DATE: 'YYYY оны MM сарын DD',
  FULL_DATETIME: 'YYYY-MM-DD HH:mm:ss',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

// Theme constants
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  APP_CONFIG: 'appConfig',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Сүлжээний алдаа. Интернэт холболтоо шалгана уу.',
  SERVER_ERROR: 'Серверийн алдаа. Дараа дахин оролдоно уу.',
  UNAUTHORIZED: 'Таны эрх хүрэхгүй байна.',
  FORBIDDEN: 'Хандах эрхгүй.',
  NOT_FOUND: 'Мэдээлэл олдсонгүй.',
  VALIDATION_ERROR: 'Мэдээлэл буруу байна.',
  TIMEOUT: 'Хэтэрхий удаан. Дараа дахин оролдоно уу.',
  UNKNOWN: 'Тодорхойгүй алдаа гарлаа.',
} as const;