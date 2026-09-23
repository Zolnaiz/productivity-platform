import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * What a raised piece of work says, in a form the reader's language can reach.
 *
 * The scheduler writes "Tier 1 5S audit due: A03 - Storage", and that sentence
 * is what the task list, the register and the notification all show — in
 * English, to a workspace that runs in Mongolian. It is the same fault the 5S
 * page had, where the rules module assembled sentences the translation could
 * not touch, and it has the same fix: store the key and its parts, and word it
 * where somebody is reading.
 *
 * The assembled sentence stays in `title` rather than being replaced. It is
 * what a CSV export, an email and any client that has never heard of these
 * columns will show, and dropping it would break all three to fix one.
 */
export class AddRaisedTextKeys1781263000000 implements MigrationInterface {
  name = 'AddRaisedTextKeys1781263000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS title_key varchar`);
    await queryRunner.query(
      `ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS title_params jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title_key varchar`);
    await queryRunner.query(
      `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title_params jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE notifications DROP COLUMN IF EXISTS title_params`);
    await queryRunner.query(`ALTER TABLE notifications DROP COLUMN IF EXISTS title_key`);
    await queryRunner.query(`ALTER TABLE work_tasks DROP COLUMN IF EXISTS title_params`);
    await queryRunner.query(`ALTER TABLE work_tasks DROP COLUMN IF EXISTS title_key`);
  }
}
