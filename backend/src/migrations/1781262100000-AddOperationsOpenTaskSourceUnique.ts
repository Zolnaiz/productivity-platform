import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enforces "one open task per finding" in the database.
 *
 * The rule was a read-then-insert in the service, which two callers can both
 * pass before either writes — two scheduler replicas firing at six, or a
 * double-clicked button. The index that existed was not unique, so the
 * invariant the service claimed was never actually held.
 *
 * The index is partial: a task only occupies its finding's slot while it is
 * unfinished. Once it is done it leaves the index, and a recurring finding can
 * raise new work — which is the behaviour the rule is supposed to have.
 */
export class AddOperationsOpenTaskSourceUnique1781262100000 implements MigrationInterface {
  name = 'AddOperationsOpenTaskSourceUnique1781262100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Existing duplicates would block the index, so close all but the newest
    // of each group first. They are duplicate work items; keeping the most
    // recent loses nothing a person entered.
    await queryRunner.query(`
      UPDATE work_tasks SET status = 'done'
      WHERE id IN (
        SELECT id FROM (
          SELECT id, row_number() OVER (
            PARTITION BY organization_id, source_type, source_id
            ORDER BY "createdAt" DESC
          ) AS position
          FROM work_tasks
          WHERE source_type IS NOT NULL
            AND source_id IS NOT NULL
            AND status <> 'done'
            AND "deletedAt" IS NULL
        ) ranked
        WHERE ranked.position > 1
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_work_tasks_open_source
        ON work_tasks (organization_id, source_type, source_id)
        WHERE source_type IS NOT NULL
          AND source_id IS NOT NULL
          AND status <> 'done'
          AND "deletedAt" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_work_tasks_open_source`);
  }
}
