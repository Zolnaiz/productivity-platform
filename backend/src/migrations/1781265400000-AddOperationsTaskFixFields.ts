import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The rest of the corrective-action loop on an audit-raised fix: why the area
 * fell short, and a manager's sign-off that the work was done properly.
 */
export class AddOperationsTaskFixFields1781265400000 implements MigrationInterface {
  name = 'AddOperationsTaskFixFields1781265400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS root_cause text`);
    await queryRunner.query(`ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS fix_signed_off_by varchar`);
    await queryRunner.query(`ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS fix_signed_off_at timestamptz`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE work_tasks DROP COLUMN IF EXISTS fix_signed_off_at`);
    await queryRunner.query(`ALTER TABLE work_tasks DROP COLUMN IF EXISTS fix_signed_off_by`);
    await queryRunner.query(`ALTER TABLE work_tasks DROP COLUMN IF EXISTS root_cause`);
  }
}
