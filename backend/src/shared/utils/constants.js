"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUCCESS_MESSAGES = exports.ERROR_MESSAGES = exports.CACHE_CONSTANTS = exports.REPORT_CONSTANTS = exports.QUESTIONNAIRE_CONSTANTS = exports.EXPENSE_CONSTANTS = exports.FILE_CONSTANTS = exports.PAGINATION_CONSTANTS = exports.VALIDATION_CONSTANTS = exports.DB_CONSTANTS = exports.JWT_CONSTANTS = exports.APP_DESCRIPTION = exports.APP_VERSION = exports.APP_NAME = void 0;
exports.APP_NAME = 'Questionnaire Management System';
exports.APP_VERSION = '1.0.0';
exports.APP_DESCRIPTION = 'Асуулга, зардлын менежментийн систем';
// JWT Constants
exports.JWT_CONSTANTS = {
    EXPIRES_IN: '1h',
    REFRESH_EXPIRES_IN: '7d',
    SECRET_MIN_LENGTH: 32,
};
// Database Constants
exports.DB_CONSTANTS = {
    MAX_RETRIES: 5,
    RETRY_DELAY: 3000,
    CONNECTION_TIMEOUT: 10000,
};
// Validation Constants
exports.VALIDATION_CONSTANTS = {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 100,
    EMAIL_MAX_LENGTH: 255,
    NAME_MAX_LENGTH: 100,
    PHONE_MAX_LENGTH: 20,
    TAX_NUMBER_LENGTH: 20,
    ADDRESS_MAX_LENGTH: 500,
};
// Pagination Constants
exports.PAGINATION_CONSTANTS = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
    SORT_ORDER: ['ASC', 'DESC'],
};
// File Upload Constants
exports.FILE_CONSTANTS = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_MIME_TYPES: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx'],
};
// Expense Constants
exports.EXPENSE_CONSTANTS = {
    MIN_AMOUNT: 0,
    MAX_AMOUNT: 1000000000, // 1 тэрбум
    CATEGORIES: [
        'salary',
        'utility',
        'rent',
        'office_supplies',
        'marketing',
        'travel',
        'equipment',
        'software',
        'training',
        'other',
    ],
    STATUSES: ['pending', 'approved', 'paid', 'rejected', 'cancelled'],
};
// Questionnaire Constants
exports.QUESTIONNAIRE_CONSTANTS = {
    MAX_QUESTIONS: 100,
    MIN_QUESTIONS: 1,
    MAX_OPTIONS: 10,
    QUESTION_TYPES: ['text', 'multiple_choice', 'single_choice', 'rating', 'scale', 'date'],
    STATUSES: ['draft', 'published', 'archived'],
    TYPES: ['survey', 'quiz', 'evaluation', 'feedback'],
};
// Report Constants
exports.REPORT_CONSTANTS = {
    TYPES: ['questionnaire', 'expense', 'combined', 'custom'],
    STATUSES: ['pending', 'processing', 'completed', 'failed', 'exported'],
    EXPORT_FORMATS: ['pdf', 'excel', 'csv', 'json'],
    MAX_DATA_SIZE: 50 * 1024 * 1024, // 50MB
};
// Cache Constants
exports.CACHE_CONSTANTS = {
    DEFAULT_TTL: 3600, // 1 цаг
    MAX_TTL: 86400, // 24 цаг
    PREFIX: 'questionnaire:',
};
// Error Messages
exports.ERROR_MESSAGES = {
    NOT_FOUND: 'Мэдээлэл олдсонгүй',
    UNAUTHORIZED: 'Нэвтрэх эрхгүй байна',
    FORBIDDEN: 'Хандах эрхгүй байна',
    BAD_REQUEST: 'Буруу хүсэлт',
    INTERNAL_SERVER_ERROR: 'Дотоод серверийн алдаа',
    VALIDATION_ERROR: 'Баталгаажуулалтын алдаа',
    DUPLICATE_ENTRY: 'Давхардсан мэдээлэл',
    INVALID_CREDENTIALS: 'Нууц үг эсвэл и-мэйл буруу',
    TOKEN_EXPIRED: 'Токен хүчингүй болсон',
    TOKEN_INVALID: 'Токен буруу',
    RATE_LIMIT_EXCEEDED: 'Хэт олон хүсэлт илгээсэн',
    FILE_TOO_LARGE: 'Файлын хэмжээ хэт их',
    INVALID_FILE_TYPE: 'Буруу файлын төрөл',
};
// Success Messages
exports.SUCCESS_MESSAGES = {
    CREATED: 'Амжилттай үүсгэгдлээ',
    UPDATED: 'Амжилттай шинэчлэгдлээ',
    DELETED: 'Амжилттай устгагдлаа',
    LOGIN_SUCCESS: 'Амжилттай нэвтэрлээ',
    LOGOUT_SUCCESS: 'Амжилттай гарлаа',
    REGISTER_SUCCESS: 'Амжилттай бүртгэгдлээ',
    PASSWORD_RESET: 'Нууц үг амжилттай шинэчлэгдлээ',
    EMAIL_VERIFIED: 'И-мэйл амжилттай баталгаажлаа',
    REPORT_GENERATED: 'Тайлан амжилттай үүсгэгдлээ',
    EXPORT_SUCCESS: 'Экспорт амжилттай дууслаа',
};
