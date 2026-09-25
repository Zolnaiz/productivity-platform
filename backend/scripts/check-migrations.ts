import { PGlite } from '@electric-sql/pglite';
import { liveTables, mappedColumns, migrationFiles } from '../src/migrations/entity-columns';

/**
 * Applies every migration to a real PostgreSQL and checks what is left.
 *
 * `schema-coverage.spec.ts` asks whether a migration *mentions* each mapped
 * column. That catches a column nobody wrote a migration for, which is the
 * mistake actually made twice here — but it is text matching. It cannot tell a
 * working `CREATE TABLE` from one with a syntax error, a column added to the
 * wrong table, or a migration that fails because the one before it left the
 * schema somewhere unexpected. Until now nothing checked those, and the plan
 * was to find out at deployment.
 *
 * PGlite is PostgreSQL 18 compiled to WebAssembly and runs in this process:
 * no Docker, no daemon, no virtualisation. That matters here — the machine
 * this is developed on has virtualisation disabled in firmware, so Docker
 * cannot start at all, and the check had been waiting on that for weeks.
 *
 * A script rather than a Jest spec because PGlite loads itself with a dynamic
 * import, which Jest's CommonJS runtime refuses without a flag. Plain Node
 * runs it without ceremony.
 *
 * What this does not replace: the runtime smoke against a server, which also
 * exercises connection handling, pooling and the seed.
 */

/** TypeORM hands migrations a query runner; they only ever call `query`. */
const queryRunnerFor = (db: PGlite) => ({
  query: async (sql: string) => {
    // `CREATE EXTENSION "pgcrypto"` is not available in PGlite and is not
    // needed: the only thing the migrations want from it is
    // `gen_random_uuid()`, which PostgreSQL has had built in since 13. The
    // line stays in the migrations for older servers that predate that.
    if (/CREATE EXTENSION/i.test(sql)) return [];

    await db.exec(sql);
    return [];
  },
});

type Migration = new () => { up: (runner: unknown) => Promise<void> };

const failures: string[] = [];

const check = (description: string, condition: boolean, detail = '') => {
  if (condition) {
    console.log(`  ok    ${description}`);
    return;
  }

  console.log(`  FAIL  ${description}${detail ? ` — ${detail}` : ''}`);
  failures.push(description);
};

const run = async () => {
  const db = await PGlite.create();
  const runner = queryRunnerFor(db);

  try {
    console.log('Applying migrations...');

    const files = migrationFiles();

    for (const file of files) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const loaded = require(file.path);
      const MigrationClass = (Object.values(loaded) as unknown[]).find(
        (value): value is Migration =>
          typeof value === 'function' && typeof (value as Migration).prototype?.up === 'function',
      );

      if (!MigrationClass) throw new Error(`No migration class exported from ${file.name}`);

      await new MigrationClass().up(runner);
      console.log(`  applied ${file.name}`);
    }

    console.log(`\nChecking the schema (${files.length} migrations applied)...`);

    // A silent zero would make every check below pass for nothing.
    check('the loader has migrations to apply', files.length > 10, `found ${files.length}`);

    const tables = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    const present = tables.rows.map((row) => row.table_name);

    const absentTables = liveTables.filter((table) => !present.includes(table));
    check('every live table exists', absentTables.length === 0, absentTables.join(', '));

    const columns = await db.query<{ table_name: string; column_name: string }>(
      `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'`,
    );
    const byTable = new Map<string, string[]>();
    columns.rows.forEach((row) => {
      byTable.set(row.table_name, [...(byTable.get(row.table_name) ?? []), row.column_name]);
    });

    const absentColumns = mappedColumns()
      .filter(({ table, column }) => !byTable.get(table)?.includes(column))
      .map(({ table, column }) => `${table}.${column}`);
    check('every mapped column exists', absentColumns.length === 0, absentColumns.join(', '));

    // Present is not the same as usable.
    await db.exec(`
      INSERT INTO audit_log_entries (organization_id, module, action, method, route, status_code)
      VALUES ('org-1', 'projects', 'created', 'POST', '/projects', 201)
    `);
    const written = await db.query<{ module: string }>('SELECT module FROM audit_log_entries');
    check('the schema can be written to and read back', written.rows[0]?.module === 'projects');

    // The partial unique index is the whole defence against raising two tasks
    // for one 5S finding. A migration that created it wrongly would be silent.
    const insertTask = (sourceId: string) =>
      db.exec(`
        INSERT INTO work_tasks (organization_id, title, status, source_type, source_id)
        VALUES ('org-1', 'Clear red tags', 'todo', 'five_s_zone', '${sourceId}')
      `);

    await insertTask('due-zone-1');
    let refused = false;
    try {
      await insertTask('due-zone-1');
    } catch {
      refused = true;
    }
    check('a second open task for one source is refused', refused);
  } finally {
    await db.close();
  }

  if (failures.length) {
    console.error(`\n${failures.length} check(s) failed.`);
    process.exit(1);
  }

  console.log('\nAll migration checks passed.');
};

run().catch((error) => {
  console.error('\nMigration check failed to run:', error);
  process.exit(1);
});
