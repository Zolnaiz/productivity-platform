export type AssessmentType = 'survey' | 'inspection' | 'quality' | 'safety' | 'feedback';
export type AssessmentStatus = 'draft' | 'published' | 'archived';
export type ResponseStatus = 'in_progress' | 'submitted' | 'reviewed' | 'rejected';

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'score' | 'yes_no' | 'text';
  maxScore?: number;
}

export interface AssessmentTemplate {
  id: string;
  title: string;
  description: string;
  type: AssessmentType;
  status: AssessmentStatus;
  industry: string;
  questions: AssessmentQuestion[];
  createdAt: string;
}

export interface AssessmentResponse {
  id: string;
  templateId: string;
  respondent: string;
  department: string;
  status: ResponseStatus;
  score: number;
  submittedAt: string;
  answers: Array<{
    questionId: string;
    value: string | number | boolean;
    note?: string;
  }>;
}
