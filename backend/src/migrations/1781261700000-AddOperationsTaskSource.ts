import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Records what produced a task.
 *
 * A 5S red tag already carries an owner and a due date, but nothing tied the
 * task raised from it back to the finding — so the work appeared in nobody's
 * list with any context, and pressing the button twice raised it twice.
 */
export class AddOperationsTaskSource1781261700000 implements MigrationInterface {
  name = 'AddOperationsTaskSource1781261700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS source_type varchar`);
    await queryRunner.query(`ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS source_id varchar`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_work_tasks_source ON work_tasks (source_type, source_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_work_tasks_source`);
    await queryRunner.query(`ALTER TABLE work_tasks DROP COLUMN IF EXISTS source_id`);
    await queryRunner.query(`ALTER TABLE work_tasks DROP COLUMN IF EXISTS source_type`);
  }
}
