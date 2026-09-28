import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Weekly check-ins: progress, plans and problems, one per person per week.
 */
export class CreateOperationsWeeklyCheckinsTable1781264600000 implements MigrationInterface {
  name = 'CreateOperationsWeeklyCheckinsTable1781264600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS weekly_checkins (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz,
        organization_id varchar,
        user_id varchar NOT NULL,
        week date NOT NULL,
        progress text NOT NULL DEFAULT '',
        plans text NOT NULL DEFAULT '',
        problems text NOT NULL DEFAULT ''
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_weekly_checkins_organization_week ON weekly_checkins (organization_id, week)`,
    );
    // One check-in a person a week: writing it again updates it.
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_checkins_user_week ON weekly_checkins (user_id, week)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS weekly_checkins`);
  }
}
