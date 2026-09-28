import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The written summary that heads a month's report, drafted and approved.
 */
export class CreateOperationsMonthlySummariesTable1781264700000 implements MigrationInterface {
  name = 'CreateOperationsMonthlySummariesTable1781264700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS monthly_summaries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz,
        organization_id varchar NOT NULL,
        period varchar(7) NOT NULL,
        text text NOT NULL DEFAULT '',
        ai_drafted boolean NOT NULL DEFAULT false,
        updated_by varchar,
        approved_by varchar,
        approved_at timestamptz
      )
    `);
    // One summary a month for an organization: drafting again replaces it.
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_summaries_period ON monthly_summaries (organization_id, period)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS monthly_summaries`);
  }
}
