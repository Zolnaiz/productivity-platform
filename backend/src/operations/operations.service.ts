import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
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
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { projectProgressPercent, summarisePeople } from './monthly-people';
import { NotificationsService } from './notifications.service';

type CurrentUser = {
  id?: string;
  organizationId?: string;
};

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
    private readonly notifications: NotificationsService,
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

  async createTask(payload: Partial<WorkTask>, user: CurrentUser) {
    const organizationId = this.resolveOrganizationId(user, payload.organizationId);
    const existing = await this.findOpenTaskForSource(payload, organizationId);

    // A finding raises one task, not one per press of the button. Deduping
    // here rather than in the browser means the mobile app gets it too.
    if (existing) {
      return existing;
    }

    const task = this.tasks.create({
      ...payload,
      organizationId,
      reporterId: payload.reporterId || user?.id,
    });

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
        body: task.dueDate ? `Due ${task.dueDate}` : '',
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
    const task = await this.findOneScoped(this.tasks, id, user, 'Task');
    this.assignWithoutOrganizationChange(task, payload);

    const saved = await this.tasks.save(task);
    await this.closeFindingForCompletedTask(saved, user);

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
    const layout = await this.layoutHolding(user, (candidate) =>
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

  findDailyGoals(user: CurrentUser, date?: string) {
    return this.dailyGoals.find({
      where: {
        ...this.personalWhere(user),
        ...(date ? { date } : {}),
      },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  createDailyGoal(payload: Partial<DailyGoal>, user: CurrentUser) {
    const goal = this.dailyGoals.create({
      ...payload,
      organizationId: this.resolveOrganizationId(user, payload.organizationId),
      userId: user?.id || payload.userId,
      date: payload.date || new Date().toISOString().slice(0, 10),
      completed: payload.completed ?? false,
    });
    return this.dailyGoals.save(goal);
  }

  async updateDailyGoal(id: string, payload: Partial<DailyGoal>, user: CurrentUser) {
    const goal = await this.findOnePersonalScoped(this.dailyGoals, id, user, 'Daily goal');
    this.assignWithoutPersonalScopeChange(goal, payload);
    return this.dailyGoals.save(goal);
  }

  /**
   * The organization's plan that satisfies a test, or null.
   *
   * Reading them all and looking is deliberate: an organization has a handful
   * of floors, not thousands, and a query into JSON would tie the shape of a
   * zone to the shape of a database index.
   */
  private async layoutHolding(user: CurrentUser, holds: (layout: FiveSLayout) => boolean) {
    const layouts = await this.fiveSLayouts.find({ where: this.organizationWhere(user) });

    return layouts.find(holds) ?? null;
  }

  /**
   * Every plan the organization has, in the order somebody would read them.
   *
   * By site, then floor, then name: a plant is walked building by building and
   * floor by floor, and a list in that order is one somebody can find their
   * way down.
   */
  async findFiveSLayouts(user: CurrentUser) {
    const layouts = await this.fiveSLayouts.find({ where: this.organizationWhere(user) });

    if (layouts.length) {
      return layouts.sort(
        (a, b) =>
          (a.site || '').localeCompare(b.site || '') ||
          (a.floor || '').localeCompare(b.floor || '') ||
          (a.name || '').localeCompare(b.name || ''),
      );
    }

    // An organization with no plan gets one rather than an empty list, for
    // the same reason a new workspace gets an empty plan rather than nothing:
    // there has to be something to draw on.
    return [await this.findFiveSLayout(user)];
  }

  /**
   * Raises a red tag on one zone.
   *
   * A narrow door into the plan rather than a plan update: everything the
   * caller can say is the title and what they think should happen to the
   * item, and everything else — the id, the status, the date, the count — is
   * the server's. That is what makes it safe to give to whoever is standing
   * in front of the clutter, which is the only way red-tagging works.
   */
  async addRedTag(
    planId: string,
    zoneId: string,
    payload: { title: string; disposition?: string },
    user: CurrentUser,
  ) {
    const organizationId = this.resolveOrganizationId(user);
    const layout = await this.fiveSLayouts.findOne({
      where: { id: planId, ...(organizationId ? { organizationId } : {}) },
    });

    if (!layout) {
      throw apiError(ErrorCode.ResourceNotFound, 'five-s-layout');
    }

    const zone = (layout.zones ?? []).find((candidate) => candidate.id === zoneId);

    if (!zone) {
      throw apiError(ErrorCode.ResourceNotFound, 'zone');
    }

    const redTag = {
      id: `redtag-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      title: payload.title.trim(),
      disposition: payload.disposition?.trim() ?? '',
      status: 'open',
      // Whoever raised it, so the tag can be asked about later. Names are not
      // copied: a person's name changes and the account is where it lives.
      ownerId: user?.id,
      createdAt: new Date().toISOString(),
    };

    const redTags = [...((zone.redTags as Record<string, unknown>[]) ?? []), redTag];

    layout.zones = (layout.zones ?? []).map((candidate) =>
      candidate.id === zoneId
        ? {
            ...candidate,
            redTags,
            // Kept in step here rather than left to the browser: a count that
            // disagrees with the list is the kind of wrong number this
            // application has been full of.
            redTagCount: redTags.filter(
              (tag) => !(tag as { closedAt?: string }).closedAt &&
                ['open', 'review'].includes(String((tag as { status?: string }).status)),
            ).length,
          }
        : candidate,
    );

    await this.fiveSLayouts.save(layout);

    return redTag;
  }

  async createFiveSLayout(payload: Partial<FiveSLayout>, user: CurrentUser) {
    const organizationId = this.resolveOrganizationId(user, payload.organizationId);

    return this.fiveSLayouts.save(
      this.fiveSLayouts.create({
        name: payload.name || '5S area map',
        site: payload.site || 'Workspace',
        floor: payload.floor || '',
        backgroundImage: '',
        backgroundOpacity: 0.55,
        showGrid: true,
        snapToGrid: true,
        showDimensions: false,
        zones: [],
        objects: [],
        corners: [],
        walls: [],
        openings: [],
        roomLabels: [],
        organizationId,
      }),
    );
  }

  /**
   * Removes a plan.
   *
   * Scoped by organization in the delete itself rather than by reading the row
   * and checking, so an identifier from another organization removes nothing
   * instead of being caught by a check somebody has to remember to write.
   */
  async deleteFiveSLayout(id: string, user: CurrentUser) {
    const organizationId = this.resolveOrganizationId(user);
    const result = await this.fiveSLayouts.delete({ id, ...(organizationId ? { organizationId } : {}) });

    return { id, deleted: Boolean(result.affected) };
  }

  async findFiveSLayout(user: CurrentUser, id?: string) {
    const organizationId = this.resolveOrganizationId(user);
    const where = organizationId ? { organizationId } : {};
    // An id names one plan; without one this is still "the organization's
    // plan", which is what every caller written before there were several
    // means by it.
    const layout = await this.fiveSLayouts.findOne({ where: id ? { ...where, id } : where });

    if (layout) {
      return layout;
    }

    const defaultLayout = this.fiveSLayouts.create({
      organizationId,
      name: '5S area map',
      site: 'Workspace',
      scale: '1 square = 1 meter',
      backgroundImage: '',
      backgroundOpacity: 0.55,
      showGrid: true,
      zones: [],
      objects: [],
      corners: [],
      walls: [],
      openings: [],
      roomLabels: [],
    });

    return this.fiveSLayouts.save(defaultLayout);
  }

  async upsertFiveSLayout(payload: Partial<FiveSLayout>, user: CurrentUser, id?: string) {
    const organizationId = this.resolveOrganizationId(user, payload.organizationId);
    const where = organizationId ? { organizationId } : {};
    const existing = await this.fiveSLayouts.findOne({ where: id ? { ...where, id } : where });
    const layoutPayload = {
      name: payload.name || '5S area map',
      site: payload.site || 'Workspace',
      floor: payload.floor ?? existing?.floor ?? '',
      scale: payload.scale || '1 square = 1 meter',
      backgroundImage: payload.backgroundImage || '',
      backgroundOpacity: payload.backgroundOpacity ?? 0.55,
      showGrid: payload.showGrid ?? true,
      snapToGrid: payload.snapToGrid ?? true,
      showDimensions: payload.showDimensions ?? false,
      zones: payload.zones || [],
      objects: payload.objects || [],
      // The wall graph. Left out of the payload until now, so a plan drawn
      // against a real backend was whole until the page was reloaded.
      corners: payload.corners || [],
      walls: payload.walls || [],
      openings: payload.openings || [],
      roomLabels: payload.roomLabels || [],
      metresPerUnit: payload.metresPerUnit ?? existing?.metresPerUnit,
    };

    if (existing) {
      Object.assign(existing, layoutPayload);
      return this.fiveSLayouts.save(existing);
    }

    return this.fiveSLayouts.save(
      this.fiveSLayouts.create({
        ...layoutPayload,
        organizationId,
      }),
    );
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

  /**
   * Audit history, newest first.
   *
   * `zoneId` narrows it to one place on the floor plan, which is what the map
   * asks for when somebody opens a zone: how has this area been scoring, and
   * against what baseline.
   */
  findAuditRuns(user: CurrentUser, zoneId?: string) {
    const where = this.organizationWhere(user);

    return this.auditRuns.find({
      where: zoneId ? { ...where, zoneId } : where,
      order: { createdAt: 'DESC' },
    });
  }

  async createAuditRun(payload: Partial<AuditRun>, user: CurrentUser) {
    const run = this.auditRuns.create({
      ...payload,
      organizationId: this.resolveOrganizationId(user, payload.organizationId),
      auditorId: payload.auditorId || user?.id,
      answers: payload.answers || [],
    });

    const saved = await this.auditRuns.save(run);
    await this.applyAuditScoreToZone(saved, user);

    return saved;
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
    const layout = await this.layoutHolding(user, (candidate) =>
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
    // Counted from the tasks, the same way the projects page counts it. This
    // used to average `project.progress` — a figure somebody set with a slider
    // — and report it as the organization's progress for the month.
    const averageProjectProgress = projects.length
      ? Math.round(
          projects.reduce((sum, project) => sum + projectProgressPercent(project, tasks), 0) /
            projects.length,
        )
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
    const [projects, tasks, workLogs, timeEntries, auditRuns, assessmentResponses, expenses, dailyGoals] = await Promise.all([
      this.projects.find({ where: organization }),
      this.tasks.find({ where: organization }),
      this.workLogs.find({ where: organization }),
      this.timeEntries.find({ where: organization }),
      this.auditRuns.find({ where: organization }),
      this.assessmentResponses.find({ where: organization }),
      this.expenses.find({ where: organization }),
      this.dailyGoals.find({ where: this.personalWhere(user) }),
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
    const monthlyDailyGoals = dailyGoals.filter((goal) => this.isInMonth(goal.date || goal.createdAt, reportMonth));

    const completedTasks = monthlyTasks.filter((task) => task.status === 'done');
    const completedDailyGoals = monthlyDailyGoals.filter((goal) => goal.completed);
    const totalHours = monthlyTimeEntries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
    const completionRate = monthlyTasks.length ? Math.round((completedTasks.length / monthlyTasks.length) * 100) : 0;
    const dailyGoalCompletionRate = monthlyDailyGoals.length
      ? Math.round((completedDailyGoals.length / monthlyDailyGoals.length) * 100)
      : 0;
    // Counted from the tasks, the same rule the projects page and the
    // dashboard use: `project.progress` is a figure somebody set with a slider.
    const averageProjectProgress = projects.length
      ? Math.round(
          projects.reduce((sum, project) => sum + projectProgressPercent(project, tasks), 0) /
            projects.length,
        )
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

    /*
      What each person did, which is the conversation a manager actually has.
      The totals above are for a board paper; nobody can act on them.

      Daily goals are deliberately absent: they are personal notes, scoped to
      the person who wrote them, and turning them into a number somebody else
      reads would change what they are for.
    */
    const people = summarisePeople({
      tasks: monthlyTasks,
      workLogs: monthlyWorkLogs,
      timeEntries: monthlyTimeEntries,
      auditRuns: monthlyAuditRuns,
      assessmentResponses: monthlyAssessmentResponses,
    });

    return {
      period: reportMonth,
      people,
      totals: {
        projects: projects.length,
        tasks: monthlyTasks.length,
        completedTasks: completedTasks.length,
        workLogs: monthlyWorkLogs.length,
        totalHours,
        auditRuns: monthlyAuditRuns.length,
        assessmentResponses: monthlyAssessmentResponses.length,
        expenses: monthlyExpenses.length,
        dailyGoals: monthlyDailyGoals.length,
        completedDailyGoals: completedDailyGoals.length,
        approvedExpenseTotal,
        pendingExpenseTotal,
      },
      kpis: {
        completionRate,
        dailyGoalCompletionRate,
        averageProjectProgress,
        averageAssessmentScore,
      },
      completedTasks,
      workLogs: monthlyWorkLogs,
      timeEntries: monthlyTimeEntries,
      projects,
      dailyGoals: monthlyDailyGoals,
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

  private personalWhere(user: CurrentUser) {
    return {
      ...this.organizationWhere(user),
      ...(user?.id ? { userId: user.id } : {}),
    };
  }

  private resolveOrganizationId(user?: CurrentUser, payloadOrganizationId?: string) {
    const allowPublicOperations = this.configService.get('ALLOW_PUBLIC_OPERATIONS') === true;

    if (user?.organizationId) {
      return user.organizationId;
    }

    if (!allowPublicOperations) {
      throw apiError(ErrorCode.AuthOrganizationRequired);
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
      throw apiError(ErrorCode.ResourceNotFound, label);
    }

    return entity;
  }

  private async findOnePersonalScoped<T extends { id: string; organizationId?: string; userId?: string }>(
    repository: Repository<T>,
    id: string,
    user: CurrentUser,
    label: string,
  ) {
    const entity = await repository.findOne({
      where: {
        id,
        ...this.personalWhere(user),
      } as any,
    });

    if (!entity) {
      throw apiError(ErrorCode.ResourceNotFound, label);
    }

    return entity;
  }

  private assignWithoutOrganizationChange<T extends { organizationId?: string }>(entity: T, payload: Partial<T>) {
    const safePayload = { ...payload };
    delete safePayload.organizationId;
    Object.assign(entity, safePayload);
  }

  private assignWithoutPersonalScopeChange<T extends { organizationId?: string; userId?: string }>(
    entity: T,
    payload: Partial<T>,
  ) {
    const safePayload = { ...payload };
    delete safePayload.organizationId;
    delete safePayload.userId;
    Object.assign(entity, safePayload);
  }
}
