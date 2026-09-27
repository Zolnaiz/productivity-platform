import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A raised task's description as a key and its parts, like its title.
 *
 * The scheduler writes "Layer: tier 2 (Supervisor)", "Frequency: weekly" and
 * "Due: ..." under a title the phone already reads in Mongolian, so the card
 * read in two languages. The sentence stays for exports, which have no reader
 * to ask. Tasks raised before this keep their sentence until they close; the
 * next ones raised carry the key.
 */
export class AddOperationsTaskDescriptionKey1781264200000 implements MigrationInterface {
  name = 'AddOperationsTaskDescriptionKey1781264200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS description_key varchar`);
    await queryRunner.query(
      `ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS description_params jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE work_tasks DROP COLUMN IF EXISTS description_params`);
    await queryRunner.query(`ALTER TABLE work_tasks DROP COLUMN IF EXISTS description_key`);
  }
}
