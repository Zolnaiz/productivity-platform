import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The language a person reads in.
 *
 * Their choice in the browser was kept in that browser, so the server wrote
 * their email in the organization's language whatever they had picked - an
 * English reader in a Mongolian workspace was emailed in Mongolian. Empty
 * means they have not chosen, and the organization's language applies.
 */
export class AddOperationsUserLanguage1781264300000 implements MigrationInterface {
  name = 'AddOperationsUserLanguage1781264300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS language varchar(8)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS language`);
  }
}
