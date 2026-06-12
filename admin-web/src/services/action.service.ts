import { assessmentService } from './assessment.service';
import { financeService } from './finance.service';
import { operationsService } from './operations.service';
import { ActionItem } from '../types/action.types';

export const actionService = {
  getActionItems: async (): Promise<ActionItem[]> => {
    const [projects, tasks, auditRuns, responses, expenses] = await Promise.all([
      operationsService.getProjects(),
      operationsService.getTasks(),
      operationsService.getAuditRuns(),
      assessmentService.getResponses(),
      financeService.getExpenses(),
    ]);
    const today = new Date().toISOString().slice(0, 10);

    return [
      ...tasks
        .filter((task) => task.status !== 'done')
        .map<ActionItem>((task) => {
          const overdue = Boolean(task.dueDate && task.dueDate < today);
          return {
            id: `task-${task.id}`,
            type: overdue ? 'overdue' : 'task',
            title: overdue ? 'Overdue task' : 'Open task',
            message: task.title,
            meta: task.dueDate ? `Due ${task.dueDate}` : task.priority,
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
          message: project.name,
          meta: `${project.progress}% complete`,
          path: '/projects',
          priority: project.progress < 40 ? 'high' : 'medium',
        })),
      ...auditRuns
        .filter((run) => run.score < 85)
        .map<ActionItem>((run) => ({
          id: `audit-${run.id}`,
          type: 'audit',
          title: 'Audit needs action',
          message: run.location || 'Audit run',
          meta: `${run.score}% score`,
          path: '/fives',
          priority: run.score < 70 ? 'high' : 'medium',
        })),
      ...responses
        .filter((response) => response.score < 85 || response.status === 'submitted')
        .map<ActionItem>((response) => ({
          id: `response-${response.id}`,
          type: 'assessment',
          title: response.score < 85 ? 'Assessment needs action' : 'Response needs review',
          message: response.respondent,
          meta: `${response.department} - ${response.score}% - ${response.status}`,
          path: '/responses',
          priority: response.score < 75 ? 'high' : 'medium',
        })),
      ...expenses
        .filter((expense) => expense.status === 'submitted')
        .map<ActionItem>((expense) => ({
          id: `expense-${expense.id}`,
          type: 'expense',
          title: 'Expense approval',
          message: expense.title,
          meta: `${expense.category} - ${expense.amount.toLocaleString()} MNT`,
          path: '/expenses',
          priority: expense.amount > 300000 ? 'high' : 'medium',
        })),
    ].sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.priority] - rank[b.priority];
    });
  },
};
