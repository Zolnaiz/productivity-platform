import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every mapped column must exist in a migration.
 *
 * `DB_SYNCHRONIZE` is false by default and forbidden in production, so a
 * column TypeORM maps but no migration creates simply does not exist in a real
 * database — and every read and write of that table fails with a missing
 * column. It is silent in development, where the seeded demo data hides it,
 * and total in production.
 *
 * This has happened twice: the 5S layout migrations were named outside the
 * loader's glob and never ran at all, and `audit_runs.tier` was mapped with no
 * migration behind it. Both reached a pull request.
 *
 * The check is deliberately crude — it asks only whether a migration mentions
 * the column name for that table. That is enough to catch a column nobody
 * wrote a migration for, which is the mistake actually being made.
 */

const root = join(__dirname, '..');

const readAll = (dir: string, match: RegExp): string[] => {
  const entries = readdirSync(join(root, dir), { withFileTypes: true });

  return entries.flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) return readAll(path, match);
    return match.test(entry.name) ? [readFileSync(join(root, path), 'utf-8')] : [];
  });
};

/** Tables the application graph actually talks to. */
const liveTables = [
  'projects',
  'work_tasks',
  'work_logs',
  'time_entries',
  'audit_templates',
  'audit_runs',
  'assessment_templates',
  'assessment_responses',
  'expenses',
  'daily_goals',
  'five_s_layouts',
  'attachments',
  'invitations',
  // Live since `UsersModule` and `OrganizationsModule` joined the application
  // graph. Until then nothing read these tables through TypeORM, so a column
  // missing a migration would not have shown up here.
  'users',
  'organizations',
];

/** Created by `BaseEntity`, so they come with the table rather than separately. */
const baseColumns = new Set(['id', 'createdAt', 'updatedAt', 'deletedAt']);

interface MappedColumn {
  table: string;
  column: string;
  file: string;
}

const mappedColumns = (): MappedColumn[] => {
  const sources = [
    ...readAll('operations/entities', /\.entity\.ts$/),
    ...readAll('auth/entities', /\.entity\.ts$/),
    ...readAll('users/entities', /\.entity\.ts$/),
    ...readAll('organizations/entities', /\.entity\.ts$/),
  ];

  return sources.flatMap((source) => {
    const table = source.match(/@Entity\('([a-z_]+)'\)/)?.[1];

    if (!table || !liveTables.includes(table)) return [];

    // `@Column({ ... })` followed by the property it decorates. An explicit
    // `name:` wins; otherwise TypeORM uses the property name as written.
    const declarations = [...source.matchAll(/@Column\(([\s\S]*?)\)\s*(?:\/\*[\s\S]*?\*\/\s*)?(\w+)[?!]?:/g)];

    return declarations
      .map(([, options, property]) => ({
        table,
        column: options.match(/name:\s*'([^']+)'/)?.[1] ?? property,
        file: table,
      }))
      .filter(({ column }) => !baseColumns.has(column));
  });
};

describe('every mapped column has a migration', () => {
  const migrations = readAll('migrations', /^\d+-.*\.ts$/).join('\n');
  const columns = mappedColumns();

  it('finds the columns to check', () => {
    // A silent zero here would make the whole check pass for nothing.
    expect(columns.length).toBeGreaterThan(40);
    expect(columns.map((item) => item.column)).toContain('zone_id');
  });

  it.each(liveTables)('has a migration creating %s', (table) => {
    expect(migrations).toContain(table);
  });

  it('has a migration mentioning every mapped column', () => {
    const missing = columns
      .filter(({ column }) => !migrations.includes(column))
      .map(({ table, column }) => `${table}.${column}`);

    // Jest has no message argument, so the names go in the assertion itself.
    expect({ mappedWithNoMigration: missing }).toEqual({ mappedWithNoMigration: [] });
  });
});
