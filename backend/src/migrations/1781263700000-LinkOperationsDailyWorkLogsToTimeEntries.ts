import { MigrationInterface, QueryRunner } from 'typeorm';

/** Keep the daily work narrative linked to the one time entry that measures it. */
export class LinkOperationsDailyWorkLogsToTimeEntries1781263700000 implements MigrationInterface {
  name = 'LinkOperationsDailyWorkLogsToTimeEntries1781263700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS work_log_id uuid`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_time_entries_work_log_id ON time_entries (work_log_id) WHERE work_log_id IS NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_time_entries_work_log_id`);
    await queryRunner.query(`ALTER TABLE time_entries DROP COLUMN IF EXISTS work_log_id`);
  }
}
