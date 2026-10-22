/**
 * Measured, not estimated: p50/p95 latency of six key endpoints on a seeded
 * organization (50 users, 10,000 records), and the run time of the scoring
 * and K1/K3 algorithms on 10,000 records.
 *
 *   DB_DATABASE=pp_bench npm run bench
 *
 * Needs a PostgreSQL it may write to (a throwaway database: it seeds one).
 * Writes docs/benchmark-results.json, which `npm run results` puts into
 * docs/RESULTS.md together with the machine it ran on.
 */
import { writeFileSync } from 'node:fs';
import { cpus, totalmem, release, type } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { DataSource } from 'typeorm';

process.env.DB_DATABASE ??= 'pp_bench';

const USERS = 50;
const TASKS = 4000;
const LOGS = 4000;
const AUDITS = 2000;
const SAMPLES = Number(process.env.BENCH_SAMPLES ?? 200);
const WARMUP = 20;

const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
const summarise = (times: number[]) => {
  const sorted = [...times].sort((a, b) => a - b);
  const round = (value: number) => Math.round(value * 100) / 100;
  return {
    samples: times.length,
    p50: round(percentile(sorted, 50)),
    p95: round(percentile(sorted, 95)),
    mean: round(times.reduce((sum, value) => sum + value, 0) / times.length),
    max: round(sorted[sorted.length - 1]),
  };
};

const loadWebModule = (relative: string) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ts = require('typescript');
  const { readFileSync } = require('node:fs');
  const Module = require('node:module');
  const file = join(__dirname, relative);
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf-8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const compiled = new Module(file);
  compiled.paths = Module._nodeModulePaths(__dirname);
  compiled._compile(outputText, file);
  return compiled.exports;
};

const dayOffset = (days: number) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

const main = async () => {
  const { bootApp, useCaseEnv } = await import('../test/use-cases/app');
  useCaseEnv();
  // Mail is logged, schedulers are off: the measurement is the request, not a cron job.
  const app = await bootApp();
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  const base = `http://127.0.0.1:${address.port}/api`;

  const call = async (method: string, path: string, token?: string, body?: unknown) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    const json = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(`${method} ${path} -> ${response.status} ${text.slice(0, 200)}`);
    return json?.data ?? json;
  };

  // --- seed: one organization, an owner, a manager and 48 employees -------
  const stamp = Date.now();
  const password = 'Password123';
  const seedStarted = performance.now();
  const owner = await call('POST', '/auth/register', undefined, {
    firstName: 'Bench', lastName: 'Owner', email: `owner.${stamp}@bench.test`, password, organizationName: `Bench ${stamp}`,
  });
  const ownerToken = owner.access_token;
  const organizationId = owner.user.organizationId;
  const people: Array<{ id: string; email: string; token: string; role: string }> = [];
  for (let i = 0; i < USERS - 1; i += 1) {
    const role = i === 0 ? 'manager' : 'user';
    const email = `${role}${i}.${stamp}@bench.test`;
    const { token } = await call('POST', '/auth/invitations', ownerToken, { email, role });
    await call('POST', `/auth/invitations/token/${token}/accept`, undefined, { firstName: `P${i}`, lastName: 'Bench', password });
    const login = await call('POST', '/auth/login', undefined, { email, password });
    people.push({ id: login.user.id, email, token: login.access_token, role });
  }
  const manager = people[0];
  const employees = people.slice(1);

  const plan = await call('POST', '/five-s-layouts', ownerToken, { name: 'Bench floor', site: 'Bench' });
  const zones = Array.from({ length: 20 }, (_, i) => ({
    id: `bench-zone-${i}`, code: `A${String(i + 1).padStart(2, '0')}`, name: `Area ${i + 1}`, color: '#38bdf8',
    x: 40 + (i % 4) * 210, y: 40 + Math.floor(i / 4) * 140, width: 190, height: 118,
    contents: '', standard: '', labelText: '', stage: 'sort', auditFrequency: 'weekly',
  }));
  await call('PATCH', `/five-s-layouts/${plan.id}`, ownerToken, {
    name: plan.name, site: plan.site, floor: '', scale: plan.scale, zones, objects: [], corners: [], walls: [], openings: [], roomLabels: [],
  });
  const template = await call('POST', '/audit-templates', ownerToken, {
    title: 'Bench 5S', category: '5s',
    questions: Array.from({ length: 10 }, (_, i) => ({ id: `q${i + 1}`, text: `Q${i + 1}`, type: 'score', maxScore: 5 })),
  });

  // 10,000 records written straight to the tables: the API under test is the read path.
  const dataSource = app.get(DataSource);
  const { WorkTask } = await import('../src/operations/entities/task.entity');
  const { WorkLog } = await import('../src/operations/entities/work-log.entity');
  const { AuditRun } = await import('../src/operations/entities/audit-run.entity');
  const insert = async (entity: new () => object, rows: Record<string, unknown>[]) => {
    for (let i = 0; i < rows.length; i += 500) {
      await dataSource.createQueryBuilder().insert().into(entity).values(rows.slice(i, i + 500) as never).execute();
    }
  };
  const statuses = ['todo', 'in_progress', 'review', 'done', 'done', 'done'];
  await insert(WorkTask, Array.from({ length: TASKS }, (_, i) => {
    const status = statuses[i % statuses.length];
    const due = dayOffset((i % 90) - 10);
    return {
      organizationId, title: `Bench task ${i}`, assigneeId: employees[i % employees.length].id,
      status, priority: 'medium', dueDate: due,
      completedAt: status === 'done' ? new Date(`${due}T06:00:00Z`) : null,
      sourceType: i % 10 === 0 ? 'audit_run' : null,
    };
  }));
  await insert(WorkLog, Array.from({ length: LOGS }, (_, i) => ({
    organizationId, userId: employees[i % employees.length].id, logDate: dayOffset(i % 90),
    summary: `Bench log ${i}`, hours: 1 + (i % 8),
  })));
  await insert(AuditRun, Array.from({ length: AUDITS }, (_, i) => ({
    organizationId, templateId: template.id, auditorId: employees[i % employees.length].id,
    zoneId: zones[i % zones.length].id, status: 'submitted', score: 50 + (i % 50),
    answers: [], createdAt: new Date(`${dayOffset(i % 90)}T05:00:00Z`),
  })));
  const seedSeconds = Math.round((performance.now() - seedStarted) / 100) / 10;

  // --- measure ------------------------------------------------------------
  const employee = employees[0];
  const month = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ulaanbaatar' }).format(new Date()).slice(0, 7);
  const toCsv = (report: any) =>
    [...report.completedTasks.map((t: any) => [t.title, t.status, t.dueDate]), ...report.workLogs.map((l: any) => [l.summary, l.hours, l.logDate])]
      .map((row: unknown[]) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

  const endpoints: Array<{ name: string; run: () => Promise<unknown> }> = [
    { name: 'POST /auth/login', run: () => call('POST', '/auth/login', undefined, { email: employee.email, password }) },
    { name: 'GET /tasks (manager, whole organization)', run: () => call('GET', '/tasks', manager.token) },
    { name: 'POST /work-logs/daily', run: () => call('POST', '/work-logs/daily', employee.token, { summary: 'Bench entry', hours: 1, logDate: dayOffset(0) }) },
    {
      name: 'POST /audit-runs (submit)',
      run: () => call('POST', '/audit-runs', employee.token, {
        templateId: template.id, zoneId: zones[0].id, status: 'submitted', score: 80,
        answers: Array.from({ length: 10 }, (_, i) => ({ questionId: `q${i + 1}`, value: 4 })),
      }),
    },
    { name: 'GET /operations/monthly-report (manager, K1–K6)', run: () => call('GET', `/operations/monthly-report?month=${month}`, manager.token) },
    { name: 'Report CSV (report fetch + CSV serialisation)', run: async () => toCsv(await call('GET', `/operations/monthly-report?month=${month}`, manager.token)) },
  ];

  const results = [];
  for (const endpoint of endpoints) {
    for (let i = 0; i < WARMUP; i += 1) await endpoint.run();
    const times: number[] = [];
    for (let i = 0; i < SAMPLES; i += 1) {
      const start = performance.now();
      await endpoint.run();
      times.push(performance.now() - start);
    }
    results.push({ endpoint: endpoint.name, ...summarise(times) });
    console.log(endpoint.name, results[results.length - 1]);
  }

  // --- algorithms on 10,000 records, in process -----------------------------
  const { monthlyMeasurements } = await import('../src/operations/monthly-measurements');
  // The web's own scoring function, the one both clients call. Its package is an
  // ES module, so it is compiled here to CommonJS rather than required.
  const { scoreAnswers } = loadWebModule('../../admin-web/src/components/fives/auditAnswers.ts');
  const records = {
    completedTasks: Array.from({ length: 5000 }, (_, i) => ({
      completedAt: `${month}-${String((i % 28) + 1).padStart(2, '0')}T06:00:00Z`, dueDate: `${month}-${String(((i + 3) % 28) + 1).padStart(2, '0')}`,
    })),
    auditRuns: Array.from({ length: 5000 }, (_, i) => ({ zoneId: `z${i % 20}`, status: 'submitted', score: 40 + (i % 60) })),
    workLogs: [],
  };
  const algorithmTimes = (fn: () => unknown) => {
    for (let i = 0; i < 5; i += 1) fn();
    const times: number[] = [];
    for (let i = 0; i < 50; i += 1) {
      const start = performance.now();
      fn();
      times.push(performance.now() - start);
    }
    return summarise(times);
  };
  const templateForScore = { questions: Array.from({ length: 10 }, (_, i) => ({ id: `q${i + 1}`, text: '', type: 'score' as const, maxScore: 5 })) };
  const answerSets = Array.from({ length: 10000 }, (_, i) =>
    Object.fromEntries(templateForScore.questions.map((q, j) => [q.id, String((i + j) % 6)])),
  );
  const algorithms = [
    { name: 'K1 + K3 (monthlyMeasurements), 10,000 records', ...algorithmTimes(() => monthlyMeasurements(records as never, month, 'Asia/Ulaanbaatar')) },
    { name: 'Audit score (scoreAnswers), 10,000 audits × 10 questions', ...algorithmTimes(() => answerSets.forEach((answers) => scoreAnswers(templateForScore as never, answers))) },
  ];

  const output = {
    measuredAt: new Date().toISOString(),
    machine: {
      cpu: cpus()[0]?.model ?? 'unknown',
      cores: cpus().length,
      memoryGb: Math.round(totalmem() / 1024 ** 3),
      os: `${type()} ${release()}`,
      node: process.version,
      database: 'PostgreSQL (local, same machine)',
    },
    dataset: { users: USERS, tasks: TASKS, workLogs: LOGS, auditRuns: AUDITS, totalRecords: TASKS + LOGS + AUDITS, zones: zones.length, seedSeconds },
    method: `${WARMUP} warm-up requests, then ${SAMPLES} sequential requests per endpoint over HTTP on 127.0.0.1 (keep-alive fetch); client and server on one machine.`,
    nfr06ThresholdMs: 2000,
    endpoints: results,
    algorithms,
  };
  writeFileSync(join(__dirname, '../../docs/benchmark-results.json'), `${JSON.stringify(output, null, 2)}\n`);
  console.log('wrote docs/benchmark-results.json');
  await app.close();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
