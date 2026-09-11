import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Records which layer of a layered audit a run was.
 *
 * The entity mapped `tier` without this, and `DB_SYNCHRONIZE` is false by
 * default and forbidden in production — so a migrated database had no such
 * column while TypeORM selected and inserted it. Every audit-run read and
 * write would have failed with a missing column.
 */
export class AddOperationsAuditRunTier1781262000000 implements MigrationInterface {
  name = 'AddOperationsAuditRunTier1781262000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE audit_runs ADD COLUMN IF NOT EXISTS tier integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE audit_runs DROP COLUMN IF EXISTS tier`);
  }
}
