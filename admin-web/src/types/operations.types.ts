export interface Project {
  id: string;
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
  title: string;
  description?: string;
  projectId?: string;
  assigneeId?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
}

export interface WorkLog {
  id: string;
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
