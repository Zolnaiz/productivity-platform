import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Closed months, and the records each was closed on.
 *
 * A report counted from live tables changes every time the work it counts
 * moves; one that has been handed in has to keep saying what it said.
 */
export class CreateOperationsMonthlyReportClosesTable1781263900000 implements MigrationInterface {
  name = 'CreateOperationsMonthlyReportClosesTable1781263900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS monthly_report_closes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz,
        organization_id varchar,
        period varchar(7) NOT NULL,
        closed_by varchar,
        records jsonb NOT NULL DEFAULT '{}'::jsonb
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_monthly_report_closes_organization ON monthly_report_closes (organization_id)`,
    );
    // One live close per month: a manager pressing the button while the
    // scheduled close runs must not leave two versions of the same month.
    // Reopened ones are soft-deleted and stay, so the index skips them.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_report_closes_one_per_month
      ON monthly_report_closes (organization_id, period)
      WHERE "deletedAt" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS monthly_report_closes`);
  }
}
