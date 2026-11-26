import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The SUS questionnaire (measure K7): rounds an administrator opens and
 * closes, and one response per person per round.
 *
 * Two rules live in the database rather than only in the service, because
 * two requests at once would slip past a check made in code:
 * - one open round per organization (a partial unique index);
 * - one response per person per round (a unique index), so answering again
 *   updates the answer.
 * The answers themselves are checked here as well: exactly ten, each 1-5.
 */
export class CreateOperationsSusTables1781265600000 implements MigrationInterface {
  name = 'CreateOperationsSusTables1781265600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sus_rounds (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz,
        organization_id varchar NOT NULL,
        title varchar(120) NOT NULL,
        opened_by varchar NOT NULL,
        closed_at timestamptz
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_sus_rounds_organization_created ON sus_rounds (organization_id, "createdAt")`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_sus_rounds_one_open
        ON sus_rounds (organization_id) WHERE closed_at IS NULL AND "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sus_responses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz,
        organization_id varchar NOT NULL,
        round_id uuid NOT NULL REFERENCES sus_rounds (id) ON DELETE CASCADE,
        user_id varchar NOT NULL,
        answers smallint[] NOT NULL,
        CONSTRAINT chk_sus_responses_answers CHECK (
          cardinality(answers) = 10 AND 1 <= ALL (answers) AND 5 >= ALL (answers)
        )
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_sus_responses_round_user ON sus_responses (round_id, user_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS sus_responses`);
    await queryRunner.query(`DROP TABLE IF EXISTS sus_rounds`);
  }
}
