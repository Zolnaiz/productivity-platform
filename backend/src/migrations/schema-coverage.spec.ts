import { liveTables, mappedColumns, readAll } from './entity-columns';

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
 * wrote a migration for, which is the mistake actually being made, and it runs
 * in milliseconds as part of the ordinary test suite.
 *
 * `npm run migration:check` is the stronger version: it applies the migrations
 * to a real PostgreSQL and inspects the schema that results. This one stays
 * because it is fast and because it names the offending column directly.
 */

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
