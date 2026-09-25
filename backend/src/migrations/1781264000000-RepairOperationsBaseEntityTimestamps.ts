import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gives five tables the timestamp columns their entities actually read.
 *
 * `BaseEntity` maps `createdAt`, `updatedAt` and `deletedAt` by their property
 * names, and the migrations that created these tables wrote `created_at` and
 * friends instead — notifications without a deletion column at all. Every
 * query TypeORM builds for them names a column that is not there, so on a
 * real database the departments page and the notification inbox answered
 * with a 500, and `notify()`, which swallows its own failures so as never to
 * stop work being raised, quietly delivered nothing to anybody.
 *
 * Each column is renamed where the old name exists, added where neither does,
 * and left alone where it is already right, so this is safe on a database
 * that was built before or after the create migrations are corrected.
 * Renaming carries the partial unique indexes' predicates with it.
 */
const tables = [
  'notifications',
  'departments',
  'five_s_guidelines',
  'five_s_layout_versions',
  'monthly_report_closes',
];

const columns: Array<{ from: string; to: string; definition: string }> = [
  { from: 'created_at', to: 'createdAt', definition: 'timestamptz NOT NULL DEFAULT now()' },
  { from: 'updated_at', to: 'updatedAt', definition: 'timestamptz NOT NULL DEFAULT now()' },
  { from: 'deleted_at', to: 'deletedAt', definition: 'timestamptz' },
];

export class RepairOperationsBaseEntityTimestamps1781264000000 implements MigrationInterface {
  name = 'RepairOperationsBaseEntityTimestamps1781264000000';

  private async columnsOf(queryRunner: QueryRunner, table: string): Promise<string[]> {
    const rows: Array<{ column_name: string }> = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1`,
      [table],
    );

    return rows.map((row) => row.column_name);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of tables) {
      const existing = await this.columnsOf(queryRunner, table);
      if (!existing.length) continue;

      for (const { from, to, definition } of columns) {
        if (existing.includes(to)) continue;

        if (existing.includes(from)) {
          await queryRunner.query(`ALTER TABLE ${table} RENAME COLUMN ${from} TO "${to}"`);
        } else {
          await queryRunner.query(`ALTER TABLE ${table} ADD COLUMN "${to}" ${definition}`);
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Back to the names the create migrations wrote. The added deletion
    // column on notifications is dropped, since it did not exist before.
    for (const table of tables) {
      const existing = await this.columnsOf(queryRunner, table);
      if (!existing.length) continue;

      for (const { from, to } of columns) {
        if (!existing.includes(to) || existing.includes(from)) continue;

        if (table === 'notifications' && to === 'deletedAt') {
          await queryRunner.query(`ALTER TABLE ${table} DROP COLUMN "${to}"`);
        } else {
          await queryRunner.query(`ALTER TABLE ${table} RENAME COLUMN "${to}" TO ${from}`);
        }
      }
    }
  }
}
