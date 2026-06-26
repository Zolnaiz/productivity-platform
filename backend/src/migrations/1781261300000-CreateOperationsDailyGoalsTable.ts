import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOperationsDailyGoalsTable1781261300000 implements MigrationInterface {
  name = 'CreateOperationsDailyGoalsTable1781261300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS daily_goals (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id varchar,
        user_id varchar,
        title varchar NOT NULL,
        goal_date date NOT NULL,
        completed boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_daily_goals_organization_id ON daily_goals (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_daily_goals_user_id ON daily_goals (user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_daily_goals_goal_date ON daily_goals (goal_date)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_daily_goals_completed ON daily_goals (completed)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS daily_goals`);
  }
}
