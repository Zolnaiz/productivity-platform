import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * When a task was finished.
 *
 * Deliberately not backfilled. The only candidate is `updated_at`, which is
 * the last edit of any kind; stamping it on every finished task would move a
 * March task edited in September into September and rewrite reports that
 * people have already read. Rows without a date keep being counted by the
 * month they were planned for, which is exactly what they said before.
 */
export class AddOperationsTaskCompletedAt1781263800000 implements MigrationInterface {
  name = 'AddOperationsTaskCompletedAt1781263800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE work_tasks DROP COLUMN IF EXISTS completed_at`);
  }
}
