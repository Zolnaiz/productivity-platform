import { del, get, isDemoMode, localId, patch, post, shouldUseDemoFallback } from './api';
import { planHoldingZone, readDemoPlans, replaceDemoPlan, writeDemoPlans } from './demoPlanStore';
import {
  AuditTemplate,
  AuditRun,
  OperationsMonthlyReport,
  OperationsSummary,
  Project,
  TimeEntry,
  WorkLog,
  WorkTask,
} from '../types/operations.types';
import { DailyGoal } from '../types/productivity.types';
import { summarisePeople } from '../components/reports/monthlyPeople';

type ApiEnvelope<T> = T | { data: T; success?: boolean };
type DemoKey = 'projects' | 'tasks' | 'workLogs' | 'timeEntries' | 'auditTemplates' | 'auditRuns' | 'goals';

const unwrap = <T>(response: ApiEnvelope<T>): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }

  return response as T;
};

const demoProjects: Project[] = [
  {
    id: 'p1',
    organizationId: 'demo-org',
    ownerId: 'u1',
    name: 'Operations productivity rollout',
    description: 'Task, time, work log, and monthly reporting MVP.',
    status: 'active',
    priority: 'high',
    progress: 62,
    dueDate: '2026-07-15',
    budget: 25000000,
  },
  {
    id: 'p2',
    organizationId: 'demo-org',
    ownerId: 'u1',
    name: '5S audit implementation',
    description: 'Manufacturing checklist templates and audit scoring.',
    status: 'planned',
    priority: 'medium',
    progress: 25,
    dueDate: '2026-08-01',
  },
];

const demoTasks: WorkTask[] = [
  {
    id: 't1',
    organizationId: 'demo-org',
    title: 'Build project and task APIs',
    projectId: 'p1',
    assigneeId: 'u1',
    reporterId: 'u1',
    status: 'done',
    priority: 'high',
    dueDate: '2026-06-14',
    estimatedHours: 8,
    actualHours: 7,
  },
  {
    id: 't2',
    organizationId: 'demo-org',
    title: 'Connect work log dashboard',
    projectId: 'p1',
    assigneeId: 'u3',
    reporterId: 'u1',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-06-18',
    estimatedHours: 6,
    actualHours: 3,
  },
  {
    id: 't3',
    organizationId: 'demo-org',
    title: 'Prepare 5S template library',
    projectId: 'p2',
    assigneeId: 'u2',
    reporterId: 'u1',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-06-25',
    estimatedHours: 5,
    actualHours: 0,
  },
];

const demoWorkLogs: WorkLog[] = [
  {
    id: 'w1',
    organizationId: 'demo-org',
    userId: 'u1',
    logDate: '2026-06-12',
    projectId: 'p1',
    taskId: 't1',
    summary: 'Backend operations module and frontend shell were connected.',
    nextSteps: 'Add real report generation and monthly summary exports.',
    hours: 6.5,
  },
  {
    id: 'w2',
    organizationId: 'demo-org',
    userId: 'u3',
    logDate: '2026-06-11',
    projectId: 'p1',
    summary: 'Product blueprint and route structure were finalized.',
    blockers: 'Old scaffold pages had incomplete TypeScript types.',
    hours: 4,
  },
];

const demoTimeEntries: TimeEntry[] = [
  {
    id: 'te1',
    organizationId: 'demo-org',
    userId: 'u1',
    workDate: '2026-06-12',
    projectId: 'p1',
    taskId: 't1',
    hours: 6.5,
    note: 'API and shell work',
  },
  {
    id: 'te2',
    organizationId: 'demo-org',
    userId: 'u3',
    workDate: '2026-06-11',
    projectId: 'p1',
    hours: 4,
    note: 'Planning and cleanup',
  },
];

const demoDailyGoals: DailyGoal[] = [
  { id: 'g1', organizationId: 'demo-org', userId: 'u1', title: 'Finish operations MVP shell', date: '2026-06-23', completed: true },
  { id: 'g2', organizationId: 'demo-org', userId: 'u1', title: 'Add daily productivity tools', date: '2026-06-23', completed: false },
  { id: 'g3', organizationId: 'demo-org', userId: 'u1', title: 'Review carry-over work', date: '2026-06-20', completed: false },
];

const demoAuditTemplates: AuditTemplate[] = [
  {
    id: 'a1',
    organizationId: 'demo-org',
    title: '5S Workplace Audit',
    description: 'Sort, Set in order, Shine, Standardize, Sustain audit template.',
    category: '5s',
    industry: 'Manufacturing',
    isActive: true,
    questions: [
      { id: 'q1', text: 'Unnecessary items are removed from the workplace.', type: 'score', maxScore: 5 },
      { id: 'q2', text: 'Tools and materials are clearly labeled.', type: 'score', maxScore: 5 },
      { id: 'q3', text: 'Cleaning responsibilities are visible.', type: 'score', maxScore: 5 },
    ],
  },
  {
    id: 'a2',
    organizationId: 'demo-org',
    title: 'Fire Safety Inspection',
    description: 'Emergency exits, extinguisher access, and safety signage.',
    category: 'safety',
    industry: 'Facility management',
    isActive: true,
    questions: [
      { id: 'q1', text: 'Emergency exits are clear.', type: 'yes_no' },
      { id: 'q2', text: 'Fire extinguishers are inspected.', type: 'yes_no' },
    ],
  },
  {
    id: 'a3',
    title: 'Construction Site Safety',
    description: 'PPE, edge protection, housekeeping, permits, and hazard control checklist.',
    category: 'safety',
    industry: 'Construction',
    isActive: true,
    questions: [
      { id: 'q1', text: 'Workers are using required PPE.', type: 'yes_no' },
      { id: 'q2', text: 'Open edges and elevated work areas are protected.', type: 'score', maxScore: 5 },
      { id: 'q3', text: 'Tools, cables, and materials do not create trip hazards.', type: 'score', maxScore: 5 },
      { id: 'q4', text: 'High-risk work permits are visible where required.', type: 'yes_no' },
    ],
  },
  {
    id: 'a4',
    title: 'Restaurant Food Safety',
    description: 'Temperature control, hygiene, cleaning schedule, and storage compliance.',
    category: 'compliance',
    industry: 'Hospitality',
    isActive: true,
    questions: [
      { id: 'q1', text: 'Cold and hot holding temperatures are within required limits.', type: 'score', maxScore: 5 },
      { id: 'q2', text: 'Handwashing and sanitation supplies are available.', type: 'yes_no' },
      { id: 'q3', text: 'Food is labeled and stored by expiry date.', type: 'score', maxScore: 5 },
      { id: 'q4', text: 'Cleaning schedule is completed for the current shift.', type: 'yes_no' },
    ],
  },
  {
    id: 'a5',
    title: 'Vehicle Inspection',
    description: 'Pre-trip vehicle checklist for logistics and transport operations.',
    category: 'safety',
    industry: 'Logistics',
    isActive: true,
    questions: [
      { id: 'q1', text: 'Brakes, lights, horn, and mirrors are working.', type: 'yes_no' },
      { id: 'q2', text: 'Tires and fluid levels are acceptable.', type: 'score', maxScore: 5 },
      { id: 'q3', text: 'Vehicle documents and emergency kit are present.', type: 'yes_no' },
    ],
  },
  {
    id: 'a6',
    title: 'Forklift Inspection',
    description: 'Daily forklift inspection for warehouse and logistics teams.',
    category: 'safety',
    industry: 'Logistics',
    isActive: true,
    questions: [
      { id: 'q1', text: 'Forks, mast, chains, and hydraulics show no visible damage.', type: 'score', maxScore: 5 },
      { id: 'q2', text: 'Warning lights, alarm, horn, and seatbelt work.', type: 'yes_no' },
      { id: 'q3', text: 'Battery or fuel condition is safe for operation.', type: 'score', maxScore: 5 },
    ],
  },
  {
    id: 'a7',
    title: 'Retail Store Opening Checklist',
    description: 'Store readiness, safety, merchandising, and customer experience checklist.',
    category: 'quality',
    industry: 'Retail',
    isActive: true,
    questions: [
      { id: 'q1', text: 'Entrance, aisles, and checkout areas are clean and clear.', type: 'score', maxScore: 5 },
      { id: 'q2', text: 'Promotions and price labels are accurate.', type: 'yes_no' },
      { id: 'q3', text: 'Critical stock gaps are logged for replenishment.', type: 'score', maxScore: 5 },
    ],
  },
  {
    id: 'a8',
    title: 'Facility Energy Audit',
    description: 'Energy saving opportunities for lighting, HVAC, equipment, and behavior.',
    category: 'operational_excellence',
    industry: 'Facility management',
    isActive: true,
    questions: [
      { id: 'q1', text: 'Lights and equipment are turned off in unused areas.', type: 'score', maxScore: 5 },
      { id: 'q2', text: 'HVAC temperature settings are within standard range.', type: 'score', maxScore: 5 },
      { id: 'q3', text: 'Energy leaks or abnormal consumption points are documented.', type: 'text' },
    ],
  },
  {
    id: 'a9',
    title: 'QMS Process Audit',
    description: 'Quality management process audit for documentation and corrective actions.',
    category: 'quality',
    industry: 'Manufacturing',
    isActive: true,
    questions: [
      { id: 'q1', text: 'Current SOPs are available at the point of work.', type: 'yes_no' },
      { id: 'q2', text: 'Nonconformities have owner, due date, and action status.', type: 'score', maxScore: 5 },
      { id: 'q3', text: 'Records are complete and traceable.', type: 'score', maxScore: 5 },
    ],
  },
  {
    id: 'a10',
    title: 'Kaizen Improvement Walk',
    description: 'Operational excellence checklist for waste, flow, standard work, and improvement ideas.',
    category: 'operational_excellence',
    industry: 'Manufacturing',
    isActive: true,
    questions: [
      { id: 'q1', text: 'Visible waste or waiting time is identified.', type: 'text' },
      { id: 'q2', text: 'Standard work is followed and visible.', type: 'score', maxScore: 5 },
      { id: 'q3', text: 'Improvement idea has owner and next experiment.', type: 'yes_no' },
    ],
  },
  {
    id: 'a11',
    title: 'Risk and Compliance Review',
    description: 'General compliance review for operational risks, controls, and evidence.',
    category: 'risk',
    industry: 'General',
    isActive: true,
    questions: [
      { id: 'q1', text: 'Top operational risks have assigned controls.', type: 'score', maxScore: 5 },
      { id: 'q2', text: 'Evidence for required checks is available.', type: 'yes_no' },
      { id: 'q3', text: 'Open compliance gaps are tracked as tasks.', type: 'yes_no' },
    ],
  },
];

const demoAuditRuns: AuditRun[] = [
  {
    id: 'ar1',
    templateId: 'a1',
    // The quality manager walks the floor; without an auditor the run belongs
    // to nobody and nobody's month shows the audit they carried out.
    auditorId: 'u2',
    location: 'Main production floor',
    status: 'submitted',
    score: 82,
    createdAt: '2026-06-12T09:00:00.000Z',
    answers: [
      { questionId: 'q1', value: 4 },
      { questionId: 'q2', value: 4 },
      { questionId: 'q3', value: 4 },
    ],
  },
];

const defaults = {
  projects: demoProjects,
  tasks: demoTasks,
  workLogs: demoWorkLogs,
  timeEntries: demoTimeEntries,
  goals: demoDailyGoals,
  auditTemplates: demoAuditTemplates,
  auditRuns: demoAuditRuns,
};

const storageKey = (key: DemoKey) => `productivity-demo-${key}`;

const withDemoScope = <T extends Record<string, any>>(key: DemoKey, item: T): T => {
  const scoped: Record<string, any> = {
    organizationId: 'demo-org',
    ...item,
  };

  if ((key === 'workLogs' || key === 'timeEntries') && !scoped.userId) {
    scoped.userId = 'u1';
  }

  if (key === 'goals' && !scoped.userId) {
    scoped.userId = 'u1';
  }

  if (key === 'tasks') {
    if (!scoped.assigneeId) scoped.assigneeId = 'u1';
    if (!scoped.reporterId) scoped.reporterId = 'u1';
  }

  if (key === 'auditRuns' && !scoped.auditorId) {
    scoped.auditorId = 'u1';
  }

  return scoped as T;
};

const readDemo = <T>(key: DemoKey): T[] => {
  const stored = localStorage.getItem(storageKey(key));
  if (stored) {
    let parsed: T[];
    try {
      parsed = (JSON.parse(stored) as T[]).map((item) => withDemoScope(key, item as Record<string, any>) as T);
    } catch {
      localStorage.removeItem(storageKey(key));
      parsed = [];
    }
    const initial = (defaults[key] as T[]).map((item) => withDemoScope(key, item as Record<string, any>) as T);
    const merged = [
      ...parsed,
      ...initial.filter(
        (defaultItem: any) => !parsed.some((storedItem: any) => storedItem.id === defaultItem.id),
      ),
    ];
    if (merged.length !== parsed.length) {
      localStorage.setItem(storageKey(key), JSON.stringify(merged));
    }
    return merged;
  }

  const initial = (defaults[key] as T[]).map((item) => withDemoScope(key, item as Record<string, any>) as T);
  localStorage.setItem(storageKey(key), JSON.stringify(initial));
  return initial;
};

const writeDemo = <T>(key: DemoKey, items: T[]) => {
  localStorage.setItem(storageKey(key), JSON.stringify(items));
  return items;
};

const createDemo = <T extends { id: string }>(key: DemoKey, data: Partial<T>) => {
  const items = readDemo<T>(key);
  // The server stamps createdAt; the demo store has to as well, or anything
  // that shows when a record was made renders a dash.
  const item = {
    createdAt: new Date().toISOString(),
    ...data,
    id: data.id || localId(),
  } as unknown as T;
  writeDemo(key, [item, ...items]);
  return item;
};

/** Mirrors `OperationsService.findOpenTaskForSource`. */
const findOpenDemoTaskForSource = (data: Partial<WorkTask>) => {
  if (!data.sourceType || !data.sourceId) return undefined;

  return readDemo<WorkTask>('tasks').find(
    (task) =>
      task.sourceType === data.sourceType && task.sourceId === data.sourceId && task.status !== 'done',
  );
};


/**
 * Demo mirrors of rules the server enforces.
 *
 * The demo workspace never reaches the API, so any rule a page depends on has
 * to exist here too. Leaving one out does not fail loudly — the screen simply
 * does less than the product does, and the demo is what most people see first.
 *
 * Each mirror below names the server method it stands in for.
 */
/**
 * The demo plan holding a zone.
 *
 * Not the first plan stored: an audit recorded against an area upstairs must
 * not repaint the ground floor. The server learned that when a building first
 * got a second plan, and the demo kept the old behaviour because it held only
 * one — which is no longer true.
 */
const readDemoPlan = (zoneId?: string): Record<string, any> | null => {
  const plans = readDemoPlans<Record<string, any>>() ?? [];

  return (zoneId ? planHoldingZone(plans, zoneId) : plans[0]) ?? null;
};

const writeDemoPlan = (plan: Record<string, any>) => {
  const plans = readDemoPlans<Record<string, any>>() ?? [];

  writeDemoPlans(replaceDemoPlan(plans, plan));
};

/** Mirrors `OperationsService.applyAuditScoreToZone`. */
/** The same marks the server keeps; see `operations.service.ts` there. */
const DEMO_PASSING_SCORE = 85;
const DEMO_URGENT_SCORE = 70;

const applyDemoAuditScoreToZone = (run: Partial<AuditRun> | undefined) => {
  if (!run?.zoneId || run.status === 'draft') return;

  const plan = readDemoPlan(run.zoneId);
  if (!plan?.zones) return;

  const auditedAt = new Date().toISOString();
  let matched = false;

  plan.zones = plan.zones.map((zone: Record<string, any>) => {
    if (zone.id !== run.zoneId) return zone;

    matched = true;
    const score = Number(run.score) || 0;

    // A layered audit resets its own layer's clock as well as the zone's
    // overall condition, because the layers run independently.
    const tierAudits = run.tier
      ? { ...(zone.tierAudits ?? {}), [String(run.tier)]: { lastAuditAt: auditedAt, lastAuditScore: score } }
      : zone.tierAudits;

    return {
      ...zone,
      ...(tierAudits ? { tierAudits } : {}),
      lastAuditScore: score,
      lastAuditAt: auditedAt,
      baselineScore: zone.baselineScore ?? score,
      baselineAt: zone.baselineAt ?? auditedAt,
    };
  });

  if (matched) writeDemoPlan(plan);
};

/**
 * Mirrors `OperationsService.correctiveWorkFor`.
 *
 * The demo workspace has no server, so the half of the 5S loop that lives on
 * the server has to live here too — otherwise the one place a new customer
 * looks first is the one place a failing audit leads to nothing.
 */
const raiseDemoFollowUp = (run: Partial<AuditRun> | undefined) => {
  const score = Number(run?.score) || 0;

  if (!run?.id || run.status === 'draft' || score >= DEMO_PASSING_SCORE) {
    return null;
  }

  // One task per finding, the same rule the server's dedupe enforces.
  const existing = readDemo<WorkTask>('tasks').find(
    (task) => task.sourceType === 'audit_run' && task.sourceId === run.id && task.status !== 'done',
  );

  if (existing) {
    return existing;
  }

  const zone = (readDemoPlan(run.zoneId)?.zones ?? []).find(
    (item: Record<string, any>) => item.id === run.zoneId,
  );
  const place = zone
    ? [zone.code, zone.name].filter(Boolean).join(' - ')
    : run.location || 'the audited area';

  return createDemo<WorkTask>('tasks', {
    title: `5S follow-up: ${place}`,
    description: `The audit scored ${score}%. The standard for this area is ${DEMO_PASSING_SCORE}%.`,
    assigneeId: zone?.ownerId,
    sourceType: 'audit_run',
    sourceId: run.id,
    status: 'todo',
    priority: score < DEMO_URGENT_SCORE ? 'high' : 'medium',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    estimatedHours: 2,
    actualHours: 0,
  } as Partial<WorkTask>);
};

/** Mirrors `OperationsService.closeFindingForCompletedTask`. */
const closeDemoFindingForTask = (task: Partial<WorkTask> | undefined) => {
  if (task?.status !== 'done' || task.sourceType !== 'five_s_red_tag' || !task.sourceId) {
    return;
  }

  /*
    The plan carrying this red tag, across every floor — the tag's id is all
    the finished task knows, and with more than one plan the first one is
    simply the wrong place to look.
  */
  const plan = (readDemoPlans<Record<string, any>>() ?? []).find((candidate) =>
    (candidate.zones ?? []).some((zone: Record<string, any>) =>
      (zone.redTags ?? []).some((redTag: Record<string, any>) => redTag.id === task.sourceId),
    ),
  );

  if (!plan?.zones) return;

  const closedAt = new Date().toISOString();
  let matched = false;

  plan.zones = plan.zones.map((zone: Record<string, any>) => {
    if (!Array.isArray(zone.redTags)) return zone;

    let changed = false;
    const redTags = zone.redTags.map((redTag: Record<string, any>) => {
      if (redTag.id !== task.sourceId || redTag.closedAt) return redTag;

      changed = true;
      matched = true;
      // Only `closedAt`. Disposed or returned is a decision somebody makes.
      return { ...redTag, closedAt };
    });

    return changed ? { ...zone, redTags } : zone;
  });

  if (matched) writeDemoPlan(plan);
};

const updateDemo = <T extends { id: string }>(key: DemoKey, id: string, data: Partial<T>) => {
  const items = readDemo<T>(key);
  const updated = items.map((item) => (item.id === id ? { ...item, ...data } : item));
  writeDemo(key, updated);
  return updated.find((item) => item.id === id) as T;
};

const deleteDemo = <T extends { id: string }>(key: DemoKey, id: string) => {
  const items = readDemo<T>(key);
  writeDemo(
    key,
    items.filter((item) => item.id !== id),
  );
  return { id, deleted: true };
};

const withoutClientScopedFields = <T extends { id?: string; organizationId?: string }>(data: Partial<T>) => {
  const payload = { ...data };
  delete payload.id;
  delete payload.organizationId;
  return payload;
};

const fallback = async <T>(request: () => Promise<ApiEnvelope<T>>, demoData: T): Promise<T> => {
  if (isDemoMode()) {
    return demoData;
  }

  try {
    return unwrap(await request());
  } catch {
    if (!shouldUseDemoFallback()) {
      throw new Error('Backend request failed and demo fallback is disabled in production.');
    }
    return demoData;
  }
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

const inMonth = (value: string | undefined, month: string) => Boolean(value && value.slice(0, 7) === month);

const buildSummary = (): OperationsSummary => {
  const projects = readDemo<Project>('projects');
  const tasks = readDemo<WorkTask>('tasks');
  const workLogs = readDemo<WorkLog>('workLogs');
  const timeEntries = readDemo<TimeEntry>('timeEntries');
  const auditRuns = readDemo<AuditRun>('auditRuns');
  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
  // Counted from the tasks, the same rule the projects page and the server
  // use. `project.progress` is a figure somebody set with a slider.
  const averageProjectProgress = projects.length
    ? Math.round(
        projects.reduce((sum, project) => {
          const mine = tasks.filter((task) => task.projectId === project.id);
          if (!mine.length) return sum + Number(project.progress || 0);

          return sum + Math.round((mine.filter((task) => task.status === 'done').length / mine.length) * 100);
        }, 0) / projects.length,
      )
    : 0;

  const averageAuditScore = auditRuns.length
    ? Math.round(auditRuns.reduce((sum, run) => sum + Number(run.score || 0), 0) / auditRuns.length)
    : 0;

  return {
    totals: {
      projects: projects.length,
      tasks: tasks.length,
      completedTasks,
      workLogs: workLogs.length,
      totalHours,
      auditRuns: auditRuns.length,
    },
    kpis: {
      taskCompletionRate: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
      averageProjectProgress,
      averageAuditScore,
    },
    recent: {
      projects: projects.slice(0, 5),
      tasks: tasks.slice(0, 5),
      workLogs: workLogs.slice(0, 5),
      auditRuns: auditRuns.slice(0, 5),
    },
  };
};

const buildMonthlyReport = (month = currentMonth()): OperationsMonthlyReport => {
  const projects = readDemo<Project>('projects');
  const tasks = readDemo<WorkTask>('tasks');
  const workLogs = readDemo<WorkLog>('workLogs').filter((log) => inMonth(log.logDate, month));
  const timeEntries = readDemo<TimeEntry>('timeEntries').filter((entry) => inMonth(entry.workDate, month));
  const dailyGoals = readDemo<DailyGoal>('goals').filter((goal) => inMonth(goal.date, month));
  const auditRuns = readDemo<AuditRun>('auditRuns').filter((run) => inMonth(run.createdAt, month));
  const completedTasks = tasks.filter((task) => task.status === 'done' && inMonth(task.dueDate, month));
  const monthlyTasks = tasks.filter((task) => inMonth(task.dueDate, month));
  const completedDailyGoals = dailyGoals.filter((goal) => goal.completed);
  const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
  const averageProjectProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + Number(project.progress || 0), 0) / projects.length)
    : 0;

  return {
    period: month,
    // The demo builds its report in the browser, so it groups the records by
    // person here rather than being handed the answer by the server.
    people: summarisePeople({ tasks: monthlyTasks, workLogs, timeEntries, auditRuns }),
    totals: {
      projects: projects.length,
      tasks: monthlyTasks.length,
      completedTasks: completedTasks.length,
      workLogs: workLogs.length,
      totalHours,
      auditRuns: auditRuns.length,
      assessmentResponses: 0,
      expenses: 0,
      dailyGoals: dailyGoals.length,
      completedDailyGoals: completedDailyGoals.length,
      approvedExpenseTotal: 0,
      pendingExpenseTotal: 0,
    },
    kpis: {
      completionRate: monthlyTasks.length ? Math.round((completedTasks.length / monthlyTasks.length) * 100) : 0,
      dailyGoalCompletionRate: dailyGoals.length ? Math.round((completedDailyGoals.length / dailyGoals.length) * 100) : 0,
      averageProjectProgress,
      averageAssessmentScore: 0,
    },
    completedTasks,
    workLogs,
    timeEntries,
    projects,
    dailyGoals,
    assessmentResponses: [],
    expenses: [],
  };
};

export const operationsService = {
  getSummary: () => fallback<OperationsSummary>(() => get('/operations/summary'), buildSummary()),
  getMonthlyReport: (month?: string) =>
    fallback<OperationsMonthlyReport>(
      () => get('/operations/monthly-report', month ? { month } : undefined),
      buildMonthlyReport(month),
    ),
  getProjects: () => fallback<Project[]>(() => get('/projects'), readDemo<Project>('projects')),
  createProject: (data: Partial<Project>) =>
    isDemoMode()
      ? Promise.resolve(createDemo<Project>('projects', data))
      : post<Project>('/projects', withoutClientScopedFields(data)),
  updateProject: (id: string, data: Partial<Project>) =>
    isDemoMode()
      ? Promise.resolve(updateDemo<Project>('projects', id, data))
      : patch<Project>(`/projects/${id}`, withoutClientScopedFields(data)),
  deleteProject: (id: string) =>
    isDemoMode() ? Promise.resolve(deleteDemo<Project>('projects', id)) : del<{ id: string; deleted: boolean }>(`/projects/${id}`),
  getTasks: () => fallback<WorkTask[]>(() => get('/tasks'), readDemo<WorkTask>('tasks')),
  createTask: (data: Partial<WorkTask>) =>
    isDemoMode()
      ? Promise.resolve(findOpenDemoTaskForSource(data) ?? createDemo<WorkTask>('tasks', data))
      : post<WorkTask>('/tasks', withoutClientScopedFields(data)),
  updateTask: (id: string, data: Partial<WorkTask>) => {
    if (!isDemoMode()) {
      return patch<WorkTask>(`/tasks/${id}`, withoutClientScopedFields(data));
    }

    const updated = updateDemo<WorkTask>('tasks', id, data);
    closeDemoFindingForTask(updated);

    return Promise.resolve(updated);
  },
  getWorkLogs: () => fallback<WorkLog[]>(() => get('/work-logs'), readDemo<WorkLog>('workLogs')),
  createWorkLog: (data: Partial<WorkLog>) =>
    isDemoMode()
      ? Promise.resolve(createDemo<WorkLog>('workLogs', data))
      : post<WorkLog>('/work-logs', withoutClientScopedFields(data)),
  getTimeEntries: () => fallback<TimeEntry[]>(() => get('/time-entries'), readDemo<TimeEntry>('timeEntries')),
  createTimeEntry: (data: Partial<TimeEntry>) =>
    isDemoMode()
      ? Promise.resolve(createDemo<TimeEntry>('timeEntries', data))
      : post<TimeEntry>('/time-entries', withoutClientScopedFields(data)),
  getAuditTemplates: () =>
    fallback<AuditTemplate[]>(() => get('/audit-templates'), readDemo<AuditTemplate>('auditTemplates')),
  createAuditTemplate: (data: Partial<AuditTemplate>) =>
    isDemoMode()
      ? Promise.resolve(createDemo<AuditTemplate>('auditTemplates', data))
      : post<AuditTemplate>('/audit-templates', withoutClientScopedFields(data)),
  getAuditRuns: (zoneId?: string) =>
    fallback<AuditRun[]>(
      () => get('/audit-runs', zoneId ? { zoneId } : undefined),
      readDemo<AuditRun>('auditRuns').filter((run) => !zoneId || run.zoneId === zoneId),
    ),
  createAuditRun: (data: Partial<AuditRun>) => {
    if (!isDemoMode()) {
      return post<AuditRun>('/audit-runs', withoutClientScopedFields(data));
    }

    const run = createDemo<AuditRun>('auditRuns', data);
    applyDemoAuditScoreToZone(run);
    raiseDemoFollowUp(run);

    return Promise.resolve(run);
  },
  /**
   * Chases a failing run that raised no work, or raised it long ago.
   *
   * The wording of the task is the server's, not this screen's, so work raised
   * by hand and work raised by recording a run read the same in the list.
   */
  raiseAuditFollowUp: (runId: string) => {
    if (!isDemoMode()) {
      return post<WorkTask | null>(`/audit-runs/${runId}/follow-up`, {});
    }

    return Promise.resolve(
      raiseDemoFollowUp(readDemo<AuditRun>('auditRuns').find((run) => run.id === runId)),
    );
  },
  getCalendarEvents: async () => {
    const [projects, tasks, auditRuns] = await Promise.all([
      operationsService.getProjects(),
      operationsService.getTasks(),
      operationsService.getAuditRuns(),
    ]);

    return [
      ...projects
        .filter((project) => project.dueDate)
        .map((project) => ({
          id: `project-${project.id}`,
          date: project.dueDate as string,
          type: 'project',
          title: project.name,
          description: `${project.progress}% complete`,
          path: '/projects',
        })),
      ...tasks
        .filter((task) => task.dueDate)
        .map((task) => ({
          id: `task-${task.id}`,
          date: task.dueDate as string,
          type: 'task',
          title: task.title,
          description: task.status,
          path: '/tasks',
        })),
      ...auditRuns.map((run) => ({
        id: `audit-${run.id}`,
        date: new Date().toISOString().slice(0, 10),
        type: 'audit',
        title: run.location || 'Audit run',
        description: `${run.score}% score`,
        path: '/fives',
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));
  },
};
