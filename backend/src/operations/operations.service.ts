/**
 * Facade for projects, tasks, work logs, audits and departments. Organisation checks are in OrganizationScope and
 * 5S records in FiveSRecords; this class keeps the public API controllers and tests use.
 */
import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { TaskSource, TaskStatus, WorkTask } from './entities/task.entity';
import { WorkLog } from './entities/work-log.entity';
import { TimeEntry } from './entities/time-entry.entity';
import { AuditTemplate } from './entities/audit-template.entity';
import { AuditRun } from './entities/audit-run.entity';
import { AssessmentTemplate } from './entities/assessment-template.entity';
import { AssessmentResponse } from './entities/assessment-response.entity';
import { ExpenseItem } from './entities/expense.entity';
import { DailyGoal } from './entities/daily-goal.entity';
import { FiveSLayout } from './entities/five-s-layout.entity';
import { Department } from './entities/department.entity';
import { FiveSGuideline } from './entities/five-s-guideline.entity';
import { FiveSLayoutVersion } from './entities/five-s-layout-version.entity';
import { User } from '../users/entities/user.entity';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { projectProgressPercent, sumRecordedHours } from './monthly-people';
import { WeeklyCheckin } from './entities/weekly-checkin.entity';
import { verifyImprovements } from './improvement-verification';
import { scoreFromAnswers } from './audit-score';
import { buildMonthlyReport, MonthRecords, OrganizationRecords, selectMonthRecords } from './monthly-report';
import { FiveSRecords } from './five-s-records';
import { OrganizationScope } from './organization-scope';
import { NotificationsService } from './notifications.service';
import { noteAuditBefore } from '../audit/audit-context';
import { dayIn, organizationTimeZone, stampCompletion, todayIn, withoutCompletionDate } from './task-completion';

type CurrentUser = {
  id?: string;
  role?: string;
  organizationId?: string;
};

/**
 * The mark a 5S area has to reach, and the one below which it needs attention
 * this week rather than next.
 *
 * These lived in the browser, where only one of the three ways of submitting a
 * run could see them: an audit walked on a phone raised no follow-up work at
 * all, and the person walking it usually cannot create tasks in the first
 * place. Deciding here means the same score produces the same work whoever
 * recorded it and from wherever.
 */
const PASSING_SCORE = 85;

/**
 * Forgets the server's wording of a title or description somebody rewrote.
 *
 * A raised task carries a key its clients word in the reader's language. Left
 * in place after an edit, the key would keep showing the old sentence and hide
 * the new one - the edit would look as if it had not saved.
 */
const withoutStaleWording = (task: WorkTask, payload: Partial<WorkTask>): Partial<WorkTask> => ({
  ...payload,
  ...('title' in payload && payload.title !== task.title ? { titleKey: null as never, titleParams: {} } : {}),
  ...('description' in payload && payload.description !== task.description
    ? { descriptionKey: null as never, descriptionParams: {} }
    : {}),
});
const URGENT_SCORE = 70;
const CORRECTIVE_DUE_DAYS = 7;

/** Postgres unique-violation. Other drivers surface it differently. */
const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';

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
    @InjectRepository(DailyGoal) private dailyGoals: Repository<DailyGoal>,
    @InjectRepository(FiveSLayout) private fiveSLayouts: Repository<FiveSLayout>,
    @InjectRepository(Department) private departments: Repository<Department>,
    @InjectRepository(FiveSGuideline) private guidelines: Repository<FiveSGuideline>,
    @InjectRepository(FiveSLayoutVersion) private layoutVersions: Repository<FiveSLayoutVersion>,
    private readonly notifications: NotificationsService,
    /*
      Read-only, to check that the person work is given to belongs to the
      same organization. Optional so the hand-built service in the specs can
      leave it out; the application always has it.
    */
    @Optional() @InjectRepository(User) private readonly users?: Repository<User>,
    // For K6 on the monthly report; optional for the same reason as `users`.
    @Optional() @InjectRepository(WeeklyCheckin) private readonly weeklyCheckins?: Repository<WeeklyCheckin>,
  ) {
    this.scope = new OrganizationScope(configService);
    this.fiveS = new FiveSRecords(fiveSLayouts, layoutVersions, guidelines, this.scope);
  }

  /** Which organization a request acts in (organization-scope.ts). */
  private readonly scope: OrganizationScope;

  /** Floor plans, their versions and the 5S guideline (five-s-records.ts). */
  private readonly fiveS: FiveSRecords;

  /**
   * Refuses to give work to somebody outside the organization.
   *
   * The id arrives from the client. Without this a manager could hand a task
   * to a person in another workspace, who would then be told — and emailed —
   * its title: a leak across the one boundary this application promises.
   */
  private async isAssignable(assigneeId: string | null | undefined, organizationId: string | undefined) {
    if (!assigneeId || !organizationId || !this.users) return true;

    return Boolean(await this.users.findOne({ where: { id: assigneeId, organizationId } }));
  }

  private async assertAssignable(assigneeId: string | null | undefined, organizationId: string | undefined) {
    if (!(await this.isAssignable(assigneeId, organizationId))) {
      throw apiError(ErrorCode.ValidationFailed, 'assigneeId');
    }
  }

  /**
   * The organization's departments, in the order a person reads a list.
   *
   * By name rather than by when they were created: a department list is the
   * shape of the organization, and somebody looking for Maintenance should
   * find it where the alphabet says it is.
   */
  async findDepartments(user: CurrentUser) {
    const departments = await this.departments.find({ where: this.scope.organizationWhere(user) });

    return departments.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  createDepartment(payload: Partial<Department>, user: CurrentUser) {
    return this.departments.save(
      this.departments.create({
        ...payload,
        organizationId: this.scope.resolveOrganizationId(user, payload.organizationId),
      }),
    );
  }

  async updateDepartment(id: string, payload: Partial<Department>, user: CurrentUser) {
    const department = await this.scope.findOneScoped(this.departments, id, user, 'Department');
    this.scope.assignWithoutOrganizationChange(department, payload);

    return this.departments.save(department);
  }

  /**
   * Retires a department.
   *
   * Soft, like every other record here, and the people and areas that pointed
   * at it are deliberately left pointing at it: a department that is dissolved
   * does not un-happen, and rewriting a hundred rows to null in the same
   * breath is how an undo becomes impossible. What reads them resolves an
   * unknown department to "unassigned", which is the honest answer.
   */
  async removeDepartment(id: string, user: CurrentUser) {
    const department = await this.scope.findOneScoped(this.departments, id, user, 'Department');
    await this.departments.softRemove(department);

    return { id, deleted: true };
  }

  // 5S floor plans, versions and the guideline: the work is in FiveSRecords
  // (five-s-records.ts); these keep the routes calling the service they always did.

  findFiveSGuideline(user: CurrentUser) {
    return this.fiveS.findFiveSGuideline(user);
  }

  saveFiveSGuidelineRecords(records: Record<string, unknown>, user: CurrentUser, baseUpdatedAt?: string) {
    return this.fiveS.saveFiveSGuidelineRecords(records, user, baseUpdatedAt);
  }

  saveFiveSGuidelineContent(content: Record<string, unknown>, user: CurrentUser) {
    return this.fiveS.saveFiveSGuidelineContent(content, user);
  }

  findFiveSLayouts(user: CurrentUser) {
    return this.fiveS.findFiveSLayouts(user);
  }

  addRedTag(
    planId: string,
    zoneId: string,
    payload: { title: string; disposition?: string },
    user: CurrentUser,
  ) {
    return this.fiveS.addRedTag(planId, zoneId, payload, user);
  }

  markZoneCleaned(planId: string, zoneId: string, user: CurrentUser) {
    return this.fiveS.markZoneCleaned(planId, zoneId, user);
  }

  createFiveSLayout(payload: Partial<FiveSLayout>, user: CurrentUser) {
    return this.fiveS.createFiveSLayout(payload, user);
  }

  deleteFiveSLayout(id: string, user: CurrentUser) {
    return this.fiveS.deleteFiveSLayout(id, user);
  }

  findFiveSLayout(user: CurrentUser, id?: string) {
    return this.fiveS.findFiveSLayout(user, id);
  }

  upsertFiveSLayout(payload: Partial<FiveSLayout>, user: CurrentUser, id?: string, baseUpdatedAt?: string) {
    return this.fiveS.upsertFiveSLayout(payload, user, id, baseUpdatedAt);
  }

  findLayoutVersions(layoutId: string, user: CurrentUser) {
    return this.fiveS.findLayoutVersions(layoutId, user);
  }

  keepLayoutVersionNow(layoutId: string, label: string | undefined, user: CurrentUser) {
    return this.fiveS.keepLayoutVersionNow(layoutId, label, user);
  }

  restoreLayoutVersion(layoutId: string, versionId: string, user: CurrentUser) {
    return this.fiveS.restoreLayoutVersion(layoutId, versionId, user);
  }

  findProjects(user: CurrentUser) {
    return this.projects.find({
      where: this.scope.organizationWhere(user),
      order: { createdAt: 'DESC' },
    });
  }

  createProject(payload: Partial<Project>, user: CurrentUser) {
    const project = this.projects.create({
      ...payload,
      organizationId: this.scope.resolveOrganizationId(user, payload.organizationId),
      ownerId: payload.ownerId || user?.id,
    });
    return this.projects.save(project);
  }

  async updateProject(id: string, payload: Partial<Project>, user: CurrentUser) {
    const project = await this.scope.findOneScoped(this.projects, id, user, 'Project');
    this.scope.assignWithoutOrganizationChange(project, payload);
    return this.projects.save(project);
  }

  async removeProject(id: string, user: CurrentUser) {
    const project = await this.scope.findOneScoped(this.projects, id, user, 'Project');
    await this.projects.softRemove(project);
    return { id, deleted: true };
  }

  async removeTask(id: string, user: CurrentUser) {
    const task = await this.scope.findOneScoped(this.tasks, id, user, 'Task');
    await this.tasks.softRemove(task);
    return { id, deleted: true };
  }

  findTasks(user: CurrentUser, projectId?: string) {
    return this.tasks.find({
      where: {
        ...this.scope.organizationWhere(user),
        ...(user?.role === 'user' ? { assigneeId: user.id } : {}),
        ...(projectId ? { projectId } : {}),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async createTask(payload: Partial<WorkTask>, user: CurrentUser) {
    const organizationId = this.scope.resolveOrganizationId(user, payload.organizationId);
    const existing = await this.findOpenTaskForSource(payload, organizationId);

    // A finding raises one task, not one per press of the button. Deduping
    // here rather than in the browser means the mobile app gets it too.
    if (existing) {
      return existing;
    }

    /*
      A person asking is told no. The scheduler, which calls with no person,
      may name a zone owner whose account is gone or has moved on; refusing
      would drop the audit entirely, so the work is raised with nobody on it
      and shows up on the board as needing somebody.
    */
    if (user?.id) {
      await this.assertAssignable(payload.assigneeId, organizationId);
    } else if (!(await this.isAssignable(payload.assigneeId, organizationId))) {
      payload = { ...payload, assigneeId: undefined };
    }

    const task = this.tasks.create({
      ...withoutCompletionDate(payload),
      organizationId,
      reporterId: payload.reporterId || user?.id,
    });
    stampCompletion(task, undefined);

    try {
      const saved = await this.tasks.save(task);

      await this.tellTheAssignee(saved, user);

      return saved;
    } catch (error) {
      // The lookup above is a read before a write, so two callers can both
      // pass it — two scheduler replicas at six, or a double-clicked button.
      // A partial unique index makes the database the arbiter; losing that
      // race means somebody else raised the work, which is the right outcome.
      const raced = isUniqueViolation(error)
        ? await this.findOpenTaskForSource(payload, organizationId)
        : null;

      if (raced) {
        return raced;
      }

      throw error;
    }
  }

  /**
   * Tells whoever the work was given to that it exists.
   *
   * Only for a task that was just created: the dedupe above returns the
   * existing one without coming here, so an audit the scheduler re-raises
   * every morning until it is done reaches its owner once rather than daily.
   *
   * Nobody is told about work they gave themselves — saying "you have a new
   * task" to the person who has just typed it is how an inbox becomes
   * something people stop reading. And a failure to deliver is swallowed on
   * purpose: the task is the work, and it must survive the telling failing.
   */
  private async tellTheAssignee(task: WorkTask, user: CurrentUser) {
    if (!task.assigneeId || task.assigneeId === user?.id) return;

    try {
      await this.notifications.notify({
        userId: task.assigneeId,
        organizationId: task.organizationId,
        title: task.title,
        // Carried through rather than re-derived: the inbox says exactly what
        // the task says, in whatever language the reader has chosen.
        titleKey: task.titleKey,
        titleParams: task.titleParams,
        body: task.dueDate ? `Due ${task.dueDate}` : '',
        bodyKey: task.dueDate ? 'raised.dueOn' : undefined,
        bodyParams: task.dueDate ? { date: String(task.dueDate).slice(0, 10) } : undefined,
        link: '/tasks',
        sourceType: 'work_task',
        sourceId: task.id,
      });
    } catch {
      // Deliberately silent: see above.
    }
  }

  /**
   * The open task already raised for a finding, if there is one.
   *
   * Only unfinished tasks count: a red tag that comes back after its task was
   * completed is a new occurrence and deserves new work, which is also the
   * signal that a standard is not holding.
   */
  private findOpenTaskForSource(payload: Partial<WorkTask>, organizationId?: string) {
    if (!payload.sourceType || !payload.sourceId) {
      return Promise.resolve(null);
    }

    return this.tasks.findOne({
      where: {
        organizationId,
        sourceType: payload.sourceType,
        sourceId: payload.sourceId,
        status: Not(TaskStatus.DONE),
      },
    });
  }

  async updateTask(id: string, payload: Partial<WorkTask>, user: CurrentUser) {
    const task = await this.scope.findOneScoped(this.tasks, id, user, 'Task');
    if (user?.role === 'user') {
      if (task.assigneeId !== user.id) {
        throw apiError(ErrorCode.ResourceNotFound, 'Task');
      }
      // Moving it along, and saying why the area fell short when it is a fix.
      if (Object.keys(payload).some((field) => field !== 'status' && field !== 'rootCause')) {
        throw apiError(ErrorCode.AccessDenied);
      }
    }
    const statusBefore = task.status;
    const assigneeBefore = task.assigneeId;
    if ('assigneeId' in payload) {
      await this.assertAssignable(payload.assigneeId, task.organizationId);
    }
    const { fixSignedOffBy: _by, fixSignedOffAt: _at, ...editable } = payload;
    this.scope.assignWithoutOrganizationChange(task, withoutStaleWording(task, withoutCompletionDate(editable)));
    stampCompletion(task, statusBefore);
    // A fix reopened is not the fix that was signed off.
    if (task.status !== TaskStatus.DONE) {
      task.fixSignedOffBy = null;
      task.fixSignedOffAt = null;
    }

    const saved = await this.tasks.save(task);
    await this.closeFindingForCompletedTask(saved, user);
    await this.reviewImprovementForCompletedTask(saved);

    // Work handed to somebody new reaches them the way new work does. Told
    // only when it changed hands, so editing a task does not re-announce it.
    if (saved.assigneeId && saved.assigneeId !== assigneeBefore) {
      await this.tellTheAssignee(saved, user);
    }

    return saved;
  }

  /**
   * Closes the red tag a finished task was raised from.
   *
   * This is the last joint of the 5S loop. Without it the link ran one way —
   * work knew its finding, but clearing the item left the tag open for ever,
   * so the map kept reporting a problem somebody had already fixed.
   *
   * Only red tags close. A task raised from an audit is verified by the next
   * audit, not by someone ticking it off.
   */
  private async closeFindingForCompletedTask(task: WorkTask, user: CurrentUser) {
    if (task.status !== TaskStatus.DONE || task.sourceType !== TaskSource.RED_TAG || !task.sourceId) {
      return;
    }

    // Across every plan the organization has, not the first one. When a
    // building had one floor plan these were the same thing; with a plan per
    // floor, looking only at the first means a tag raised upstairs is never
    // closed and nothing says why.
    const layout = await this.fiveS.layoutHolding(user, (candidate) =>
      (candidate.zones ?? []).some((zone) =>
        (zone.redTags ?? []).some((redTag: Record<string, any>) => redTag.id === task.sourceId),
      ),
    );

    if (!layout) {
      return;
    }

    const closedAt = new Date().toISOString();
    let matched = false;

    const zones = layout.zones.map((zone) => {
      if (!Array.isArray(zone.redTags)) {
        return zone;
      }

      let changed = false;
      const redTags = zone.redTags.map((redTag: Record<string, any>) => {
        if (redTag.id !== task.sourceId || redTag.closedAt) {
          return redTag;
        }

        changed = true;
        matched = true;
        // Only `closedAt` is set. Whether the item was disposed of or returned
        // is a decision somebody makes in the holding-area review; finishing
        // the cleanup task says the work happened, not which way it went.
        return { ...redTag, closedAt };
      });

      // Only the zone holding the tag is rewritten; the rest keep their
      // identity, so an unrelated concurrent edit has less to collide with.
      return changed ? { ...zone, redTags } : zone;
    });

    if (!matched) {
      return;
    }

    layout.zones = zones;
    await this.fiveSLayouts.save(layout);
  }

  /**
   * Hands a finished improvement to management.
   *
   * An improvement record's action plan becomes a task somebody is given; when
   * that task is done the record moves on to management review, which is the
   * register's own next step - somebody senior confirms the cause is gone.
   * Not to closed: finishing the work says it happened, not that it worked.
   *
   * A record already past review, or no longer in the register, is left alone.
   */
  private async reviewImprovementForCompletedTask(task: WorkTask) {
    if (task.status !== TaskStatus.DONE || task.sourceType !== TaskSource.IMPROVEMENT || !task.sourceId) {
      return;
    }

    const register = await this.guidelines.findOne({ where: { organizationId: task.organizationId } });
    const improvements = register?.records?.improvements;

    if (!register || !Array.isArray(improvements)) {
      return;
    }

    let matched = false;
    const next = improvements.map((item: Record<string, unknown>) => {
      if (item?.id !== task.sourceId || !['open', 'in_progress'].includes(String(item.status))) {
        return item;
      }

      matched = true;
      return { ...item, status: 'management_review' };
    });

    if (!matched) {
      return;
    }

    register.records = { ...register.records, improvements: next, updatedAt: new Date().toISOString() };
    await this.guidelines.save(register);
  }

  findWorkLogs(user: CurrentUser) {
    return this.workLogs.find({
      where: user?.role === 'user' ? this.scope.personalWhere(user) : this.scope.organizationWhere(user),
      order: { logDate: 'DESC', createdAt: 'DESC' },
    });
  }

  /** Resolve links once so a task and its recorded hours always name the same project. */
  private async resolveWorkLinks(
    payload: { projectId?: string; taskId?: string },
    user: CurrentUser,
    organizationId: string | undefined,
  ) {
    const scope = { organizationId: organizationId ?? IsNull() };
    let projectId = payload.projectId;

    if (payload.taskId) {
      const task = await this.tasks.findOne({
        where: {
          id: payload.taskId,
          ...scope,
          ...(user?.role === 'user' ? { assigneeId: user.id } : {}),
        },
      });
      if (!task) throw apiError(ErrorCode.ResourceNotFound, 'Task');

      if (projectId && projectId !== task.projectId) {
        throw apiError(ErrorCode.ValidationFailed, 'projectId');
      }
      projectId = task.projectId;
    }

    if (projectId && !(await this.projects.findOne({ where: { id: projectId, ...scope } }))) {
      throw apiError(ErrorCode.ResourceNotFound, 'Project');
    }

    return { projectId, taskId: payload.taskId };
  }

  async createWorkLog(payload: Partial<WorkLog>, user: CurrentUser) {
    const organizationId = this.scope.resolveOrganizationId(user, payload.organizationId);
    const links = await this.resolveWorkLinks(payload, user, organizationId);
    const log = this.workLogs.create({
      ...payload,
      ...links,
      organizationId,
      userId: user?.id,
      logDate: payload.logDate || todayIn(),
    });
    return this.workLogs.save(log);
  }

  async createDailyWorkLog(payload: Partial<WorkLog>, user: CurrentUser) {
    const organizationId = this.scope.resolveOrganizationId(user, payload.organizationId);
    const links = await this.resolveWorkLinks(payload, user, organizationId);
    const logDate = payload.logDate || todayIn();

    return this.workLogs.manager.transaction(async (manager) => {
      const workLogs = manager.getRepository(WorkLog);
      const timeEntries = manager.getRepository(TimeEntry);
      const log = await workLogs.save(
        workLogs.create({
          ...payload,
          ...links,
          organizationId,
          userId: user?.id,
          logDate,
        }),
      );
      const timeEntry = await timeEntries.save(
        timeEntries.create({
          organizationId,
          userId: user?.id,
          projectId: log.projectId,
          taskId: log.taskId,
          workDate: logDate,
          hours: log.hours,
          note: log.summary,
          workLogId: log.id,
        }),
      );

      return { workLog: log, timeEntry };
    });
  }

  findTimeEntries(user: CurrentUser) {
    return this.timeEntries.find({
      where: user?.role === 'user' ? this.scope.personalWhere(user) : this.scope.organizationWhere(user),
      order: { workDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async createTimeEntry(payload: Partial<TimeEntry>, user: CurrentUser) {
    const organizationId = this.scope.resolveOrganizationId(user, payload.organizationId);
    const links = await this.resolveWorkLinks(payload, user, organizationId);
    const entry = this.timeEntries.create({
      ...payload,
      ...links,
      organizationId,
      userId: user?.id,
      workDate: payload.workDate || todayIn(),
    });
    return this.timeEntries.save(entry);
  }

  findDailyGoals(user: CurrentUser, date?: string) {
    return this.dailyGoals.find({
      where: {
        ...this.scope.personalWhere(user),
        ...(date ? { date } : {}),
      },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  createDailyGoal(payload: Partial<DailyGoal>, user: CurrentUser) {
    const goal = this.dailyGoals.create({
      ...payload,
      organizationId: this.scope.resolveOrganizationId(user, payload.organizationId),
      userId: user?.id || payload.userId,
      date: payload.date || todayIn(),
      completed: payload.completed ?? false,
    });
    return this.dailyGoals.save(goal);
  }

  async updateDailyGoal(id: string, payload: Partial<DailyGoal>, user: CurrentUser) {
    const goal = await this.scope.findOnePersonalScoped(this.dailyGoals, id, user, 'Daily goal');
    this.scope.assignWithoutPersonalScopeChange(goal, payload);
    return this.dailyGoals.save(goal);
  }

  findAuditTemplates(user: CurrentUser) {
    return this.auditTemplates.find({
      where: this.scope.organizationWhere(user),
      order: { createdAt: 'DESC' },
    });
  }

  createAuditTemplate(payload: Partial<AuditTemplate>, user: CurrentUser) {
    const template = this.auditTemplates.create({
      ...payload,
      organizationId: this.scope.resolveOrganizationId(user, payload.organizationId),
      questions: payload.questions || [],
    });
    return this.auditTemplates.save(template);
  }

  /**
   * Audit history, newest first.
   *
   * `zoneId` narrows it to one place on the floor plan, which is what the map
   * asks for when somebody opens a zone: how has this area been scoring, and
   * against what baseline.
   */
  findAuditRuns(user: CurrentUser, zoneId?: string) {
    const where = this.scope.organizationWhere(user);

    return this.auditRuns.find({
      where: zoneId ? { ...where, zoneId } : where,
      order: { createdAt: 'DESC' },
    });
  }

  async createAuditRun(payload: Partial<AuditRun>, user: CurrentUser) {
    // A run against a checklist that is not this organization's is refused
    // here, as not found, rather than failing later as a server error.
    const organizationId = this.scope.resolveOrganizationId(user, payload.organizationId);
    const template = await this.auditTemplates.findOne({
      where: { id: payload.templateId, ...(organizationId ? { organizationId } : {}) },
    });
    if (!template) {
      throw apiError(ErrorCode.ResourceNotFound, 'AuditTemplate');
    }

    // The drawing this was walked against, decided before the run is written
    // rather than matched to one afterwards by somebody's memory.
    const version = await this.versionWalkedAgainst(payload, user);

    // The score that decides corrective work and goes into K3 is the server's,
    // worked out from the answers; one sent by the client stands only for a
    // checklist that has nothing to score.
    const answers = payload.answers || [];
    const score = scoreFromAnswers(template.questions, answers) ?? payload.score;

    const run = this.auditRuns.create({
      ...payload,
      organizationId: this.scope.resolveOrganizationId(user, payload.organizationId),
      auditorId: payload.auditorId || user?.id,
      answers,
      score,
      layoutVersionId: version?.id,
      layoutVersionOn: version?.takenOn,
    });

    const saved = await this.auditRuns.save(run);
    await this.applyAuditScoreToZone(saved, user);
    await this.raiseCorrectiveWork(saved, user);

    return saved;
  }

  /**
   * The snapshot of the plan this run was walked against.
   *
   * The most recent one, because a plan that has not changed since June is
   * still the June drawing. A plan that has never been snapshotted gets one
   * now: a score with no drawing behind it is the state this was meant to end.
   *
   * Never fails the audit. The run is the measurement, and losing it because a
   * copy of a drawing could not be made would be the wrong trade entirely.
   */
  private async versionWalkedAgainst(payload: Partial<AuditRun>, user: CurrentUser) {
    if (!payload.zoneId) return null;

    try {
      const layout = await this.fiveS.layoutHolding(user, (candidate) =>
        (candidate.zones ?? []).some((zone) => zone.id === payload.zoneId),
      );

      if (!layout) return null;

      const latest = await this.layoutVersions.findOne({
        where: { layoutId: layout.id },
        order: { takenOn: 'DESC' },
      });

      return latest ?? (await this.fiveS.keepLayoutVersion(layout, user));
    } catch {
      return null;
    }
  }

  /**
   * Raises the work a failing audit calls for.
   *
   * A score is a measurement, and a measurement nobody acts on is a number.
   * The browser used to do this, which meant it happened only when an audit
   * was typed up at a desk by somebody senior enough to create tasks — the
   * daily checks that actually find things raised nothing.
   *
   * It goes through `createTask`, so the work is deduped by its source and the
   * person it lands on is told. The audit is the record and must survive the
   * follow-up failing, so a failure here is logged rather than thrown: losing
   * the run because a task could not be raised would lose the measurement too.
   */
  private async raiseCorrectiveWork(run: AuditRun, user: CurrentUser) {
    try {
      await this.correctiveWorkFor(run, user);
    } catch {
      // Deliberately swallowed: see above.
    }
  }

  /**
   * Raises the follow-up for a run that has already been recorded.
   *
   * The same work the run itself raises, for the case where it did not: a run
   * recorded before this was the server's job, or an area that has not
   * improved since its first task was closed. It is the same code, so the task
   * reads the same either way — a second wording for the same finding is how
   * two lists of work stop matching.
   */
  async raiseAuditFollowUp(id: string, user: CurrentUser) {
    const run = await this.scope.findOneScoped(this.auditRuns, id, user, 'Audit run');

    return this.correctiveWorkFor(run, user);
  }

  private async correctiveWorkFor(run: AuditRun, user: CurrentUser) {
    const score = Number(run.score) || 0;

    if (run.status === 'draft' || score >= PASSING_SCORE) {
      return null;
    }

    const layout = run.zoneId
      ? await this.fiveS.layoutHolding(user, (candidate) =>
          (candidate.zones ?? []).some((zone) => zone.id === run.zoneId),
        )
      : null;
    const zone = (layout?.zones ?? []).find((item) => item.id === run.zoneId);
    const place = zone
      ? [zone.code, zone.name].filter(Boolean).join(' - ')
      : run.location || 'the audited area';

    const dueDate = new Date(Date.now() + CORRECTIVE_DUE_DAYS * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    return this.createTask(
      {
        title: `5S follow-up: ${place}`,
        titleKey: 'raised.auditFollowUp',
        titleParams: { place },
        description: [
          `The audit on ${todayIn(undefined, run.createdAt ?? new Date())} scored ${score}%.`,
          `The standard for this area is ${PASSING_SCORE}%.`,
          'Bring the area back to its standard; the next audit verifies it.',
        ].join('\n'),
        descriptionKey: 'raised.auditFollowUpBody',
        descriptionParams: {
          date: todayIn(undefined, run.createdAt ?? new Date()),
          score,
          standard: PASSING_SCORE,
        },
        // The area's owner, because a 5S finding belongs to whoever owns the
        // area rather than to whoever happened to walk past it.
        assigneeId: zone?.ownerId,
        sourceType: TaskSource.AUDIT_RUN,
        sourceId: run.id,
        status: TaskStatus.TODO,
        priority: score < URGENT_SCORE ? 'high' : 'medium',
        dueDate,
        estimatedHours: 2,
        actualHours: 0,
      } as Partial<WorkTask>,
      user,
    );
  }

  /**
   * Writes a finished run's score onto the zone it audited.
   *
   * This is the joint that closes the 5S loop: the floor plan already carried
   * `lastAuditScore` and `lastAuditAt` fields, but nothing ever set them, so a
   * zone's colour meant whatever someone typed rather than measured condition.
   *
   * Draft runs are ignored — a half-finished checklist should not repaint the
   * map. A run whose zone is no longer on the plan is ignored too, rather than
   * failing the submission: the audit itself is still valid history.
   */
  private async applyAuditScoreToZone(run: AuditRun, user: CurrentUser) {
    if (!run.zoneId || run.status === 'draft') {
      return;
    }

    // The plan holding this zone, which is not necessarily the first one: an
    // audit of a zone on the second floor has to repaint the second floor.
    const layout = await this.fiveS.layoutHolding(user, (candidate) =>
      (candidate.zones ?? []).some((zone) => zone.id === run.zoneId),
    );

    if (!layout) {
      return;
    }

    const auditedAt = (run.createdAt ?? new Date()).toISOString();
    let matched = false;

    const zones = layout.zones.map((zone) => {
      if (zone.id !== run.zoneId) {
        return zone;
      }

      matched = true;
      const score = Number(run.score) || 0;

      // A layered audit resets its own tier's clock as well as the zone's
      // overall condition, because the tiers run independently.
      const tierAudits = run.tier
        ? { ...(zone.tierAudits ?? {}), [String(run.tier)]: { lastAuditAt: auditedAt, lastAuditScore: score } }
        : zone.tierAudits;

      return {
        ...zone,
        ...(tierAudits ? { tierAudits } : {}),
        lastAuditScore: score,
        lastAuditAt: auditedAt,
        // The first score a zone receives becomes its baseline, so later
        // improvement is measurable rather than merely visible.
        baselineScore: zone.baselineScore ?? score,
        baselineAt: zone.baselineAt ?? auditedAt,
      };
    });

    if (!matched) {
      return;
    }

    layout.zones = zones;
    await this.fiveSLayouts.save(layout);
  }

  findAssessmentTemplates(user: CurrentUser) {
    return this.assessmentTemplates.find({
      where: this.scope.organizationWhere(user),
      order: { createdAt: 'DESC' },
    });
  }

  createAssessmentTemplate(payload: Partial<AssessmentTemplate>, user: CurrentUser) {
    const template = this.assessmentTemplates.create({
      ...payload,
      organizationId: this.scope.resolveOrganizationId(user, payload.organizationId),
      questions: payload.questions || [],
    });
    return this.assessmentTemplates.save(template);
  }

  async updateAssessmentTemplate(id: string, payload: Partial<AssessmentTemplate>, user: CurrentUser) {
    const template = await this.scope.findOneScoped(this.assessmentTemplates, id, user, 'Assessment template');
    this.scope.assignWithoutOrganizationChange(template, payload);
    return this.assessmentTemplates.save(template);
  }

  findAssessmentResponses(user: CurrentUser) {
    return this.assessmentResponses.find({
      where: this.scope.organizationWhere(user),
      order: { submittedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  createAssessmentResponse(payload: Partial<AssessmentResponse>, user: CurrentUser) {
    const response = this.assessmentResponses.create({
      ...payload,
      organizationId: this.scope.resolveOrganizationId(user, payload.organizationId),
      respondentId: payload.respondentId || user?.id,
      answers: payload.answers || [],
      submittedAt: payload.submittedAt || new Date(),
    });
    return this.assessmentResponses.save(response);
  }

  async updateAssessmentResponse(id: string, payload: Partial<AssessmentResponse>, user: CurrentUser) {
    const response = await this.scope.findOneScoped(this.assessmentResponses, id, user, 'Assessment response');
    this.scope.assignWithoutOrganizationChange(response, payload);
    return this.assessmentResponses.save(response);
  }

  findExpenses(user: CurrentUser) {
    return this.expenses.find({
      where: this.scope.organizationWhere(user),
      order: { expenseDate: 'DESC', createdAt: 'DESC' },
    });
  }

  createExpense(payload: Partial<ExpenseItem>, user: CurrentUser) {
    const expense = this.expenses.create({
      ...payload,
      /*
        Who submitted it is whoever is signed in. The web sent the words
        "Demo Owner" for everybody, and the monthly report finds a person's
        own expenses by this id - so nobody's were ever theirs.
      */
      submittedBy: user?.id ?? payload.submittedBy,
      organizationId: this.scope.resolveOrganizationId(user, payload.organizationId),
      expenseDate: payload.expenseDate || todayIn(),
    });
    return this.expenses.save(expense);
  }

  async updateExpense(id: string, payload: Partial<ExpenseItem>, user: CurrentUser) {
    const expense = await this.scope.findOneScoped(this.expenses, id, user, 'Expense');
    this.scope.assignWithoutOrganizationChange(expense, payload);
    return this.expenses.save(expense);
  }

  async dashboardSummary(user: CurrentUser) {
    const organization = this.scope.organizationWhere(user);
    const [projects, tasks, workLogs, timeEntries, auditRuns, assessmentResponses, expenses] = await Promise.all([
      this.projects.find({ where: organization }),
      this.tasks.find({ where: organization }),
      this.workLogs.find({ where: organization }),
      this.timeEntries.find({ where: organization }),
      this.auditRuns.find({ where: organization }),
      this.assessmentResponses.find({ where: organization }),
      this.expenses.find({ where: organization }),
    ]);

    const ownOnly = user?.role === 'user';
    const visibleTasks = tasks.filter((task) => !ownOnly || task.assigneeId === user?.id);
    const visibleWorkLogs = workLogs.filter((log) => !ownOnly || log.userId === user?.id);
    const visibleTimeEntries = timeEntries.filter((entry) => !ownOnly || entry.userId === user?.id);
    const visibleAuditRuns = auditRuns.filter((run) => !ownOnly || run.auditorId === user?.id);
    const visibleAssessments = assessmentResponses.filter(
      (response) => !ownOnly || response.respondentId === user?.id,
    );
    const visibleExpenses = expenses.filter((expense) => !ownOnly || expense.submittedBy === user?.id);
    const visibleProjects = projects.filter(
      (project) =>
        !ownOnly ||
        project.ownerId === user?.id ||
        visibleTasks.some((task) => task.projectId === project.id),
    );

    const completedTasks = visibleTasks.filter((task) => task.status === 'done').length;
    const totalHours = sumRecordedHours(visibleWorkLogs, visibleTimeEntries);
    // Counted from the tasks, the same way the projects page counts it. This
    // used to average `project.progress` — a figure somebody set with a slider
    // — and report it as measured progress.
    const averageProjectProgress = visibleProjects.length
      ? Math.round(
          visibleProjects.reduce((sum, project) => sum + projectProgressPercent(project, visibleTasks), 0) /
            visibleProjects.length,
        )
      : 0;
    const averageAuditScore = visibleAuditRuns.length
      ? Math.round(
          visibleAuditRuns.reduce((sum, run) => sum + Number(run.score || 0), 0) / visibleAuditRuns.length,
        )
      : 0;
    const averageAssessmentScore = visibleAssessments.length
      ? Math.round(
          visibleAssessments.reduce((sum, response) => sum + Number(response.score || 0), 0) /
            visibleAssessments.length,
        )
      : 0;
    const approvedExpenseTotal = visibleExpenses
      .filter((expense) => expense.status === 'approved')
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return {
      totals: {
        projects: visibleProjects.length,
        tasks: visibleTasks.length,
        completedTasks,
        workLogs: visibleWorkLogs.length,
        totalHours,
        auditRuns: visibleAuditRuns.length,
        assessmentResponses: visibleAssessments.length,
        approvedExpenseTotal,
      },
      kpis: {
        taskCompletionRate: visibleTasks.length ? Math.round((completedTasks / visibleTasks.length) * 100) : 0,
        averageProjectProgress,
        averageAuditScore,
        averageAssessmentScore,
      },
      recent: {
        projects: visibleProjects.slice(0, 5),
        tasks: visibleTasks.slice(0, 5),
        workLogs: visibleWorkLogs.slice(0, 5),
      },
    };
  }

  async monthlyReport(user: CurrentUser, month?: string) {
    const reportMonth = this.resolveReportMonth(month);
    const records = await this.monthRecords(user, reportMonth);

    // Employees can inspect their own monthly results. Managers and
    // administrators retain the team view for review and planning.
    return buildMonthlyReport(records, reportMonth, { id: user?.id, ownOnly: user?.role === 'user' });
  }

  /**
   * One month of the organization's records, for everybody in it.
   *
   * What a closed month stores, so it is always the whole team's: whose view
   * it is decides only how the records are read back.
   */
  async monthRecords(user: CurrentUser, month: string, timeZone?: string): Promise<MonthRecords> {
    return selectMonthRecords(await this.organizationRecords(user), month, timeZone);
  }

  /** Everything the monthly report counts, for the whole organization, read once. */
  async organizationRecords(user: CurrentUser): Promise<OrganizationRecords> {
    const organization = this.scope.organizationWhere(user);
    const [projects, tasks, workLogs, timeEntries, auditRuns, assessmentResponses, expenses, dailyGoals] = await Promise.all([
      this.projects.find({ where: organization }),
      this.tasks.find({ where: organization }),
      this.workLogs.find({ where: organization }),
      this.timeEntries.find({ where: organization }),
      this.auditRuns.find({ where: organization }),
      this.assessmentResponses.find({ where: organization }),
      this.expenses.find({ where: organization }),
      this.dailyGoals.find({ where: organization }),
    ]);

    // K6 needs who wrote a weekly check-in and who was expected to. A service
    // built without those repositories reports K6 as "no data", never as 0%.
    const [weeklyCheckins, members] = await Promise.all([
      this.weeklyCheckins?.find?.({ where: organization }),
      this.users?.find?.({
        where: organization,
        select: { id: true, role: true, isActive: true } as never,
      }),
    ]);

    return {
      projects,
      tasks,
      workLogs,
      timeEntries,
      auditRuns,
      assessmentResponses,
      expenses,
      dailyGoals,
      weeklyCheckins,
      members: members?.map((member) => ({ id: member.id, role: member.role, isActive: member.isActive })),
    };
  }

  /**
   * PDCA "Check": each audit-raised fix with what the next audit of its area
   * found. An employee sees the fixes given to them; a manager the team's.
   */
  /**
   * A manager's check that a finished, audit-raised fix was done properly.
   *
   * Not by whoever did it: the point of the check is a second pair of eyes.
   * The next audit of the area still decides whether it worked.
   */
  async signOffFix(id: string, user: CurrentUser, now = new Date()) {
    const task = await this.scope.findOneScoped(this.tasks, id, user, 'Task');
    if (task.sourceType !== TaskSource.AUDIT_RUN || task.status !== TaskStatus.DONE) {
      throw apiError(ErrorCode.FixNotDone);
    }
    if (task.assigneeId && task.assigneeId === user?.id) {
      throw apiError(ErrorCode.AccessDenied);
    }

    noteAuditBefore(task, ['fixSignedOffBy', 'fixSignedOffAt']);
    task.fixSignedOffBy = user?.id ?? null;
    task.fixSignedOffAt = now;
    return this.tasks.save(task);
  }

  async improvementVerification(user: CurrentUser) {
    const organization = this.scope.organizationWhere(user);
    const [tasks, runs] = await Promise.all([
      this.tasks.find({ where: { ...organization, sourceType: TaskSource.AUDIT_RUN } }),
      this.auditRuns.find({ where: organization }),
    ]);
    const mine = user?.role === 'user' ? tasks.filter((task) => task.assigneeId === user.id) : tasks;
    return verifyImprovements(mine, runs);
  }

  resolveReportMonth(month?: string) {
    // This month on the organization's calendar, not the server's UTC one.
    return month && /^\d{4}-\d{2}$/.test(month) ? month : dayIn(organizationTimeZone(), new Date()).slice(0, 7);
  }

}
