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

/** What produced a task that was not typed by hand. */
export type TaskSource = 'five_s_red_tag' | 'audit_run' | 'five_s_improvement';

/**
 * What the server raised, as a key and its parts.
 *
 * The assembled sentence stays in `title` for an export or an email, which
 * have no reader to ask. A screen words the key instead — see
 * `components/common/raisedText.ts`.
 */
export interface RaisedTitle {
  titleKey?: string;
  titleParams?: Record<string, string | number>;
}

export interface WorkTask extends RaisedTitle {
  id: string;
  organizationId?: string;
  title: string;
  description?: string;
  projectId?: string;
  assigneeId?: string;
  reporterId?: string;
  /**
   * Where this task came from. The server raises at most one open task per
   * source, so sending these makes "create tasks" safe to press twice.
   */
  sourceType?: TaskSource;
  sourceId?: string;
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
  workLogId?: string;
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
  /** The 5S zone audited. The server writes this run's score onto that zone. */
  zoneId?: string;
  /** Which layer of a layered audit this was. The server resets that clock. */
  tier?: number;
  /**
   * The floor plan as it stood when this was walked.
   *
   * A score is only as readable as the drawing behind it: a March result read
   * against a June plan cannot say whether an area improved or was redrawn.
   */
  layoutVersionId?: string;
  layoutVersionOn?: string;
  /** Human-readable place, kept so a run still reads well if the zone is gone. */
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

/** What one person did in the month, from everything they left behind. */
export interface MonthlyPerson {
  userId: string;
  completedTasks: number;
  assignedTasks: number;
  hours: number;
  workLogs: number;
  dailyGoals?: number;
  completedDailyGoals?: number;
  auditRuns: number;
  assessments: number;
}

export interface OperationsMonthlyReport {
  period: string;
  /**
   * Everybody who appears in the month's records.
   *
   * Built from the records rather than the staff list, so somebody who has
   * left still has the month they worked; the page adds the people who left
   * nothing behind, because it knows who was supposed to be there.
   */
  people?: MonthlyPerson[];
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
