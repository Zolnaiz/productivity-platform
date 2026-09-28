import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Improvement ideas, from whoever had them to the work they became.
 */
export class CreateOperationsIdeasTable1781264500000 implements MigrationInterface {
  name = 'CreateOperationsIdeasTable1781264500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ideas (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz,
        organization_id varchar,
        author_id varchar,
        title varchar(200) NOT NULL,
        description text NOT NULL DEFAULT '',
        area varchar(200) NOT NULL DEFAULT '',
        benefit text NOT NULL DEFAULT '',
        status varchar(20) NOT NULL DEFAULT 'submitted',
        reviewer_id varchar,
        review_note text NOT NULL DEFAULT '',
        reviewed_at timestamptz,
        task_id varchar
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ideas_organization ON ideas (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ideas_author ON ideas (author_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas (status)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ideas`);
  }
}
