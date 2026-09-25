import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Links an audit run to the 5S zone it audited.
 *
 * `location` stayed free text, so a score could never be matched back to a
 * zone on the floor plan. With this column the run can update the zone's
 * condition on submit, which is what makes the map live rather than drawn.
 */
export class AddOperationsAuditRunZone1781261600000 implements MigrationInterface {
  name = 'AddOperationsAuditRunZone1781261600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE audit_runs ADD COLUMN IF NOT EXISTS zone_id varchar`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_runs_zone_id ON audit_runs (zone_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_runs_zone_id`);
    await queryRunner.query(`ALTER TABLE audit_runs DROP COLUMN IF EXISTS zone_id`);
  }
}
