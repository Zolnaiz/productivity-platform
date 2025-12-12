import { RESPONSE_STATUS } from '../utils/constants';

export type ResponseStatus = typeof RESPONSE_STATUS[keyof typeof RESPONSE_STATUS];

export interface Response {
  id: string;
  questionnaireId: string;
  questionnaire?: Questionnaire;
  userId?: string;
  user?: User;
  organizationId: string;
  organization?: Organization;
  answers: Answer[];
  status: ResponseStatus;
  score?: number;
  maxScore?: number;
  percentage?: number;
  timeSpent: number; // in seconds
  startedAt: Date;
  completedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Answer {
  questionId: string;
  question?: Question;
  value: any;
  score?: number;
  maxScore?: number;
  comments?: string;
  attachments?: FileInfo[];
  answeredAt: Date;
}

export interface CreateResponseDto {
  questionnaireId: string;
  userId?: string;
  organizationId: string;
  answers: Omit<Answer, 'answeredAt'>[];
  metadata?: Record<string, any>;
}

export interface UpdateResponseDto {
  answers?: Answer[];
  status?: ResponseStatus;
  score?: number;
  reviewNotes?: string;
}

export interface ResponseAnalysis {
  totalResponses: number;
  averageScore: number;
  averageTime: number;
  completionRate: number;
  scoreDistribution: Record<string, number>;
  timeDistribution: Record<string, number>;
  questionAnalysis: QuestionAnalysis[];
  demographicAnalysis?: DemographicAnalysis;
}

export interface QuestionAnalysis {
  questionId: string;
  questionText: string;
  type: string;
  totalAnswers: number;
  answerDistribution: Record<string, number>;
  averageScore?: number;
  correctRate?: number;
}

export interface DemographicAnalysis {
  byGender?: Record<string, number>;
  byAge?: Record<string, number>;
  byLocation?: Record<string, number>;
  byDepartment?: Record<string, number>;
}

export interface ResponseFilter {
  questionnaireId?: string;
  userId?: string;
  organizationId?: string;
  status?: ResponseStatus;
  startDate?: Date;
  endDate?: Date;
  minScore?: number;
  maxScore?: number;
  reviewed?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BulkResponseAction {
  responseIds: string[];
  action: 'approve' | 'reject' | 'delete' | 'export';
  data?: any;
}