import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A notification's body as a key and its parts, like its title.
 *
 * The body was a sentence the server wrote in English - "Due 2026-09-25" -
 * so the inbox read in Mongolian above it and English below. The sentence
 * stays for the email, which has no reader to ask.
 */
export class AddOperationsNotificationBodyKey1781264100000 implements MigrationInterface {
  name = 'AddOperationsNotificationBodyKey1781264100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body_key varchar`);
    await queryRunner.query(
      `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body_params jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE notifications DROP COLUMN IF EXISTS body_params`);
    await queryRunner.query(`ALTER TABLE notifications DROP COLUMN IF EXISTS body_key`);
  }
}
