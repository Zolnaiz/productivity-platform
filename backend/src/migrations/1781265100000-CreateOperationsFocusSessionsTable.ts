import { MigrationInterface, QueryRunner } from 'typeorm';

/** Focus (Pomodoro) sessions, moved from browser storage to the server. */
export class CreateOperationsFocusSessionsTable1781265100000 implements MigrationInterface {
  name = 'CreateOperationsFocusSessionsTable1781265100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz,
        organization_id varchar NOT NULL,
        user_id varchar NOT NULL,
        title varchar(200) NOT NULL,
        minutes numeric(6,1) NOT NULL DEFAULT 0,
        session_date date NOT NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_focus_sessions_owner_day ON focus_sessions (organization_id, user_id, session_date)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS focus_sessions`);
  }
}
