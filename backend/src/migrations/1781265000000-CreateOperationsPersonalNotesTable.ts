import { MigrationInterface, QueryRunner } from 'typeorm';

/** Personal notes, moved from browser storage to the server so they follow their author. */
export class CreateOperationsPersonalNotesTable1781265000000 implements MigrationInterface {
  name = 'CreateOperationsPersonalNotesTable1781265000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS personal_notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz,
        organization_id varchar NOT NULL,
        user_id varchar NOT NULL,
        title varchar(200) NOT NULL,
        content text NOT NULL DEFAULT '',
        tag varchar(60) NOT NULL DEFAULT ''
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_personal_notes_organization_user ON personal_notes (organization_id, user_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS personal_notes`);
  }
}
