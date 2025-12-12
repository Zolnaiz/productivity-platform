import { QUESTIONNAIRE_STATUS } from '../utils/constants';

export type QuestionnaireStatus = typeof QUESTIONNAIRE_STATUS[keyof typeof QUESTIONNAIRE_STATUS];

export interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  code: string;
  version: number;
  status: QuestionnaireStatus;
  organizationId: string;
  organization?: Organization;
  createdBy: string;
  updatedBy: string;
  settings: QuestionnaireSettings;
  questions: Question[];
  tags: string[];
  isTemplate: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionnaireSettings {
  isPublic: boolean;
  allowAnonymous: boolean;
  requireLogin: boolean;
  showProgress: boolean;
  allowBackNavigation: boolean;
  timeLimit?: number; // in minutes
  attemptLimit?: number;
  scoringEnabled: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  notifications: {
    onStart: boolean;
    onCompletion: boolean;
    onSubmission: boolean;
  };
}

export interface Question {
  id: string;
  order: number;
  title: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  scoring?: QuestionScoring;
  skipLogic?: SkipLogic[];
}

export type QuestionType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'time'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'rating'
  | 'scale'
  | 'file'
  | 'signature';

export interface QuestionOption {
  id: string;
  value: string;
  label: string;
  score?: number;
}

export interface QuestionValidation {
  min?: number;
  max?: number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  allowedTypes?: string[];
  maxSize?: number;
}

export interface QuestionScoring {
  enabled: boolean;
  points: number;
  correctAnswers?: string[];
  partialScoring?: boolean;
}

export interface SkipLogic {
  condition: SkipCondition;
  targetQuestionId: string;
}

export interface SkipCondition {
  questionId: string;
  operator: 'eq' | 'neq' | 'contains' | 'notContains' | 'gt' | 'lt' | 'gte' | 'lte';
  value: any;
}

export interface CreateQuestionnaireDto {
  title: string;
  description?: string;
  code: string;
  organizationId: string;
  settings?: Partial<QuestionnaireSettings>;
  questions?: Omit<Question, 'id'>[];
  tags?: string[];
  isTemplate?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateQuestionnaireDto {
  title?: string;
  description?: string;
  code?: string;
  status?: QuestionnaireStatus;
  settings?: Partial<QuestionnaireSettings>;
  questions?: Question[];
  tags?: string[];
  isTemplate?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface QuestionnaireStats {
  totalQuestions: number;
  totalResponses: number;
  completionRate: number;
  averageTime: number; // in minutes
  averageScore?: number;
  responsesByDate: Record<string, number>;
  responsesByStatus: Record<string, number>;
}

export interface QuestionnaireFilter {
  search?: string;
  status?: QuestionnaireStatus;
  organizationId?: string;
  isTemplate?: boolean;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}