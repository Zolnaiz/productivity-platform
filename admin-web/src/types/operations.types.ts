import type { DailyGoal } from './productivity.types';

export interface Project {
  id: string;
  organizationId?: string;
  name: string;
  description?: string;
  ownerId?: string;
  status: 'planned' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: string;
  progress: number;
  startDate?: string;
  dueDate?: string;
  budget?: number;
}

export interface WorkTask {
  id: string;
  organizationId?: string;
  title: string;
  description?: string;
  projectId?: string;
  assigneeId?: string;
  reporterId?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
}

export interface WorkLog {
  id: string;
  organizationId?: string;
  userId?: string;
  projectId?: string;
  taskId?: string;
  logDate: string;
  summary: string;
  blockers?: string;
  nextSteps?: string;
  hours: number;
}

export interface TimeEntry {
  id: string;
  organizationId?: string;
  userId?: string;
  projectId?: string;
  taskId?: string;
  workDate: string;
  startedAt?: string;
  endedAt?: string;
  hours: number;
  note?: string;
}

export interface AuditTemplate {
  id: string;
  organizationId?: string;
  title: string;
  description?: string;
  category: '5s' | 'safety' | 'quality' | 'compliance' | 'risk' | 'operational_excellence';
  industry?: string;
  questions: Array<{
    id: string;
    text: string;
    type: 'score' | 'yes_no' | 'text';
    maxScore?: number;
  }>;
  isActive: boolean;
}

export interface AuditRun {
  id: string;
  organizationId?: string;
  templateId: string;
  auditorId?: string;
  projectId?: string;
  location?: string;
  answers: Array<{
    questionId: string;
    value: string | number | boolean;
    note?: string;
  }>;
  score: number;
  status: string;
  createdAt?: string;
}

export interface OperationsSummary {
  totals: {
    projects: number;
    tasks: number;
    completedTasks: number;
    workLogs: number;
    totalHours: number;
    auditRuns: number;
  };
  kpis: {
    taskCompletionRate: number;
    averageProjectProgress: number;
    averageAuditScore: number;
  };
  recent: {
    projects: Project[];
    tasks: WorkTask[];
    workLogs: WorkLog[];
    auditRuns?: AuditRun[];
  };
}

export interface OperationsMonthlyReport {
  period: string;
  totals: {
    projects: number;
    tasks: number;
    completedTasks: number;
    workLogs: number;
    totalHours: number;
    auditRuns: number;
    assessmentResponses: number;
    expenses: number;
    dailyGoals: number;
    completedDailyGoals: number;
    approvedExpenseTotal: number;
    pendingExpenseTotal: number;
  };
  kpis: {
    completionRate: number;
    dailyGoalCompletionRate: number;
    averageProjectProgress: number;
    averageAssessmentScore: number;
  };
  completedTasks: WorkTask[];
  workLogs: WorkLog[];
  timeEntries: TimeEntry[];
  projects: Project[];
  dailyGoals: DailyGoal[];
  assessmentResponses: Array<{
    id: string;
    organizationId?: string;
    templateId: string;
    respondentId?: string;
    respondent: string;
    department: string;
    status: 'in_progress' | 'submitted' | 'reviewed' | 'rejected';
    score: number;
    answers: Array<{
      questionId: string;
      value: string | number | boolean;
      note?: string;
    }>;
    submittedAt?: string;
  }>;
  expenses: Array<{
    id: string;
    organizationId?: string;
    title: string;
    projectId?: string;
    category: 'tools' | 'travel' | 'materials' | 'software' | 'other';
    amount: number;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    expenseDate: string;
    submittedBy?: string;
    note?: string;
  }>;
}
