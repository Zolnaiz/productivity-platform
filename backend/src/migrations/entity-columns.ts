import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * What the entities say the database should contain.
 *
 * Read from the source rather than from TypeORM's metadata so it can be used
 * without standing an application up. Two specs consume it: one checks the
 * migrations *mention* every mapped column, the other runs them against a real
 * PostgreSQL and checks the columns are actually there.
 */

const root = join(__dirname, '..');

export const readAll = (dir: string, match: RegExp): string[] => {
  const entries = readdirSync(join(root, dir), { withFileTypes: true });

  return entries.flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) return readAll(path, match);
    return match.test(entry.name) ? [readFileSync(join(root, path), 'utf-8')] : [];
  });
};

/** Tables the application graph actually talks to. */
export const liveTables = [
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
  'users',
  'organizations',
  'audit_log_entries',
  'notifications',
  'departments',
  'five_s_guidelines',
  'five_s_layout_versions',
  'monthly_report_closes',
  'ideas',
  'weekly_checkins',
];

/** Declared by `BaseEntity` rather than by the entity, so they are counted separately below. */
export const baseColumns = new Set(['id', 'createdAt', 'updatedAt', 'deletedAt']);

/**
 * The timestamps every `BaseEntity` table must have, under the names TypeORM
 * reads: the property names, as written.
 *
 * These were once exempt from the check on the reasoning that they "come with
 * the table". They come with whatever the migration wrote, and five migrations
 * wrote `created_at` — so departments and the notification inbox answered
 * every request with a 500 on a real database while every test passed.
 */
export const inheritedColumns = ['createdAt', 'updatedAt', 'deletedAt'];

export interface MappedColumn {
  table: string;
  column: string;
}

const entityDirectories = [
  'operations/entities',
  'auth/entities',
  'users/entities',
  'organizations/entities',
  'audit/entities',
];

export const mappedColumns = (): MappedColumn[] => {
  const sources = entityDirectories.flatMap((dir) => readAll(dir, /\.entity\.ts$/));

  return sources.flatMap((source) => {
    const table = source.match(/@Entity\('([a-z_]+)'\)/)?.[1];

    if (!table || !liveTables.includes(table)) return [];

    // `@Column({ ... })` followed by the property it decorates. An explicit
    // `name:` wins; otherwise TypeORM uses the property name as written.
    const declarations = [...source.matchAll(/@Column\(([\s\S]*?)\)\s*(?:\/\*[\s\S]*?\*\/\s*)?(\w+)[?!]?:/g)];

    const inherited = /extends BaseEntity\b/.test(source)
      ? inheritedColumns.map((column) => ({ table, column }))
      : [];

    return [
      ...declarations
        .map(([, options, property]) => ({
          table,
          column: options.match(/name:\s*'([^']+)'/)?.[1] ?? property,
        }))
        .filter(({ column }) => !baseColumns.has(column)),
      ...inherited,
    ];
  });
};

/**
 * The migration files the loader would actually apply, oldest first.
 *
 * The glob in `data-source.ts` only picks up `*Runtime*` and `*Operations*`;
 * a file matching neither is never run, which is how the 5S layout tables once
 * went missing from every real database. This mirrors that rule rather than
 * reading the directory, so a migration the loader would skip is skipped here
 * too and the gap shows up as a missing table.
 */
export const migrationFiles = () => {
  const directory = join(root, 'migrations');

  return readdirSync(directory)
    .filter((name) => /\.ts$/.test(name) && /^\d+-/.test(name))
    .filter((name) => name.includes('Runtime') || name.includes('Operations'))
    .sort()
    .map((name) => ({ name, path: join(directory, name) }));
};
