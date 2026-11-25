/**
 * Collects the actions waiting for the user (tasks, reviews, approvals) from the other services into one list.
 */
import { assessmentService } from './assessment.service';
import { financeService } from './finance.service';
import { operationsService } from './operations.service';
import { ActionItem } from '../types/action.types';
import { localDay } from '../components/progress/progressBoard';

/** Who is looking: their own returned documents, and (for a reviewer) other people's waiting for review. */
export interface ActionViewer {
  id?: string;
  canReview?: boolean;
}

/** Documents waiting longer than this are urgent: the author cannot finish until somebody decides. */
const REVIEW_URGENT_DAYS = 2;

export const actionService = {
  getActionItems: async (viewer: ActionViewer = {}): Promise<ActionItem[]> => {
    const [projects, tasks, auditRuns, responses, expenses] = await Promise.all([
      operationsService.getProjects(),
      operationsService.getTasks(),
      operationsService.getAuditRuns(),
      assessmentService.getResponses(),
      financeService.getExpenses(),
    ]);
    // The reader's day, not UTC's: before 08:00 in Ulaanbaatar the UTC date
    // is still yesterday, and nothing due today would read as overdue.
    const today = localDay(new Date());

    const waitingDays = (since?: string | null) =>
      since ? Math.floor((Date.now() - Date.parse(since)) / (24 * 60 * 60 * 1000)) : 0;

    return [
      // Work documents sent for review, for whoever may decide - never one's own (the server refuses it too).
      ...(viewer.canReview
        ? tasks.filter((task) => task.reviewStatus === 'submitted' && task.assigneeId !== viewer.id)
        : []
      ).map<ActionItem>((task) => ({
        id: `review-${task.id}`,
        type: 'review',
        title: 'Documents to review',
        titleKey: 'actions.documentsToReview',
        message: task.title,
        messageKey: task.titleKey,
        messageParams: task.titleParams,
        meta: task.submittedAt ? `Sent ${task.submittedAt.slice(0, 10)}` : '',
        metaKey: task.submittedAt ? 'actions.sentOn' : undefined,
        metaParams: task.submittedAt ? { date: task.submittedAt.slice(0, 10) } : undefined,
        path: '/tasks',
        priority: waitingDays(task.submittedAt) >= REVIEW_URGENT_DAYS ? 'high' : 'medium',
      })),
      // One's own documents sent back: the reason is the thing to read.
      ...tasks
        .filter((task) => task.reviewStatus === 'returned' && viewer.id && task.assigneeId === viewer.id)
        .map<ActionItem>((task) => ({
          id: `returned-${task.id}`,
          type: 'review',
          title: 'Documents returned',
          titleKey: 'actions.documentsReturned',
          message: task.title,
          messageKey: task.titleKey,
          messageParams: task.titleParams,
          meta: task.reviewNote ?? '',
          path: '/tasks',
          priority: 'high',
        })),
      ...tasks
        .filter((task) => task.status !== 'done')
        .map<ActionItem>((task) => {
          const overdue = Boolean(task.dueDate && task.dueDate < today);
          return {
            id: `task-${task.id}`,
            type: overdue ? 'overdue' : 'task',
            title: overdue ? 'Overdue task' : 'Open task',
            titleKey: overdue ? 'actions.overdueTask' : 'actions.openTask',
            message: task.title,
            messageKey: task.titleKey,
            messageParams: task.titleParams,
            meta: task.dueDate ? `Due ${task.dueDate}` : task.priority,
            metaKey: task.dueDate ? 'actions.due' : `tasks.priorities.${task.priority}`,
            metaParams: task.dueDate ? { date: task.dueDate.slice(0, 10) } : undefined,
            path: '/tasks',
            priority: overdue || task.priority === 'high' ? 'high' : 'medium',
          };
        }),
      ...projects
        .filter((project) => project.status !== 'completed' && project.progress < 80)
        .map<ActionItem>((project) => ({
          id: `project-${project.id}`,
          type: 'project',
          title: 'Project progress',
          titleKey: 'actions.projectProgress',
          message: project.name,
          meta: `${project.progress}% complete`,
          metaKey: 'actions.percentComplete',
          metaParams: { percent: project.progress },
          path: '/projects',
          priority: project.progress < 40 ? 'high' : 'medium',
        })),
      ...auditRuns
        .filter((run) => run.score < 85)
        .map<ActionItem>((run) => ({
          id: `audit-${run.id}`,
          type: 'audit',
          title: 'Audit needs action',
          titleKey: 'actions.auditNeedsAction',
          message: run.location || 'Audit run',
          messageKey: run.location ? undefined : 'actions.auditRun',
          meta: `${run.score}% score`,
          metaKey: 'actions.percentScore',
          metaParams: { score: run.score },
          path: '/fives',
          priority: run.score < 70 ? 'high' : 'medium',
        })),
      ...responses
        .filter((response) => response.score < 85 || response.status === 'submitted')
        .map<ActionItem>((response) => ({
          id: `response-${response.id}`,
          type: 'assessment',
          title: response.score < 85 ? 'Assessment needs action' : 'Response needs review',
          titleKey: response.score < 85 ? 'actions.assessmentNeedsAction' : 'actions.responseNeedsReview',
          message: response.respondent,
          meta: `${response.department} - ${response.score}% - ${response.status}`,
          metaKey: 'actions.assessmentMeta',
          metaParams: { department: response.department, score: response.score, status: response.status },
          path: '/responses',
          priority: response.score < 75 ? 'high' : 'medium',
        })),
      ...expenses
        .filter((expense) => expense.status === 'submitted')
        .map<ActionItem>((expense) => ({
          id: `expense-${expense.id}`,
          type: 'expense',
          title: 'Expense approval',
          titleKey: 'actions.expenseApproval',
          message: expense.title,
          meta: `${expense.category} - ${expense.amount.toLocaleString()} MNT`,
          metaKey: 'actions.expenseMeta',
          metaParams: { category: expense.category, amount: expense.amount.toLocaleString() },
          path: '/expenses',
          priority: expense.amount > 300000 ? 'high' : 'medium',
        })),
    ].sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.priority] - rank[b.priority];
    });
  },
};
