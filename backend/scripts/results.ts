/**
 * docs/RESULTS.md, from real test output - never by hand.
 *
 *   npm run results
 *
 * Runs each suite with a machine-readable reporter, reads what it reported,
 * and writes the tables: suite totals, one row per use case (UC-01 … UC-22),
 * the benchmark (docs/benchmark-results.json, written by `npm run bench`), and
 * the ISO/IEC 25010 summary. A suite that cannot run here (no PostgreSQL for
 * the use cases, no Flutter SDK, no browser) is reported as not run, with the
 * reason - not as passed.
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = join(__dirname, '../..');
const backend = join(root, 'backend');
const web = join(root, 'admin-web');
const mobile = join(root, 'mobile-flutter');
const scratch = mkdtempSync(join(tmpdir(), 'results-'));

interface Case {
  name: string;
  file: string;
  status: 'passed' | 'failed' | 'skipped';
}
interface Suite {
  label: string;
  command: string;
  ran: boolean;
  reason?: string;
  passed: number;
  failed: number;
  skipped: number;
  cases: Case[];
}

const run = (command: string, cwd: string, env: Record<string, string> = {}) => {
  const result = spawnSync('bash', ['-lc', command], { cwd, env: { ...process.env, ...env }, encoding: 'utf-8', maxBuffer: 256 * 1024 * 1024 });
  return { code: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
};

const jestSuite = (label: string, command: string, cwd: string, env: Record<string, string> = {}): Suite => {
  const out = join(scratch, `${label.replace(/\W+/g, '-')}.json`);
  run(`${command} --json --outputFile=${out}`, cwd, env);
  if (!existsSync(out)) return { label, command, ran: false, reason: 'the suite did not start', passed: 0, failed: 0, skipped: 0, cases: [] };
  const report = JSON.parse(readFileSync(out, 'utf-8'));
  const cases: Case[] = report.testResults.flatMap((file: any) =>
    file.assertionResults.map((test: any) => ({
      name: [...test.ancestorTitles, test.title].join(' › '),
      file: file.name.replace(`${root}/`, ''),
      status: test.status === 'passed' ? 'passed' : test.status === 'failed' ? 'failed' : 'skipped',
    })),
  );
  const failedToRun = report.testResults.filter((file: any) => file.status === 'failed' && !file.assertionResults.length);
  return {
    label,
    command,
    ran: true,
    reason: failedToRun.length ? failedToRun.map((file: any) => file.message?.split('\n')[0]).join('; ') : undefined,
    passed: report.numPassedTests,
    failed: report.numFailedTests + failedToRun.length,
    skipped: report.numPendingTests,
    cases,
  };
};

const vitestSuite = (): Suite => {
  const out = join(scratch, 'vitest.json');
  run(`npx vitest run --reporter=json --outputFile=${out}`, web);
  if (!existsSync(out)) return { label: 'Web (vitest)', command: 'npx vitest run', ran: false, reason: 'did not start', passed: 0, failed: 0, skipped: 0, cases: [] };
  const report = JSON.parse(readFileSync(out, 'utf-8'));
  return {
    label: 'Web (vitest)',
    command: 'cd admin-web && npx vitest run',
    ran: true,
    passed: report.numPassedTests,
    failed: report.numFailedTests,
    skipped: report.numPendingTests + (report.numTodoTests ?? 0),
    cases: [],
  };
};

const flutterSuite = (): Suite => {
  const flutter = process.env.FLUTTER_BIN || 'flutter';
  const label = 'Mobile (flutter test)';
  if (run(`command -v ${flutter}`, mobile).code !== 0) {
    return { label, command: 'flutter test', ran: false, reason: 'Flutter SDK not installed here (set FLUTTER_BIN)', passed: 0, failed: 0, skipped: 0, cases: [] };
  }
  const { stdout } = run(`${flutter} test --machine`, mobile);
  const names = new Map<number, { name: string; file: string }>();
  const suites = new Map<number, string>();
  const cases: Case[] = [];
  for (const line of stdout.split('\n')) {
    if (!line.startsWith('{')) continue;
    let event: any;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (event.type === 'suite') suites.set(event.suite.id, String(event.suite.path ?? '').replace(`${root}/`, ''));
    if (event.type === 'testStart' && !event.test.name.startsWith('loading ')) {
      names.set(event.test.id, { name: event.test.name, file: suites.get(event.test.suiteID) ?? '' });
    }
    if (event.type === 'testDone' && names.has(event.testID) && !event.hidden) {
      const { name, file } = names.get(event.testID)!;
      cases.push({ name, file, status: event.skipped ? 'skipped' : event.result === 'success' ? 'passed' : 'failed' });
    }
  }
  return {
    label,
    command: 'cd mobile-flutter && flutter test',
    ran: true,
    passed: cases.filter((c) => c.status === 'passed').length,
    failed: cases.filter((c) => c.status === 'failed').length,
    skipped: cases.filter((c) => c.status === 'skipped').length,
    cases,
  };
};

const lintStatus = (cwd: string, command: string) => (run(command, cwd).code === 0 ? 'clean' : 'errors');

// --- run -----------------------------------------------------------------
const unit = jestSuite('Backend unit + HTTP (jest)', 'npx jest', backend);
const useCases = jestSuite('Use-case acceptance (jest + supertest + PostgreSQL)', 'npx jest --config ./test/jest-uc.json --runInBand', backend);
if (useCases.ran && useCases.passed + useCases.failed === 0) {
  useCases.ran = false;
  useCases.reason = useCases.reason ?? 'no PostgreSQL reachable (DB_HOST/DB_DATABASE)';
}
const webSuite = vitestSuite();
const mobileSuite = flutterSuite();
const e2eFile = process.env.E2E_JSON;
const e2e: Suite = (() => {
  const label = `Browser e2e (Playwright${process.env.E2E_LIVE ? ', demo + live API' : ''})`;
  if (!e2eFile || !existsSync(e2eFile)) {
    return { label, command: 'cd admin-web && npx playwright test', ran: false, reason: 'not run by this script (needs a browser); pass E2E_JSON=<playwright json report>', passed: 0, failed: 0, skipped: 0, cases: [] };
  }
  const stats = JSON.parse(readFileSync(e2eFile, 'utf-8')).stats;
  return { label, command: 'cd admin-web && npx playwright test', ran: true, passed: stats.expected, failed: stats.unexpected, skipped: stats.skipped, cases: [] };
})();
const lint = { backend: lintStatus(backend, 'npm run lint:check'), web: lintStatus(web, 'npm run lint:check') };
const suites = [unit, useCases, webSuite, mobileSuite, e2e];

const commit = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
})();

// --- use cases --------------------------------------------------------------
// An array, not an object: keys like '10' would be ordered before '01'.
const UC_NAMES: Array<[string, string]> = Object.entries({
  '01': 'Оноосон ажлаа гүйцэтгэх', '02': 'Өдрийн ажлын бүртгэл хөтлөх', '03': 'Долоо хоногийн тайлан бичих',
  '04': 'Сарын тайлангаа өөрийн бүртгэлээс бэлтгэх', '05': 'Улаан шошгоор дутагдал бүртгэх', '06': 'Сайжруулалтын санаа гаргах',
  '07': 'Хувийн бүртгэлээ удирдах', '08': '5S аудит хийх', '09': 'Төсөл үүсгэж, ажил оноож хянах', '10': 'Сарын төлөвлөгөө гаргах',
  '11': 'Өглөөний хурал хөтлөх', '12': 'Gemba явалт хийх', '13': 'Санааг хянаж шийдвэрлэх', '14': 'Багийн бүтээмжийг дүгнэх',
  '15': 'Хагас жил, жилийн тайлан гаргах', '16': 'Сарын тайланг хааж батлах', '17': 'Хэрэглэгч урьж, эрх олгох',
  '18': 'Хэлтэс, байгууллагын тохиргоо хийх', '19': '5S талбай, стандарт тохируулах', '20': 'Аудитын шалгах хуудас боловсруулах',
  '21': 'Үйл ажиллагааны түүх шалгах', '22': 'Сануулга илгээх, аудит товлох',
}).sort(([a], [b]) => a.localeCompare(b));
const ucRows = UC_NAMES.map(([number, name]) => {
  const cases = useCases.cases.filter((c) => c.name.startsWith(`UC-${number} `));
  const status = !useCases.ran
    ? 'ажиллуулаагүй'
    : !cases.length
      ? 'тест алга'
      : cases.every((c) => c.status === 'passed')
        ? 'pass'
        : 'FAIL';
  return { number, name, cases, status, file: cases[0]?.file ?? 'backend/test/use-cases/use-cases.uc-spec.ts' };
});
const ucPassed = ucRows.filter((row) => row.status === 'pass').length;

// --- benchmark ------------------------------------------------------------
const benchPath = join(root, 'docs/benchmark-results.json');
const beforePath = join(root, 'docs/benchmark-results.before-cache.json');
const bench = existsSync(benchPath) ? JSON.parse(readFileSync(benchPath, 'utf-8')) : null;
const before = existsSync(beforePath) ? JSON.parse(readFileSync(beforePath, 'utf-8')) : null;

// --- authorization, from the refused flows of the use cases -------------------
const refusals = useCases.cases.filter((c) => /› refused:/.test(c.name));
const outbox = mobileSuite.cases.filter((c) => c.file.endsWith('outbox_test.dart'));
const resetAbuse = unit.cases.filter((c) => c.file.endsWith('password-reset.http.spec.ts'));

// --- write ------------------------------------------------------------------
const cell = (value: unknown) => String(value).replace(/\|/g, '\\|');
const lines: string[] = [];
const push = (...more: string[]) => lines.push(...more);

push(
  '# Тестийн болон хэмжилтийн үр дүн',
  '',
  `> \`npm run results\` (backend)-ээр автоматаар үүсгэв. Гараар бүү засаарай. Commit \`${commit}\`, ${new Date().toISOString()}.`,
  '',
  '## 1. Suite бүрийн нийлбэр',
  '',
  '| Suite | Команд | Passed | Failed | Skipped | Тайлбар |',
  '|---|---|---:|---:|---:|---|',
  ...suites.map((s) =>
    s.ran
      ? `| ${s.label} | \`${s.command}\` | ${s.passed} | ${s.failed} | ${s.skipped} | ${s.reason ? cell(s.reason) : ''} |`
      : `| ${s.label} | \`${s.command}\` | – | – | – | Ажиллуулаагүй: ${cell(s.reason)} |`,
  ),
  '',
  `Нийт ажилласан тест: **${suites.filter((s) => s.ran).reduce((sum, s) => sum + s.passed, 0)} passed**, **${suites.filter((s) => s.ran).reduce((sum, s) => sum + s.failed, 0)} failed**.`,
  '',
  `Lint: backend — ${lint.backend}, web — ${lint.web}.`,
  '',
  '## 2. Use case-ийн хүлээн авах тест (UC → тест → үр дүн)',
  '',
  'Тест бүр жинхэнэ аппликейшныг (бүх модуль, guard, validation) PostgreSQL дээр HTTP API-гаар шалгана: үндсэн урсгал ба нэг өөр/татгалзсан урсгал.',
  '',
  '| UC | Нэр | Тест файл | Тест | Үр дүн |',
  '|---|---|---|---|---|',
  ...ucRows.map((row) =>
    `| UC-${row.number} | ${row.name} | \`${row.file}\` | ${row.cases.map((c) => `${c.status === 'passed' ? '✓' : c.status === 'failed' ? '✗' : '–'} ${cell(c.name.split(' › ').slice(1).join(' › '))}`).join('<br>') || '—'} | ${row.status} |`,
  ),
  '',
  `**${ucPassed} / 22** use case бүх тестээ давсан.`,
  '',
);

push('## 3. Гүйцэтгэлийн хэмжилт (benchmark)', '');
if (!bench) {
  push('`docs/benchmark-results.json` алга. `DB_DATABASE=pp_bench npm run bench`-ийг ажиллуулна уу.', '');
} else {
  push(
    `Хэмжсэн: ${bench.measuredAt}. Машин: ${bench.machine.cpu}, ${bench.machine.cores} цөм, ${bench.machine.memoryGb} GB RAM, ${bench.machine.os}, Node ${bench.machine.node}, ${bench.machine.database}.`,
    '',
    `Өгөгдөл: ${bench.dataset.users} хэрэглэгч, ${bench.dataset.totalRecords} бүртгэл (ажил ${bench.dataset.tasks}, ажлын бүртгэл ${bench.dataset.workLogs}, аудит ${bench.dataset.auditRuns}), ${bench.dataset.zones} талбай.`,
    '',
    `Арга: ${bench.method}`,
    '',
    '| Endpoint | n | p50 (мс) | p95 (мс) | дундаж | max | NFR-06 (< 2000 мс) |',
    '|---|---:|---:|---:|---:|---:|---|',
    ...bench.endpoints.map((e: any) => `| ${cell(e.endpoint)} | ${e.samples} | ${e.p50} | ${e.p95} | ${e.mean} | ${e.max} | ${e.p95 < bench.nfr06ThresholdMs ? 'хангасан (p95)' : 'ХАНГААГҮЙ'}${e.max >= bench.nfr06ThresholdMs ? ', max давсан' : ''} |`),
    '',
    '### Алгоритмын гүйцэтгэх хугацаа (процесс дотор, 50 давталт)',
    '',
    '| Алгоритм | p50 (мс) | p95 (мс) | max |',
    '|---|---:|---:|---:|',
    ...bench.algorithms.map((a: any) => `| ${cell(a.name)} | ${a.p50} | ${a.p95} | ${a.max} |`),
    '',
  );
  if (before) {
    const pair = (list: any[], name: string) => list.find((e: any) => (e.endpoint ?? e.name) === name);
    push(
      '### Засварын өмнө ба дараа',
      '',
      'Эхний хэмжилтээр `dayIn()` дуудлага бүрт шинэ `Intl.DateTimeFormat` үүсгэж байсан нь сарын тайлангийн ихэнх хугацааг эзэлж байв (p95 ≈ 1.75 с, max > 2 с — NFR-06-д ойр/давсан). Formatter-ийг цагийн бүсээр кэшилсний дараа ижил өгөгдөл дээр дахин хэмжив.',
      '',
      '| Хэмжилт | p95 өмнө (мс) | p95 дараа (мс) | max өмнө | max дараа |',
      '|---|---:|---:|---:|---:|',
      ...[...bench.endpoints, ...bench.algorithms]
        .map((after: any) => {
          const name = after.endpoint ?? after.name;
          const old = pair([...before.endpoints, ...before.algorithms], name);
          return old ? `| ${cell(name)} | ${old.p95} | ${after.p95} | ${old.max} | ${after.max} |` : '';
        })
        .filter(Boolean),
      '',
    );
  }
}

push(
  '### Офлайн outbox-ийн дахин илгээлт (Flutter)',
  '',
  mobileSuite.ran
    ? `\`mobile-flutter/test/outbox_test.dart\`: ${outbox.filter((c) => c.status === 'passed').length}/${outbox.length} passed.`
    : `Ажиллуулаагүй: ${mobileSuite.reason}.`,
  '',
  ...outbox.map((c) => `- ${c.status === 'passed' ? '✓' : '✗'} ${c.name}`),
  '',
);

const measured = (value: string) => value;
push(
  '## 4. ISO/IEC 25010 — тестийн хураангуй',
  '',
  '| Шинж чанар | Юугаар шалгасан | Үр дүн |',
  '|---|---|---|',
  `| Үйл ажиллагааны тохирох байдал | 22 UC-ийн хүлээн авах тест; K1–K6-ийн хүснэгтэн unit тест | ${useCases.ran ? `${ucPassed}/22 UC pass` : 'UC ажиллуулаагүй'} |`,
  `| Гүйцэтгэлийн үр ашиг | 6 endpoint-ийн p50/p95, 10k бүртгэл дээрх алгоритм | ${bench ? `хамгийн удаан p95 = ${Math.max(...bench.endpoints.map((e: any) => e.p95))} мс (NFR-06 босго 2000 мс)` : 'хэмжээгүй'} |`,
  `| Аюулгүй байдал | Эрхийн матриц (доор); нууц үг сэргээлтийн халдлагын тохиолдол | ${refusals.filter((c) => c.status === 'passed').length}/${refusals.length} татгалзах тест pass; сэргээлт: ${resetAbuse.filter((c) => c.status === 'passed').length}/${resetAbuse.length} pass |`,
  '| Ашиглахад хялбар байдал | SUS асуулга бодит хэрэглэгч шаарддаг | Хэмжээгүй (не измерено) — пилот дээр SUS авах шаардлагатай; хүртээмжийн автомат шалгалт (axe, Flutter accessibility) suite-д багтсан |',
  `| Найдвартай байдал | Офлайн outbox, дахин илгээлт | ${mobileSuite.ran ? `${outbox.filter((c) => c.status === 'passed').length}/${outbox.length} pass` : 'ажиллуулаагүй'}; бодит сүлжээний тасалдлын туршилт хэмжээгүй |`,
  `| Засвар үйлчилгээ | Тестийн тоо, lint | ${suites.filter((s) => s.ran).reduce((sum, s) => sum + s.passed, 0)} тест; lint backend ${lint.backend}, web ${lint.web} |`,
  `| Нийцтэй байдал | Web (Chromium e2e), Android/iOS Flutter client, нэг API | ${e2e.ran ? `e2e ${e2e.passed} passed, ${e2e.failed} failed` : 'e2e энэ ажиллагаанд ороогүй'}; бусад хөтөч, бодит төхөөрөмж дээр хэмжээгүй |`,
  '',
  '### Эрхийн матриц (UC тестийн татгалзсан урсгалаас)',
  '',
  '| Тест | Үр дүн |',
  '|---|---|',
  ...refusals.map((c) => `| ${cell(c.name)} | ${c.status === 'passed' ? 'refused as expected' : c.status} |`),
  '',
  '### Нууц үг сэргээлтийн халдлагын тохиолдол',
  '',
  ...resetAbuse.map((c) => `- ${c.status === 'passed' ? '✓' : '✗'} ${c.name.split(' › ').slice(1).join(' › ')}`),
  '',
);

writeFileSync(join(root, 'docs/RESULTS.md'), `${lines.map(measured).join('\n')}\n`);
console.log(`docs/RESULTS.md: ${suites.map((s) => `${s.label}: ${s.ran ? `${s.passed}/${s.passed + s.failed}` : 'not run'}`).join('; ')}; UC ${ucPassed}/22`);
if (suites.some((s) => s.ran && s.failed > 0)) process.exitCode = 1;
