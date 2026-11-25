import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Review of a task's work documents (PLAN_V2 M2; rules in operations/deliverables.ts): the state of the review
 * and who decided it when. The documents themselves are attachments (owner `work_task`), which need no change:
 * owner and kind are free text there.
 *
 * The state is checked here as well as in code, so a direct write cannot leave a task in a state the rules
 * do not know.
 */
export class AddOperationsTaskReview1781265700000 implements MigrationInterface {
  name = 'AddOperationsTaskReview1781265700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS review_status varchar(20)`);
    await queryRunner.query(`ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS review_note text`);
    await queryRunner.query(`ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS reviewed_by varchar`);
    await queryRunner.query(`ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS reviewed_at timestamptz`);
    await queryRunner.query(`ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS submitted_at timestamptz`);
    await queryRunner.query(`
      ALTER TABLE work_tasks ADD CONSTRAINT chk_work_tasks_review_status
        CHECK (review_status IS NULL OR review_status IN ('submitted', 'approved', 'returned'))
    `);
    // The reviewer's list: everything waiting, per organisation.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_work_tasks_review ON work_tasks (organization_id, review_status) WHERE review_status IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_work_tasks_review`);
    await queryRunner.query(`ALTER TABLE work_tasks DROP CONSTRAINT IF EXISTS chk_work_tasks_review_status`);
    await queryRunner.query(`ALTER TABLE work_tasks DROP COLUMN IF EXISTS submitted_at`);
    await queryRunner.query(`ALTER TABLE work_tasks DROP COLUMN IF EXISTS reviewed_at`);
    await queryRunner.query(`ALTER TABLE work_tasks DROP COLUMN IF EXISTS reviewed_by`);
    await queryRunner.query(`ALTER TABLE work_tasks DROP COLUMN IF EXISTS review_note`);
    await queryRunner.query(`ALTER TABLE work_tasks DROP COLUMN IF EXISTS review_status`);
  }
}
