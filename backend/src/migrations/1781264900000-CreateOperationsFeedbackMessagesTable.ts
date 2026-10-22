import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * In-app feedback: faults, suggestions and questions about the product,
 * read by the organization's administrators.
 */
export class CreateOperationsFeedbackMessagesTable1781264900000 implements MigrationInterface {
  name = 'CreateOperationsFeedbackMessagesTable1781264900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS feedback_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz,
        organization_id varchar NOT NULL,
        author_id varchar NOT NULL,
        kind varchar(20) NOT NULL DEFAULT 'suggestion',
        message text NOT NULL,
        page varchar(200) NOT NULL DEFAULT '',
        read_at timestamptz
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_feedback_messages_organization_created ON feedback_messages (organization_id, "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS feedback_messages`);
  }
}
