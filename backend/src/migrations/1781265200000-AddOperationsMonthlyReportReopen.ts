import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Who reopened a closed month, and why.
 *
 * Reopening already kept the closed copy, soft-deleted. It did not say who
 * opened it again or what the correction was for, so a report that changed
 * after it was handed in could not be explained.
 */
export class AddOperationsMonthlyReportReopen1781265200000 implements MigrationInterface {
  name = 'AddOperationsMonthlyReportReopen1781265200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE monthly_report_closes ADD COLUMN IF NOT EXISTS reopened_by varchar`);
    await queryRunner.query(`ALTER TABLE monthly_report_closes ADD COLUMN IF NOT EXISTS reopen_reason text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE monthly_report_closes DROP COLUMN IF EXISTS reopen_reason`);
    await queryRunner.query(`ALTER TABLE monthly_report_closes DROP COLUMN IF EXISTS reopened_by`);
  }
}
