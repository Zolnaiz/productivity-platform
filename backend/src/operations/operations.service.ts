import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { WorkTask } from './entities/task.entity';
import { WorkLog } from './entities/work-log.entity';
import { TimeEntry } from './entities/time-entry.entity';
import { AuditTemplate } from './entities/audit-template.entity';
import { AuditRun } from './entities/audit-run.entity';
import { AssessmentTemplate } from './entities/assessment-template.entity';
import { AssessmentResponse } from './entities/assessment-response.entity';
import { ExpenseItem } from './entities/expense.entity';

type CurrentUser = {
  id?: string;
  organizationId?: string;
};

@Injectable()
export class OperationsService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Project) private projects: Repository<Project>,
    @InjectRepository(WorkTask) private tasks: Repository<WorkTask>,
    @InjectRepository(WorkLog) private workLogs: Repository<WorkLog>,
    @InjectRepository(TimeEntry) private timeEntries: Repository<TimeEntry>,
    @InjectRepository(AuditTemplate) private auditTemplates: Repository<AuditTemplate>,
    @InjectRepository(AuditRun) private auditRuns: Repository<AuditRun>,
    @InjectRepository(AssessmentTemplate) private assessmentTemplates: Repository<AssessmentTemplate>,
    @InjectRepository(AssessmentResponse) private assessmentResponses: Repository<AssessmentResponse>,
    @InjectRepository(ExpenseItem) private expenses: Repository<ExpenseItem>,
  ) {}

  findProjects(user: CurrentUser) {
    return this.projects.find({
      where: this.organizationWhere(user),
      order: { createdAt: 'DESC' },
    });
  }

  createProject(payload: Partial<Project>, user: CurrentUser) {
    const project = this.projects.create({
      ...payload,
      organizationId: this.resolveOrganizationId(user, payload.organizationId),
      ownerId: payload.ownerId || user?.id,
    });
    return this.projects.save(project);
  }

  async updateProject(id: string, payload: Partial<Project>, user: CurrentUser) {
    const project = await this.findOneScoped(this.projects, id, user, 'Project');
    this.assignWithoutOrganizationChange(project, payload);
    return this.projects.save(project);
  }

  async removeProject(id: string, user: CurrentUser) {
    const project = await this.findOneScoped(this.projects, id, user, 'Project');
    await this.projects.softRemove(project);
    return { id, deleted: true };
  }

  findTasks(user: CurrentUser, projectId?: string) {
    return this.tasks.find({
      where: {
        ...this.organizationWhere(user),
        ...(projectId ? { projectId } : {}),
      },
      order: { createdAt: 'DESC' },
    });
  }

  createTask(payload: Partial<WorkTask>, user: CurrentUser) {
    const task = this.tasks.create({
      ...payload,
      organizationId: this.resolveOrganizationId(user, payload.organizationId),
      reporterId: payload.reporterId || user?.id,
    });
    return this.tasks.save(task);
  }

  async updateTask(id: string, payload: Partial<WorkTask>, user: CurrentUser) {
    const task = await this.findOneScoped(this.tasks, id, user, 'Task');
    this.assignWithoutOrganizationChange(task, payload);
    return this.tasks.save(task);
  }

  findWorkLogs(user: CurrentUser) {
    return this.workLogs.find({
      where: this.organizationWhere(user),
      order: { logDate: 'DESC', createdAt: 'DESC' },
    });
  }

  createWorkLog(payload: Partial<WorkLog>, user: CurrentUser) {
    const log = this.workLogs.create({
      ...payload,
      organizationId: this.resolveOrganizationId(user, payload.organizationId),
      userId: payload.userId || user?.id,
      logDate: payload.logDate || new Date().toISOString().slice(0, 10),
    });
    return this.workLogs.save(log);
  }

  findTimeEntries(user: CurrentUser) {
    return this.timeEntries.find({
      where: this.organizationWhere(user),
      order: { workDate: 'DESC', createdAt: 'DESC' },
    });
  }

  createTimeEntry(payload: Partial<TimeEntry>, user: CurrentUser) {
    const entry = this.timeEntries.create({
      ...payload,
      organizationId: this.resolveOrganizationId(user, payload.organizationId),
      userId: payload.userId || user?.id,
      workDate: payload.workDate || new Date().toISOString().slice(0, 10),
    });
    return this.timeEntries.save(entry);
  }

  findAuditTemplates(user: CurrentUser) {
    return this.auditTemplates.find({
      where: this.organizationWhere(user),
      order: { createdAt: 'DESC' },
    });
  }

  createAuditTemplate(payload: Partial<AuditTemplate>, user: CurrentUser) {
    const template = this.auditTemplates.create({
      ...payload,
      organizationId: this.resolveOrganizationId(user, payload.organizationId),
      questions: payload.questions || [],
    });
    return this.auditTemplates.save(template);
  }

  findAuditRuns(user: CurrentUser) {
    return this.auditRuns.find({
      where: this.organizationWhere(user),
      order: { createdAt: 'DESC' },
    });
  }

  createAuditRun(payload: Partial<AuditRun>, user: CurrentUser) {
    const run = this.auditRuns.create({
      ...payload,
      organizationId: this.resolveOrganizationId(user, payload.organizationId),
      auditorId: payload.auditorId || user?.id,
      answers: payload.answers || [],
    });
    return this.auditRuns.save(run);
  }

  findAssessmentTemplates(user: CurrentUser) {
    return this.assessmentTemplates.find({
      where: this.organizationWhere(user),
      order: { createdAt: 'DESC' },
    });
  }

  createAssessmentTemplate(payload: Partial<AssessmentTemplate>, user: CurrentUser) {
    const template = this.assessmentTemplates.create({
      ...payload,
      organizationId: this.resolveOrganizationId(user, payload.organizationId),
      questions: payload.questions || [],
    });
    return this.assessmentTemplates.save(template);
  }

  async updateAssessmentTemplate(id: string, payload: Partial<AssessmentTemplate>, user: CurrentUser) {
    const template = await this.findOneScoped(this.assessmentTemplates, id, user, 'Assessment template');
    this.assignWithoutOrganizationChange(template, payload);
    return this.assessmentTemplates.save(template);
  }

  findAssessmentResponses(user: CurrentUser) {
    return this.assessmentResponses.find({
      where: this.organizationWhere(user),
      order: { submittedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  createAssessmentResponse(payload: Partial<AssessmentResponse>, user: CurrentUser) {
    const response = this.assessmentResponses.create({
      ...payload,
      organizationId: this.resolveOrganizationId(user, payload.organizationId),
      respondentId: payload.respondentId || user?.id,
      answers: payload.answers || [],
      submittedAt: payload.submittedAt || new Date(),
    });
    return this.assessmentResponses.save(response);
  }

  async updateAssessmentResponse(id: string, payload: Partial<AssessmentResponse>, user: CurrentUser) {
    const response = await this.findOneScoped(this.assessmentResponses, id, user, 'Assessment response');
    this.assignWithoutOrganizationChange(response, payload);
    return this.assessmentResponses.save(response);
  }

  findExpenses(user: CurrentUser) {
    return this.expenses.find({
      where: this.organizationWhere(user),
      order: { expenseDate: 'DESC', createdAt: 'DESC' },
    });
  }

  createExpense(payload: Partial<ExpenseItem>, user: CurrentUser) {
    const expense = this.expenses.create({
      ...payload,
      organizationId: this.resolveOrganizationId(user, payload.organizationId),
      expenseDate: payload.expenseDate || new Date().toISOString().slice(0, 10),
    });
    return this.expenses.save(expense);
  }

  async updateExpense(id: string, payload: Partial<ExpenseItem>, user: CurrentUser) {
    const expense = await this.findOneScoped(this.expenses, id, user, 'Expense');
    this.assignWithoutOrganizationChange(expense, payload);
    return this.expenses.save(expense);
  }

  async dashboardSummary(user: CurrentUser) {
    const organization = this.organizationWhere(user);
    const [projects, tasks, workLogs, timeEntries, auditRuns, assessmentResponses, expenses] = await Promise.all([
      this.projects.find({ where: organization }),
      this.tasks.find({ where: organization }),
      this.workLogs.find({ where: organization }),
      this.timeEntries.find({ where: organization }),
      this.auditRuns.find({ where: organization }),
      this.assessmentResponses.find({ where: organization }),
      this.expenses.find({ where: organization }),
    ]);

    const completedTasks = tasks.filter((task) => task.status === 'done').length;
    const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
    const averageProjectProgress = projects.length
      ? Math.round(projects.reduce((sum, project) => sum + Number(project.progress || 0), 0) / projects.length)
      : 0;
    const averageAuditScore = auditRuns.length
      ? Math.round(auditRuns.reduce((sum, run) => sum + Number(run.score || 0), 0) / auditRuns.length)
      : 0;
    const averageAssessmentScore = assessmentResponses.length
      ? Math.round(
          assessmentResponses.reduce((sum, response) => sum + Number(response.score || 0), 0) /
            assessmentResponses.length,
        )
      : 0;
    const approvedExpenseTotal = expenses
      .filter((expense) => expense.status === 'approved')
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return {
      totals: {
        projects: projects.length,
        tasks: tasks.length,
        completedTasks,
        workLogs: workLogs.length,
        totalHours,
        auditRuns: auditRuns.length,
        assessmentResponses: assessmentResponses.length,
        approvedExpenseTotal,
      },
      kpis: {
        taskCompletionRate: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
        averageProjectProgress,
        averageAuditScore,
        averageAssessmentScore,
      },
      recent: {
        projects: projects.slice(0, 5),
        tasks: tasks.slice(0, 5),
        workLogs: workLogs.slice(0, 5),
      },
    };
  }

  async monthlyReport(user: CurrentUser, month?: string) {
    const organization = this.organizationWhere(user);
    const [projects, tasks, workLogs, timeEntries, auditRuns, assessmentResponses, expenses] = await Promise.all([
      this.projects.find({ where: organization }),
      this.tasks.find({ where: organization }),
      this.workLogs.find({ where: organization }),
      this.timeEntries.find({ where: organization }),
      this.auditRuns.find({ where: organization }),
      this.assessmentResponses.find({ where: organization }),
      this.expenses.find({ where: organization }),
    ]);

    const reportMonth = this.resolveReportMonth(month);
    const monthlyTasks = tasks.filter((task) => this.isInMonth(task.dueDate || task.createdAt, reportMonth));
    const monthlyWorkLogs = workLogs.filter((log) => this.isInMonth(log.logDate || log.createdAt, reportMonth));
    const monthlyTimeEntries = timeEntries.filter((entry) => this.isInMonth(entry.workDate || entry.createdAt, reportMonth));
    const monthlyAuditRuns = auditRuns.filter((run) => this.isInMonth(run.createdAt, reportMonth));
    const monthlyAssessmentResponses = assessmentResponses.filter((response) =>
      this.isInMonth(response.submittedAt || response.createdAt, reportMonth),
    );
    const monthlyExpenses = expenses.filter((expense) => this.isInMonth(expense.expenseDate || expense.createdAt, reportMonth));

    const completedTasks = monthlyTasks.filter((task) => task.status === 'done');
    const totalHours = monthlyTimeEntries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
    const completionRate = monthlyTasks.length ? Math.round((completedTasks.length / monthlyTasks.length) * 100) : 0;
    const averageProjectProgress = projects.length
      ? Math.round(projects.reduce((sum, project) => sum + Number(project.progress || 0), 0) / projects.length)
      : 0;
    const averageAssessmentScore = monthlyAssessmentResponses.length
      ? Math.round(
          monthlyAssessmentResponses.reduce((sum, response) => sum + Number(response.score || 0), 0) /
            monthlyAssessmentResponses.length,
        )
      : 0;
    const approvedExpenseTotal = monthlyExpenses
      .filter((expense) => expense.status === 'approved')
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const pendingExpenseTotal = monthlyExpenses
      .filter((expense) => expense.status === 'submitted')
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return {
      period: reportMonth,
      totals: {
        projects: projects.length,
        tasks: monthlyTasks.length,
        completedTasks: completedTasks.length,
        workLogs: monthlyWorkLogs.length,
        totalHours,
        auditRuns: monthlyAuditRuns.length,
        assessmentResponses: monthlyAssessmentResponses.length,
        expenses: monthlyExpenses.length,
        approvedExpenseTotal,
        pendingExpenseTotal,
      },
      kpis: {
        completionRate,
        averageProjectProgress,
        averageAssessmentScore,
      },
      completedTasks,
      workLogs: monthlyWorkLogs,
      timeEntries: monthlyTimeEntries,
      projects,
      assessmentResponses: monthlyAssessmentResponses,
      expenses: monthlyExpenses,
    };
  }

  private resolveReportMonth(month?: string) {
    return month && /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7);
  }

  private isInMonth(value: Date | string | undefined, month: string) {
    if (!value) return false;

    if (value instanceof Date) {
      return value.toISOString().slice(0, 7) === month;
    }

    return String(value).slice(0, 7) === month;
  }

  private organizationWhere(user: CurrentUser) {
    const organizationId = this.resolveOrganizationId(user);
    return organizationId ? { organizationId } : {};
  }

  private resolveOrganizationId(user?: CurrentUser, payloadOrganizationId?: string) {
    const allowPublicOperations = this.configService.get('ALLOW_PUBLIC_OPERATIONS') === true;

    if (user?.organizationId) {
      return user.organizationId;
    }

    if (!allowPublicOperations) {
      throw new UnauthorizedException('Organization context is required');
    }

    return payloadOrganizationId;
  }

  private async findOneScoped<T extends { id: string; organizationId?: string }>(
    repository: Repository<T>,
    id: string,
    user: CurrentUser,
    label: string,
  ) {
    const entity = await repository.findOne({
      where: {
        id,
        ...this.organizationWhere(user),
      } as any,
    });

    if (!entity) {
      throw new NotFoundException(`${label} not found`);
    }

    return entity;
  }

  private assignWithoutOrganizationChange<T extends { organizationId?: string }>(entity: T, payload: Partial<T>) {
    const safePayload = { ...payload };
    delete safePayload.organizationId;
    Object.assign(entity, safePayload);
  }
}
