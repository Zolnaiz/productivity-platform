import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Which drawing an audit was walked against.
 *
 * The snapshots exist now, but a score still had to be matched to one by hand:
 * somebody reading a March result had to remember what the plan looked like in
 * March, which is the thing nobody remembers. The run records the version it
 * was walked against, and its date beside it — the date is what a reader
 * actually wants and it never changes, so it is kept rather than joined for.
 */
export class AddAuditRunLayoutVersion1781263600000 implements MigrationInterface {
  name = 'AddAuditRunLayoutVersion1781263600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE audit_runs ADD COLUMN IF NOT EXISTS layout_version_id varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE audit_runs ADD COLUMN IF NOT EXISTS layout_version_on date`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE audit_runs DROP COLUMN IF EXISTS layout_version_on`);
    await queryRunner.query(`ALTER TABLE audit_runs DROP COLUMN IF EXISTS layout_version_id`);
  }
}
